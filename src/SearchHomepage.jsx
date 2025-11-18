// SearchHomepage.jsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Spin, App } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getCarouselPosts, getPostsList } from './services/api';
import './SearchHomepage.css';

const { useApp } = App;

// ======================== 工具函数 ========================
function formatTimeAgo(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
}

// ======================== 轮播图组件 ========================
const StoryCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { message } = useApp();

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getCarouselPosts(4); 
        const carouselPosts = Array.isArray(res?.data) ? res.data : [];
        if (active) {
          // 如果 GraphQL 没图片，也会回退到无图帖子，维持长度
          setPosts(
            carouselPosts.length > 0
              ? carouselPosts
              : []
          );
        }
      } catch (error) {
        console.error('Failed to load carousel posts:', error);
        message.error('Failed to load stories.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [message]);

  const handlePrev = () => {
    if (!posts.length) return;
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? posts.length - 1 : prev - 1));
      setFade(true);
    }, 50);
  };

  const handleNext = () => {
    if (!posts.length) return;
    setFade(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === posts.length - 1 ? 0 : prev + 1));
      setFade(true);
    }, 50);
  };

  useEffect(() => {
    if (posts.length > 0) {
      const timer = setInterval(() => handleNext(), 4000);
      return () => clearInterval(timer);
    }
  }, [posts.length]);

  const handleDotClick = (index) => {
    setFade(false);
    setTimeout(() => {
      setCurrentIndex(index);
      setFade(true);
    }, 50);
  };

  const handleTitleClick = (postId) => navigate(`/detail/${postId}`);

  if (loading) return <div>Loading...</div>;
  if (!posts.length) return null;

  const current = posts[currentIndex];

  return (
    <div className="carousel-container">
      <Button className="carousel-arrow carousel-arrow-left" icon={<LeftOutlined />} onClick={handlePrev} shape="circle" size="large" />
      <div className="carousel-wrapper">
        <div className={`carousel-slide ${fade ? 'fade-in' : 'fade-out'}`}>
          <Card className="story-card">
            {current?.pet_image ? (
              <img
                src={current.pet_image}
                alt={current.title}
                className="story-image"
              />
            ) : null}
            <h3
              className="story-title clickable"
              onClick={() => handleTitleClick(current.postId)}
              style={{ cursor: 'pointer' }}
            >
              {current.title}
            </h3>
            {current?.description ? <p>{current.description}</p> : null}
          </Card>
        </div>

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
      <Button className="carousel-arrow carousel-arrow-right" icon={<RightOutlined />} onClick={handleNext} shape="circle" size="large" />
    </div>
  );
};

// ======================== 主页面组件 ========================
const SearchHomepage = () => {
  const navigate = useNavigate();
  const [allPosts, setAllPosts] = useState([]);
  const [nextToken, setNextToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res = await getPostsList({ limit: 50 });
        const items = res?.data ?? [];
        const token = res?.nextToken ?? null;
        const formatted = items.map((p) => ({
          id: p.id ?? p.postId ?? p._id,
          author: p.owner ?? p.userid ?? 'Anonymous',
          title: p.title ?? 'Untitled',
          description: p.description ?? p.content ?? '',
          tags: Array.isArray(p.keywords) ? p.keywords : [],
          location: p.city ?? '',
          petType: p.pet_type ?? '',
          timeAgo: formatTimeAgo(p.createAt ?? p.createdAt ?? p.updatedAt),
        }));

        if (mounted) {
          setAllPosts(formatted);
          setNextToken(token);
        }
      } catch (err) {
        console.error('❌ Failed to load posts:', err);
        if (mounted) {
          setAllPosts([]);
          setNextToken(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Loading posts..." />
      </div>
    );

  return (
    <div className="search-homepage">
      <div className="main-content" style={{ backgroundColor: '#ffffff' }}>
        <div className="hero-section">
          <Card className="hero-card">
            <h2>Successful Fostering Stories</h2>
            <p>See heartwarming stories from owners and hosts ❤️</p>
          </Card>
          <StoryCarousel />
        </div>

        {/* 所有帖子展示 */}
        <div style={{ marginTop: 40, padding: '0 16px' }}>
          <h3 style={{ marginBottom: 16 }}>Latest Posts</h3>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {allPosts.map((post) => (
              <Card
                key={post.id}
                hoverable
                title={post.title}
                onClick={() => navigate(`/detail/${post.id}`)}
              >
                {post.description ? <p>{post.description}</p> : null}
                <p style={{ color: '#999', fontSize: 13 }}>
                  {post.author} · {post.location} · {post.timeAgo}
                </p>
              </Card>
            ))}
          </Space>

          {!allPosts.length && (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              <p>No posts found</p>
            </div>
          )}

          {/* 如果要做分页加载：
          {nextToken && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Button onClick={handleLoadMore}>Load more</Button>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default SearchHomepage;
