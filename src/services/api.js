// src/services/api.js
// ===== Amplify v6: GraphQL & Storage =====
import { client } from './amplifyClient';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { getPost as gqlGetPost, listPosts as gqlListPosts } from '../graphql/queries.js';
import { createPost as gqlCreatePost, updatePost as gqlUpdatePost } from '../graphql/mutations.js';
import { getCurrentUser } from 'aws-amplify/auth';

// 使用相对路径，Vite 会自动代理到 proxy 配置的地址（保留，供其他 REST 场景用）
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const getToken = () => localStorage.getItem('token');

// ============== 通用 REST 请求工具（保留以兼容旧代码） ==============
const request = async (url, options = {}) => {
  const token = getToken();
  let { body, headers: inputHeaders, method, skipAuth, ...rest } = options;
  method = (method || 'GET').toUpperCase();
  const headers = { ...(inputHeaders || {}) };

  if (token && !skipAuth) headers['Authorization'] = `Bearer ${token}`;

  if (body === undefined || body === null) {
    body = undefined;
    if (headers['Content-Type']) delete headers['Content-Type'];
  } else if (body instanceof FormData) {
    if (headers['Content-Type']) delete headers['Content-Type'];
  } else if (typeof body === 'string') {
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
  } else {
    body = JSON.stringify(body);
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  const fullUrl = `${BASE_URL}${url}`;
  try {
    const response = await fetch(fullUrl, { method, headers, body, ...rest });
    if (response.status === 204) return null;
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('Invalid response format');
    }
    if (!response.ok) throw new Error(data?.message || `Request failed: ${response.status} ${response.statusText}`);
    return data;
  } catch (error) {
    console.error('❌ API Error:', { url: fullUrl, error: error.message });
    throw error;
  }
};

// ==================== 用户认证相关（保留以兼容旧代码） ====================
export const register = async (username, password) =>
  request('/api/register', { method: 'POST', body: JSON.stringify({ username, password }), skipAuth: true });

export const login = async (username, password) => {
  const response = await request('/api/login', { method: 'POST', body: JSON.stringify({ username, password }), skipAuth: true });
  if (response?.data?.token) {
    localStorage.setItem('token', response.data.token);
    if (response.data.userid) localStorage.setItem('userId', response.data.userid);
    if (response.data.username) localStorage.setItem('username', response.data.username);
  }
  return response;
};

export const getUserProfile = async () => request('/api/user/profile', { method: 'GET' });

export const updateUserProfile = async (modified) =>
  request('/api/user/profile', { method: 'PUT', body: JSON.stringify({ modified }) });

export const changePassword = async (newPassword) =>
  request('/api/change/password', { method: 'PUT', body: JSON.stringify({ password: newPassword }) });

// ==================== 文件上传（Amplify Storage） ====================
const buildPublicKey = (file) => {
  const safe = (file?.name || 'image').replace(/\s+/g, '-').toLowerCase();
  return `posts/${crypto.randomUUID()}-${safe}`;
  // return `public/posts/${crypto.randomUUID()}-${safe}`;
};

export const uploadImage = async (file, onProgress, urlExpiresSeconds = 7 * 24 * 3600) => {
  try {
    if (!file) throw new Error('No file');
    const key = buildPublicKey(file);
    await uploadData({
      key,
      data: file,
      options: {
        accessLevel: 'public', 
        contentType: file.type || 'application/octet-stream',
        onProgress: (p) => {
          if (onProgress && p?.totalBytes) onProgress(Math.round((p.transferredBytes / p.totalBytes) * 100));
        }
      }
    }).result;
    // const { url } = await getUrl({ key, options: { expiresIn: urlExpiresSeconds } });
    const { url } = await getUrl({
      key,
      options: { accessLevel: 'public', expiresIn: urlExpiresSeconds }
    });
    console.log('[uploadImage] uploaded key:', key, 'url:', url?.toString());
    return { data: { key, url }, key, url };
  } catch (e) {
    console.warn('[uploadImage] storage not configured or failed, skip.', e);
    return { data: { key: null, url: null }, key: null, url: null };
  }
};

// ==================== 帖子（Amplify GraphQL 直连） ====================

// 创建帖子（与 schema 完全一致）
export const createPost = async (postData) => {
  // content 是必填；若调用方没传，兜底拼一个
  const content =
    postData?.content ??
    `[${postData?.pet_type || ''}/${postData?.city || ''}] ${postData?.description || ''}`.trim();

  const full = {
    title: postData.title,
    content,
    description: postData.description ?? null,
    pet_type: postData.pet_type ?? null,
    city: postData.city ?? null,
    startDate: postData.startDate ?? null,
    endDate: postData.endDate ?? null,
    keywords: Array.isArray(postData.keywords) ? postData.keywords : (postData.keywords || []),
    pet_image: postData.pet_image ?? null,          // 展示 URL（可选）
    pet_image_key: postData.pet_image_key ?? null,  // S3 key（关键）
    createdAt: postData.createdAt ?? new Date().toISOString(), // ✅ 注意拼写
  };

  console.log('[createPost] input payload:', full);

  try {
    const res = await client.graphql({
      query: gqlCreatePost,
      variables: { input: full },
      authMode: 'userPool',
    });
    console.log('[createPost] success:', res?.data?.createPost);
    return { data: res.data.createPost };
  } catch (err) {
    console.error('[createPost] failed', JSON.stringify(err, null, 2));
    throw err;
  }
};

// 获取帖子详情（Public 读取）
export const getPostDetail = async (postId) => {
  const res = await client.graphql({
    query: gqlGetPost,
    variables: { id: postId },
    authMode: 'apiKey',
  });
  return { data: res.data.getPost };
};

// 更新帖子（需登录）
export const updatePost = async (postId, modified) => {
  const patch = Object.assign({}, ...modified); // [{title},{description}] -> {title,description}
  const input = { id: postId, ...patch };
  const res = await client.graphql({
    query: gqlUpdatePost,
    variables: { input },
    authMode: 'userPool',
  });
  return { data: res.data.updatePost };
};

// // 删除帖子（如果你还有自建 REST，保留；否则可删除）
// export const deletePost = async (postId) =>
//   request(`/api/posts/${postId}`, { method: 'DELETE' });

import { deletePost as gqlDeletePost } from '../graphql/mutations';

export const deletePost = async (postId) => {
  if (!postId) throw new Error('Missing postId');
  const res = await client.graphql({
    query: gqlDeletePost,
    variables: { input: { id: postId } },
    authMode: 'userPool',
  });
  return { data: res.data.deletePost };
};

// GraphQL 列表：从 Amplify 直接读（公共读取）
export const getPostsList = async ({ limit = 50, nextToken = null } = {}) => {
  const resp = await client.graphql({
    query: gqlListPosts,
    variables: { limit, nextToken },
    authMode: 'apiKey',
  });
  const list = resp?.data?.listPosts;
  return {
    data: list?.items ?? [],
    nextToken: list?.nextToken ?? null,
  };
};

// 轮播：优先选有图片的帖子，按 createdAt/updatedAt 客户端排序截取
export const getCarouselPosts = async (limit = 4) => {
  const { data: items = [] } = await getPostsList({ limit: 100 });
  const safeDate = (x) => new Date(x || 0).getTime() || 0;
  const sorted = [...items].sort((a, b) => {
    const ta = Math.max(safeDate(a.updatedAt), safeDate(a.createAt), safeDate(a.createdAt));
    const tb = Math.max(safeDate(b.updatedAt), safeDate(b.createAt), safeDate(b.createdAt));
    return tb - ta;
  });

  const withImg = sorted.filter(p => !!(p.pet_image || p.image));
  const withoutImg = sorted.filter(p => !(p.pet_image || p.image));
  const picked = [...withImg, ...withoutImg].slice(0, limit);

  const normalized = picked.map(p => ({
    postId: p.id || p.postId || p._id,
    title: p.title || 'Untitled',
    description: p.description || p.content || '',
    pet_image: p.pet_image || p.image || null,
  }));

  return { data: normalized };
};

// 搜索（REST 的保留；如果要 GraphQL 也可改写）
export const searchPosts = async (query, city, petType) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (city) params.append('city', city);
  if (petType) params.append('petType', petType);
  return request(`/api/posts/search?${params.toString()}`, { method: 'GET' });
};

// GraphQL 标题包含搜索（公共读取）
export const searchPostsByTitle = async ({ query = '', limit = 10, nextToken } = {}) => {
  const variables = { limit, nextToken };
  const trimmed = (query || '').trim();
  if (trimmed) variables.filter = { title: { contains: trimmed } };
  const resp = await client.graphql({
    query: gqlListPosts,
    variables,
    authMode: 'apiKey',
  });
  const list = resp?.data?.listPosts;
  return {
    data: list?.items ?? [],
    nextToken: list?.nextToken ?? null,
  };
};

// 当前登录用户的帖子（依然用 userPool）
export const getUserPosts = async ({ limit = 20, nextToken } = {}) => {
  let sub = null;
  let username = null;
  try {
    const u = await getCurrentUser();
    sub = u?.userId || null;
    username = u?.username || null;
  } catch {}

  const variables = { limit, nextToken };
  if (sub) variables.filter = { owner: { contains: sub } };
  else if (username) variables.filter = { owner: { eq: username } };

  const resp = await client.graphql({
    query: gqlListPosts,
    variables,
    authMode: 'userPool',
  });

  const list = resp?.data?.listPosts;
  const items = list?.items ?? [];
  const token = list?.nextToken ?? null;

  if (items.length === 0 && !variables.filter?.owner?.eq && username) {
    try {
      const retry = await client.graphql({
        query: gqlListPosts,
        variables: { limit, nextToken, filter: { owner: { eq: username } } },
        authMode: 'userPool',
      });
      const retryList = retry?.data?.listPosts;
      const retryItems = retryList?.items ?? [];
      const retryToken = retryList?.nextToken ?? null;
      if (retryItems.length > 0) return { data: retryItems, nextToken: retryToken };
    } catch {}
  }
  return { data: items, nextToken: token };
};

// 收藏/取消收藏/收藏列表/回复（保留 REST，若无后端可删除）
export const favoritePost = async (postId) =>
  request(`/api/posts/${postId}/favorite`, { method: 'POST' });

export const unfavoritePost = async (postId) =>
  request(`/api/posts/${postId}/favorite`, { method: 'DELETE' });

export const getUserFavorites = async () =>
  request('/api/user/favorites', { method: 'GET' });

export const addReply = async (postId, replyContent, replyTime) => {
  const params = new URLSearchParams();
  if (replyTime) params.append('reply_time', replyTime);
  if (replyContent) params.append('reply_content', replyContent);
  return request(`/api/addreply?${params.toString()}`, { method: 'POST' });
};

// 解析本地 token 获取用户信息（保留）
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return {
      userId: decoded.userId || localStorage.getItem('userId'),
      username: decoded.username || localStorage.getItem('username'),
    };
  } catch (error) {
    console.warn('Failed to decode token, using localStorage fallback');
    return {
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
    };
  }
};

export default {
  register,
  login,
  getUserProfile,
  updateUserProfile,
  changePassword,
  uploadImage,
  createPost,
  getPostDetail,
  updatePost,
  deletePost,
  getPostsList,
  getCarouselPosts,
  searchPosts,
  getUserPosts,
  favoritePost,
  unfavoritePost,
  getUserFavorites,
  addReply,
  searchPostsByTitle,
  getUserInfo,
};
