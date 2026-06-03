import React, { useState } from "react";
import styles from "./Planner.module.css"; // Import CSS module

const subjectResources = {
  "Data Structures and Algorithms": [
    { title: "DSA Guide", url: "https://www.geeksforgeeks.org/data-structures/" },
    { title: "LeetCode DSA", url: "https://leetcode.com/" },
    { title: "Algorithms Visualization", url: "https://visualgo.net/en" },
  ],
  "Web Development": [
    { title: "MDN Web Docs", url: "https://developer.mozilla.org/en-US/" },
    { title: "Frontend Mentor", url: "https://www.frontendmentor.io/" },
    { title: "CSS Tricks", url: "https://css-tricks.com/" },
  ],
  "Object Oriented Programming": [
    { title: "OOP Concepts", url: "https://www.javatpoint.com/object-oriented-programming-in-java" },
    { title: "SOLID Principles", url: "https://www.freecodecamp.org/news/solid-principles-explained-in-plain-english/" },
    { title: "OOP in C++", url: "https://www.geeksforgeeks.org/object-oriented-programming-in-cpp/" },
  ],
  "Machine Learning": [
    { title: "ML Crash Course ", url: "https://developers.google.com/machine-learning/crash-course" },
    { title: "Kaggle Courses", url: "https://www.kaggle.com/learn" },
    { title: "ML Cheat Sheet", url: "https://ml-cheatsheet.readthedocs.io/en/latest/" },
  ],
};

const Planner = () => {
  const [formData, setFormData] = useState({
    daily_habits: "",
    study_habits: "",
    subjects: [],
    exam_date: "",
    study_time: "",
    days_of_week: [],
  });

  const [studyPlan, setStudyPlan] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMultiSelect = (e) => {
    const { name, options } = e.target;
    const selectedValues = Array.from(options)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setFormData((prev) => ({ ...prev, [name]: selectedValues }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      setStudyPlan(data.study_plan?.replace(/\*/g, "") || "⚠️ Error generating study plan.");

      // Extract selected subjects and retrieve corresponding resources
      const selectedSubjects = formData.subjects;
      const resources = selectedSubjects.flatMap((subject) => subjectResources[subject] || []);
      setSelectedResources(resources);
    } catch (error) {
      console.error("Error fetching study plan:", error);
      setStudyPlan("⚠️ Failed to connect to the server.");
    }

    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>📚 Study Plan Generator</h2>
          <label>Daily Habits:</label>
          <input type="text" name="daily_habits" onChange={handleChange} required />

          <label>Study Habits:</label>
          <input type="text" name="study_habits" onChange={handleChange} required />

          <label>Select Subject:</label>
          <select name="subjects" multiple onChange={handleMultiSelect} required>
            <option value="Data Structures and Algorithms">Data Structures and Algorithms</option>
            <option value="Web Development">Web Development</option>
            <option value="Object Oriented Programming">Object Oriented Programming</option>
            <option value="Machine Learning">Machine Learning</option>
          </select>

          <label>Exam Date:</label>
          <input type="date" name="exam_date" onChange={handleChange} required />

          <label>Preferred Study Time:</label>
          <input type="time" name="study_time" onChange={handleChange} required />

          <label>Preferred Studying Day:</label>
          <select name="days_of_week" multiple onChange={handleMultiSelect} required>
            <option value="Monday">Monday</option>
            <option value="Tuesday">Tuesday</option>
            <option value="Wednesday">Wednesday</option>
            <option value="Thursday">Thursday</option>
            <option value="Friday">Friday</option>
            <option value="Saturday">Saturday</option>
            <option value="Sunday">Sunday</option>
          </select>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "⏳ Generating..." : "Generate Plan"}
          </button>
        </form>
      </div>

      <div className={styles.rightPanel}>
        <div className={styles.result}>
          <h3>📅 Your Study Plan:</h3>
          <p>{studyPlan || "Your study plan will appear here."}</p>
        </div>

        <div className={styles.result}>
          <h3>🔗 Additional Resources:</h3>
          {selectedResources.length > 0 ? (
            <ul>
              {selectedResources.map((resource, index) => (
                <li key={index}>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    {resource.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p>No resources selected yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Planner;
