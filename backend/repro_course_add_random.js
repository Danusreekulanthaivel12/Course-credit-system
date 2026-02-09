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

function generateRandomCode() {
    return 'TEST_' + Math.random().toString(36).substring(7).toUpperCase();
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

        const deptId = departments[0].id; // Use first department
        const randomCode = generateRandomCode();

        const course = {
            course_code: randomCode,
            course_name: "Test Course " + randomCode,
            credits: 3,
            dept_id: deptId,
            semester: 1,
            type: "Regular"
        };

        console.log("Attempting to add course:", course);
        const addRes = await request('POST', '/courses', course);
        console.log("Add Response Status:", addRes.status);
        console.log("Add Response Data:", addRes.data);

        if (addRes.status === 200) {
            console.log("✅ Success reported by API. Verifying persistence...");

            // Allow some time for DB commit if async (unlikely but good practice)
            await new Promise(r => setTimeout(r, 1000));

            const verifyRes = await request('GET', `/courses?dept_id=${deptId}&semester=1`);
            const courses = verifyRes.data;
            const found = courses.find(c => c.course_code === randomCode);

            if (found) {
                console.log("✅ Course found in database:", found);
                // Cleanup
                await request('DELETE', `/courses/${found.id}`);
                console.log("Cleanup executed.");
            } else {
                console.error("❌ Course NOT found in database despite success response!");
                console.log("Fetched courses:", courses.map(c => c.course_code));
            }
        } else {
            console.error("❌ Failed to add course.");
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testAddCourse();
