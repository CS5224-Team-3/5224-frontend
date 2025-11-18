// src/PostCreate.jsx  （或 src/pages/PostCreate.jsx）
import React, { useState } from 'react';
import { Form, Input, Button, Upload, DatePicker, Select, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// ✅ 你的 API：上传 + 创建
import { uploadImage, createPost } from './services/api'; // 若在 pages/ 下，请改为 ../services/api
// ✅ 会话校验，避免 create 后被重定向到 /login
import { getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';

const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function PostCreate() {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp?.() || { message: { success: console.log, error: console.error, warning: console.warn, loading: console.log } };

  // 表单提交失败：给出可见错误
  const onFinishFailed = ({ errorFields }) => {
    console.log('[PostCreate] onFinishFailed', errorFields);
    const first = errorFields?.[0]?.errors?.[0] || 'Please complete required fields';
    message.error(first);
  };

  // 提交成功：上传图片 → 写库 → 跳详情
  const onFinish = async (values) => {
    console.log('[PostCreate] onFinish values =', values);
    setLoading(true);
    try {
      // 1) 会话校验：确认已登录且 token 可用（与 createPost 的 userPool 一致）
      try {
        const u = await getCurrentUser();
        const s = await fetchAuthSession();
        console.log('[auth] user =', u?.username, 'idToken?', !!s?.tokens?.idToken);
      } catch {
        message.error('Session expired. Please sign in again.');
        navigate('/login');
        return;
      }

      // 2) 取 Upload 的文件
      const fileObj = values?.pet_image?.[0]?.originFileObj;
      let imageUrl = null;
      let imageKey = null;

      if (fileObj) {
        message.loading({ content: 'Uploading image...', key: 'up', duration: 0 });
        try {
          const up = await Promise.race([
            uploadImage(fileObj), // 返回 { data: { key, url }, key, url }
            new Promise((_, rej) => setTimeout(() => rej(new Error('Upload timeout (15s)')), 15000)),
          ]);
          console.log('[uploadImage] result:', up);
          imageUrl = up?.data?.url || up?.url || null; // 给前端展示的临时 URL（可选）
          imageKey = up?.data?.key || up?.key || null; // S3 key（详情页 getUrl 用它）
          message.success({ content: 'Image uploaded', key: 'up', duration: 1.2 });
        } catch (e) {
          console.warn('[uploadImage] failed, continue without image', e);
          message.warning({ content: `Upload failed: ${e.message}. Will continue without image.`, key: 'up' });
        }
      }

      // 3) 处理日期
      let startDate = null, endDate = null;
      if (Array.isArray(values?.dateRange) && values.dateRange.length === 2) {
        startDate = values.dateRange[0]?.format('YYYY-MM-DD');
        endDate = values.dateRange[1]?.format('YYYY-MM-DD');
      }

      // 4) 组装与 schema 对齐的数据（content 是必填）
      const postData = {
        title: values.title,
        description: values.description || '',
        pet_type: values.pet_type || null,
        city: values.city || null,
        startDate,
        endDate,
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
        pet_image: imageUrl,         // 可选展示 URL
        pet_image_key: imageKey,     // 详情页从 S3 取图用的 key（关键）
        content: `[${values.pet_type || ''}/${values.city || ''}] ${values.description || ''}`,
        createdAt: new Date().toISOString(), // 注意拼写：createdAt
      };
      console.log('[PostCreate] createPost payload:', postData);

      // 5) 创建
      const res = await createPost(postData);
      console.log('[PostCreate] createPost result:', res);

      // 6) 跳转到详情：/detail/:id （匹配你的路由）
      const newId = res?.data?.id;
      message.success('Post created successfully!');
      navigate(`/detail/${newId}`);
    } catch (err) {
      console.error('[PostCreate] createPost error', err);
      message.error(err?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '60px', maxWidth: '900px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center' }}>Create a New Post</h1>

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
        autoComplete="off"
        size="large"
      >
        <Form.Item
          label="Title"
          name="title"
          rules={[{ required: true, message: 'Please input post title!' }]}
        >
          <Input placeholder="Enter post title" />
        </Form.Item>

        <Form.Item
          label="Description"
          name="description"
          rules={[{ required: true, message: 'Please input description!' }]}
        >
          <TextArea rows={4} placeholder="Describe your pet or event..." />
        </Form.Item>

        <Form.Item label="Pet Type" name="pet_type">
          <Input placeholder="e.g. dog, cat, corgi, mixed... (free text)" allowClear />
        </Form.Item>

        <Form.Item label="City" name="city">
          <Input placeholder="Enter city" />
        </Form.Item>

        <Form.Item label="Date Range" name="dateRange">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item label="Keywords (comma separated)" name="keywords">
          <Input placeholder="e.g. cute, adoption, friendly" />
        </Form.Item>

        {/* ✅ Upload 正确绑定到 Form：valuePropName + getValueFromEvent */}
        <Form.Item
          label="Pet Image"
          name="pet_image"
          valuePropName="fileList"
          getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList ?? [])}
        >
          <Upload
            listType="picture-card"
            beforeUpload={() => false}   // 不自动上传；提交时手动上传到 S3
            maxCount={1}
          >
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload</div>
            </div>
          </Upload>
        </Form.Item>

        <Form.Item style={{ textAlign: 'center', marginTop: '30px' }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
            style={{ fontSize: '18px', height: '50px', padding: '0 40px' }}
          >
            Create Post
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
