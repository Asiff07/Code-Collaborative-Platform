const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testWorkspace() {
  try {
    // We need a token. Let's assume there's a test user or just try to hit the endpoint.
    // Actually, I'll just check if the server is alive.
    const res = await axios.get(`${API_URL}/api/workspaces`);
    console.log('Workspaces:', res.data);
  } catch (err) {
    console.error('Error:', err.response ? err.response.data : err.message);
  }
}

testWorkspace();
