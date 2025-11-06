// src/pages/Register.jsx
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Space, App } from 'antd';
import './Login.css';

// ✅ Amplify v6 Auth API
import { signUp } from 'aws-amplify/auth';

const { useApp } = App;

export default function Register() {
  // 这里保留 useAuth（如果你要注册后自动登录再用），本改动暂不自动登录
  const { login } = useAuth?.() ?? { login: () => {} };
  const navigate = useNavigate();
  const { message } = useApp();

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  const handleSignUp = async ({ username, email, password }) => {
    try {
      // 若你用户池使用“Email 作为用户名”，则优先取 email 作为 username
      const signupUsername = (username && username.trim()) || (email && email.trim());
      if (!signupUsername) {
        message.error('Username or Email is required');
        return;
      }

      // 1) 注册：不自动登录、也不在此确认验证码
      const res = await signUp({
        username: signupUsername,
        password,
        options: {
          userAttributes: { email },      // 确保会向该邮箱发验证码
          autoSignIn: { enabled: false }, // 先去验证码页
        },
      });
      console.log('[signUp] nextStep:', res.nextStep);

      // 2) 跳转到验证码页面，把用户名（通常是邮箱）传过去做预填
      message.success('Sign up successful. Please verify your email.');
      navigate('/confirm-signup', { state: { username: signupUsername } });
    } catch (err) {
      console.error('[signUp error]', err);
      const tip =
        err?.name === 'UsernameExistsException' ? 'Username already exists' :
        err?.name === 'InvalidPasswordException' ? 'Password does not meet policy' :
        err?.message || 'Registration failed';
      message.error(tip);
    }
  };

  return (
    <div
      style={{
        backgroundImage:
          "url('https://th.bing.com/th/id/OIP.lfyUaiR2EXEm_q4gj7FVbQAAAA?w=152&h=104&c=7&bgcl=ebbbe1&r=0&o=6&dpr=1.5&pid=13.1')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        fontSize: 30,
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="login-container">
        <h2>Sign up to PetLodge</h2>

        <Form
          name="basic"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          style={{ width: 800 }}
          initialValues={{ remember: true }}
          onFinish={handleSignUp}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          size="large"
        >
          {/* 若你的用户池配置为“Email 即用户名”，可将此项文案改为 Email，或直接隐藏此项只保留 Email */}
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: false }]} // 非强制；会用 email 兜底
          >
            <Input size="large" style={{ fontSize: '20px' }} placeholder="(Optional) Username" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Invalid email!' },
            ]}
          >
            <Input size="large" style={{ fontSize: '20px' }} placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            style={{ fontSize: '20px' }}
            label="Password"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password style={{ fontSize: '20px' }} size="large" />
          </Form.Item>

          <Form.Item
            style={{ fontSize: '20px' }}
            label="Confirm Password"
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Please confirm your password!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve();
                  return Promise.reject(new Error('The two passwords do not match!'));
                },
              }),
            ]}
          >
            <Input.Password style={{ fontSize: '20px' }} size="large" />
          </Form.Item>

          <Form.Item label={null} style={{ display: 'flex', justifyContent: 'center' }}>
            <Space>
              <Button style={{ fontSize: '20px' }} size="large" type="primary" htmlType="submit">
                Sign up
              </Button>
              <Button style={{ fontSize: '20px' }} size="large" onClick={() => navigate('/login')}>
                Back to Login
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
