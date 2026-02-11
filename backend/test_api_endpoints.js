const fetch = require('node-fetch');

async function testEndpoints() {
    const baseUrl = 'http://localhost:5000';
    const endpoints = [
        '/departments',
        '/semester-limits',
        '/courses' // This might return empty if no query params, but should still respond
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint}...`);
            const res = await fetch(`${baseUrl}${endpoint}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`[SUCCESS] ${endpoint}:`, Array.isArray(data) ? `Got ${data.length} items` : 'Got response');
                if (Array.isArray(data) && data.length > 0) console.log('Sample:', data[0]);
            } else {
                console.error(`[ERROR] ${endpoint}: Status ${res.status}`);
            }
        } catch (err) {
            console.error(`[FAILED] ${endpoint}:`, err.message);
        }
    }
}

testEndpoints();
