import os
import PyPDF2
import groq
from flask import Flask, request, jsonify
from flask_cors import CORS  # ✅ Import CORS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
app = Flask(__name__)
CORS(app) 

# Direct API Key (Replace with your actual key)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize Groq Client
groq_client = groq.Groq(api_key=GROQ_API_KEY)

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
    
    *Assignment:*
    {assignment_text}
    
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

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

    #aewbwb