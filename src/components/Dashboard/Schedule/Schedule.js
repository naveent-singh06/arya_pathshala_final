import React from "react";
import styles from "./Schedule.module.css";

const ClassSchedule = () => {
  const schedule = [
    ["8:00 - 9:00", "Math", "Physics", "Chemistry", "English", "Computer Science"],
    ["9:00 - 10:00", "Biology", "History", "Geography", "Economics", "Physical Education"],
    ["10:00 - 11:00", "Computer Lab", "Physics Lab", "Math", "History", "Chemistry"],
    ["11:00 - 12:00", "Computer Lab", "Physics Lab", "Math", "History", "Chemistry"],
    ["12:00 - 1:00", "Computer Lab", "Physics Lab", "Math", "History", "Chemistry"],
    ["1:00 - 2:00", "Lunch Break", "Lunch Break", "Lunch Break", "Lunch Break", "Lunch Break"],
    ["2:00 - 3:00", "English", "Chemistry", "Physics", "Math", "History"],
    ["3:00 - 4:00", "Geography", "Economics", "Physical Education", "Computer Science", "Biology"]
  ];

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Class Schedule</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Time</th>
            <th>Monday</th>
            <th>Tuesday</th>
            <th>Wednesday</th>
            <th>Thursday</th>
            <th>Friday</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((row, index) => (
            <tr key={index}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className={cell === "Lunch Break" ? styles.break : ""}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClassSchedule;
