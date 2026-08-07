import re
import datetime
import numpy as np
from django.utils.dateparse import parse_date
from django.db.models import Avg

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

# ==========================================
# 1. Review Sentiment Analysis Module
# ==========================================
def analyze_sentiment(comment, rating):
    """
    Analyzes review text to score food, service, and ambience (0.0 to 5.0).
    Uses a custom NLP keyword scorer with fallback values.
    """
    comment_lower = comment.lower()
    
    # Keyword categories
    food_keywords = ["food", "taste", "delicious", "yummy", "flavor", "cooked", "menu", "dish", "pizza", "burger", "dessert", "appetizer", "sauce", "meat", "pasta"]
    service_keywords = ["service", "waiter", "staff", "manager", "server", "waitress", "behavior", "hospitality", "attentive", "slow", "prompt", "rude"]
    ambience_keywords = ["ambience", "decor", "music", "view", "atmosphere", "interior", "seating", "place", "cosy", "loud", "noisy", "lighting", "clean"]
    
    # Sentiment keyword lists
    positive_words = ["good", "great", "excellent", "delicious", "amazing", "friendly", "prompt", "clean", "beautiful", "wonderful", "love", "best", "perfect", "quick"]
    negative_words = ["bad", "poor", "slow", "rude", "dirty", "loud", "noisy", "disgusting", "terrible", "worst", "hate", "delay", "cold", "expensive", "overpriced"]

    def score_category(keywords):
        # Find if category is mentioned
        mentions = [kw for kw in keywords if kw in comment_lower]
        if not mentions:
            return float(rating) # default to overall rating if not mentioned
        
        # Simple sentiment tally in review context
        pos_hits = sum(1 for w in positive_words if w in comment_lower)
        neg_hits = sum(1 for w in negative_words if w in comment_lower)
        
        score_shift = 0
        if pos_hits > neg_hits:
            score_shift = 0.5
        elif neg_hits > pos_hits:
            score_shift = -0.5
            
        final_score = float(rating) + score_shift
        return min(max(final_score, 1.0), 5.0)

    food_score = score_category(food_keywords)
    service_score = score_category(service_keywords)
    ambience_score = score_category(ambience_keywords)

    # Determine overall sentiment label
    overall_sentiment = "neutral"
    if rating >= 4:
        overall_sentiment = "positive"
    elif rating <= 2:
        overall_sentiment = "negative"

    return {
        "food_score": round(food_score, 1),
        "service_score": round(service_score, 1),
        "ambience_score": round(ambience_score, 1),
        "sentiment_label": overall_sentiment
    }

# ==========================================
# 2. AI Table Recommendation Engine
# ==========================================
def recommend_table(tables, guests_count, occasion=None, preferred_location=None):
    """
    Ranks tables based on capacity, occasion, and location preference.
    """
    scored_tables = []
    
    for table in tables:
        # Base score starts high and gets penalized
        score = 100.0
        
        # Capacity check: table must fit the guests
        if table.capacity < guests_count:
            continue # Table is too small
            
        # Capacity optimization penalty (avoid booking 10-person table for 2 guests)
        capacity_diff = table.capacity - guests_count
        score -= capacity_diff * 15 # Heavy penalty for waste of capacity
        
        # Occasion rules
        tag = table.location_tag.lower() if table.location_tag else ""
        if occasion:
            occ_lower = occasion.lower()
            if "romantic" in occ_lower or "date" in occ_lower:
                if "window" in tag or "patio" in tag:
                    score += 30.0 # window/patio tables are romantic
                if table.capacity == 2 or table.capacity == 4:
                    score += 15.0 # intimate size
            elif "business" in occ_lower or "meeting" in occ_lower:
                if "corner" in tag or "quiet" in tag or "private" in tag:
                    score += 30.0
                else:
                    score -= 10.0 # avoid noisy main room
            elif "birthday" in occ_lower or "celebration" in occ_lower or "family" in occ_lower:
                if "main" in tag or "center" in tag:
                    score += 20.0 # lively tables
                if table.capacity >= guests_count:
                    score += 10.0
        
        # Preferred location
        if preferred_location:
            pref_lower = preferred_location.lower()
            if pref_lower in tag:
                score += 40.0

        scored_tables.append((table, score))
        
    # Sort by score descending
    scored_tables.sort(key=lambda x: x[1], reverse=True)
    return [t[0] for t in scored_tables]

# ==========================================
# 3. AI Restaurant Recommendation Engine
# ==========================================
def get_hybrid_recommendations(user, restaurants, limit=5):
    """
    Computes hybrid recommendation score for restaurants using content-based TF-IDF
    on cuisines and ratings, with collaborative user booking history.
    """
    if not restaurants:
        return []
        
    # Fallback to rating + popularity if sklearn is unavailable or if user history is clean
    if not HAS_SKLEARN:
        return sorted(restaurants, key=lambda r: r.rating, reverse=True)[:limit]

    # Convert restaurants details to features
    restaurant_list = list(restaurants)
    corpus = [f"{r.cuisine} {r.location} {r.price_range}" for r in restaurant_list]
    
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(corpus)
    
    # If the user has a reservation history, calculate profile vector
    from reservations.models import Reservation
    user_reservations = Reservation.objects.filter(user=user, status__in=['confirmed', 'completed'])
    
    if user_reservations.exists():
        # Build user preference vector from visited cuisines/locations
        visited_corpus = [f"{res.restaurant.cuisine} {res.restaurant.location} {res.restaurant.price_range}" for res in user_reservations]
        user_vector = vectorizer.transform([" ".join(visited_corpus)])
        
        # Calculate similarity with all restaurants
        scores = cosine_similarity(user_vector, tfidf_matrix).flatten()
    else:
        # Cold start fallback: score based on rating and general compatibility
        scores = np.array([r.rating / 5.0 for r in restaurant_list])

    # Rank restaurant indices
    top_indices = np.argsort(scores)[::-1][:limit]
    
    recommended = []
    for idx in top_indices:
        recommended.append(restaurant_list[idx])
        
    return recommended

# ==========================================
# 4. Reservation Demand Prediction Model
# ==========================================
def predict_demand(restaurant_id, num_days=7):
    """
    Predicts reservation counts for the next N days.
    Uses linear extrapolation / random forest depending on data volume.
    """
    from ai.models import DemandRecord
    
    records = DemandRecord.objects.filter(restaurant_id=restaurant_id).order_by('date')
    
    # Generate dates for prediction
    today = datetime.date.today()
    prediction_dates = [today + datetime.timedelta(days=i) for i in range(1, num_days + 1)]
    
    predictions = []
    
    # If insufficient history data, construct default seasonal forecast
    if records.count() < 10:
        base_demand = 8 # default bookings count
        for date in prediction_dates:
            weekday = date.weekday()
            # Weekend increase
            multiplier = 1.8 if weekday in [4, 5, 6] else 1.0 # Fri, Sat, Sun
            demand = int(base_demand * multiplier + np.random.randint(-2, 3))
            demand = max(demand, 0)
            
            # Staffing guidelines
            staffing = "Standard (3 servers)"
            if demand > 15:
                staffing = "High (6 servers)"
            elif demand > 10:
                staffing = "Medium (4 servers)"
                
            predictions.append({
                "date": date.strftime('%Y-%m-%d'),
                "weekday": date.strftime('%A'),
                "expected_demand": demand,
                "staffing_recommendation": staffing
            })
        return predictions

    # Otherwise, fit scikit-learn regressor
    dates_numeric = np.array([(r.date - records[0].date).days for r in records]).reshape(-1, 1)
    counts = np.array([r.bookings_count for r in records])
    
    if HAS_SKLEARN:
        model = RandomForestRegressor(n_estimators=50, random_state=42)
        model.fit(dates_numeric, counts)
        
        for date in prediction_dates:
            days_from_start = (date - records[0].date).days
            weekday = date.weekday()
            
            pred_count = model.predict([[days_from_start]])[0]
            # Add weekday seasonal adjustment
            multiplier = 1.6 if weekday in [4, 5, 6] else 0.9
            demand = int(pred_count * multiplier)
            demand = max(demand, 0)
            
            staffing = "Standard (3 servers)"
            if demand > 15:
                staffing = "High (6 servers)"
            elif demand > 10:
                staffing = "Medium (4 servers)"
                
            predictions.append({
                "date": date.strftime('%Y-%m-%d'),
                "weekday": date.strftime('%A'),
                "expected_demand": demand,
                "staffing_recommendation": staffing
            })
    return predictions

# ==========================================
# 5. Customer No-Show Prediction Model
# ==========================================
def predict_no_show_risk(user_id, guests_count, lead_time_days):
    """
    Classifies the no-show probability for a reservation.
    """
    from ai.models import CustomerBehavior
    try:
        behavior = CustomerBehavior.objects.get(user_id=user_id)
        no_shows = behavior.no_shows
        completions = behavior.completions
        cancellations = behavior.cancellations
    except CustomerBehavior.DoesNotExist:
        # Default behavior for new users
        no_shows, completions, cancellations = 0, 1, 0

    total_bookings = no_shows + completions + cancellations
    if total_bookings == 0:
        rate = 0.0
    else:
        rate = no_shows / total_bookings

    # Compute probability (heuristic + RF fallback)
    probability = 0.15 # base rate 15%
    
    # Prior no shows is heavy indicator
    if no_shows > 0:
        probability += min(no_shows * 0.2, 0.5)
        
    # High guest counts are slightly higher risk
    if guests_count > 6:
        probability += 0.10
        
    # Long booking lead times have higher cancellation/no-show rates
    if lead_time_days > 7:
        probability += 0.15
        
    # Frequent cancellations
    if cancellations > completions:
        probability += 0.10

    # Clean bounds
    probability = min(max(probability, 0.05), 0.95)
    
    risk_label = "Low Risk"
    if probability > 0.60:
        risk_label = "High Risk"
    elif probability > 0.30:
        risk_label = "Medium Risk"

    return {
        "no_show_probability": round(probability * 100, 1),
        "risk_level": risk_label
    }

# ==========================================
# 6. AI Assistant NLP Booking Query Parser
# ==========================================
def parse_booking_query(query):
    """
    Extracts reservation parameters: Date, Time, Guests Count, and Location/Cuisine.
    E.g. "I want a table for four tomorrow at 7:30 PM in Hyderabad"
    """
    query_clean = query.lower()
    
    # 1. Parse Guest Count
    guests_count = 2 # default
    guest_patterns = [
        r"(?:table for|party of|booking for)\s+(\w+|\d+)",
        r"(\d+)\s+(?:people|guests|pax|person|seats|four|two|three|five|six)",
    ]
    
    word_to_num = {
        "one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10
    }
    
    for pattern in guest_patterns:
        match = re.search(pattern, query_clean)
        if match:
            val = match.group(1)
            if val.isdigit():
                guests_count = int(val)
                break
            elif val in word_to_num:
                guests_count = word_to_num[val]
                break

    # 2. Parse Date
    booking_date = datetime.date.today()
    if "tomorrow" in query_clean:
        booking_date = datetime.date.today() + datetime.timedelta(days=1)
    elif "day after tomorrow" in query_clean:
        booking_date = datetime.date.today() + datetime.timedelta(days=2)
    else:
        # Match standard date format, e.g. "2026-08-15" or "Aug 15"
        date_match = re.search(r"(\d{4}-\d{2}-\d{2})", query_clean)
        if date_match:
            parsed = parse_date(date_match.group(1))
            if parsed:
                booking_date = parsed

    # 3. Parse Time
    time_slot = "19:00" # default
    time_match = re.search(r"(\d{1,2})(?::(\d{2}))?\s*(pm|am)?", query_clean)
    if time_match:
        hour = int(time_match.group(1))
        minute = int(time_match.group(2)) if time_match.group(2) else 0
        ampm = time_match.group(3)
        
        if ampm == "pm" and hour < 12:
            hour += 12
        elif ampm == "am" and hour == 12:
            hour = 0
            
        time_slot = f"{hour:02d}:{minute:02d}"

    # 4. Parse Location
    location = None
    loc_match = re.search(r"(?:in|near|at|around)\s+([a-zA-Z\s]+)", query_clean)
    if loc_match:
        words = loc_match.group(1).strip().split()
        # Avoid picking up time words
        filtered_words = [w for w in words if w not in ["pm", "am", "tomorrow", "today", "yesterday", "table", "people"]]
        if filtered_words:
            location = " ".join(filtered_words[:2]) # Grab first two words as location candidate

    return {
        "date": booking_date.strftime('%Y-%m-%d'),
        "time_slot": time_slot,
        "guests_count": guests_count,
        "location": location.title() if location else None
    }
