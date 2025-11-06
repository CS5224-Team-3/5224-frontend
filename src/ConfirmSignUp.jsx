// src/ConfirmSignUp.jsx
import { useLocation, useNavigate } from 'react-router-dom';
import { App, Button, Form, Input, Space, Typography } from 'antd';
import { useEffect } from 'react';
import { confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';

export default function ConfirmSignUp() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  // 若从注册页带了 email，则预填
  useEffect(() => {
    const incoming = location?.state?.username;
    if (incoming) {
      form.setFieldsValue({ username: incoming });
    }
  }, [location, form]);

  const onConfirm = async ({ username, code }) => {
    try {
      await confirmSignUp({ username, confirmationCode: code });
      message.success('Account verified. Please sign in.');
      navigate('/login', { state: { username } });
    } catch (err) {
      console.error('[confirmSignUp error]', err);
      message.error(err?.message || 'Confirmation failed');
    }
  };

  const onResend = async () => {
    try {
      const username = form.getFieldValue('username');
      if (!username) {
        message.warning('Please enter your email first.');
        return;
      }
      await resendSignUpCode({ username });
      message.success('Verification code resent. Please check your email.');
    } catch (err) {
      console.error('[resendSignUpCode error]', err);
      message.error(err?.message || 'Resend failed');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'grid',
      placeItems: 'center',
      background: '#f6f7fb'
    }}>
      <div style={{ width: 520, padding: 24, background: '#fff', borderRadius: 12 }}>
        <Typography.Title level={3} style={{ marginBottom: 16 }}>
          Verify your email
        </Typography.Title>
        <Form
          form={form}
          layout="vertical"
          size="large"
          autoComplete="off"
          onFinish={onConfirm}
          initialValues={{ username: location?.state?.username ?? '' }}
        >
          <Form.Item
            label="Email (username)"
            name="username"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Invalid email' }
            ]}
          >
            <Input placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label="Verification code"
            name="code"
            rules={[{ required: true, message: 'Please input the verification code!' }]}
          >
            <Input placeholder="Enter the code from your email" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">Confirm</Button>
              <Button onClick={onResend}>Resend code</Button>
              <Button onClick={() => navigate('/login')}>Back to login</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
}
