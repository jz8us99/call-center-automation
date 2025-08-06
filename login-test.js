// 使用Node.js运行此脚本来获取JWT token
// 运行命令: node login-test.js

const fetch = require('node-fetch'); // 需要安装: npm install node-fetch

const LOGIN_URL = 'http://localhost:3000/api/auth/login';

async function loginAndGetToken(email, password) {
  try {
    console.log('正在登录...');

    const response = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('登录失败:', result.error);
      return null;
    }

    console.log('登录成功!');
    console.log('用户信息:', result.user);
    console.log('\n=== JWT Token ===');
    console.log(result.session.access_token);
    console.log('\n=== API测试命令 ===');
    console.log(
      `curl -X GET "http://localhost:3000/api/customer-call-logs-rls" \\`
    );
    console.log(`  -H "Authorization: Bearer ${result.session.access_token}"`);

    return result.session.access_token;
  } catch (error) {
    console.error('登录错误:', error.message);
    return null;
  }
}

// 测试用户凭据 - 替换为你的实际凭据
const TEST_EMAIL = 'your-email@example.com';
const TEST_PASSWORD = 'your-password';

// 如果直接运行此脚本
if (require.main === module) {
  loginAndGetToken(TEST_EMAIL, TEST_PASSWORD)
    .then(token => {
      if (token) {
        console.log('\nToken获取成功，可以用于API测试');
      } else {
        console.log('Token获取失败');
      }
    })
    .catch(console.error);
}

module.exports = { loginAndGetToken };
