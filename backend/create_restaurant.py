import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
from restaurants.models import Restaurant, Table, MenuItem

User = get_user_model()

def create_maisammaguda_restaurant():
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
        print("Test owner user created.")
    else:
        print("Test owner user loaded.")

    # 2. Create the restaurant "Maisammaguda"
    restaurant, rest_created = Restaurant.objects.get_or_create(
        name='Maisammaguda Biryani Hub',
        defaults={
            'owner': owner,
            'cuisine': 'Biryani & South Indian',
            'location': 'Maisammaguda, Hyderabad',
            'description': 'A premium dining experience in Maisammaguda offering authentic Hyderabadi Biryani, kebabs, and South Indian delicacies.',
            'operating_hours': '11:00 AM - 11:00 PM',
            'price_range': '$$',
            'rating': 4.6
        }
    )

    if rest_created:
        print(f"Restaurant '{restaurant.name}' created successfully.")
    else:
        print(f"Restaurant '{restaurant.name}' already exists.")

    # 3. Create Tables for this restaurant
    tables_data = [
        {'table_number': 'M1', 'capacity': 2, 'location': 'Main Room'},
        {'table_number': 'M2', 'capacity': 4, 'location': 'Main Room'},
        {'table_number': 'W1', 'capacity': 2, 'location': 'Window Side'},
        {'table_number': 'W2', 'capacity': 4, 'location': 'Window Side'},
        {'table_number': 'P1', 'capacity': 6, 'location': 'Patio Outdoor'}
    ]

    for t_data in tables_data:
        table, t_created = Table.objects.get_or_create(
            restaurant=restaurant,
            table_number=t_data['table_number'],
            defaults={
                'capacity': t_data['capacity'],
                'location_tag': t_data['location'],
                'is_active': True
            }
        )
        if t_created:
            print(f"Table {table.table_number} (Cap: {table.capacity}) created.")

    # 4. Create Menu Items for this restaurant
    menu_data = [
        {
            'name': 'Special Hyderabadi Chicken Biryani',
            'description': 'Fragrant long grain basmati rice layered with spiced marinated chicken, cooked dum-style.',
            'price': 320.00,
            'category': 'Main Course'
        },
        {
            'name': 'Tangdi Kebab',
            'description': 'Chicken drumsticks marinated in a rich cream and yogurt blend, grilled over live charcoal.',
            'price': 260.00,
            'category': 'Starter'
        },
        {
            'name': 'Double Ka Meetha',
            'description': 'Traditional bread pudding dessert soaked in saffron-flavored milk and topped with dry fruits.',
            'price': 120.00,
            'category': 'Dessert'
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
    create_maisammaguda_restaurant()
