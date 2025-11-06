// src/Login.jsx
import { useAuth } from './AuthProvider';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Checkbox, Form, Input, Space, App, Modal } from 'antd';
import './Login.css';

import {
  signIn,
  confirmSignIn,
  getCurrentUser,
  fetchAuthSession,
  confirmSignUp,
} from 'aws-amplify/auth';

const { useApp } = App;

export default function Login() {
  const { login } = useAuth?.() ?? { login: () => {} };
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = useApp();

  const onFinishFailed = (errorInfo) => {
    console.log('Failed:', errorInfo);
  };

  // 简易输入弹窗
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
      // 第一次尝试登录
      let res = await signIn({ username, password });

      // 循环处理直到 DONE
      // 防止只处理一次导致不会跳转
      for (;;) {
        const step = res?.nextStep?.signInStep ?? 'DONE';
        console.log('[signIn step]', step, res?.nextStep);

        if (step === 'DONE') break;

        if (step === 'CONFIRM_SIGN_UP') {
          // 未完成注册确认：跳到验证码页
          navigate('/confirm-signup', { state: { username } });
          message.info('Please verify your email to continue.');
          return;
        }

        if (step === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD') {
          const newPwd = await prompt('First sign-in detected. Please set a NEW password');
          res = await confirmSignIn({ challengeResponse: newPwd });
          continue;
        }

        if (step === 'CONFIRM_SIGN_IN_WITH_SMS_MFA') {
          const code = await prompt('Enter the SMS code you received');
          res = await confirmSignIn({ challengeResponse: code });
          continue;
        }

        if (step === 'CONFIRM_SIGN_IN_WITH_TOTP_MFA') {
          const code = await prompt('Enter the authenticator app code');
          res = await confirmSignIn({ challengeResponse: code });
          continue;
        }

        // 未覆盖到的步骤，避免静默卡住
        console.warn('Unhandled sign-in step:', step);
        message.warning(`Unhandled sign-in step: ${step}`);
        return;
      }

      // 登录完成
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      console.log('[currentUser]', user);
      console.log('[tokens]', session.tokens);

      localStorage.setItem('username', user.username);
      login?.();
      message.success('Login successful!');
      navigate('/'); // 已经 DONE 才会到这里
    } catch (err) {
      console.error('[login error]', err);

      if (err?.name === 'UserNotConfirmedException') {
        // 直接跳转去验证页，更清晰
        message.info('Account not confirmed. Please verify your email.');
        navigate('/confirm-signup', {
          state: { username: (location.state?.username) || undefined },
        });
        return;
      }

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
