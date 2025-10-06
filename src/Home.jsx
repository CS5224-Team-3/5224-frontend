import SearchHomepage from './SearchHomepage';
import { useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, Button, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const { useApp } = App;

// Create Post modal
const CreatePostModal = ({ visible, onCancel, onSubmit }) => {
  const [form] = Form.useForm();
  const { message } = useApp(); // 使用 hook 方式获取 message

  const handleSubmit = (values) => {
    console.log('create post:', values);
    message.success('Post created successfully!');
    form.resetFields();
    onSubmit && onSubmit(values);
  };

  return (
    <Modal
      title="Create New Post"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="title"
          label="Title"
          rules={[{ required: true, message: 'Please enter a title' }]}
        >
          <Input placeholder="Enter post title" />
        </Form.Item>

        <Form.Item
          name="description"
          label="Description"
          rules={[{ required: true, message: 'Please enter a description' }]}
        >
          <TextArea rows={4} placeholder="Describe your request in detail..." />
        </Form.Item>

        <Form.Item
          name="petType"
          label="Pet Type"
          rules={[{ required: true, message: 'Please select a pet type' }]}
        >
          <Select placeholder="Select a pet type">
            <Option value="cat">🐱 Cat</Option>
            <Option value="dog">🐶 Dog</Option>
            <Option value="other">🐰 Other</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="location"
          label="City"
          rules={[{ required: true, message: 'Please select a city' }]}
        >
          <Select placeholder="Select your city">
            <Option value="beijing">Beijing</Option>
            <Option value="shanghai">Shanghai</Option>
            <Option value="hangzhou">Hangzhou</Option>
            <Option value="shenzhen">Shenzhen</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Fostering Period"
          rules={[{ required: true, message: 'Please select a date range' }]}
        >
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="tags"
          label="Tags"
        >
          <Select
            mode="tags"
            placeholder="Add tags (e.g., GoldenRetriever, Hangzhou, urgent)"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
            <Button onClick={onCancel}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
              Create Post
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default function Home() {
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const handleCreatePost = () => {
    setCreateModalVisible(true);
  };

  const handleModalCancel = () => {
    setCreateModalVisible(false);
  };

  const handlePostSubmit = (values) => {
    console.log('新帖子数据:', values);
    setCreateModalVisible(false);
  };

  return (
    <>
      <SearchHomepage onCreatePost={handleCreatePost} />
      <CreatePostModal
        visible={createModalVisible}
        onCancel={handleModalCancel}
        onSubmit={handlePostSubmit}
      />
    </>
  );
}