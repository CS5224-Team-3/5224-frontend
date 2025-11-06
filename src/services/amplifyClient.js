// src/services/amplifyClient.js
import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports';

// Amplify 初始化（只需调用一次）
if (!Amplify._isConfigured) {
  Amplify.configure(awsExports);
  Amplify._isConfigured = true; // 防止重复初始化
}

// GraphQL v6 客户端
import { generateClient } from 'aws-amplify/api';
export const client = generateClient();

// 如果其他文件需要直接使用 Amplify（例如 Auth、Storage）
export { Amplify };
