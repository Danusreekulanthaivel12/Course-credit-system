const http = require('http');

const data = JSON.stringify({
    dept_id: "",
    current_semester: "Sem 1",
    new_semester: "Sem 2"
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/students/promote',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);

    let bodyChunks = [];
    res.on('data', (chunk) => {
        bodyChunks.push(chunk);
    });

    res.on('end', () => {
        const body = Buffer.concat(bodyChunks).toString();
        // Try parsing JSON
        try {
            console.log("BODY (JSON):", JSON.parse(body));
        } catch (e) {
            console.log("BODY (Text):", body);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
