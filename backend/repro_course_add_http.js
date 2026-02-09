const http = require('http');

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testAddCourse() {
    try {
        console.log("Fetching departments...");
        const deptRes = await request('GET', '/departments');
        const departments = deptRes.data;

        if (!Array.isArray(departments) || departments.length === 0) {
            console.error("No departments found! Cannot test adding a course.");
            return;
        }

        const deptId = departments[0].id;
        console.log("Using Department ID:", deptId);

        const course = {
            course_code: "TEST_REPRO_003",
            course_name: "Test Course Repro",
            credits: 3,
            dept_id: deptId,
            semester: 1,
            type: "Regular"
        }; // Ensure course code is unique each run or delete it

        console.log("Attempting to add course:", course);
        const addRes = await request('POST', '/courses', course);
        console.log("Add Response:", addRes);

        if (addRes.status === 200) {
            console.log("✅ Success reported by API. Verifying...");

            const verifyRes = await request('GET', `/courses?dept_id=${deptId}&semester=1`);
            const courses = verifyRes.data;
            const found = courses.find(c => c.course_code === course.course_code);

            if (found) {
                console.log("✅ Course found in database:", found);
                // Cleanup
                await request('DELETE', `/courses/${found.id}`);
            } else {
                console.error("❌ Course NOT found in database despite success response!");
                // Check if maybe fetch all courses returns it? (Just in case filtering is broken)
                const allCoursesRes = await request('GET', '/courses'); // Assuming endpoint supports no filters? No, code says 1=1 AND ... 
                // But wait, server.js says:
                /*
                  app.get("/courses", (req, res) => {
                    const { dept_id, semester } = req.query;
                    let sql = "SELECT * FROM courses WHERE 1=1";
                    // ...
                  });
                */
                // Validate logic
            }
        } else {
            console.error("❌ Failed to add course:", addRes);
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testAddCourse();
