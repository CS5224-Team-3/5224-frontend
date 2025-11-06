import React, { useEffect, useState } from 'react';
import { Card, Avatar, Button, Input, Space, Tag, Spin, message } from 'antd';
import { UserOutlined, HeartOutlined, HeartFilled, SendOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getUrl } from 'aws-amplify/storage';

import { client } from './services/amplifyClient';

import {
  getPost as gqlGetPost,
  listComments as gqlListComments,
} from './graphql/queries';
import { createComment as gqlCreateComment } from './graphql/mutations';

import './PostDetailPage.css';

const { TextArea } = Input;
const FALLBACK_IMAGE = 'https://imgs.699pic.com/images/501/343/865.jpg!list1x.v2';

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
      // 1) 帖子详情（访客可读）
      const postRes = await client.graphql({
        query: gqlGetPost,
        variables: { id },
        authMode: 'apiKey',
      });
      const p = postRes?.data?.getPost;
      console.log('[PostDetail] getPost payload:', p);

      if (!p) {
        message.warning('Post not found');
        setPostData(null);
        setComments([]);
        return;
      }

      // 兼容 description | content
      const desc = p.description ?? p.content ?? '';

      // 🖼️ 统一取图：优先 S3 key → getUrl(accessLevel:'public')；再兜底 url 字段
      let img = null;
      const key =
        p.pet_image_key ??
        p.petImageKey ??
        p.imageKey ??
        null;

      console.log('[PostDetail] key:', key, 'fallback url fields:', p.pet_image || p.petImage || p.image);

      if (key) {
        try {
          const { url } = await getUrl({
            key,
            options: {
              accessLevel: 'public',    // 若是 protected/private，请改这里
              // expiresIn: 7 * 24 * 3600
            },
          });
          img = url?.toString() || null;
          console.log('[PostDetail] getUrl success:', img);
        } catch (e) {
          console.warn('[PostDetail] getUrl failed:', e);
        }
      }
      if (!img) {
        img = p.pet_image ?? p.petImage ?? p.image ?? null; // 兜底（如果你把临时URL存库了，这里也能用）
      }

      setPostData({
        id: p.id,
        author: p.owner ?? 'Anonymous',
        timeAgo: formatTimeAgo(p.createdAt),
        petType: p.pet_type ?? p.petType ?? '',
        location: p.city ?? '',
        title: p.title ?? 'Untitled',
        description: desc,
        image: img || FALLBACK_IMAGE,
        tags: Array.isArray(p.keywords) ? p.keywords : [],
      });

      // 2) 评论（访客可读）
      const cmtRes = await client.graphql({
        query: gqlListComments,
        variables: { filter: { postId: { eq: id } }, limit: 100 },
        authMode: 'apiKey',
      });
      const cmts = (cmtRes?.data?.listComments?.items ?? [])
        .sort((a, b) => new Date(a?.createdAt || 0) - new Date(b?.createdAt || 0));

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
    const text = replyText.trim();
    if (!text) {
      message.warning('Please write something');
      return;
    }

    try {
      await client.graphql({
        query: gqlCreateComment,
        variables: { input: { postId: id, content: text } },
        authMode: 'userPool',
      });

      message.success('Comment sent');
      setReplyText('');
    } catch (err) {
      console.error('[createComment error]', JSON.stringify(err, null, 2));

      const errMsg =
        (err?.errors && err.errors[0]?.message) ||
        err?.message ||
        'Failed to send comment';

      if (/not.*authorized|unauthoriz|missing.*auth/i.test(errMsg)) {
        message.error('Please sign in to reply');
        navigate('/login', { state: { from: `/detail/${id}` } });
        return;
      }

      message.error(errMsg);
    } finally {
      // 无论成功或失败，都延迟 1s 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 100);
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
