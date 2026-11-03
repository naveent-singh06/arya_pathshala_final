import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Upload, Camera, UserCheck } from "lucide-react";
import styles from "./FaceRecog.module.css";

const FLASK_BACKEND_URL = "http://localhost:5000";

const FaceRecog = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [showWebcam, setShowWebcam] = useState(false);
  const [attendance, setAttendance] = useState({});


  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadStatus("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {  
      setUploadStatus("Please select a file first");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(`${FLASK_BACKEND_URL}/upload_student`, formData);
      setUploadStatus(response.data.message);
    } catch (error) {
      setUploadStatus("Error uploading file. Please try again.");
      console.error("Upload error:", error);
    }
  };

  const toggleWebcam = () => {
    setShowWebcam(!showWebcam);
  };

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await axios.get(`${FLASK_BACKEND_URL}/attendance`);
      setAttendance(response.data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
  }, []);

  useEffect(() => {
    if (showWebcam) {
      fetchAttendance(); 
      const interval = setInterval(fetchAttendance, 3000);
      return () => clearInterval(interval);
    }
  }, [showWebcam, fetchAttendance]);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Face Recognition Attendance System</h1>

        {/* File Upload Section */}
        <div className={styles.uploadSection}>
          <h2 className={styles.sectionTitle}>
            <Upload size={24} /> Upload Student Photo
          </h2>
          <div className={styles.fileInputContainer}>
            <input
              type="file"
              onChange={handleFileChange}
              accept="image/*"
              className={styles.fileInput}
            />
            <button onClick={handleUpload} className={`${styles.button} ${styles.buttonPrimary}`}>
              Upload
            </button>
          </div>
          {uploadStatus && (
            <p className={`${styles.statusMessage} ${uploadStatus.includes("Error") ? styles.error : styles.success}`}>
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Webcam Section */}
        <div className={styles.webcamSection}>
          <div className={styles.webcamHeader}>
            <h2 className={styles.sectionTitle}>
              <Camera size={24} /> Live Recognition
            </h2>
            <button
              onClick={toggleWebcam}
              className={`${styles.button} ${showWebcam ? styles.buttonDanger : styles.buttonSuccess}`}
            >
              {showWebcam ? "Stop Camera" : "Start Camera"}
            </button>
          </div>

          {showWebcam && (
            <div className={styles.videoContainer}>
              <img
                src={`${FLASK_BACKEND_URL}/video_feed`}
                alt="Video feed"
                className={styles.videoFeed}
              />
            </div>
          )}
        </div>

        {/* Attendance List */}
        <div className={styles.uploadSection}>
          <h2 className={styles.sectionTitle}>
            <UserCheck size={24} /> Attendance List
          </h2>
          <div className={styles.attendanceGrid}>
            {Object.entries(attendance).length > 0 ? (
              Object.entries(attendance).map(([student, details]) => (
                <div key={student} className={styles.attendanceCard}>
                  <p className={styles.studentRoll}>Roll No: {student}</p>
                  <p className={styles.studentStatus}>{details.status}</p>
                  <p className={styles.studentTime}>Marked at: {details.timestamp}</p>
                </div>
              ))
            ) : (
              <p className={styles.noAttendance}>No students marked present yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceRecog;
