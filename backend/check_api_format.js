const http = require('http');

function fetchData(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    console.log(`\nURL: ${url}`);
                    console.log('Status:', res.statusCode);
                    const json = JSON.parse(data);
                    console.log('Is Array?', Array.isArray(json));
                    console.log('Structure:', Array.isArray(json) ? `Array of length ${json.length}` : Object.keys(json));
                    if (Array.isArray(json) && json.length > 0) {
                        console.log('Sample Item Keys:', Object.keys(json[0]));
                        console.log('Sample Item:', JSON.stringify(json[0], null, 2));
                    }
                    if (!Array.isArray(json)) console.log('Response:', JSON.stringify(json, null, 2));
                    resolve(json);
                } catch (e) {
                    console.error('Error parsing JSON:', e.message);
                    console.log('Raw Data:', data);
                    resolve(null);
                }
            });
        }).on('error', err => {
            console.error(`Error fetching ${url}:`, err.message);
            resolve(null);
        });
    });
}

async function run() {
    console.log('--- Checking API Responses ---');
    await fetchData('http://localhost:5000/departments');

    const students = await fetchData('http://localhost:5000/students');

    // Fetch courses using a valid department if possible
    const departments = await fetchData('http://localhost:5000/departments');
    if (Array.isArray(departments) && departments.length > 0) {
        await fetchData(`http://localhost:5000/courses?dept_id=${departments[0].id}&semester=1`);
    } else {
        console.log('Skipping course fetch (no departments found to get ID)');
    }
}

run();
