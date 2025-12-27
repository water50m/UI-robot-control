# fake_robot.py
import asyncio
import websockets
import json
import random
import math

SERVER_URL = "ws://localhost:8000/ws/robot"

async def run_robot():
    async with websockets.connect(SERVER_URL) as websocket:
        print("✅ Fake Robot connected to Brain!")
        
        # สร้าง Loop แยกเพื่อรอรับคำสั่ง (เหมือนฟังก์ชัน webSocketEvent ใน ESP32)
        async def receive_commands():
            while True:
                msg = await websocket.recv()
                print(f"📥 Robot Received Command: {msg}")
                # ตรงนี้ถ้าเป็นหุ่นจริงคือสั่ง Motor หมุน

        # รันตัวรับคำสั่งไว้เบื้องหลัง
        asyncio.create_task(receive_commands())

        # Loop หลักสำหรับส่งค่า Sensor (เหมือน void loop)
        angle = 0
        while True:
            # 1. จำลองข้อมูลสถานะ (Status)
            status_packet = {
                "type": "status",
                "bat": round(random.uniform(10.0, 12.6), 1), # แบตแกว่งไปมา
                "mode": "MANUAL"
            }
            await websocket.send(json.dumps(status_packet))

            # 2. จำลองข้อมูล Lidar (สร้างจุดวงกลมหมุนๆ)
            # สร้างกำแพงปลอมๆ ระยะ 200cm
            fake_dist = 200 + random.randint(-5, 5) 
            lidar_packet = {
                "type": "lidar",
                "angle": angle,
                "dist": fake_dist
            }
            await websocket.send(json.dumps(lidar_packet))

            # ขยับมุม Servo
            angle = (angle + 5) % 180
            
            # ส่งทุกๆ 0.1 วินาที
            await asyncio.sleep(0.1)

asyncio.run(run_robot())