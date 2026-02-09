import express from "express";
import cors from "cors";
import mysql from "mysql2";

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

/* ================= AUTHENTICATION ================= */

app.post("/login", (req, res) => {
  const { username, password, role } = req.body;

  if (role === "admin") {
    db.query("SELECT * FROM admins WHERE username = ? AND password = ?", [username, password], (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length > 0) {
        res.json({ success: true, role: "admin", user: result[0] });
      } else {
        res.status(401).json({ message: "Invalid Admin Credentials" });
      }
    });
  } else if (role === "student") {
    db.query("SELECT * FROM students WHERE email = ? AND password = ?", [username, password], (err, result) => {
      if (err) return res.status(500).json(err);
      if (result.length > 0) {
        res.json({ success: true, role: "student", user: result[0] });
      } else {
        res.status(401).json({ message: "Invalid Student Credentials" });
      }
    });
  } else {
    res.status(400).json({ message: "Invalid Role" });
  }
});

/* ================= ADMIN MODULE ================= */

// --- Departments ---
app.get("/departments", (req, res) => {
  db.query("SELECT * FROM departments", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/departments", (req, res) => {
  const { name } = req.body;
  db.query("INSERT INTO departments (name) VALUES (?)", [name], (err, result) => {
    if (err) return res.status(400).json({ message: "Department exists or invalid data" });
    res.json({ message: "Department added", id: result.insertId });
  });
});

// Update Department
app.put("/departments/:id", (req, res) => {
  const { name } = req.body;
  db.query("UPDATE departments SET name = ? WHERE id = ?", [name, req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department updated" });
  });
});

// Delete Department
app.delete("/departments/:id", (req, res) => {
  db.query("DELETE FROM departments WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Department deleted" });
  });
});

// --- Semester Limits ---
app.get("/semester-limits", (req, res) => {
  db.query("SELECT * FROM semester_limits", (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.put("/semester-limits/:semester", (req, res) => {
  const { credit_limit } = req.body;
  db.query(
    "UPDATE semester_limits SET credit_limit = ? WHERE semester = ?",
    [credit_limit, req.params.semester],
    (err) => {
      if (err) return res.status(500).json(err);
      res.json({ message: "Limit updated" });
    }
  );
});

// --- Courses ---
app.get("/courses", (req, res) => {
  const { dept_id, semester } = req.query;
  let sql = "SELECT * FROM courses WHERE 1=1";
  const params = [];

  if (dept_id) {
    sql += " AND dept_id = ?";
    params.push(dept_id);
  }
  if (semester) {
    sql += " AND semester = ?";
    params.push(semester);
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json(err);
    res.json(result);
  });
});

app.post("/courses", (req, res) => {
  const { course_code, course_name, credits, dept_id, semester, type } = req.body;
  console.log("POST /courses payload:", req.body);

  // Validation
  if (!course_code || course_code.length > 20) {
    return res.status(400).json({ message: "Course code must be 1-20 characters" });
  }
  if (!course_name) {
    return res.status(400).json({ message: "Course name is required" });
  }
  const creditsInt = parseInt(credits);
  if (isNaN(creditsInt) || creditsInt <= 0) {
    return res.status(400).json({ message: "Credits must be a positive number" });
  }
  const semesterInt = parseInt(semester);
  if (isNaN(semesterInt) || semesterInt <= 0) {
    return res.status(400).json({ message: "Semester must be a valid number" });
  }
  const deptIdInt = parseInt(dept_id);
  if (isNaN(deptIdInt)) {
    return res.status(400).json({ message: "Invalid Department" });
  }

  const sql = "INSERT INTO courses (course_code, course_name, credits, dept_id, semester, type) VALUES (?, ?, ?, ?, ?, ?)";
  const values = [course_code, course_name, creditsInt, deptIdInt, semesterInt, type || 'Regular'];

  console.log("Executing SQL:", sql, "Values:", values);

  db.query(
    sql,
    values,
    (err, result) => {
      if (err) {
        console.error("Insert Error:", err);
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Course code must be unique" });
        if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ message: "Invalid Department ID" });
        return res.status(500).json(err);
      }
      console.log("Insert Result:", result);
      res.json({ message: "Course added", id: result.insertId });
    }
  );
});

// Update Course
app.put("/courses/:id", (req, res) => {
  const { course_code, course_name, credits, type } = req.body;
  db.query(
    "UPDATE courses SET course_code = ?, course_name = ?, credits = ?, type = ? WHERE id = ?",
    [course_code, course_name, credits, type, req.params.id],
    (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "Course code must be unique" });
        return res.status(500).json(err);
      }
      res.json({ message: "Course updated successfully" });
    }
  );
});

// Delete Course (with check)
app.delete("/courses/:id", (req, res) => {
  db.query("DELETE FROM courses WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Course deleted successfully" });
  });
});


// --- Students Management ---
app.get("/students", (req, res) => {
  db.query(`
        SELECT s.*, d.name as dept_name 
        FROM students s 
        LEFT JOIN departments d ON s.dept_id = d.id`,
    (err, result) => {
      if (err) return res.status(500).json(err);
      res.json(result);
    });
});

app.post("/students", (req, res) => {
  const { name, email, password, dept_id, semester } = req.body;
  db.query(
    "INSERT INTO students (name, email, password, dept_id, semester) VALUES (?, ?, ?, ?, ?)",
    [name, email, password, dept_id, semester],
    (err) => {
      if (err) return res.status(400).json({ message: "Email already exists" });
      res.json({ message: "Student added" });
    }
  );
});

app.put("/students/promote", (req, res) => {
  console.log("Bulk Update Request:", req.body);

  // Normalize keys (handle camelCase vs snake_case)
  const currentSemesterVal = req.body.current_semester || req.body.currentSemester;
  const newSemesterVal = req.body.new_semester || req.body.newSemester;
  const deptVal = req.body.dept_id !== undefined ? req.body.dept_id : req.body.department;

  // Helper to extract number from string (e.g., "Sem 1" -> 1)
  const parseSemValue = (val) => {
    if (val === null || val === undefined || val === "") return NaN;
    const str = String(val);
    const match = str.match(/\d+/);
    return match ? parseInt(match[0]) : NaN;
  };

  const currentSem = parseSemValue(currentSemesterVal);
  const newSem = parseSemValue(newSemesterVal);

  // Handle Department
  let deptId = null;
  if (deptVal && deptVal !== "All Departments" && deptVal !== "") {
    deptId = parseInt(deptVal);
    if (isNaN(deptId)) deptId = null; // Fallback if parse fails
  }

  if (isNaN(newSem) || isNaN(currentSem)) {
    return res.status(400).json({ message: "Invalid semester values. Received: " + JSON.stringify(req.body) });
  }

  if (newSem <= currentSem) {
    return res.status(400).json({ message: "New semester must be greater than current semester" });
  }

  console.log(`Processing Update: Sem ${currentSem} -> ${newSem}, Dept: ${deptId} `);

  let sql = "UPDATE students SET semester = ? WHERE semester = ?";
  const params = [newSem, currentSem];

  if (deptId !== null) {
    sql += " AND dept_id = ?";
    params.push(deptId);
  }

  console.log("Executing SQL:", sql, "Params:", params);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Bulk Update SQL Error:", err);
      return res.status(500).json({ message: "Database update failed", error: err });
    }
    console.log("Bulk Update Result:", result);

    if (result.affectedRows === 0) {
      return res.json({ message: "No students matches the criteria for update.", updatedCount: 0 });
    }

    res.json({ message: "Students updated successfully", updatedCount: result.affectedRows });
  });
});

app.delete("/students/:id", (req, res) => {
  db.query("DELETE FROM students WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Student deleted" });
  });
});

// --- Registration Stats ---



/* ================= STUDENT MODULE ================= */

// Get Student's Registered Courses


app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
