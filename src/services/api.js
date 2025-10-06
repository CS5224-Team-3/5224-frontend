// API 基础配置
// 使用相对路径，Vite 会自动代理到 proxy 配置的地址
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// 获取 token
const getToken = () => {
  return localStorage.getItem('token');
};

// 获取用户信息
export const getUserInfo = () => {
  const token = getToken();
  if (!token) return null;
  
  try {
    // 解码 JWT payload (base64)
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

// 通用请求函数
const request = async (url, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 只有在有 token 且不是登录/注册接口时才添加 Authorization
  if (token && !options.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${BASE_URL}${url}`;
  console.log('🔵 API Request:', {
    url: fullUrl,
    method: options.method || 'GET',
    headers,
    body: options.body
  });

  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    console.log('🟢 API Response:', {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // 尝试解析 JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('❌ Failed to parse JSON response:', e);
      throw new Error('Invalid response format');
    }

    console.log('📦 Response Data:', data);

    if (!response.ok) {
      throw new Error(data.message || `Request failed: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('❌ API Error:', {
      url: fullUrl,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// ==================== 用户认证相关 ====================

// 注册
export const register = async (username, password) => {
  return request('/api/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuth: true, // 注册不需要 token
  });
};

// 登录
export const login = async (username, password) => {
  const response = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
    skipAuth: true, // 登录不需要 token
  });
  
  // 保存 token 和用户信息
  if (response.data?.token) {
    localStorage.setItem('token', response.data.token);
    // 同时保存到 localStorage 作为备用（避免每次解码 JWT）
    if (response.data.userid) {
      localStorage.setItem('userId', response.data.userid);
    }
    if (response.data.username) {
      localStorage.setItem('username', response.data.username);
    }
  }
  
  return response;
};

// 获取用户资料
export const getUserProfile = async () => {
  return request('/api/user/profile', {
    method: 'GET',
  });
};

// 更新用户资料
export const updateUserProfile = async (modified) => {
  return request('/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ modified }),
  });
};

// 修改密码
export const changePassword = async (newPassword) => {
  return request('/api/change/password', {
    method: 'PUT',
    body: JSON.stringify({ password: newPassword }),
  });
};

// ==================== 帖子相关 ====================

// 上传图片
export const uploadImage = async (file) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('image', file);

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fullUrl = `${BASE_URL}/api/upload/image`;
  console.log('🔵 Image Upload Request:', {
    url: fullUrl,
    method: 'POST',
    headers,
    file: file.name
  });

  try {
    const response = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    console.log('🟢 Image Upload Response:', {
      url: fullUrl,
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('❌ Failed to parse JSON response:', e);
      throw new Error('Invalid response format');
    }

    console.log('📦 Upload Response Data:', data);

    if (!response.ok) {
      throw new Error(data.message || `Upload failed: ${response.status} ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('❌ Image Upload Error:', {
      url: fullUrl,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// 创建帖子
export const createPost = async (postData) => {
  return request('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

// 获取帖子详情
export const getPostDetail = async (postId) => {
  return request(`/api/posts/${postId}`, {
    method: 'GET',
  });
};

// 更新帖子
export const updatePost = async (postId, modified) => {
  return request(`/api/posts/${postId}`, {
    method: 'PUT',
    body: JSON.stringify({ modified }),
  });
};

// 删除帖子
export const deletePost = async (postId) => {
  return request(`/api/posts/${postId}`, {
    method: 'DELETE',
  });
};

// 获取帖子列表
export const getPostsList = async () => {
  return request('/api/posts', {
    method: 'GET',
  });
};

// 获取轮播图帖子
export const getCarouselPosts = async (limit = 4) => {
  return request(`/api/posts/carousel?limit=${limit}`, {
    method: 'GET',
  });
};

// 搜索帖子
export const searchPosts = async (query, city, petType) => {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (city) params.append('city', city);
  if (petType) params.append('petType', petType);
  
  return request(`/api/posts/search?${params.toString()}`, {
    method: 'GET',
  });
};

// 获取用户的帖子
export const getUserPosts = async () => {
  return request(`/api/user/posts`, {
    method: 'GET',
  });
};

// ==================== 收藏相关 ====================

// 收藏帖子
export const favoritePost = async (postId) => {
  return request(`/api/posts/${postId}/favorite`, {
    method: 'POST',
  });
};

// 取消收藏
export const unfavoritePost = async (postId) => {
  return request(`/api/posts/${postId}/favorite`, {
    method: 'DELETE',
  });
};

// 获取用户收藏列表
export const getUserFavorites = async () => {
  return request('/api/user/favorites', {
    method: 'GET',
  });
};

// 添加回复
export const addReply = async (postId, replyContent, replyTime) => {
  const params = new URLSearchParams();
  if (replyTime) params.append('reply_time', replyTime);
  if (replyContent) params.append('reply_content', replyContent);
  
  return request(`/api/addreply?${params.toString()}`, {
    method: 'POST',
  });
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
  getUserInfo, // 导出用户信息获取函数
};

