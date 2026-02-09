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

async function testFrontendSim() {
    try {
        console.log("Fetching departments...");
        const deptRes = await request('GET', '/departments');
        const depts = JSON.parse(deptRes.data);
        const deptId = String(depts[0].id); // Mimic Select value (String)
        const rand = Math.floor(Math.random() * 10000);

        // Mimic Frontend State
        const payload = {
            course_code: `FE_SIM_${rand}`,
            course_name: "Frontend Simulation",
            credits: "3", // Input type="number" returns string
            dept_id: deptId,
            semester: 1, // Number from button click
            type: "Regular"
        };

        console.log("Sending Frontend-like Payload:", payload);
        const res = await request('POST', '/courses', payload);
        console.log("Status:", res.status);
        console.log("Body:", res.data);

    } catch (e) {
        console.error(e);
    }
}

testFrontendSim();
