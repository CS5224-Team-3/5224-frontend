import React, { useState, useEffect } from 'react';
import { Card, Button, Space, App } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCarouselPosts } from './services/api';
import SearchResult from './SearchResult';
import './SearchHomepage.css';

const { useApp } = App;


// 自定义轮播图组件
const StoryCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { message } = useApp();

  // 从后端获取帖子数据
  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        console.log('Loading carousel posts...');
        const response = await getCarouselPosts(4);
        console.log('Carousel API response:', response);
        
        const postsData = response.data;
        console.log('Carousel data:', postsData);
        
        // 处理不同的数据格式
        let carouselPosts = [];
        
        if (Array.isArray(postsData)) {
          // 如果是数组，直接使用
          carouselPosts = postsData;
        } else if (postsData && typeof postsData === 'object') {
          // 如果是单个对象，转换为数组
          carouselPosts = [postsData];
        }
        
        if (carouselPosts.length > 0) {
          console.log('Carousel posts count:', carouselPosts.length);
          console.log('Carousel posts:', carouselPosts);
          setPosts(carouselPosts);
        } else {
          console.log('No valid posts data found, using default data');
          // 如果API成功但没有数据，使用默认数据
          setPosts([
            {
              postId: 1,
              title: "Our Ragdoll was well cared for in Hangzhou!",
              description: "One-week business trip. Daily videos from the host. Cat gained weight 😊",
              pet_image: "https://tse3.mm.bing.net/th/id/OIP.Ut0KAYWNa9xs8uGExOMVRwAAAA?rs=1&pid=ImgDetMain&o=7&rm=3"
            },
            {
              postId: 2,
              title: "Golden retriever found a loving home in Shenzhen!",
              description: "Host took the dog to the park daily. Learned new tricks 🐕",
              pet_image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgELMYZRkl1I2xvtG_Wo4x6zToSBTSCHL66Q&s"
            },
            {
              postId: 3,
              title: "Happy kitty days in Shanghai!",
              description: "Very caring host. Cat didn't lose weight, even gained some! 🐱",
              pet_image: "https://bpic.588ku.com/video_listen_meihao/video/10157_20230515084408_1.jpg!/fh/188/unsharp/true"
            },
            {
              postId: 4,
              title: "Border collie's fostering experience in Beijing!",
              description: "Host has a yard. Dog was happy every day. Owners felt assured 🐶",
              pet_image: "https://pic4.zhimg.com/v2-b11cb67f60e68240a4534abfda290519_1440w.jpg"
            }
          ]);
        }
      } catch (error) {
        console.error('Failed to load posts for carousel:', error);
        message.error('Failed to load posts');
        // 如果API失败，使用默认数据
        setPosts([
          {
            postId: 1,
            title: "Our Ragdoll was well cared for in Hangzhou!",
            description: "One-week business trip. Daily videos from the host. Cat gained weight 😊",
            pet_image: "https://tse3.mm.bing.net/th/id/OIP.Ut0KAYWNa9xs8uGExOMVRwAAAA?rs=1&pid=ImgDetMain&o=7&rm=3"
          },
          {
            postId: 2,
            title: "Golden retriever found a loving home in Shenzhen!",
            description: "Host took the dog to the park daily. Learned new tricks 🐕",
            pet_image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgELMYZRkl1I2xvtG_Wo4x6zToSBTSCHL66Q&s"
          },
          {
            postId: 3,
            title: "Happy kitty days in Shanghai!",
            description: "Very caring host. Cat didn't lose weight, even gained some! 🐱",
            pet_image: "https://bpic.588ku.com/video_listen_meihao/video/10157_20230515084408_1.jpg!/fh/188/unsharp/true"
          },
          {
            postId: 4,
            title: "Border collie's fostering experience in Beijing!",
            description: "Host has a yard. Dog was happy every day. Owners felt assured 🐶",
            pet_image: "https://pic4.zhimg.com/v2-b11cb67f60e68240a4534abfda290519_1440w.jpg"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [message]);

  const handlePrev = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1));
      setFade(true);
    }, 50);
  };

  const handleNext = () => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1));
      setFade(true);
    }, 50);
  };

  // 自动播放
  useEffect(() => {
    if (posts.length > 0) {
      const timer = setInterval(() => {
        handleNext();
      }, 3000);
      return () => clearInterval(timer);
    }
  }, [currentIndex, posts.length, handleNext]);

  const handleDotClick = (index) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 50);
  };

  // 处理标题点击事件
  const handleTitleClick = (postId) => {
    navigate(`/detail/${postId}`);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (posts.length === 0) {
    return <div>No posts available</div>;
  }

  return (
    <div className="carousel-container">
      {/* 左箭头 */}
      <Button 
        className="carousel-arrow carousel-arrow-left"
        icon={<LeftOutlined />}
        onClick={handlePrev}
        shape="circle"
        size="large"
      />
      
      {/* 轮播内容 */}
      <div className="carousel-wrapper">
        <div className={`carousel-slide ${fade ? 'fade-in' : 'fade-out'}`}>
          <Card className="story-card">
            <img 
              src={posts[currentIndex].pet_image || posts[currentIndex].image} 
              alt={posts[currentIndex].title} 
              className="story-image" 
            />
            <h3 
              className="story-title clickable"
              onClick={() => handleTitleClick(posts[currentIndex].postId)}
              style={{ cursor: 'pointer' }}
            >
              {posts[currentIndex].title}
            </h3>
            <p>{posts[currentIndex].description}</p>
          </Card>
        </div>
        
        {/* 圆点指示器 */}
        <div className="carousel-dots">
          {posts.map((_, index) => (
            <span
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => handleDotClick(index)}
            />
          ))}
        </div>
      </div>

      {/* 右箭头 */}
      <Button 
        className="carousel-arrow carousel-arrow-right"
        icon={<RightOutlined />}
        onClick={handleNext}
        shape="circle"
        size="large"
      />
    </div>
  );
};



// 主搜索页面组件
const SearchHomepage = ({ onCreatePost }) => {

  return (
    <div className="search-homepage">
      {/* 主要内容区域 */}
      <div className="main-content" style={{backgroundColor: '#ffffff'}}>
        {/* 成功故事轮播 */}
        <div className="hero-section">
          <Card className="hero-card">
            <h2>Successful Fostering Stories</h2>
            <p>See heartwarming stories from owners and hosts ❤️</p>
          </Card>
          <StoryCarousel />
        </div>

        

        {/* 使用 SearchResult 组件显示帖子列表 - 默认按时间排序 */}
        <SearchResult isSearchResult={false} />
      </div>


    </div>
  );
};

export default SearchHomepage;
