import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from restaurants.models import Restaurant, Table, MenuItem

User = get_user_model()

def create_chillax_restaurant():
    # 1. Get or create owner user
    owner, created = User.objects.get_or_create(
        email='owner@test.com',
        defaults={
            'name': 'Raj Owner',
            'phone': '+91 91234 56789',
            'role': 'owner'
        }
    )
    if created:
        owner.set_password('testpassword123')
        owner.save()

    # 2. Create the restaurant "Chillax Drive In"
    restaurant, rest_created = Restaurant.objects.get_or_create(
        name='Chillax Drive In',
        defaults={
            'owner': owner,
            'cuisine': 'Fast Food, Cafe & Mocktails',
            'location': 'Maisammaguda Main Road, Secunderabad',
            'description': 'A lively open-air drive-in food court in Maisammaguda featuring multi-cuisine kiosks, thick shakes, wraps, and momos. The ultimate late-night hangout spot for students and friends.',
            'operating_hours': '04:00 PM - 03:00 AM',
            'price_range': '$$',
            'rating': 4.4
        }
    )

    if rest_created:
        print(f"Restaurant '{restaurant.name}' created successfully.")
    else:
        print(f"Restaurant '{restaurant.name}' already exists.")

    # 3. Create Tables for this restaurant
    tables_data = [
        {'table_number': 'C1', 'capacity': 2, 'location_tag': 'Open Air Yard'},
        {'table_number': 'C2', 'capacity': 4, 'location_tag': 'Open Air Yard'},
        {'table_number': 'C3', 'capacity': 4, 'location_tag': 'Open Air Yard'},
        {'table_number': 'R1', 'capacity': 2, 'location_tag': 'Rooftop Lounge'},
        {'table_number': 'R2', 'capacity': 6, 'location_tag': 'Rooftop Lounge'}
    ]

    for t_data in tables_data:
        table, t_created = Table.objects.get_or_create(
            restaurant=restaurant,
            table_number=t_data['table_number'],
            defaults={
                'capacity': t_data['capacity'],
                'location_tag': t_data['location_tag'],
                'is_active': True
            }
        )
        if t_created:
            print(f"Table {table.table_number} (Cap: {table.capacity}) created.")

    # 4. Create Menu Items for this restaurant
    menu_data = [
        {
            'name': 'KitKat Thick Shake',
            'description': 'A rich chocolate milkshake blended with crunchy KitKat bars and topped with whipped cream.',
            'price': 180.00,
            'category': 'Drink'
        },
        {
            'name': 'Loaded Cheese Nachos',
            'description': 'Crispy tortilla chips topped with spiced beans, jalapeños, olives, and warm liquid cheddar cheese sauce.',
            'price': 220.00,
            'category': 'Appetizer'
        },
        {
            'name': 'Peri Peri Grilled Chicken Wrap',
            'description': 'Tender grilled chicken strips tossed in spicy peri peri sauce, wrapped in a fresh flatbread with lettuce and mayo.',
            'price': 245.00,
            'category': 'Main Course'
        }
    ]

    for m_data in menu_data:
        menu_item, m_created = MenuItem.objects.get_or_create(
            restaurant=restaurant,
            name=m_data['name'],
            defaults={
                'description': m_data['description'],
                'price': m_data['price'],
                'category': m_data['category']
            }
        )
        if m_created:
            print(f"Menu item '{menu_item.name}' added.")

if __name__ == "__main__":
    create_chillax_restaurant()
