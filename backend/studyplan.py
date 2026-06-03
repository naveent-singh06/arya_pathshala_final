from flask import Flask, request, jsonify
import pandas as pd
import datetime
import groq
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Load API Key securely
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = groq.Groq(api_key=GROQ_API_KEY)

# Load dataset
def load_data():
    try:
        df = pd.read_csv("xAPI-Edu-Data.csv")
        return df
    except:
        return None

df = load_data()

# API Route (for React frontend)
@app.route("/generate-plan", methods=["POST"])
def generate_study_plan():
    try:
        data = request.json

        daily_habits = data.get("daily_habits")
        study_habits = data.get("study_habits")
        selected_subjects = data.get("subjects", [])
        exam_date = data.get("exam_date")
        study_time = data.get("study_time")
        days_of_week = data.get("days_of_week", [])

        # Validation
        if not daily_habits or not study_habits or not selected_subjects or not days_of_week:
            return jsonify({"error": "Please provide all required inputs."}), 400

        subjects_str = ", ".join(selected_subjects)

        # AI Prompt
        prompt = f"""
        Generate a personalized and detailed study schedule for a student:

        Daily Routine: {daily_habits}
        Study Style: {study_habits}
        Subjects: {subjects_str}
        Exam Date: {exam_date}
        Study Days: {', '.join(days_of_week)}
        Study Time: {study_time}

        Make it realistic, include breaks, revisions, and subject-wise planning.
        """

        # AI Call
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[
                {"role": "system", "content": "You are an expert study planner."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1024
        )

        study_plan = response.choices[0].message.content.strip()

        return jsonify({"study_plan": study_plan})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5001)