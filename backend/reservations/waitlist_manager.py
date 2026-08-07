from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import WaitlistEntry, Reservation

def generate_qr_for_reservation(reservation):
    import qrcode
    from io import BytesIO
    from django.core.files import File
    
    qr_data = (
        f"Booking ID: {reservation.id}\n"
        f"Restaurant: {reservation.restaurant.name}\n"
        f"Customer: {reservation.user.name}\n"
        f"Date: {reservation.date}\n"
        f"Time: {reservation.time_slot}\n"
        f"Guests: {reservation.guests_count}\n"
        f"Status: {reservation.status.upper()}"
    )
    
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(qr_data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    blob = BytesIO()
    img.save(blob, 'PNG')
    
    reservation.qr_code_image.save(f"qr_{reservation.id}.png", File(blob), save=True)

def check_and_promote_waitlist(restaurant, date, time_slot, table):
    """
    Called when a reservation is cancelled or a table is freed.
    Looks for the oldest waitlist entry for this restaurant, date, and time_slot
    whose guest count fits the capacity of the freed table, and promotes them.
    """
    # Find active waitlist entries for this restaurant/date/time
    waitlisted = WaitlistEntry.objects.filter(
        restaurant=restaurant,
        date=date,
        time_slot=time_slot,
        status='waiting'
    ).order_by('created_at') # First in, first out

    for entry in waitlisted:
        if entry.guests_count <= table.capacity:
            entry.status = 'matched'
            entry.save()

            # Create reservation for waitlisted user
            new_res = Reservation.objects.create(
                user=entry.user,
                restaurant=restaurant,
                table=table,
                date=date,
                time_slot=time_slot,
                guests_count=entry.guests_count,
                status='confirmed',
                special_requests="Auto-promoted from Waitlist"
            )

            # Generate QR code for the new reservation
            try:
                generate_qr_for_reservation(new_res)
            except Exception as e:
                print("QR Generation Error:", e)

            # Notify via WebSockets
            channel_layer = get_channel_layer()
            if channel_layer:
                # 1. Notify the restaurant availability group
                async_to_sync(channel_layer.group_send)(
                    f"restaurant_{restaurant.id}_availability",
                    {
                        "type": "availability_update",
                        "data": {
                            "table_id": table.id,
                            "table_number": table.table_number,
                            "status": "occupied"
                        }
                    }
                )
                # 2. Notify the customer in a notifications group
                async_to_sync(channel_layer.group_send)(
                    "notifications",
                    {
                        "type": "user_notification",
                        "data": {
                            "user_id": entry.user.id,
                            "type": "waitlist_bump",
                            "message": f"Congratulations! Your waitlist booking at {restaurant.name} has been confirmed for {date} {time_slot}.",
                            "reservation_id": new_res.id
                        }
                    }
                )
            return new_res
    return None
