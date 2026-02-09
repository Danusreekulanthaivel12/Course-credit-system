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

async function testValidation() {
    console.log("Testing Validation Logic...");

    // 1. Test Long Course Code
    const longCodePayload = {
        course_code: "THIS_IS_A_VERY_LONG_COURSE_CODE_THAT_SHOULD_FAIL",
        course_name: "Long Code Test",
        credits: 3,
        dept_id: 1,
        semester: 1
    };
    const res1 = await request('POST', '/courses', longCodePayload);
    console.log(`Test 1 (Long Code): Expected 400, Got ${res1.status}`);
    if (res1.status === 400 && res1.data.includes("1-20 characters")) {
        console.log("✅ Passed");
    } else {
        console.error("❌ Failed", res1.data);
    }

    // 2. Test Invalid Credits
    const invalidCreditsPayload = {
        course_code: "TEST_CRED",
        course_name: "Credits Test",
        credits: "abc",
        dept_id: 1,
        semester: 1
    };
    const res2 = await request('POST', '/courses', invalidCreditsPayload);
    console.log(`Test 2 (Invalid Credits): Expected 400, Got ${res2.status}`);
    if (res2.status === 400 && res2.data.includes("positive number")) {
        console.log("✅ Passed");
    } else {
        console.error("❌ Failed", res2.data);
    }

    // 3. Test Valid Entry
    const validPayload = {
        course_code: "VAL_TEST_" + Math.floor(Math.random() * 1000),
        course_name: "Valid Test",
        credits: "3", // String should be parsed
        dept_id: "1", // String should be parsed
        semester: 1
    };
    const res3 = await request('POST', '/courses', validPayload);
    console.log(`Test 3 (Valid): Expected 200, Got ${res3.status}`);
    if (res3.status === 200) {
        console.log("✅ Passed");
        // Cleanup
        const parsed = JSON.parse(res3.data);
        if (parsed.id) await request('DELETE', `/courses/${parsed.id}`);
    } else {
        console.error("❌ Failed", res3.data);
    }
}

testValidation();
