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
        return;
    }
    console.log("MySQL connected");

    db.query("DROP TABLE IF EXISTS registrations", (err, result) => {
        if (err) {
            console.error("Error dropping table:", err);
        } else {
            console.log("Table 'registrations' dropped successfully.");
        }
        db.end();
    });
});
