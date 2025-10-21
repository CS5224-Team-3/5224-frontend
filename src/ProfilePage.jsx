// src/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Button, Space, Empty, message } from 'antd';
import { useNavigate } from 'react-router-dom';

// 你已有的 API（先尝试它）
import { getUserPosts } from './services/api';

// 兜底：直接用 Amplify GraphQL 拉列表（不改 api.js 也能拉到）
import { client } from './services/amplifyClient';
import { listPosts as gqlListPosts } from './graphql/queries';

const { Title, Paragraph, Text } = Typography;

export default function ProfilePage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const normalize = (arr) =>
    (arr || []).map((item) => ({
      id: item?.id,
      title: item?.title ?? '未命名帖子',
      description: item?.description ?? item?.content ?? '',
      createdAt: item?.createdAt ?? item?.created_at ?? item?.createAt ?? null,
    }));

  const load = async (p = page, ps = pageSize) => {
    setLoading(true);
    try {
      // 1) 先走你现有的 getUserPosts（可能是 GraphQL 或 REST）
      let list = [];
      let totalCount = 0;

      try {
        const res = await getUserPosts({ page: p, pageSize: ps, limit: ps });
        const data = Array.isArray(res) ? res : res?.data;
        list = normalize(data);
        totalCount =
          typeof res?.total === 'number'
            ? res.total
            : Array.isArray(data)
            ? data.length
            : list.length;
      } catch (e) {
        // 忽略，下面做兜底
        console.warn('[Profile] getUserPosts failed, will fallback:', e);
      }

      // 2) 如果还是空，做一次**无过滤**的 GraphQL 兜底（从同一张表把数据拉回来）
      if (!list || list.length === 0) {
        try {
          const resp = await client.graphql({
            query: gqlListPosts,
            variables: { limit: ps },
            authMode: 'userPool', // 与 createPost 保持一致
          });
          const fallbackItems = resp?.data?.listPosts?.items ?? [];
          list = normalize(fallbackItems);
          totalCount = list.length; // Amplify 不提供总数，这里先用当前长度
          console.warn('[Profile] fallback: listPosts without filter. count=', totalCount);
        } catch (e2) {
          console.error('[Profile] fallback listPosts failed:', e2);
        }
      }

      setItems(list);
      setTotal(totalCount);
      setPage(p);
      setPageSize(ps);
    } catch (e) {
      console.error(e);
      message.error('加载我的帖子失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="我发布的帖子"
        styles={{ body: { paddingTop: 0 } }} // 修复 antd bodyStyle 警告
        extra={
          <Space>
            <Button type="link" onClick={() => load(1, pageSize)} loading={loading}>
              刷新
            </Button>
          </Space>
        }
      >
        <List
          loading={loading}
          itemLayout="vertical"
          dataSource={items}
          locale={{ emptyText: <Empty description="暂无发布的帖子" /> }}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p, ps) => load(p, ps),
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
          }}
          renderItem={(item) => (
            <List.Item
              key={item.id}
              actions={[
                <Button key="view" type="link" onClick={() => navigate(`/detail/${item.id}`)}>
                  查看
                </Button>,
                <Button key="edit" type="link" onClick={() => navigate(`/edit/${item.id}`)}>
                  编辑
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={<Text strong style={{ fontSize: 16, margin: 0 }}>{item.title}</Text>}
                description={
                  <Text type="secondary">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </Text>
                }
              />
              {item.description ? <Paragraph ellipsis={{ rows: 2 }}>{item.description}</Paragraph> : null}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
