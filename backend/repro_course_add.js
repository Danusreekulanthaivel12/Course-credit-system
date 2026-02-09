import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAddCourse() {
    // 1. Get Departments first to get a valid dept_id
    console.log("Fetching departments...");
    const deptRes = await fetch(`${BASE_URL}/departments`);
    const departments = await deptRes.json();
    console.log("Departments:", departments);

    if (departments.length === 0) {
        console.error("No departments found! Cannot test adding a course.");
        return;
    }

    const deptId = departments[0].id;
    const course = {
        course_code: "TEST999",
        course_name: "Test Course",
        credits: 3,
        dept_id: deptId,
        semester: 1,
        type: "Regular"
    };

    console.log("Attempting to add course:", course);

    const res = await fetch(`${BASE_URL}/courses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(course)
    });

    const data = await res.json();
    console.log("Response status:", res.status);
    console.log("Response body:", data);

    if (res.ok) {
        console.log("Successfully added course. Now verifying...");
        // Verify if it exists
        const verifyRes = await fetch(`${BASE_URL}/courses?dept_id=${deptId}&semester=1`);
        const courses = await verifyRes.json();
        const found = courses.find(c => c.course_code === "TEST999");
        if (found) {
            console.log("✅ Course found in database:", found);
        } else {
            console.error("❌ Course NOT found in database despite success response!");
        }

        // Cleanup
        if (found) {
            await fetch(`${BASE_URL}/courses/${found.id}`, { method: 'DELETE' });
            console.log("Cleanup: Deleted test course.");
        }
    } else {
        console.error("Failed to add course.");
    }
}

testAddCourse().catch(console.error);
