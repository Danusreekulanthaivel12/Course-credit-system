const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "DanuK@05",
    database: "course_credit_system"
});

db.connect(err => {
    if (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    }
    console.log("MySQL connected");

    const queries = [
        // Add is_active to courses
        "ALTER TABLE courses ADD COLUMN is_active BOOLEAN DEFAULT 1",
        // Add approval_status to registrations
        "ALTER TABLE registrations ADD COLUMN approval_status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'APPROVED'",
        // Add status to students
        "ALTER TABLE students ADD COLUMN status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE'"
    ];

    let pending = queries.length;
    queries.forEach(query => {
        db.query(query, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log("Column already exists (skipped):", query);
                } else {
                    console.error("Error executing:", query, err.message);
                }
            } else {
                console.log("Success:", query);
            }

            if (--pending === 0) {
                console.log("All migrations attempted.");
                db.end();
            }
        });
    });
});
