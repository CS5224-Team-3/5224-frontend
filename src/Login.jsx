import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Form, Input, Space, App } from 'antd';
import { login as loginAPI } from './services/api';
import './Login.css'

const { useApp } = App;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = useApp();

  const onFinishFailed = errorInfo => {
    console.log('Failed:', errorInfo);
  };
  
  const handleLogin = async (values) => {
    try {
      const response = await loginAPI(values.username, values.password);
      console.log('Login response:', response);
      
      login(); // 更新本地登录状态
      message.success('Login successful!');
      navigate('/'); // 登录成功跳转首页
    } catch (error) {
      console.error('Login failed:', error);
      message.error(error.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div style={{
      backgroundImage: "url('/01.jpg')",
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

        <Form.Item name="remember" valuePropName="checked" label={null}>
          <Checkbox style={{ fontSize: '20px' }} size="large">Remember me</Checkbox>
        </Form.Item>

        <Form.Item label={null} style={{display:'flex',justifyContent:'center'}}>
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
