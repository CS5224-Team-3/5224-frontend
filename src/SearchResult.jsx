// src/SearchResult.jsx
import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Tag, Space, Spin } from 'antd';
import { HeartOutlined, HeartFilled, UserOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getPostsList, searchPostsByTitle } from './services/api';
import './SearchHomepage.css';

// ===== 工具：时间友好显示 =====
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

// ===== 帖子卡片组件 =====
const PostCard = ({ post, onLike, onViewDetail }) => {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = (e) => {
    e.stopPropagation();
    const next = !isLiked;
    setIsLiked(next);
    onLike && onLike(post.id, next);
  };

  return (
    <Card className="post-card" hoverable onClick={() => onViewDetail && onViewDetail(post.id)}>
      <div className="post-header">
        <Avatar size={32} icon={<UserOutlined />} />
        <div className="post-meta">
          <strong>{post.author}</strong>
          {post.timeAgo ? ` · ${post.timeAgo}` : ''}
          {post.petType ? ` · ${post.petType}` : ''}
          {post.location ? ` · ${post.location}` : ''}
        </div>
      </div>
      <h3 className="post-title">{post.title}</h3>
      {post.description ? <p className="post-description">{post.description}</p> : null}
      {!!post.tags?.length && (
        <div className="post-tags">
          {post.tags.map((tag, index) => (
            <Tag key={index} color="blue" className="post-tag">
              #{tag}
            </Tag>
          ))}
        </div>
      )}
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

// ===== 搜索结果组件 =====
const SearchResult = ({ isSearchResult = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const q = new URLSearchParams(location.search).get('q') || '';
  const [allPosts, setAllPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadPosts = async () => {
      setLoading(true);
      try {
        let response;
        if (isSearchResult && q) {
          console.log('🔍 Searching posts by title:', q);
          response = await searchPostsByTitle({ query: q });
        } else {
          console.log('📃 Loading all posts');
          response = await getPostsList();
        }

        const list = response?.data || [];
        console.log('✅ Got posts:', list);

        const formatted = list.map((post) => ({
          id: post.id ?? post.postId ?? post._id,
          author: post.owner ?? post.userid ?? 'Anonymous',
          title: post.title ?? 'Untitled',
          description: post.description ?? post.content ?? '',
          tags: post.keywords ?? [],
          location: post.city ?? '',
          petType: post.pet_type ?? '',
          timeAgo: formatTimeAgo(post.createAt ?? post.createdAt),
          timestamp: new Date(post.createAt ?? post.createdAt ?? Date.now()).getTime(),
        }));

        if (mounted) setAllPosts(formatted);
      } catch (e) {
        console.error('❌ Failed to load posts:', e);
        if (mounted) setAllPosts([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadPosts();
    return () => (mounted = false);
  }, [isSearchResult, q]);

  const handleLike = (id, liked) => console.log(`post ${id} ${liked ? 'liked' : 'unliked'}`);
  const handleViewDetail = (id) => id && navigate(`/detail/${id}`);

  if (loading)
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <Spin size="large" tip="Loading posts..." />
      </div>
    );

  return (
    <div className="search-result">
      <div className="main-content" style={{ backgroundColor: '#ffffff', padding: 16 }}>
        <div style={{ marginBottom: 16 }}>
          {isSearchResult ? (
            <h3 style={{ margin: 0, color: '#333', fontSize: 18 }}>
              Search Results ({allPosts.length}) · Sorted by Relevance
            </h3>
          ) : (
            <h3 style={{ margin: 0, color: '#333', fontSize: 18 }}>Latest Posts</h3>
          )}
        </div>

        <div className="posts-section">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {allPosts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} onViewDetail={handleViewDetail} />
            ))}
          </Space>
        </div>

        {!allPosts.length && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
            <p style={{ fontSize: 18, marginBottom: 8 }}>No results found</p>
            <p style={{ fontSize: 14 }}>Try adjusting your search criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResult;
