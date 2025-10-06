import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Tag, Space, Spin } from 'antd';
import { HeartOutlined, HeartFilled, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPostsList, searchPosts } from './services/api';
import './SearchHomepage.css';

// 帖子卡片组件
const PostCard = ({ post, onLike, onViewDetail }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onLike && onLike(post.id, !isLiked);
  };

  return (
    <Card 
      className="post-card" 
      hoverable
      onClick={() => onViewDetail && onViewDetail(post.id)}
    >
      <div className="post-header">
        <Avatar size={32} icon={<UserOutlined />} />
        <div className="post-meta">
          <strong>{post.author}</strong> · {post.timeAgo} · {post.petType} · {post.location}
        </div>
      </div>
      <h3 className="post-title">{post.title}</h3>
      <p className="post-description">{post.description}</p>
      <div className="post-tags">
        {post.tags.map((tag, index) => (
          <Tag key={index} color="blue" className="post-tag">
            #{tag}
          </Tag>
        ))}
      </div>
      <div className="post-actions">
        <Button 
          type="text" 
          icon={isLiked ? <HeartFilled /> : <HeartOutlined />}
          className={`favorite-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        />
      </div>
    </Card>
  );
};

// 搜索结果组件
const SearchResult = ({ isSearchResult = false, searchQuery = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 如果是搜索结果，按相关度排序；否则按时间排序
  const sortBy = isSearchResult ? 'relevance' : 'time';

  // 加载帖子数据
  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      try {
        let response;
        
        if (isSearchResult && searchQuery) {
          // 搜索帖子
          response = await searchPosts(searchQuery, null, null);
        } else {
          // 获取所有帖子
          response = await getPostsList();
        }
        
        const posts = response.data?.list || [];
        
        // 转换数据格式
        const formattedPosts = posts.map(post => ({
          id: post.postId,
          author: post.userid, // TODO: 可能需要获取用户名
          timeAgo: formatTimeAgo(post.postCreateAt),
          timestamp: new Date(post.postCreateAt).getTime(),
          petType: "🐱", // TODO: 从帖子数据获取
          location: "", // TODO: 从帖子数据获取
          title: post.title,
          description: "", // TODO: 从详情获取或列表返回
          tags: [],
          relevanceScore: post.score || 0
        }));
        
        setAllPosts(formattedPosts);
      } catch (error) {
        console.error('Failed to load posts:', error);
        setAllPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    loadPosts();
  }, [isSearchResult, searchQuery]);

  // 格式化时间
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  // 根据排序方式排序帖子
  const getSortedPosts = () => {
    const postsCopy = [...allPosts];
    
    if (sortBy === 'time') {
      // 按时间排序（最新的在前）
      return postsCopy.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortBy === 'relevance') {
      // 按相关度排序（分数高的在前）
      return postsCopy.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    
    return postsCopy;
  };

  const sortedPosts = getSortedPosts();

  const handleLike = (postId, isLiked) => {
    console.log(`post ${postId} ${isLiked ? 'liked' : 'unliked'}`);
    // TODO: 向后端发送请求
  };

  const handleViewDetail = (postId) => {
    console.log('view post detail:', postId);
    navigate(`/detail/${postId}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
        <Spin size="large" tip="Loading posts..." />
      </div>
    );
  }

  return (
    <div className="search-result">
      <div className="main-content" style={{backgroundColor: '#ffffff', padding: '16px'}}>
        {/* 帖子列表标题 */}
        <div style={{ marginBottom: '16px' }}>
          {isSearchResult ? (
            <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
              Search Results ({sortedPosts.length}) · Sorted by Relevance
            </h3>
          ) : (
            <h3 style={{ margin: 0, color: '#333', fontSize: '18px' }}>
              Latest Posts
            </h3>
          )}
        </div>

        {/* 帖子列表 */}
        <div className="posts-section">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {sortedPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onViewDetail={handleViewDetail}
              />
            ))}
          </Space>
        </div>

        {/* 空状态 */}
        {sortedPosts.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '60px 20px',
            color: '#999' 
          }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>No results found</p>
            <p style={{ fontSize: '14px' }}>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResult;

