import React, { useEffect, useState } from 'react';
import { Card, Avatar, Button, Input, Space, Tag, Spin, message } from 'antd';
import { UserOutlined, HeartOutlined, HeartFilled, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';

import { client } from './services/amplifyClient';

import {
  getPost as gqlGetPost,
  listComments as gqlListComments,  
} from './graphql/queries';
import { createComment as gqlCreateComment } from './graphql/mutations';

import './PostDetailPage.css';

const { TextArea } = Input;

function formatTimeAgo(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  return 'Just now';
}

export default function PostDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [postData, setPostData] = useState(null);
  const [comments, setComments] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      // 1) 帖子详情
      if (!gqlGetPost) {
        throw new Error('queries.getPost 未导出，请检查 ./graphql/queries 中是否存在 getPost');
      }
      const postRes = await client.graphql({
        query: gqlGetPost,
        variables: { id },
        authMode: 'apiKey',
      });
      const p = postRes?.data?.getPost;
      if (!p) {
        message.warning('Post not found');
        setPostData(null);
        setComments([]);
        return;
      }

      // 兼容你的字段：description | content，petImage | pet_image
      const desc = p.description ?? p.content ?? '';
      const img = p.petImage ?? p.pet_image ?? null;

      setPostData({
        id: p.id,
        author: p.owner ?? 'Anonymous',
        timeAgo: formatTimeAgo(p.createdAt),
        petType: p.pet_type ?? p.petType ?? '',
        location: p.city ?? '',
        title: p.title ?? 'Untitled',
        description: desc,
        image:
          img ||
          'https://imgs.699pic.com/images/501/343/865.jpg!list1x.v2', // 占位图
        tags: Array.isArray(p.keywords) ? p.keywords : [],
      });

      // 2) 评论：优先 commentsByPost(postId, sortDirection)，否则回退 listComments(filter: { postId: { eq: id } })
      let cmts = [];

      const cmtRes = await client.graphql({
        query: gqlListComments,
        variables: { filter: { postId: { eq: id } }, limit: 100 },
        authMode: 'apiKey',
      });
      cmts = cmtRes?.data?.listComments?.items ?? [];
      // 尝试按 createdAt 升序
      cmts.sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));


      setComments(
        cmts.map((r) => ({
          id: r.id,
          author: r.owner ?? 'Anonymous',
          timeAgo: formatTimeAgo(r.createdAt),
          content: r.content ?? '',
        }))
      );
    } catch (err) {
      console.error('Failed to load post/comments:', err);
      message.error(err.message || 'Failed to load post');
      setPostData(null);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleLike = () => setIsLiked((v) => !v);

  const handleReplySubmit = async () => {
    if (!replyText.trim()) {
      message.warning('Please write something');
      return;
    }
    try {
      if (!gqlCreateComment) {
        throw new Error('mutations.createComment 未导出，请检查 ./graphql/mutations 中是否存在 createComment');
      }
      const res = await client.graphql({
        query: gqlCreateComment,
        variables: { input: { postId: id, content: replyText.trim() } },
        authMode: 'userPool',
      });
      const c = res?.data?.createComment;
      if (c) {
        setComments((prev) => [
          ...prev,
          {
            id: c.id,
            author: c.owner ?? 'Me',
            timeAgo: formatTimeAgo(c.createdAt),
            content: c.content ?? '',
          },
        ]);
        setReplyText('');
        message.success('Comment sent');
      }
    } catch (err) {
      console.error('Failed to send comment:', err);
      message.error(err.message || 'Failed to send comment');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
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
      <div className="detail-content" style={{ backgroundColor: '#ffffff' }}>
        {/* Post detail card */}
        <Card className="post-detail-card" styles={{ body: { paddingTop: 0 } }}>
          {/* Post header */}
          <div className="post-header">
            <Avatar size={32} icon={<UserOutlined />} />
            <div className="post-meta">
              <strong>{postData.author}</strong>
              {postData.timeAgo ? ` · ${postData.timeAgo}` : ''}
              {postData.petType ? ` · ${postData.petType}` : ''}
              {postData.location ? ` · ${postData.location}` : ''}
            </div>
          </div>

          {/* Title */}
          <h2 className="post-title">{postData.title}</h2>

          {/* Description */}
          <p className="post-description">{postData.description}</p>

          {/* Image */}
          {postData.image ? (
            <div className="post-image-container">
              <img src={postData.image} alt="pet" className="post-image" />
            </div>
          ) : null}

          {/* Tags */}
          {postData.tags?.length ? (
            <div className="post-tags">
              {postData.tags.map((tag, index) => (
                <Tag key={index} color="blue" className="post-tag">
                  #{tag}
                </Tag>
              ))}
            </div>
          ) : null}

          {/* Like button（演示用） */}
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
        <Card className="comments-card" styles={{ body: { paddingTop: 0 } }}>
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
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
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
            <Button type="primary" icon={<SendOutlined />} onClick={handleReplySubmit} className="reply-btn">
              Send
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
