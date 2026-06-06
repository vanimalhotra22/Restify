import random
import asyncio
from fastapi_socketio import SocketManager

async def simulate_realtime_data(sio, sid):
    for _ in range(20):
        data = {
            "heart_rate": random.randint(55, 100),
            "spo2": random.randint(90, 100),
            "sleep_stage": random.choice(["Light", "Deep", "REM"])
        }
        await sio.emit("realtime_data", data, room=sid)
        await asyncio.sleep(1)
