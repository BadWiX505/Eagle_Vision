import cv2
import numpy as np
import time
from ultralytics import YOLO
from inference import get_model

# ==========================================
# 1. INITIALIZE LOCAL AI MODELS
# ==========================================
print("Loading AI Models into memory... (This takes a moment on the first run)")

# A. Local YOLOv8 (Strictly for Sports Balls / Baseballs)
local_model = YOLO('yolov8n.pt')

# B. Roboflow Local Models
ROBOFLOW_API_KEY = "mtdBhZCqQk0m3JqPgNMt" # <-- Insert your key

print("Loading Weapon model...")
weapon_model = get_model(model_id="weapon-detection-7kro8/2", api_key=ROBOFLOW_API_KEY)

print("Loading Violence classification model...")
violence_project_id = "violence-detection-sc6br/1" # <-- Insert the custom model ID you found
violence_model = get_model(model_id=violence_project_id, api_key=ROBOFLOW_API_KEY)
# ==========================================
# 2. SETUP LIVE WEBCAM FEED
# ==========================================
cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("\n" + "="*50)
print("SYSTEM ACTIVE: Monitoring live camera feed...")
print("Press Ctrl+C in this terminal to shut down.")
print("="*50 + "\n")

frame_count = 0

# We wrap the loop in a try/except block so Ctrl+C gracefully closes the camera
try:
    while cap.isOpened():
        success, frame = cap.read()
        if not success:
            print("\nCamera disconnected or unavailable.")
            break

        frame_count += 1
        
        # ------------------------------------------
        # RUN AI EVERY 10 FRAMES
        # ------------------------------------------
        if frame_count % 10 == 0:
            
            baseballs_found = 0
            weapons_found = []
            violence_status = "NORMAL"
            violence_conf = 0.0

            # 1. Baseballs
            local_results = local_model(frame, classes=[32], conf=0.4, verbose=False)
            if local_results[0].boxes is not None:
                baseballs_found = len(local_results[0].boxes)

            # 2. Weapons Detection
            try:
                weapon_res = weapon_model.infer(frame)[0].dict()
                for pred in weapon_res.get('predictions', []):
                    # Extract the name of the weapon found
                    weapons_found.append(pred.get('class_name', pred.get('class', 'Weapon')))
            except Exception:
                pass

            # 3. Violence Classification
            try:
                violence_res = violence_model.infer(frame)[0].dict()
                violence_label = violence_res.get('top', 'UNKNOWN').upper()
                
                if violence_label in ['VIOLENCE', 'FIGHT', 'VIOLENT']:
                    try:
                        top_class_data = violence_res.get('predictions', {}).get(violence_res.get('top'), {})
                        violence_conf = top_class_data.get('confidence', 0.0)
                    except:
                        violence_conf = violence_res.get('confidence', 0.0)
                    
                    if violence_conf > 0.60:
                        violence_status = "ALERT"
            except Exception:
                pass

            # ------------------------------------------
            # CONSOLE DASHBOARD OUTPUT
            # ------------------------------------------
            timestamp = time.strftime("%H:%M:%S")
            
            # Print major alerts on a new line so they stay in the console history
            if violence_status == "ALERT":
                print(f"\n[{timestamp}] 🚨 VIOLENCE DETECTED! Confidence: {violence_conf:.2f}")
            
            if weapons_found:
                weapon_list = ", ".join(weapons_found)
                print(f"\n[{timestamp}] ⚠️ WEAPON DETECTED: {weapon_list}")
                
            # Print the normal status on the same line (overwriting it) to keep the console clean
            if violence_status == "NORMAL" and not weapons_found:
                print(f"[{timestamp}] Status: Clear | Baseballs: {baseballs_found} | Weapons: 0", end='\r')

except KeyboardInterrupt:
    # This catches the Ctrl+C command
    print("\n\nShutting down by user request...")

# Clean up
cap.release()
print("System Offline.")