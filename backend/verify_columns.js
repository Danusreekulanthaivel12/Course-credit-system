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

    const tables = ['students', 'courses', 'registrations'];
    let pending = tables.length;

    tables.forEach(table => {
        db.query(`DESCRIBE ${table}`, (err, results) => {
            if (err) console.error(err);
            else {
                console.log(`\n--- ${table} ---`);
                results.forEach(col => console.log(`${col.Field} (${col.Type})`));
            }
            if (--pending === 0) db.end();
        });
    });
});
