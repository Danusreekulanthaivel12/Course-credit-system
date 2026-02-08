
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "DanuK@05",
  database: "course_credit_system"
});

db.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("MySQL connected");
});

/* ================= DEPARTMENTS ================= */

// GET all departments
app.get("/departments", (req, res) => {
  db.query("SELECT id, name FROM departments", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

// ADD department
app.post("/departments", (req, res) => {
  const { name } = req.body;
  db.query(
    "INSERT INTO departments (name) VALUES (?)",
    [name],
    err => {
      if (err) return res.status(400).json({ message: "Department exists" });
      res.json({ message: "Department added" });
    }
  );
});

// UPDATE department
app.put("/departments/:id", (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  db.query(
    "UPDATE departments SET name=? WHERE id=?",
    [name, id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Department updated" });
    }
  );
});

// DELETE department
app.delete("/departments/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM departments WHERE id=?",
    [id],
    err => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Department deleted" });
    }
  );
});

/* ================= COURSES ================= */

// app.get("/courses/:dept/:sem", (req, res) => {
//   const { dept, sem } = req.params;

//   db.query(
//     "SELECT * FROM courses WHERE department=? AND semester=?",
//     [dept, sem],
//     (err, result) => {
//       if (err) return res.status(500).json(err);
//       res.json(result);
//     }
//   );
// });
app.get("/courses/:dept/:sem", async (req, res) => {
  const { dept, sem } = req.params;

  const [rows] = await db.query(
    "SELECT * FROM courses WHERE department_code = ? AND semester = ?",
    [dept, sem]
  );

  res.json(rows);
});

// app.post("/courses", (req, res) => {
//   const { department, semester, course_name, credit } = req.body;

//   db.query(
//     "INSERT INTO courses (department, semester, course_name, credit) VALUES (?, ?, ?, ?)",
//     [department, semester, course_name, credit],
//     err => {
//       if (err) return res.status(500).json(err);
//       res.json({ message: "Course added" });
//     }
//   );
// });
app.post("/courses", async (req, res) => {
  const { department_code, semester, course_name, course_code, credit } = req.body;

  await db.query(
    "INSERT INTO courses (department_code, semester, course_name, course_code, credit) VALUES (?, ?, ?, ?, ?)",
    [department_code, semester, course_name, course_code, credit]
  );

  res.send({ message: "Course added" });
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
