import mysql from "mysql2";

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
        "SELECT COUNT(*) as count FROM departments",
        "SELECT COUNT(*) as count FROM courses",
        "SELECT COUNT(*) as count FROM students",
        "SELECT * FROM departments LIMIT 5",
        "SELECT * FROM courses LIMIT 5"
    ];

    let completed = 0;
    queries.forEach((query, index) => {
        db.query(query, (err, results) => {
            if (err) console.error("Query failed:", query, err);
            else console.log(`Query ${index + 1} results:`, results);

            completed++;
            if (completed === queries.length) {
                db.end();
            }
        });
    });
});
