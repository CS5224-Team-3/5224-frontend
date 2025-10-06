import React, { useState, useEffect } from 'react';
import { Card, Avatar, Button, Input, Space, Tag, App, Spin } from 'antd';
import { UserOutlined, HeartOutlined, HeartFilled, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getPostDetail, favoritePost, unfavoritePost, addReply } from './services/api';
import './PostDetailPage.css';

const { TextArea } = Input;
const { useApp } = App;

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { message } = useApp();
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [postData, setPostData] = useState(null);
  const [comments, setComments] = useState([]);

  // 加载帖子详情
  useEffect(() => {
    const loadPostDetail = async () => {
      setLoading(true);
      try {
        const response = await getPostDetail(id);
        const data = response.data;
        console.log('Post detail data:', data);
        console.log('Replies data:', data.replies);
        
        // 将后端数据转换为前端格式
        setPostData({
          id: data.postId,
          author: data.userId, // TODO: 可能需要另一个接口获取用户名
          timeAgo: formatTimeAgo(data.postCreatedAt),
          petType: `🐱 ${data.petType}`,
          location: data.city,
          title: data.title,
          description: data.description,
          image: data.pet_image || "https://imgs.699pic.com/images/501/343/865.jpg!list1x.v2", // 使用后端返回的图片URL
          tags: data.keywords || []
        });
        
        // 处理回复数据
        if (data.replies && Array.isArray(data.replies)) {
          const formattedComments = data.replies.map((reply, index) => ({
            id: index, // 使用索引作为临时ID
            author: reply.reply_username,
            timeAgo: formatReplyTime(reply.reply_time),
            content: reply.reply_content
          }));
          console.log('Formatted comments:', formattedComments);
          setComments(formattedComments);
        } else {
          console.log('No replies found or replies is not an array');
          setComments([]);
        }
      } catch (error) {
        console.error('Failed to load post:', error);
        message.error('Failed to load post details');
      } finally {
        setLoading(false);
      }
    };
    
    loadPostDetail();
  }, [id, message]);

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

  // 格式化回复时间
  const formatReplyTime = (timeString) => {
    // 如果时间格式是 HH:mm:ss，直接返回
    if (timeString && timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString;
    }
    
    // 如果是完整的日期时间，使用 formatTimeAgo
    if (timeString) {
      return formatTimeAgo(timeString);
    }
    
    return 'Just now';
  };



  const handleLike = async () => {
    try {
      if (isLiked) {
        await unfavoritePost(id);
        message.success('Unfavorited');
      } else {
        await favoritePost(id);
        message.success('Favorited');
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
      message.error('Operation failed');
    }
  };

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      message.warning('请输入回复内容');
      return;
    }
    
    try {
      // 生成当前时间作为回复时间
      const now = new Date();
      const replyTime = now.toTimeString().split(' ')[0]; // 格式: HH:mm:ss
      
      console.log('发送回复:', replyText, '时间:', replyTime);
      
      const response = await addReply(id, replyText, replyTime);
      console.log('回复响应:', response);
      
      message.success('回复发送成功！');
      setReplyText('');
      
      // 重新加载帖子详情以获取最新的回复列表
      const updatedResponse = await getPostDetail(id);
      const data = updatedResponse.data;
      
      if (data.replies && Array.isArray(data.replies)) {
        const formattedComments = data.replies.map((reply, index) => ({
          id: index,
          author: reply.reply_username,
          timeAgo: formatReplyTime(reply.reply_time),
          content: reply.reply_content
        }));
        setComments(formattedComments);
      }
      
    } catch (error) {
      console.error('Failed to send reply:', error);
      message.error(error.message || 'Failed to send reply. Please try again.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" tip="Loading post details..." />
      </div>
    );
  }

  if (!postData) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <p>Post not found</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="post-detail-page">


      {/* 主要内容区域 */}
      <div className="detail-content" style={{backgroundColor:'#ffffff'}}>
        {/* Post detail card */}
        <Card className="post-detail-card">
          {/* Post header */}
          <div className="post-header">
            <Avatar size={32} icon={<UserOutlined />} />
            <div className="post-meta">
              <strong>{postData.author}</strong> · {postData.timeAgo} · {postData.petType} · {postData.location}
            </div>
          </div>

          {/* Title */}
          <h2 className="post-title">{postData.title}</h2>

          {/* Description */}
          <p className="post-description">{postData.description}</p>

          {/* Image */}
          <div className="post-image-container">
            <img 
              src={postData.image} 
              alt="pet" 
              className="post-image"
            />
          </div>

          {/* Tags */}
          <div className="post-tags">
            {postData.tags.map((tag, index) => (
              <Tag key={index} color="blue" className="post-tag">
                #{tag}
              </Tag>
            ))}
          </div>

          {/* Like button */}
          <div className="post-actions">
            <Button 
              type="text" 
              icon={isLiked ? <HeartFilled /> : <HeartOutlined />}
              className={`like-btn ${isLiked ? 'liked' : ''}`}
              onClick={handleLike}
            >
              {isLiked ? 'Liked' : 'Like'}
            </Button>
          </div>
        </Card>

        {/* Comments */}
        <Card className="comments-card">
          <h3 className="comments-title">Replies ({comments.length})</h3>
          
          {comments.length > 0 ? (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {comments.map((comment) => (
                <div key={comment.id} className="comment-item">
                  <div className="comment-header">
                    <strong className="comment-author">{comment.author}</strong>
                    <span className="comment-time">· {comment.timeAgo}</span>
                  </div>
                  <p className="comment-content">{comment.content}</p>
                </div>
              ))}
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              No replies yet. Be the first to reply!
            </div>
          )}

          {/* Reply input */}
          <div className="reply-section">
            <TextArea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              className="reply-input"
            />
            <Button 
              type="primary" 
              icon={<SendOutlined />}
              onClick={handleReplySubmit}
              className="reply-btn"
            >
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PostDetailPage;
