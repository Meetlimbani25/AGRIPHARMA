const axios = require('axios');

async function testAuth() {
  try {
    console.log('Testing farmer registration...');
    const regRes = await axios.post('http://localhost:5000/api/auth/register', {
      name: 'Test Farmer',
      village: 'TestVillage',
      taluko: 'TestTaluko',
      district: 'TestDistrict',
      land_size: 5.5,
      mobile: '1234567890',
      email: 'test@example.com',
      water_level: 'medium',
      password: 'testpassword'
    });
    console.log('Registration success:', regRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Registration failed:', err.response.status, err.response.data);
    } else {
      console.error('Registration error:', err.message);
    }
  }

  try {
    console.log('\nTesting farmer login...');
    const logRes = await axios.post('http://localhost:5000/api/auth/login', {
      mobile: '1234567890',
      password: 'testpassword'
    });
    console.log('Login success:', logRes.data);
  } catch (err) {
    if (err.response) {
      console.error('Login failed:', err.response.status, err.response.data);
    } else {
      console.error('Login error:', err.message);
    }
  }
}

testAuth();
