// src/ProfilePage.jsx
import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Button, Space, Empty, message, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getUserPosts, deletePost } from './services/api';
import { client } from './services/amplifyClient';
import { listPosts as gqlListPosts } from './graphql/queries';

const { Paragraph, Text } = Typography;

export default function ProfilePage() {
  const navigate = useNavigate();
  const { modal, message: msgApi } = App.useApp(); // ✅ 新写法
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
        console.warn('[Profile] getUserPosts failed, fallback to listPosts', e);
      }

      if (!list || list.length === 0) {
        try {
          const resp = await client.graphql({
            query: gqlListPosts,
            variables: { limit: ps },
            authMode: 'userPool',
          });
          const fallbackItems = resp?.data?.listPosts?.items ?? [];
          list = normalize(fallbackItems);
          totalCount = list.length;
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
      msgApi.error('加载我的帖子失败');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 删除逻辑（使用 App 上下文 modal）
  const handleDelete = (id) => {
    console.log('[Profile] click delete for id=', id);
    modal.confirm({
      title: '确认删除？',
      content: '删除后不可恢复，确定要删除此帖子吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        try {
          await deletePost(id);
          msgApi.success('已删除');
          load(1, pageSize);
        } catch (err) {
          console.error('[delete] failed', err);
          msgApi.error('删除失败，请稍后再试');
        }
      },
    });
  };

  useEffect(() => {
    load(1, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <Card
        title="我发布的帖子"
        styles={{ body: { paddingTop: 0 } }}
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
                <Button
                  key="delete"
                  type="link"
                  danger
                  onClick={() => handleDelete(item.id)}
                >
                  删除
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={<Text strong style={{ fontSize: 16 }}>{item.title}</Text>}
                description={
                  <Text type="secondary">
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                  </Text>
                }
              />
              {item.description ? (
                <Paragraph ellipsis={{ rows: 2 }}>{item.description}</Paragraph>
              ) : null}
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
