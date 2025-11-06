import { useEffect, useState } from 'react'
import { Card, List, Typography, Button, Space, Form, Input, message } from 'antd'
import { Link } from 'react-router-dom'
import { createPost, listPosts } from '@/services/amplifyClient'

const { Title, Paragraph } = Typography

export default function PostsPage() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [posts, setPosts] = useState([])
  const [nextToken, setNextToken] = useState(undefined)

  async function load(initial = false) {
    setLoadingList(true)
    try {
      const res = await listPosts({ nextToken: initial ? undefined : nextToken })
      if (initial) {
        setPosts(res.items ?? [])
      } else {
        setPosts((p) => [...p, ...(res.items ?? [])])
      }
      setNextToken(res.nextToken)
    } catch (e) {
      console.error(e)
      message.error('加载帖子失败')
    } finally {
      setLoadingList(false)
    }
  }

  useEffect(() => {
    load(true)
  }, [])

  async function onFinish(values) {
    setLoading(true)
    try {
      const created = await createPost(values)
      message.success('发布成功')
      // 新帖子插到最上
      setPosts((p) => [created, ...p])
      form.resetFields()
    } catch (e) {
      console.error(e)
      message.error('发布失败（需要登录或后端未就绪）')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="发布新帖">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="帖子标题" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <Input.TextArea rows={4} placeholder="说点什么..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              发布
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="帖子列表" extra={
        <Button onClick={() => load(true)} loading={loadingList}>刷新</Button>
      }>
        <List
          loading={loadingList && posts.length === 0}
          dataSource={posts}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<Link to={`/posts/${item.id}`}>{item.title}</Link>}
                description={<Paragraph ellipsis={{ rows: 2 }}>{item.content}</Paragraph>}
              />
            </List.Item>
          )}
        />
        {nextToken && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button onClick={() => load(false)} loading={loadingList}>
              加载更多
            </Button>
          </div>
        )}
      </Card>
    </Space>
  )
}
