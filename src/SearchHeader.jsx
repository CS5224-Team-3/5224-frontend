import React, { useState } from 'react';
import { Input, Avatar, Button, Layout ,Dropdown, Space} from 'antd';
import { SearchOutlined, UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from './AuthProvider';
import { useNavigate, Outlet } from 'react-router-dom';
import './SearchHeader.css';

const { Search } = Input;
const { Content } = Layout;



const SearchHeader = ({ onSearch, onUserClick}) => {
  const [searchValue, setSearchValue] = useState('');
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (value) => {
    
    console.log('search:', value);
    navigate(`/search-result?q=${value}`);
    onSearch && onSearch(value);
  };
  const handleHomeClick = () => {
    if (window.location.pathname === '/') {
      window.location.reload();
    } else {
      navigate('/');
    }
  }

  const handleUserClick = () => {
    if (onUserClick) {
      onUserClick();
    } else {
      // 默认行为：导航到个人中心或登录页
      navigate('/profile');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCreatePostClick = () => {
    navigate('/create-post');
  };

  const items = [
    {
      label: <span style={{ fontSize: '16px', padding: '4px 8px' }}>Account</span>,
      key: 'account',
      onClick: handleUserClick
    },
    {
      label: <span style={{ fontSize: '16px', padding: '4px 8px' }}>Logout</span>,
      key: 'logout',
      onClick: handleLogout
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', width: '100%', background: '#fafafa', overflow: 'hidden' }}>
      {/* Header */}
      <div className="search-header" style={{
          width: '100vw',
          height: '100px', 
          background: '#FFB366',
          position: 'relative',
          left: '50%',
          right: '50%',
          marginLeft: '-50vw',
          marginRight: '-50vw'}}>
        <div className="search-header-content" style={{display: 'flex', width:'100%',height:'100%',justifyContent: 'space-between',
           alignItems: 'center', maxWidth: '100vw', margin: '0 auto'}} >
          <div className="logo" onClick={handleHomeClick}>
            🐾 PetLodge
          </div>
          <div className="search-bar">
            <Search style={{width: '100%'}}
              placeholder="Search posts or tags..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={handleSearch}
              enterButton={<SearchOutlined />}
              size="large"
            />
          </div>
          <div className="header-actions">
           
             <Dropdown 
               menu={{ 
                 items,
                 style: { minWidth: '160px', padding: '8px 0' }
               }}
               overlayClassName="user-dropdown-menu"
               placement="bottomLeft"
             >
               <a onClick={e => e.preventDefault()}>
                 <Space>
                 <Avatar 
              size={36} 
              icon={<UserOutlined />} 
              onClick={handleUserClick}
              className="user-avatar"
            />
                 </Space>
                   </a>
                 </Dropdown>
           
           
            </div>
           
             
              <Button 
                className='create-post-btn' 
                style={{
                  backgroundColor: '#FF8C42',
                  fontSize:'20px', 
                  color: '#ffffff',
                  height:'60px',
                  minWidth:'120px',
                  border: '2px solid #FF8C42',
                  fontWeight: '600',
                  transition: 'all 0.3s ease'
                }} 
                onClick={handleCreatePostClick}
              >
                Create Post
              </Button>
            
          </div>
        </div>
     

      {/* Content */}
      <Content style={{ padding: '0' }}>
        <Outlet />
      </Content>

      {/* Footer */}
      <footer style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: '#888', 
        fontSize: '0.9rem',
        // marginTop: '40px',
        background: '#fafafa'
      }}>
        © 2024 PetLodge · Demo
      </footer>
    </Layout>
  );
};

export default SearchHeader;
