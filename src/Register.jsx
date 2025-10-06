import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button, Form, Input, Space, App } from 'antd';
import { register as registerAPI } from './services/api';
import './Login.css'

const { useApp } = App;

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = useApp();

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };
  
  const handleSignUp = async (values) => {
    try {
      const response = await registerAPI(values.username, values.password);
      console.log('Register response:', response);
      
      message.success('Registration successful!');
      login(); // 注册成功后自动登录
      navigate('/'); // 跳转到首页
    } catch (error) {
      console.error('Register failed:', error);
      message.error(error.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div style={{
      backgroundImage: "url('https://th.bing.com/th/id/OIP.lfyUaiR2EXEm_q4gj7FVbQAAAA?w=152&h=104&c=7&bgcl=ebbbe1&r=0&o=6&dpr=1.5&pid=13.1)",
    backgroundSize: "cover",       // 背景铺满
    backgroundPosition: "center",  // 居中显示
    backgroundRepeat: "no-repeat", // 不重复
    height: "100vh",               // 记得加高度才能完全显示
     fontSize: 30, 
     width: '100vw', 
     display: 'flex',
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center' }}>
         <div className='login-container'>
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
        size='large'
      >
        <Form.Item
          // style={{ fontSize: '20px' }}
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input size="large"
            style={{ fontSize: '20px' }} />
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
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password style={{ fontSize: '20px' }} size="large" />
        </Form.Item>
       

        <Form.Item label={null} style={{display:'flex',justifyContent:'center'}}>
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
