const mysql = require('mysql2');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "DanuK@05",
    database: "course_credit_system"
});

db.connect(err => {
    if (err) {
        console.error("DB Connection Failed:", err);
        return;
    }
    console.log("DB Connected.");

    const queries = [
        "SELECT COUNT(*) as count FROM departments",
        "SELECT COUNT(*) as count FROM students",
        "SELECT COUNT(*) as count FROM courses"
    ];

    const tableNames = ["Departments", "Students", "Courses"];

    let completed = 0;
    queries.forEach((q, i) => {
        db.query(q, (err, res) => {
            if (err) console.error(`Error querying ${tableNames[i]}:`, err);
            else console.log(`${tableNames[i]} Count: ${res[0].count}`);

            completed++;
            if (completed === queries.length) db.end();
        });
    });
});
