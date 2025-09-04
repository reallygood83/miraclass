// Test registration API
const testData = {
  email: 'test.teacher@example.com',
  name: '김테스트',
  password: 'test123456',
  role: 'teacher',
  school_name: '테스트초등학교'
};

async function testRegistration() {
  try {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testRegistration();