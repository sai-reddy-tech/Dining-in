import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def seed_users():
    # 1. Create Customer
    if not User.objects.filter(email='customer@test.com').exists():
        User.objects.create_user(
            email='customer@test.com',
            name='John Customer',
            phone='+91 98765 43210',
            role='customer',
            password='testpassword123'
        )
        print("Test Customer account created successfully.")
    else:
        print("Test Customer already exists.")

    # 2. Create Owner
    if not User.objects.filter(email='owner@test.com').exists():
        User.objects.create_user(
            email='owner@test.com',
            name='Raj Owner',
            phone='+91 91234 56789',
            role='owner',
            password='testpassword123'
        )
        print("Test Owner account created successfully.")
    else:
        print("Test Owner already exists.")

    # 3. Create Admin
    if not User.objects.filter(email='admin@test.com').exists():
        User.objects.create_superuser(
            email='admin@test.com',
            name='System Administrator',
            phone='+91 99999 88888',
            role='admin',
            password='testpassword123'
        )
        print("Test Admin account created successfully.")
    else:
        print("Test Admin already exists.")

if __name__ == "__main__":
    seed_users()
