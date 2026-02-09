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

    db.query("SELECT id, name, dept_id, semester FROM students", (err, results) => {
        if (err) {
            console.error(err);
        } else {
            console.log("Students:", results);
        }
        db.end();
    });
});
