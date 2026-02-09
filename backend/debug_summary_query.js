const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "DanuK@05",
    database: "course_credit_system"
});

db.connect(err => {
    if (err) throw err;
    console.log("Connected");

    // 1. Simple count
    db.query("SELECT COUNT(*) as count FROM courses WHERE is_active = 1", (err, res) => {
        if (err) console.error(err);
        else console.log("1. Courses with is_active=1:", res[0].count);

        // 2. Join departments
        db.query("SELECT COUNT(*) as count FROM courses c LEFT JOIN departments d ON c.dept_id = d.id WHERE c.is_active = 1", (err, res) => {
            if (err) console.error(err);
            else console.log("2. Join Departments:", res[0].count);

            // 3. Full query check
            const fullSql = `
                SELECT 
                  d.name AS department,
                  c.semester,
                  c.course_code,
                  c.course_name,
                  COUNT(DISTINCT s.id) AS studying_count
                FROM courses c
                LEFT JOIN departments d ON c.dept_id = d.id
                LEFT JOIN registrations r ON c.id = r.course_id AND r.approval_status = 'APPROVED'
                LEFT JOIN students s ON r.student_id = s.id AND s.semester = c.semester AND s.status = 'ACTIVE'
                WHERE c.is_active = 1
                GROUP BY d.id, d.name, c.semester, c.id, c.course_code, c.course_name
                ORDER BY d.name, c.semester, c.course_code
            `;
            db.query(fullSql, (err, res) => {
                if (err) console.error("Full Query Error:", err);
                else console.log("3. Full Query Result Count:", res.length);
                if (res && res.length > 0) console.log("First row:", res[0]);
                db.end();
            });
        });
    });
});
