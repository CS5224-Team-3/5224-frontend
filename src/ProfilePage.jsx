import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Space, Form, Input, Modal, Select, DatePicker, App, Spin } from 'antd';

import { UserOutlined, PhoneOutlined, CalendarOutlined, HeartFilled, HeartOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getUserProfile, updateUserProfile, getUserPosts, getUserFavorites, favoritePost, unfavoritePost, getUserInfo, changePassword } from './services/api';
import './ProfilePage.css';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { useApp } = App;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { message } = useApp();
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [collections, setCollections] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  // 加载用户数据
  useEffect(() => {
    const loadUserData = async () => {
      setLoading(true);
      try {
        // 获取用户信息
        const userInfo = getUserInfo();
        if (!userInfo || !userInfo.userId) {
          throw new Error('User not authenticated');
        }
        
        // 并行加载用户资料、帖子和收藏数据
        const [profileRes, postsRes, favoritesRes] = await Promise.all([
          getUserProfile(),
          getUserPosts(),
          getUserFavorites()
        ]);
        
        console.log('Profile response:', profileRes);
        console.log('Posts response:', postsRes);
        console.log('Favorites response:', favoritesRes);
        
        // 设置用户资料
        const userInfoData = {
          username: userInfo.username, // 使用本地存储的用户名
          email: profileRes.data?.email || '',
          phone: profileRes.data?.phone || '',
        };
        console.log('Setting userInfo:', userInfoData);
        setUserInfo(userInfoData);
        
        // 设置收藏列表
        const favorites = favoritesRes.data?.map((fav, index) => ({
          id: fav.postId || `fav_${index}`,
          title: fav.title || '',
          liked: true
        })) || [];
        setCollections(favorites);
        
        // 设置我的帖子
        const posts = postsRes.data?.map((post, index) => ({
          id: post.postId || `post_${index}`,
          title: post.title || '',
        })) || [];
        setMyPosts(posts);
        
      } catch (error) {
        console.error('Failed to load user data:', error);
        message.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [message]);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  const handleChangePassword = () => {
    console.log('修改密码');
    setShowChangePassword(p => !p);
  };
  
  const handlePasswordSubmit = async (values) => {
    try {
      console.log('Changing password...');
      await changePassword(values.new_password);
      message.success('Password changed successfully!');
      setShowChangePassword(false); // 关闭密码修改表单
    } catch (error) {
      console.error('Failed to change password:', error);
      message.error(error.message || 'Failed to change password. Please try again.');
    }
  };

  const handlePostClick = (postId) => {
    navigate(`/detail/${postId}`);
  };

  const handleCollectionClick = (postId) => {
    navigate(`/detail/${postId}`);
  };

  const handleLikeCollection = async (e, postId) => {
    e.stopPropagation();
    
    const item = collections.find(c => c.id === postId);
    
    try {
      if (item?.liked) {
        await unfavoritePost(postId);
        message.success('Removed from favorites');
      } else {
        await favoritePost(postId);
        message.success('Added to favorites');
      }
      
      // 更新本地状态
      setCollections(prevCollections => 
        prevCollections.map(c => 
          c.id === postId 
            ? { ...c, liked: !c.liked }
            : c
        )
      );
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      message.error('Operation failed');
    }
  };

  // 打开编辑个人信息弹窗
  const handleChangeProfile = () => {
    form.setFieldsValue({
      username: userInfo.username,
      phone: userInfo.phone,
      email: userInfo.email
    });
    setEditProfileVisible(true);
  };

  // 关闭弹窗
  const handleModalCancel = () => {
    setEditProfileVisible(false);
    form.resetFields();
  };

  // 提交修改
  const handleProfileSubmit = async (values) => {
    try {
      const modified = [
        { name: values.username },
        { contact: values.phone }
        // TODO: 添加其他字段
      ];
      
      await updateUserProfile(modified);
      message.success('Profile updated successfully!');
      
      // 更新本地状态
      setUserInfo(prev => ({
        ...prev,
        username: values.username,
        phone: values.phone,
      
      }));
      
      setEditProfileVisible(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      message.error('Failed to update profile');
    }
  };


  const handledeletePost = async (e, postId) => {
    e.stopPropagation();
    modal.confirm({
      title: 'Delete Post',
      content: 'Are you sure you want to delete this post?',
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const { deletePost } = await import('./services/api');
          await deletePost(postId);
          message.success('Post deleted successfully!');
          setMyPosts(prevPosts => prevPosts.filter(post => post.id !== postId));
  console.log('delete post:', postId);
        } catch (error) {
          console.error('Failed to delete post:', error);
          message.error('Failed to delete post');
        }
      }
    });
  };
 const handleEditPost = (e,postId) => {
  
  e.stopPropagation();
  navigate(`/edit/${postId}`);
 };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading profile..." />
      </div>
    );
  }

  if (!userInfo) {
    console.log('userInfo is null or undefined:', userInfo);
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p>Failed to load profile</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="profile-page" style={{padding:'50px'}}>
      {contextHolder}
      {/* Main content */}
      <div className="profile-content" style={{height:'1000px',backgroundColor:'#ffffff'}}>
        {/* User info card */}
        <Card className="profile-card">
          <div className="profile-header">
            <Avatar 
              size={60} 
              icon={<UserOutlined />} 
              className="profile-avatar"
            />
            <div className="profile-info">
              <h2 className="username">{userInfo.username}</h2>
             
            </div>
          </div>
          
          <div className="profile-details">
            <div className="detail-item">
              <PhoneOutlined className="detail-icon" />
              <span>Phone: {userInfo.phone}</span>
            </div>
            <div className="detail-item">
              <PhoneOutlined className="detail-icon" />
              <span>Email: {userInfo.email}</span>
            </div>
          </div>

          <div className="profile-actions">
            <Button
             icon={<EditOutlined />}
             onClick={handleChangeProfile}
            >Edit Profile</Button>
            <Button 
              icon={<EditOutlined />}
              onClick={handleChangePassword}
              className="change-password-btn"
            >
              Change Password
            </Button>
            {showChangePassword&&<div>
              <Form
    name="basic"
    labelCol={{ span: 8 }}
    wrapperCol={{ span: 16 }}
    style={{ maxWidth: 600,padding:'10px' }}
    onFinish={handlePasswordSubmit}
    autoComplete="off"
  >
    <Form.Item
      label="New Password"
      name="new_password"
      rules={[{ required: true, message: 'Please input your new password!' }]}
    >
      <Input.Password />
    </Form.Item>
    <Form.Item
      label="Confirm New Password"
      name="confirm_new_password"
      dependencies={["new_password"]}
      hasFeedback
      rules={[
        { required: true, message: "Please confirm your new password!" },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue("new_password") === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error("The two passwords do not match!"));
          },
        }),
      ]}
    >
      <Input.Password />
    </Form.Item>
    <Form.Item label={null}>
      <Button type="primary" htmlType="submit">
        change password
      </Button>
    </Form.Item>
  </Form>
              </div>}
          </div>
        </Card>

        {/* My Favorites */}
        <div className="section">
          <h3 className="section-title">My Favorites</h3>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {collections.map((item) => (
              <Card 
                key={item.id} 
                className="collection-card"
                hoverable
                onClick={() => handleCollectionClick(item.id)}
              >
                <div className="post-item">
                  <h4 className="post-title">{item.title}</h4>
                  {item.liked ? (
                    <HeartFilled 
                      onClick={(e) => handleLikeCollection(e, item.id)} 
                      className="heart-icon liked" 
                    />
                  ) : (
                    <HeartOutlined 
                      onClick={(e) => handleLikeCollection(e, item.id)} 
                      className="heart-icon" 
                    />
                  )}
                </div>
              </Card>
            ))}
          </Space>
        </div>

        {/* My Posts */}
        <div className="section">
          <h3 className="section-title">My Posts</h3>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {myPosts.map((post) => (
              <Card 
                key={post.id} 
                className="post-card"
                hoverable
                onClick={() => handlePostClick(post.id)}
              >
                <div className="post-item">
                  <div className="post-content">
                  <Space>
                    <h4 className="post-title">{post.title}</h4>
                   
                 
                    <Button onClick={(e)=>{handleEditPost(e,post.id)}}>Edit</Button>
                    <Button danger onClick={(e) => handledeletePost(e, post.id)}>Delete</Button>
                    </Space>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        </div>
      </div>

      {/* 编辑个人信息弹窗 */}
      <Modal
        title="Edit Profile"
        open={editProfileVisible}
        onCancel={handleModalCancel}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleProfileSubmit}
          style={{ marginTop: '20px' }}
        >
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input size="large" placeholder="Enter your username" />
          </Form.Item>

          <Form.Item
            label="Phone"
            name="phone"
            rules={[
              { required: true, message: 'Please input your phone number!' },
              { pattern: /^1[3-9]\d{9}$/, message: 'Please enter a valid phone number!' }
            ]}
          >
            <Input size="large" placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[{pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, message: 'Please enter a valid email address!'}]}
          >
            <Input size="large" placeholder="Enter your email" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleModalCancel}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfilePage;
