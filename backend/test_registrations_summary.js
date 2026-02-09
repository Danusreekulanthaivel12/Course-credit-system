const http = require('http');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/registrations/summary',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let body = '';

    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        try {
            console.log("RESPONSE:", JSON.stringify(JSON.parse(body), null, 2));
        } catch (e) {
            console.log("BODY:", body);
        }
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.end();
