# AI-Powered Restaurant Reservation Platform

A production-ready, full-stack ecosystem enabling customers to discover restaurants, select specific tables in real time via live grid configurations, and receive personalized recommendations. It features advanced AI utilities for demand forecasting, waitlist queue promotions, and no-show risk classification.

The platform is divided into a **Django REST Framework + Channels (Daphne)** backend and a **Vite + React** client frontend.

---
screenshot:
![alt text](<Screenshot 2026-08-10 075746.png>) 
![alt text](<Screenshot 2026-08-10 075231.png>) 
![alt text](<Screenshot 2026-08-10 075247.png>) 
![alt text](<Screenshot 2026-08-10 075350.png>) 
![alt text](<Screenshot 2026-08-10 075409.png>) 
![alt text](<Screenshot 2026-08-10 075421.png>) 
![alt text](<Screenshot 2026-08-10 075430.png>) 
![alt text](<Screenshot 2026-08-10 075703.png>) 
![alt text](<Screenshot 2026-08-10 075723.png>)


demo video:
https://drive.google.com/file/d/1DAGGXXRrI2PfXHa7r7ZlwB_345EueL2Z/view?usp=drive_link


## 🛠️ Technology Stack

### Backend
- **Core Framework**: Django 5.x & Django REST Framework (DRF)
- **Real-Time Communication**: Django Channels & Daphne ASGI server (incorporating an in-memory channel layer)
- **Database**: SQLite (local development defaults)
- **AI & Analytics**: Scikit-Learn (Random Forest classifiers), Pandas, NumPy, and Custom NLP String Parsers
- **Security**: SimpleJWT (JSON Web Token authentication with custom role claims)
- **Utility**: Qrcode (check-in pass generation)

### Frontend
- **Framework**: Vite + React JS
- **Styling**: Modern, premium Vanilla CSS theme with full dark/light variables, glassmorphism card panels, and soft fade-in entrance transitions
- **Routing**: React Router DOM (protected by custom role-based private routes)
- **Charts & Visualizations**: Recharts (demand forecasts curves and review sentiment categories bar charts)
- **Icons**: React Icons (Feather Icons pack)
- **Notifications**: React Hot Toast

---

## 📂 Codebase Folder Layout

```text
Dining in/
├── backend/
│   ├── accounts/         # User registrations, profile settings, JWT token views, and tests
│   ├── restaurants/      # Restaurant profiles, tables layout, menus, and serializers
│   ├── reservations/     # Reservation booking views, Waitlist queues, and WS consumers
│   ├── reviews/          # Customer reviews feedback views and serializers
│   ├── ai/               # Core AI modules (forecasting, no-shows, TF-IDF recommendations, NLP parser)
│   ├── core/             # Django settings, URL configurations, and ASGI/routing entries
│   └── manage.py         # Entry point for backend commands
├── frontend/
│   ├── src/
│   │   ├── context/      # Global Contexts (AuthContext, ThemeContext)
│   │   ├── services/     # Axios API instances (pointing to http://localhost:8000/api)
│   │   ├── pages/        # Home, RestaurantDetails, BookingConfirmation, Customer, Owner, and Admin Dashboards
│   │   ├── styles/       # index.css variables and styling components
│   │   ├── App.jsx       # App entrypoint
│   │   └── main.jsx      # React DOM rendering
│   ├── index.html        # HTML shell (configured with metadata description tags for SEO)
│   └── package.json      # Node dependency registry
└── README.md             # Project documentation
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have the following installed on your system:
- Python 3.10+
- Node.js 18+ (with npm)

---

### 2. Backend Setup
1. **Initialize and Activate Virtual Environment**:
   ```cmd
   python -m venv .venv
   .venv\Scripts\activate
   ```
2. **Install Dependencies**:
   ```cmd
   pip install -r backend/requirements.txt
   ```
3. **Database Migrations & Tables Setup**:
   ```cmd
   python backend/manage.py makemigrations accounts restaurants reservations reviews ai
   python backend/manage.py migrate
   ```
4. **Seed Test Accounts Database**:
   We provide a seed utility that registers three test roles:
   ```cmd
   .venv\Scripts\python.exe -c "import os, django; os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings'); django.setup(); from django.contrib.auth import get_user_model; User=get_user_model(); User.objects.create_user(email='customer@test.com', name='John Customer', phone='+91 98765 43210', role='customer', password='testpassword123') if not User.objects.filter(email='customer@test.com').exists() else None; User.objects.create_user(email='owner@test.com', name='Raj Owner', phone='+91 91234 56789', role='owner', password='testpassword123') if not User.objects.filter(email='owner@test.com').exists() else None; User.objects.create_superuser(email='admin@test.com', name='System Admin', phone='+91 99999 88888', role='admin', password='testpassword123') if not User.objects.filter(email='admin@test.com').exists() else None; print('Seeded!')"
   ```
5. **Start backend API server** (runs on port `8000`):
   ```cmd
   python backend/manage.py runserver
   ```

---

### 3. Frontend Setup
1. **Navigate to the frontend folder**:
   ```cmd
   cd frontend
   ```
2. **Install Node Packages**:
   ```cmd
   npm install
   ```
3. **Start the Frontend Development Server** (runs on port `5173`):
   ```cmd
   npm run dev
   ```

Open **[http://localhost:5173/](http://localhost:5173/)** in your web browser to access the application.

---

## 🔑 Test Account Credentials

Log in using these seeded test profiles to explore different aspects of the dashboard:

| User Role | Email Address | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Customer** | `customer@test.com` | `testpassword123` | Search, NLP Chatbot Assistant, choose table grid, view check-in QR codes, write sentiment-scored reviews. |
| **Restaurant Owner** | `owner@test.com` | `testpassword123` | Upload covers, modify menus, delete profile, check bookings, track Recharts 7-day demand forecasts, and see no-show risk flags. |
| **System Admin** | `admin@test.com` | `testpassword123` | Moderate review lists, delete restaurants, audit dynamic registered users list pulled directly from DB. |

---

## 🔬 Running Automated Tests
Run unit tests to verify database model structures, user roles, AI text parses, and review category scores:
```cmd
python backend/manage.py test accounts
```
