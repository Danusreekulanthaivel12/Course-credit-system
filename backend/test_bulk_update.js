const http = require('http');

function makeRequest(path, method, body) {
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
            const bodyChunks = [];
            res.on('data', (chunk) => bodyChunks.push(chunk));
            res.on('end', () => {
                const body = Buffer.concat(bodyChunks).toString();
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    json: () => Promise.resolve(JSON.parse(body || '{}')),
                    text: () => Promise.resolve(body)
                });
            });
        });

        req.on('error', (e) => reject(e));

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function testBulkUpdate() {
    console.log("Starting Bulk Update Test...");

    // 1. Create a test student in Semester 1
    const studentData = {
        name: "Bulk Test Student",
        email: `bulktest_${Date.now()}@test.com`,
        password: "password",
        dept_id: 1, // Assumes dept 1 exists
        semester: 1
    };

    console.log("Creating test student...");
    const createRes = await makeRequest('/students', 'POST', studentData);

    if (!createRes.ok) {
        console.error("Failed to create student", await createRes.text());
        return;
    }
    console.log("Test student created.");

    // 2. Perform Bulk Update (Sem 1 -> Sem 2)
    console.log("Performing bulk update (Sem 1 -> Sem 2)...");
    const updateRes = await makeRequest('/students/promote', 'PUT', {
        current_semester: 1,
        new_semester: 2,
        dept_id: 1
    });

    const updateData = await updateRes.json();
    console.log("Update response:", updateData);

    if (updateData.updatedCount > 0) {
        console.log("SUCCESS: Bulk update affected rows.");
    } else {
        console.error("FAILURE: Bulk update did not affect any rows.");
    }

    // 3. Verify student is now in Sem 2
    console.log("Verifying update...");
    const studentsRes = await makeRequest('/students', 'GET');
    if (!studentsRes.ok) {
        console.error("Failed to fetch students:", await studentsRes.text());
        return;
    }
    const students = await studentsRes.json();

    if (!Array.isArray(students)) {
        console.error("Expected array of students, got:", students);
        return;
    }

    const updatedStudent = students.find(s => s.email === studentData.email);

    if (updatedStudent && updatedStudent.semester === 2) {
        console.log("SUCCESS: Student passed to Semester 2.");
    } else {
        console.error("FAILURE: Student is still in Semester", updatedStudent ? updatedStudent.semester : "Not Found");
    }

    // 4. Test Invalid Update (Sem 2 -> Sem 1)
    console.log("Testing invalid update (Sem 2 -> Sem 1)...");
    const invalidRes = await makeRequest('/students/promote', 'PUT', {
        current_semester: 2,
        new_semester: 1
    });

    if (invalidRes.status === 400) {
        console.log("SUCCESS: Invalid update blocked correctly.");
    } else {
        console.error("FAILURE: Invalid update was not blocked. Status:", invalidRes.status);
    }

    // Clean up
    if (updatedStudent) {
        await makeRequest(`/students/${updatedStudent.id}`, 'DELETE');
        console.log("Test student deleted.");
    }
}

testBulkUpdate().catch(console.error);
