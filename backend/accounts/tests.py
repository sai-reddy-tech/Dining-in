from django.test import TestCase
from django.contrib.auth import get_user_model
from ai.ai_engine import parse_booking_query, analyze_sentiment

User = get_user_model()

class AccountsAndAITests(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            email='customer@test.com',
            name='John Test',
            password='testpassword123',
            role='customer'
        )
        self.assertEqual(user.email, 'customer@test.com')
        self.assertEqual(user.role, 'customer')
        self.assertTrue(user.check_password('testpassword123'))

    def test_nlp_booking_parser(self):
        query = "Book a table for four tomorrow at 8 PM near Madhapur"
        parsed = parse_booking_query(query)
        self.assertEqual(parsed['guests_count'], 4)
        self.assertEqual(parsed['time_slot'], '20:00')
        self.assertEqual(parsed['location'], 'Madhapur')

    def test_sentiment_scorer(self):
        food_comment = "The pizza was absolutely delicious!"
        food_sentiment = analyze_sentiment(food_comment, 3)
        self.assertGreater(food_sentiment['food_score'], 3.0)

        service_comment = "The service was extremely slow."
        service_sentiment = analyze_sentiment(service_comment, 3)
        self.assertLess(service_sentiment['service_score'], 3.0)
