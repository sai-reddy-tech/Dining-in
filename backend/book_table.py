import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from restaurants.models import Restaurant, Table
from reservations.models import Reservation
from reservations.waitlist_manager import generate_qr_for_reservation

User = get_user_model()

def book_table():
    try:
        # 1. Fetch user
        user = User.objects.get(email='customer@test.com')
    except User.DoesNotExist:
        print("Error: customer@test.com user not found. Please run seed.py first.")
        return

    try:
        # 2. Fetch restaurant
        restaurant = Restaurant.objects.get(name='Maisammaguda Biryani Hub')
    except Restaurant.DoesNotExist:
        print("Error: Restaurant 'Maisammaguda Biryani Hub' not found. Please run create_restaurant.py first.")
        return

    # 3. Find table W2 or W1 or M2
    try:
        table = Table.objects.get(restaurant=restaurant, table_number='M2')
    except Table.DoesNotExist:
        table = Table.objects.filter(restaurant=restaurant).first()
        if not table:
            print("Error: No tables found for this restaurant.")
            return

    # 4. Create reservation
    reservation = Reservation.objects.create(
        user=user,
        restaurant=restaurant,
        table=table,
        date='2026-08-10',
        time_slot='20:00',
        guests_count=4,
        status='confirmed'
    )

    # 5. Generate check-in QR code ticket
    generate_qr_for_reservation(reservation)

    print(f"Successfully booked Table {table.table_number} ({table.capacity} Pax) at '{restaurant.name}'!")
    print(f"Customer: {user.name} ({user.email})")
    print(f"Date/Time: {reservation.date} @ {reservation.time_slot}")
    print(f"Reservation ID: {reservation.id}")
    print("QR Code generated successfully.")

if __name__ == "__main__":
    book_table()
