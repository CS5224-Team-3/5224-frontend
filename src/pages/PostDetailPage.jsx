import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, List, Typography, Form, Input, Button, Space, message } from 'antd'
import { getPost, listComments, createComment, subscribeNewComments } from '@/services/amplifyClient'

const { Title, Paragraph, Text } = Typography

export default function PostDetailPage() {
  const { id } = useParams()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [nextToken, setNextToken] = useState(undefined)
  const [loadingPost, setLoadingPost] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    async function load() {
      setLoadingPost(true)
      try {
        const p = await getPost(id)
        setPost(p)
      } catch (e) {
        console.error(e)
        message.error('加载帖子失败')
      } finally {
        setLoadingPost(false)
      }
    }
    load()
  }, [id])

  async function loadComments(initial = false) {
    setLoadingComments(true)
    try {
      const res = await listComments(id, { nextToken: initial ? undefined : nextToken })
      if (initial) {
        setComments(res.items ?? [])
      } else {
        setComments((c) => [...c, ...(res.items ?? [])])
      }
      setNextToken(res.nextToken)
    } catch (e) {
      console.error(e)
      message.error('加载评论失败')
    } finally {
      setLoadingComments(false)
    }
  }

  useEffect(() => {
    loadComments(true)
    const off = subscribeNewComments((c) => {
      // 只接收当前帖子的评论
      if (c.postId === id) {
        setComments((prev) => [c, ...prev])
      }
    })
    return off
  }, [id])

  async function onFinish(values) {
    try {
      const created = await createComment({ postId: id, content: values.content })
      // 乐观更新（订阅也会推送一次）
      setComments((prev) => [created, ...prev])
      form.resetFields()
      message.success('评论成功')
    } catch (e) {
      console.error(e)
      message.error('评论失败（需要登录或后端未就绪）')
    }
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card loading={loadingPost}>
        {post && (
          <>
            <Title level={3} style={{ marginBottom: 8 }}>{post.title}</Title>
            <Paragraph>{post.content}</Paragraph>
            <Text type="secondary">ID: {post.id}</Text>
          </>
        )}
      </Card>

      <Card title="发表评论">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入评论内容' }]}>
            <Input.TextArea rows={3} placeholder="写下你的评论…" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">发布评论</Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="评论列表" extra={<Button onClick={() => loadComments(true)} loading={loadingComments}>刷新</Button>}>
        <List
          loading={loadingComments && comments.length === 0}
          dataSource={comments}
          renderItem={(c) => (
            <List.Item>
              <List.Item.Meta
                title={c.owner ? `@${c.owner}` : '匿名'}
                description={c.content}
              />
            </List.Item>
          )}
        />
        {nextToken && (
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <Button onClick={() => loadComments(false)} loading={loadingComments}>加载更多</Button>
          </div>
        )}
      </Card>
    </Space>
  )
}
