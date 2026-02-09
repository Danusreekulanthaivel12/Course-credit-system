const http = require('http');

function request(method, path, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, data: data }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function testRegistrations() {
    try {
        console.log("Testing Registration API...");

        // 1. Fetch Students
        const studentsRes = await request('GET', '/students');
        let students = [];
        try {
            students = JSON.parse(studentsRes.data);
        } catch (e) {
            console.error("Failed to parse students");
            return;
        }

        if (!Array.isArray(students)) return;

        // Find a student with courses
        let validStudent = null;
        let validCourse = null;

        for (const s of students) {
            if (!s.dept_id || !s.semester) continue;

            const coursesRes = await request('GET', `/courses?dept_id=${s.dept_id}&semester=${s.semester}`);
            let courses = [];
            try { courses = JSON.parse(coursesRes.data); } catch (e) { }

            if (Array.isArray(courses) && courses.length > 0) {
                validStudent = s;

                // Try to find a course they are NOT registered for? Or just use the first one.
                // Let's check their registrations first.
                const regRes = await request('GET', `/registrations/${s.id}`);
                let regs = [];
                try { regs = JSON.parse(regRes.data); } catch (e) { }

                // Find a course not in regs
                const unregCourse = courses.find(c => !regs.some(r => r.course_code === c.course_code));

                if (unregCourse) {
                    validCourse = unregCourse;
                    console.log(`✅ Found Student ${s.name} (ID: ${s.id}) and Unregistered Course ${unregCourse.course_code} (ID: ${unregCourse.id})`);
                    break;
                } else if (!validStudent) {
                    // Keep track of at least one student even if all courses registered, for fallback
                    validStudent = s;
                    validCourse = courses[0];
                }
            }
        }

        if (!validStudent || !validCourse) {
            console.error("❌ No suitable student/course pair found.");
            return;
        }

        console.log(`Attempting to register Student ${validStudent.id} for Course ${validCourse.id}`);
        const regRes = await request('POST', '/registrations', {
            student_id: validStudent.id,
            course_id: validCourse.id
        });
        console.log(`POST Status: ${regRes.status}`);

        // 400 is acceptable if "Already registered" (race condition or fallback logic)
        if (regRes.status === 200 || (regRes.status === 400 && regRes.data.includes("Already registered"))) {
            console.log("✅ Registration endpoint responded correctly.");
        } else {
            console.error(`❌ Registration failed with unexpected status: ${regRes.status}`, regRes.data);
        }

        // Verify List
        const verifyRes = await request('GET', `/registrations/${validStudent.id}`);
        const registrations = JSON.parse(verifyRes.data);
        const isRegistered = registrations.some(r => r.course_id === validCourse.id);

        if (isRegistered) {
            console.log("✅ Verification SUCCESS: Course IS in registrations list.");
        } else {
            console.error("❌ Verification FAILED: Course NOT found in list.");
        }

    } catch (e) {
        console.error("Test Script Error:", e);
    }
}

testRegistrations();
