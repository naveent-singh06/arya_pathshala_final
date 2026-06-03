import React, { useState } from "react";
import styles from "./Assistant.module.css";

const AssignmentGrader = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [gradingReport, setGradingReport] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const gradeAssignment = async () => {
    if (!selectedFile) {
      alert("Please upload a PDF file.");
      return;
    }
  
    const formData = new FormData();
    formData.append("file", selectedFile);
  
    setLoading(true);
  
    try {
      const response = await fetch("http://127.0.0.1:5000/grade-assignment", {
        method: "POST",
        body: formData,
      });
  
      const data = await response.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        // Clean the grading report by removing asterisks (*)
        const cleanedReport = data.grading_report.replace(/\*/g, "").trim();
        setGradingReport(cleanedReport);
      }
    } catch (error) {
      console.error("Error grading assignment:", error);
    }
  
    setLoading(false);
  };
  

  return (
    <div className={styles.container}>
      <div className={styles.uploadSection}>
      <h2 className={styles.title}>📚 AI-Powered Assignment Grader</h2>
        <input type="file" accept="application/pdf" onChange={handleFileChange} />
        <button onClick={gradeAssignment} className={styles.uploadButton} disabled={loading}>
          {loading ? "Grading..." : "Upload & Grade"}
        </button>
      </div>

      {gradingReport && (
        <div className={styles.reportBox}>
          <h3>📜 Grading Report:</h3>
          <textarea value={gradingReport} readOnly className={styles.textArea} />
        </div>
      )}
    </div>
  );
};

export default AssignmentGrader;
