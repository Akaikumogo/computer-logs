const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TOKEN = 'your-jwt-token-here'; // Replace with actual token

async function testManualWarning() {
  try {
    console.log('🧪 Testing manual warning endpoint...');

    const response = await axios.post(
      `${BASE_URL}/schedule/attendance/manual-warning`,
      {},
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('✅ Manual warning test successful:', response.data);
  } catch (error) {
    console.error(
      '❌ Manual warning test failed:',
      error.response?.data || error.message,
    );
  }
}

async function testManualPastWarning() {
  try {
    console.log('🧪 Testing manual past warning endpoint...');

    const response = await axios.post(
      `${BASE_URL}/schedule/attendance/manual-past-warning`,
      {},
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log('✅ Manual past warning test successful:', response.data);
  } catch (error) {
    console.error(
      '❌ Manual past warning test failed:',
      error.response?.data || error.message,
    );
  }
}

async function testGetAllWarnings() {
  try {
    console.log('🧪 Testing get all warnings endpoint...');

    const response = await axios.get(`${BASE_URL}/schedule/warnings/all`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Get all warnings test successful:', response.data);
  } catch (error) {
    console.error(
      '❌ Get all warnings test failed:',
      error.response?.data || error.message,
    );
  }
}

async function testGetWarningsByDateRange() {
  try {
    console.log('🧪 Testing get warnings by date range endpoint...');

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    const response = await axios.get(
      `${BASE_URL}/schedule/warnings/date-range?startDate=${yesterday}&endDate=${today}`,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
      },
    );

    console.log(
      '✅ Get warnings by date range test successful:',
      response.data,
    );
  } catch (error) {
    console.error(
      '❌ Get warnings by date range test failed:',
      error.response?.data || error.message,
    );
  }
}

async function testDashboardStats() {
  try {
    console.log('🧪 Testing dashboard stats...');

    const response = await axios.get(`${BASE_URL}/schedule/dashboard/stats`, {
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('✅ Dashboard stats test successful:', response.data);
  } catch (error) {
    console.error(
      '❌ Dashboard stats test failed:',
      error.response?.data || error.message,
    );
  }
}

async function runTests() {
  console.log('🚀 Starting cron job tests...\n');

  await testDashboardStats();
  console.log('');
  await testGetAllWarnings();
  console.log('');
  await testGetWarningsByDateRange();
  console.log('');
  await testManualWarning();
  console.log('');
  await testManualPastWarning();

  console.log('\n🎉 All tests completed!');
}

runTests();
