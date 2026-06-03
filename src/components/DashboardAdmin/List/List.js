import React from "react";
import styles from "./List.module.css";
import suryansh from "./media/104.jpg"; // Replace with actual images later
import saurav from "./media/126.jpg"; // Replace with actual images later
import aman from "./media/117.jpg"; // Replace with actual images later
import prince from "./media/124.jpg"; // Replace with actual images later

const students = [
  {
    name: "Suryansh Himalayan",
    section: "CSE Sec-2",
    roll: "UE223104",
    phone: "7009105302",
    email: "suryanshhimalayan@gmail.com",
    photo: suryansh,
  },
  {
    name: "Saurav Dhiani",
    section: "CSE Sec-2",
    roll: "UEM223126",
    phone: "1234567890",
    email: "svsaurav95@gmail.com",
    photo: saurav,
  },
  {
    name: "Amanpreet Kaur",
    section: "CSE Sec-1",
    roll: "UEM223117",
    phone: "1428242462",
    email: "amanpreetkaur@gmail.com",
    photo: aman,
  },
  {
    name: "Prince Bhatt",
    section: "CSE Sec-2",
    roll: "UEM223124",
    phone: "3252362626",
    email: "princebhatt@gmail.com",
    photo: prince,
  },
];

const List = () => {
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Student Records</h2>
      <div className={styles.grid}>
        {students.map((student, index) => (
          <div key={index} className={styles.card}>
            <img src={student.photo} alt="Profile" className={styles.photo} />
            <div className={styles.info}>
              <h3>{student.name}</h3>
              <p><strong>Section:</strong> {student.section}</p>
              <p><strong>Roll No:</strong> {student.roll}</p>
              <p><strong>Phone:</strong> {student.phone}</p>
              <p><strong>Email:</strong> {student.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default List;
