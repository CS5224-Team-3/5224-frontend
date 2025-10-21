// src/pages/Register.jsx
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Space, App, Modal } from 'antd';
import './Login.css';

// ✅ Amplify v6 Auth API
import { signUp, confirmSignUp, signIn } from 'aws-amplify/auth';

const { useApp } = App;

export default function Register() {
  const { login } = useAuth();     // 你自己的全局登录上下文（会触发 getCurrentUser 检查）
  const navigate = useNavigate();
  const { message } = useApp();

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  // 弹窗获取验证码的小工具
  const promptCode = (title = 'Enter the verification code sent to your email') =>
    new Promise((resolve, reject) => {
      let code = '';
      Modal.confirm({
        title,
        content: (
          <Input
            autoFocus
            placeholder="6-digit code"
            onChange={(e) => (code = e.target.value)}
            onPressEnter={(e) => {
              code = e.currentTarget.value;
              Modal.destroyAll();
              resolve(code);
            }}
          />
        ),
        okText: 'Confirm',
        cancelText: 'Cancel',
        onOk: () => (code ? resolve(code) : reject(new Error('Code required'))),
        onCancel: () => reject(new Error('Cancelled')),
      });
    });

  const handleSignUp = async ({ username, email, password }) => {
    try {
      // 1) 注册（如果你的 User Pool 是“Email 作为用户名”，把 username 改为 email）
      const res = await signUp({
        username,       // 若池是“email 作为用户名”，这里传 email
        password,
        options: {
          userAttributes: { email }, // 建议收集邮箱，便于收验证码
          autoSignIn: { enabled: false }, // 我们手动在下面 signIn
        },
      });
      console.log('[signUp] nextStep:', res.nextStep);

      // 2) 需要邮箱验证码 → 让用户输入并确认
      const code = await promptCode();
      await confirmSignUp({ username, confirmationCode: code });
      message.success('Registration confirmed!');

      // 3) 可选：自动登录
      await signIn({ username, password });
      await login(); // 刷新你自己的 AuthProvider（内部会 getCurrentUser）
      message.success('Signed in successfully!');
      navigate('/');
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
          {/* 如果你的 User Pool 是“Email 作为用户名”，把这个 Username 字段的 label/placeholder 改成 Email，
              并在 onFinish 里把 username = email 传入 signUp */}
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input size="large" style={{ fontSize: '20px' }} />
          </Form.Item>

          {/* 建议收集 Email 来接收验证码；若池已是 email-as-username，也保留它做属性 */}
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Invalid email!' },
            ]}
          >
            <Input size="large" style={{ fontSize: '20px' }} />
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
