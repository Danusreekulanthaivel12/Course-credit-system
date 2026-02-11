import mysql from "mysql2";

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "DanuK@05",
    database: "course_credit_system"
});

db.connect(async err => {
    if (err) {
        console.error("DB connection failed:", err);
        process.exit(1);
    }
    console.log("MySQL connected. Diagnosing data availability...");

    const query = (sql, params = []) => new Promise((resolve, reject) => {
        db.query(sql, params, (err, res) => err ? reject(err) : resolve(res));
    });

    try {
        // 1. Get all students
        const students = await query("SELECT * FROM students");
        console.log(`Found ${students.length} students.`);

        // 2. For each student, check if courses exist for their Dept + Semester
        for (const s of students) {
            const courses = await query("SELECT count(*) as count FROM courses WHERE dept_id = ? AND semester = ?", [s.dept_id, s.semester]);
            const count = courses[0].count;
            console.log(`Student ${s.name} (ID: ${s.id}, Sem: ${s.semester}, Dept: ${s.dept_id}) -> Matching Courses: ${count}`);
        }

        // 3. Check Admin Data (Departments, Courses)
        const deptCount = await query("SELECT count(*) as count FROM departments");
        const courseCount = await query("SELECT count(*) as count FROM courses");
        console.log(`Total Departments: ${deptCount[0].count}`);
        console.log(`Total Courses: ${courseCount[0].count}`);

    } catch (error) {
        console.error("Diagnosis Error:", error);
    } finally {
        db.end();
    }
});
