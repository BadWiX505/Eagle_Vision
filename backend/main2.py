import cv2
import time
from ultralytics import YOLO
from inference import get_model

# ==========================================
# 1. INITIALIZE LOCAL AI MODELS
# ==========================================
print("Loading AI Models into memory...")

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
# 2. SETUP VIDEO INPUT AND OUTPUT
# ==========================================
input_path = 'vv.mp4'  # <-- Put your test video name here
output_path = 'stadium_security_analyzed.mp4'

cap = cv2.VideoCapture(input_path)

if not cap.isOpened():
    print(f"Error: Could not open {input_path}. Check if the file exists.")
    exit()

# Get video properties to set up the writer correctly
width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = int(cap.get(cv2.CAP_PROP_FPS))
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Initialize the VideoWriter
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

print("\n" + "="*50)
print(f"Starting Video Processing: {total_frames} total frames.")
print("This will process EVERY frame. It may take some time depending on your CPU.")
print("="*50 + "\n")

frame_count = 0
start_time = time.time()

# ==========================================
# 3. THE CORE PROCESSING LOOP
# ==========================================
while cap.isOpened():
    success, frame = cap.read()
    if not success:
        break

    frame_count += 1
    
    # Print progress to the console
    percent_done = (frame_count / total_frames) * 100
    print(f"Rendering: Frame {frame_count}/{total_frames} ({percent_done:.1f}%)", end='\r')

    # ------------------------------------------
    # RUN AI ON THE CURRENT FRAME
    # ------------------------------------------
    
    # 1. Baseballs (Class 32)
    local_results = local_model(frame, classes=[32], conf=0.4, verbose=False)
    last_yolo_boxes = local_results[0]

    # 2. Weapons Detection
    last_weapons_found = []
    try:
        weapon_res = weapon_model.infer(frame)[0].dict()
        last_weapons_found = weapon_res.get('predictions', [])
    except Exception:
        pass

    # 3. Violence Classification
    violence_label = "NORMAL"
    violence_confidence = 0.0
    is_violent = False
    
    try:
        violence_res = violence_model.infer(frame)[0].dict()
        top_pred = violence_res.get('top', 'UNKNOWN').upper()
        
        try:
            top_class_data = violence_res.get('predictions', {}).get(violence_res.get('top'), {})
            violence_confidence = top_class_data.get('confidence', 0.0)
        except:
            violence_confidence = violence_res.get('confidence', 0.0)
        
        if top_pred in ['VIOLENCE', 'FIGHT', 'VIOLENT'] and violence_confidence > 0.60:
            is_violent = True
            violence_label = "VIOLENCE"
        else:
            violence_label = top_pred
    except Exception:
        pass

    # ------------------------------------------
    # DRAW VISUALS ON THE FRAME
    # ------------------------------------------
    
    # Baseballs
    if last_yolo_boxes is not None:
        annotated_frame = last_yolo_boxes.plot(img=frame)
    else:
        annotated_frame = frame.copy()

    # Weapons
    for prediction in last_weapons_found:
        x, y = int(prediction['x']), int(prediction['y'])
        w, h = int(prediction['width']), int(prediction['height'])
        x1, y1 = int(x - w/2), int(y - h/2)
        x2, y2 = int(x + w/2), int(y + h/2)
        
        cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (0, 0, 255), 3)
        class_name = prediction.get('class_name', prediction.get('class', 'Weapon'))
        label = f"{class_name} {prediction['confidence']:.2f}"
        cv2.putText(annotated_frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)

    # Violence HUD
    if is_violent:
        bg_color = (0, 0, 255) # Red
        display_text = f"ALERT: {violence_label} ({violence_confidence:.2f})"
        cv2.rectangle(annotated_frame, (0, 0), (width, height), bg_color, 10)
    else:
        bg_color = (0, 150, 0) # Green
        display_text = f"NORMAL: {violence_label} ({violence_confidence:.2f})"

    cv2.rectangle(annotated_frame, (10, 10), (450, 50), bg_color, -1)
    cv2.putText(annotated_frame, display_text, (20, 38), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

    # Write the completed frame to the new video file
    out.write(annotated_frame)

# Clean up
cap.release()
out.release()
end_time = time.time()

print(f"\n\nProcessing Complete! Saved as {output_path}")
print(f"Total time taken: {(end_time - start_time) / 60:.1f} minutes.")