import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Form, Input, Space, App, Modal } from 'antd';
import './Login.css';

// ✅ Amplify v6 Auth API
import {
  signIn,
  confirmSignIn,
  getCurrentUser,
  fetchAuthSession,
} from 'aws-amplify/auth';

const { useApp } = App;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = useApp();

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  // 小工具，弹窗输入
  const prompt = (title, placeholder = '') =>
    new Promise((resolve, reject) => {
      let inputVal = '';
      Modal.confirm({
        title,
        content: (
          <Input
            autoFocus
            placeholder={placeholder}
            onChange={(e) => (inputVal = e.target.value)}
            onPressEnter={(e) => {
              inputVal = e.currentTarget.value;
              Modal.destroyAll();
              resolve(inputVal);
            }}
          />
        ),
        okText: 'OK',
        cancelText: 'Cancel',
        onOk: () => (inputVal ? resolve(inputVal) : reject(new Error('Required'))),
        onCancel: () => reject(new Error('Cancelled')),
      });
    });

  const handleLogin = async ({ username, password }) => {
    try {
      // 1) 基础登录
      const res = await signIn({ username, password });
      console.log('[signIn] nextStep =', res.nextStep);

      // 2) 常见 nextStep 处理
      let step = res.nextStep?.signInStep;

      // a) 第一次登录需设置新密码（控制台创建用户最常见）
      if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        const newPwd = await prompt('First sign-in detected. Please set a NEW password');
        await confirmSignIn({ challengeResponse: newPwd });
      }

      // b) 短信验证码
      if (step === 'CONFIRM_SIGN_IN_WITH_SMS_CODE') {
        const code = await prompt('Enter the SMS code you received');
        await confirmSignIn({ challengeResponse: code });
      }

      // c) TOTP 验证码（Authenticator App）
      if (step === 'CONFIRM_SIGN_IN_WITH_TOTP_CODE') {
        const code = await prompt('Enter the authenticator app code');
        await confirmSignIn({ challengeResponse: code });
      }

      // 3) 到这里应为“已登录”
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      console.log('[currentUser]', user);
      console.log('[tokens]', session.tokens);

      // 可选：用于前端显示昵称
      localStorage.setItem('username', user.username);

      // 4) 更新你现有的本地登录上下文 & 跳转
      login();
      message.success('Login successful!');
      navigate('/');
    } catch (err) {
      console.error('[login error]', err);
      const map =
        err?.name === 'UserNotFoundException' ? 'User does not exist' :
        err?.name === 'NotAuthorizedException' ? 'Incorrect username or password' :
        err?.message || 'Login failed';
      message.error(map);
    }
  };

  return (
    <div style={{
      backgroundImage: "url('/01.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      height: "100vh",
      fontSize: 30,
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className='login-container'>
        <h2>Welcome to PetLodge</h2>

        <Form
          name="basic"
          labelCol={{ span: 24 }}
          wrapperCol={{ span: 24 }}
          style={{ width: 800 }}
          initialValues={{ remember: true }}
          onFinish={handleLogin}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
          size='large'
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
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

          <Form.Item name="remember" valuePropName="checked" label={null}>
            <Checkbox style={{ fontSize: '20px' }} size="large">Remember me</Checkbox>
          </Form.Item>

          <Form.Item label={null} style={{ display: 'flex', justifyContent: 'center' }}>
            <Space>
              <Button style={{ fontSize: '20px' }} size="large" type="primary" htmlType="submit">
                Sign in
              </Button>
              <Button onClick={() => navigate('/register')}>Sign up</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
