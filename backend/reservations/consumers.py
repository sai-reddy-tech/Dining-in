import json
from channels.generic.websocket import AsyncWebsocketConsumer

class RestaurantAvailabilityConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.restaurant_id = self.scope['url_route']['kwargs']['restaurant_id']
        self.group_name = f"restaurant_{self.restaurant_id}_availability"

        # Join restaurant availability group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive message from group
    async def availability_update(self, event):
        data = event['data']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'availability_update',
            'data': data
        }))

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "notifications"
        # Join notification group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    # Receive notification from group
    async def user_notification(self, event):
        data = event['data']
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'user_notification',
            'data': data
        }))
