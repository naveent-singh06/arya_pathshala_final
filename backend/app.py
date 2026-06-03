import os
import PyPDF2
import groq
import cv2
import numpy as np
import torch
import pickle
import smtplib
import pandas as pd
import datetime
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from ultralytics import YOLO
from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image
from werkzeug.utils import secure_filename
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ------------------------------------------------------
# Groq API Key (Replace with your actual key)
# ------------------------------------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
groq_client = groq.Groq(api_key=GROQ_API_KEY)

# ------------------------------------------------------
# Assignment Grading Functionality
# ------------------------------------------------------
def extract_text_from_pdf(pdf_file):
    reader = PyPDF2.PdfReader(pdf_file)
    text = "\n".join([page.extract_text() for page in reader.pages if page.extract_text()])
    return text

@app.route("/grade-assignment", methods=["POST"])
def grade_assignment():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    assignment_text = extract_text_from_pdf(file)

    if not assignment_text.strip():
        return jsonify({"error": "Assignment text is empty. Please upload a valid PDF."}), 400

    prompt = f"""
    Grade the following assignment based on:
    - *Clarity (20%)* 
    - *Accuracy (30%)* 
    - *Structure (20%)* 
    - *Creativity (20%)* 
    - *Grammar & Spelling (10%)* 

    Provide a *detailed score breakdown* and an overall *grade (A-F)* with *constructive feedback*.

    *Assignment:* {assignment_text}

    The feedback should be *clear, constructive, and helpful* for the student to improve.
    """
    response = groq_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role": "system", "content": "You are an expert assignment grader."},
                  {"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1024
    )

    grading_report = response.choices[0].message.content.strip()
    return jsonify({"grading_report": grading_report})

# ------------------------------------------------------
# Face Recognition Attendance System
# ------------------------------------------------------
student_emails = {
    "104": "himalayansuryansh@gmail.com",
    "126": "svsaurav95@gmail.com",
    "117": "amanpreet0303kaur@gmail.com"
}

EMAIL_SENDER = os.getenv("EMAIL_SENDER")
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Using device: {device}")

face_detector = YOLO("ultralytics/yolov8n.pt")
facenet_model = InceptionResnetV1(pretrained='casia-webface').to(device).eval()
mtcnn = MTCNN(keep_all=False, device=device)

STUDENT_DATASET_DIR = "students"
EMBEDDINGS_FILE = "student_embeddings.pkl"
os.makedirs(STUDENT_DATASET_DIR, exist_ok=True)

if os.path.exists(EMBEDDINGS_FILE):
    with open(EMBEDDINGS_FILE, "rb") as f:
        student_embeddings = pickle.load(f)
else:
    student_embeddings = {}

attendance_log = {}

def detect_faces(frame):
    results = face_detector(frame)
    faces = []
    for result in results:
        boxes = result.boxes.xyxy.cpu().numpy() if result.boxes is not None else []
        for box in boxes:
            x1, y1, x2, y2 = map(int, box[:4])
            h, w, _ = frame.shape
            x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
            face_img = frame[y1:y2, x1:x2]
            if face_img.size == 0:
                continue
            faces.append((face_img, (x1, y1, x2, y2)))
    return faces

def get_face_embedding(face_img):
    try:
        pil_img = Image.fromarray(cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB))
        face_aligned = mtcnn(pil_img)
        if face_aligned is None:
            return None
        with torch.no_grad():
            face_aligned = face_aligned.to(device)
            embedding = facenet_model(face_aligned.unsqueeze(0))
        return embedding.cpu().numpy().flatten()
    except Exception as e:
        print("Error in embedding extraction:", e)
        return None

def recognize_student(face_embedding):
    if face_embedding is None:
        return None, 0
    best_match = None
    best_similarity = 0
    for student_name, stored_embedding in student_embeddings.items():
        similarity = np.dot(stored_embedding, face_embedding) / (
            np.linalg.norm(stored_embedding) * np.linalg.norm(face_embedding) + 1e-10
        )
        if similarity > best_similarity and similarity > 0.65:
            best_match = student_name
            best_similarity = similarity
    return best_match, best_similarity

def send_email(student_roll):
    recipient_email = student_emails.get(student_roll)
    if not recipient_email:
        return

    timestamp = attendance_log.get(student_roll, {}).get("timestamp", "Unknown Time")

    subject = "Attendance Marked Successfully"
    body = f"""
    Hello,

    Your attendance has been marked successfully.

    ✅ Roll No: {student_roll}  
    📅 Date & Time: {timestamp}  

    Regards,  
    Team Digi Dynamos
    """
    
    msg = MIMEMultipart()
    msg["From"] = EMAIL_SENDER
    msg["To"] = recipient_email
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_SENDER, EMAIL_PASSWORD)
        server.sendmail(EMAIL_SENDER, recipient_email, msg.as_string())
        server.quit()
        print(f"Email sent to {recipient_email} for {student_roll} at {timestamp}")
    except Exception as e:
        print(f"Email Error: {e}")


@app.route('/upload_student', methods=['POST'])
def upload_student():
    """Handles student image uploads, extracts face embeddings, and stores them using roll number."""
    global student_embeddings

    if 'file' not in request.files:
        return jsonify({"error": "Missing file"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Invalid file name"}), 400

    # Extract roll number from filename (expects format: 104.jpg)
    filename = secure_filename(file.filename)
    roll_number, ext = os.path.splitext(filename)
    
    if not roll_number.isdigit():
        return jsonify({"error": "Filename must be a numeric roll number (e.g., 104.jpg)"}), 400

    file_path = os.path.join(STUDENT_DATASET_DIR, filename)
    file.save(file_path)

    frame = cv2.imread(file_path)

    # Detect face in the uploaded image
    faces = detect_faces(frame)
    if len(faces) != 1:
        return jsonify({"error": "The image must contain exactly one face!"}), 400

    face_img, _ = faces[0]
    embedding = get_face_embedding(face_img)

    if embedding is None:
        return jsonify({"error": "Could not generate an embedding."}), 400

    # Store student embedding using roll number
    student_embeddings[roll_number] = embedding
    with open(EMBEDDINGS_FILE, "wb") as f:
        pickle.dump(student_embeddings, f)

    return jsonify({"message": f"Student with Roll No {roll_number} added successfully."})

def generate_frames():
    """Generates webcam frames with face detection and attendance marking."""
    cap = cv2.VideoCapture(0)
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break

            faces = detect_faces(frame)
            for face_img, (x1, y1, x2, y2) in faces:
                current_embedding = get_face_embedding(face_img)
                student_roll, similarity = recognize_student(current_embedding)

                if student_roll:
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(frame, f"{student_roll} ({similarity:.2f})",
                                (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

                    # Mark attendance with timestamp
                    if student_roll not in attendance_log:
                        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        attendance_log[student_roll] = {"status": "Present", "timestamp": timestamp}
                        print(f"Marked {student_roll} as Present at {timestamp}")

                        # Send email notification
                        send_email(student_roll)

            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()

            yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
    finally:
        cap.release()
        cv2.destroyAllWindows()

@app.route('/video_feed')
def video_feed():
    """Streams the live video feed with attendance marking."""
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/attendance', methods=['GET'])
def get_attendance():
    return jsonify(attendance_log), 200

# ------------------------------------------------------
# Study Plan Generator
# ------------------------------------------------------
df = pd.read_csv("xAPI-Edu-Data.csv")

@app.route("/generate-plan", methods=["POST"])
def generate_study_plan():
    data = request.json
    prompt = f"""
    Generate a personalized study schedule for:
    - Daily Routine: {data.get("daily_habits")}
    - Study Style: {data.get("study_habits")}
    - Focus Subjects: {', '.join(data.get("subjects", []))}
    """
    response = groq_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=1024
    )
    return jsonify({"study_plan": response.choices[0].message.content.strip()})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
