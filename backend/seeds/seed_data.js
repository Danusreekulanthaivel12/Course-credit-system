const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "DanuK@05", // Default XAMPP password
    database: "course_credit_system",
    multipleStatements: true
});

db.connect(async (err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to MySQL for seeding.");

    const departments = [
        "Computer Science",
        "Information Technology",
        "Electronics and Communication",
        "Electrical and Electronics",
        "Mechanical Engineering",
        "Civil Engineering"
    ];

    console.log("Seeding Departments...");
    // Insert Departments
    for (const dept of departments) {
        await new Promise((resolve) => {
            db.query("INSERT IGNORE INTO departments (name) VALUES (?)", [dept], (err) => {
                if (err) console.error(err);
                resolve();
            });
        });
    }

    console.log("Seeding Courses...");

    // Get Dept IDs
    const getDeptId = (name) => {
        return new Promise((resolve) => {
            db.query("SELECT id FROM departments WHERE name = ?", [name], (err, res) => {
                resolve(res[0]?.id);
            });
        });
    };

    const csId = await getDeptId("Computer Science");

    if (csId) {
        const courses = [
            // Sem 3
            { code: "CS301", name: "Data Structures", credits: 4, sem: 3, type: "Regular" },
            { code: "CS302", name: "Object Oriented Programming", credits: 3, sem: 3, type: "Regular" },
            { code: "CS303", name: "Digital Logic Design", credits: 3, sem: 3, type: "Regular" },
            { code: "CS304", name: "Discrete Mathematics", credits: 3, sem: 3, type: "Regular" },
            // Sem 4
            { code: "CS401", name: "Database Management Systems", credits: 4, sem: 4, type: "Regular" },
            { code: "CS402", name: "Operating Systems", credits: 3, sem: 4, type: "Regular" },
            { code: "CS403", name: "Computer Organization", credits: 3, sem: 4, type: "Regular" },
            // Sem 5 (Core)
            { code: "CS500", name: "Design and Analysis of Algorithms", credits: 4, sem: 5, type: "Regular" },
            { code: "CS504", name: "Computer Networks", credits: 3, sem: 5, type: "Regular" },
            // Sem 5 (Electives)
            { code: "CS501", name: "Machine Learning", credits: 3, sem: 5, type: "Elective" },
            { code: "CS502", name: "Cyber Security", credits: 3, sem: 5, type: "Elective" },
            { code: "CS503", name: "Cloud Computing", credits: 3, sem: 5, type: "Elective" },
            // Sem 6 (Core)
            { code: "CS601", name: "Compiler Design", credits: 4, sem: 6, type: "Regular" },
            { code: "CS602", name: "Web Technology", credits: 3, sem: 6, type: "Regular" },
            // Sem 6 (Electives)
            { code: "CS603", name: "Artificial Intelligence", credits: 3, sem: 6, type: "Elective" },
            { code: "CS604", name: "Big Data Analytics", credits: 3, sem: 6, type: "Elective" },
            { code: "CS605", name: "Internet of Things", credits: 3, sem: 6, type: "Elective" }
        ];

        for (const c of courses) {
            await new Promise((resolve) => {
                db.query(
                    "INSERT IGNORE INTO courses (course_code, course_name, credits, dept_id, semester, type) VALUES (?, ?, ?, ?, ?, ?)",
                    [c.code, c.name, c.credits, csId, c.sem, c.type],
                    (err) => {
                        if (err) console.error("Error inserting " + c.code, err.message);
                        resolve();
                    }
                );
            });
        }
    }

    // Seed other departments with dummy data
    const otherDepts = ["Information Technology", "Electronics and Communication", "Mechanical Engineering"];
    for (const dName of otherDepts) {
        const dId = await getDeptId(dName);
        if (dId) {
            const prefix = dName.substring(0, 2).toUpperCase();
            for (let sem = 1; sem <= 8; sem++) {
                // Add 2 random courses per sem
                await new Promise(r => {
                    db.query(
                        "INSERT IGNORE INTO courses (course_code, course_name, credits, dept_id, semester, type) VALUES (?, ?, ?, ?, ?, ?)",
                        [`${prefix}${sem}01`, `${dName} Core ${sem}`, 4, dId, sem, "Regular"], r
                    );
                });
                if (sem >= 5) {
                    await new Promise(r => {
                        db.query(
                            "INSERT IGNORE INTO courses (course_code, course_name, credits, dept_id, semester, type) VALUES (?, ?, ?, ?, ?, ?)",
                            [`${prefix}${sem}E1`, `${dName} Elective ${sem}`, 3, dId, sem, "Elective"], r
                        );
                    });
                }
            }
        }
    }

    console.log("Seeding Complete!");
    process.exit();
});
