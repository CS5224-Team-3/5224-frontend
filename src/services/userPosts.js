// src/services/userPosts.js

// ✅ Amplify v6+：GraphQL 用 generateClient；Auth 用函数式 API。
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { listPosts as gqlListPosts } from '../graphql/queries';

// 生成 GraphQL 客户端（确保入口已 Amplify.configure(...)）
const client = generateClient();

/**
 * 仅使用 Amplify GraphQL 获取“当前登录用户的帖子”
 * - 通过 owner 过滤保障只拿该用户在数据库中的帖子
 * - 分页使用 nextToken
 */
export async function listMyPostsAmplify({ limit = 10, nextToken } = {}) {
  // v6：用 getCurrentUser() 获取当前用户
  const { username, userId } = await getCurrentUser();
  const owner = username || userId;

  const resp = await client.graphql({
    query: gqlListPosts,
    variables: {
      filter: { owner: { eq: owner } },
      limit,
      nextToken,
    },
    // 如需指定授权模式可加：authMode: 'userPool',
  });

  const list = resp?.data?.listPosts;
  const items = list?.items ?? [];
  return {
    items,
    nextToken: list?.nextToken ?? null,
  };
}

/**
 * 将 nextToken 分页封装成“页码式”的体验
 */
export function createMyPostsPager({ pageSize = 10 } = {}) {
  const tokenMap = new Map();          // page -> nextTokenBeforeThisPage
  tokenMap.set(1, undefined);          // 第 1 页之前没有 token

  async function fetchPage(page = 1) {
    if (page < 1) page = 1;

    let beforeToken = tokenMap.get(page);

    // 若跳页且没有该页的 token，从头滚动到目标页
    if (beforeToken === undefined && page !== 1) {
      tokenMap.clear();
      tokenMap.set(1, undefined);
      beforeToken = undefined;
      let curPage = 1;
      while (curPage < page) {
        const { nextToken } = await listMyPostsAmplify({ limit: pageSize, nextToken: beforeToken });
        if (!nextToken) break;
        tokenMap.set(curPage + 1, nextToken);
        beforeToken = nextToken;
        curPage += 1;
      }
    }

    const { items, nextToken } = await listMyPostsAmplify({ limit: pageSize, nextToken: beforeToken });

    tokenMap.set(page + 1, nextToken || null);

    return {
      data: items,
      page,
      pageSize,
      hasNext: !!nextToken,
      nextTokenMap: tokenMap,
    };
  }

  return { fetchPage, nextTokenMap: tokenMap, pageSize };
}
