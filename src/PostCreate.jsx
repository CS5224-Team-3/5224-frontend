import React, { useEffect, useState } from 'react'
import { Form, DatePicker, Input, Button, Row, Col, App, Spin, Upload, message as antdMessage } from 'antd'
import { useParams, useNavigate } from 'react-router-dom'
import { createPost, getPostDetail, updatePost, uploadImage } from './services/api'
import { UploadOutlined, InboxOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

const { RangePicker } = DatePicker;
const { useApp } = App;

export default function PostForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const isEditMode = !!id;
  
  const validateMessages = {
    required: '${label} is required!',
    types: {
      pet_type: '${label} is not a valid pet type!',
      city: '${label} is not a valid city!',
    },
    number: {
      range: '${label} must be between ${min} and ${max}',
    },
  };

  // 如果是编辑模式，加载现有数据
  useEffect(() => {
    const loadPostData = async () => {
      if (isEditMode) {
        setLoading(true);
        try {
          const response = await getPostDetail(id);
          const postData = response.data;
          
          // 将后端数据映射到表单字段
          form.setFieldsValue({
            user: {
              name: postData.title,
              email: postData.petType,
              age: postData.city,
              period: postData.startDate && postData.endDate ? [
                dayjs(postData.startDate),
                dayjs(postData.endDate)
              ] : null,
              introduction: postData.description
            }
          });
        } catch (error) {
          console.error('Failed to load post:', error);
          message.error('Failed to load post data');
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadPostData();
  }, [isEditMode, id, form, message]);
  
  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      let imageUrl = null;
      
      // 如果有上传的图片，先上传图片
      if (values.user.pet_image && values.user.pet_image.length > 0) {
        const file = values.user.pet_image[0].originFileObj;
        if (file) {
          console.log('Uploading image before creating post...');
          const uploadResponse = await uploadImage(file);
          imageUrl = uploadResponse.data?.url || uploadResponse.data?.imageUrl || uploadResponse.url || uploadResponse.imageUrl;
          console.log('Image uploaded successfully:', imageUrl);
        }
      }
      
      // 将表单数据映射为 API 需要的格式
      const postData = {
        pet_type: values.user.email,
        city: values.user.age,
        startDate: values.user.period?.[0]?.format('YYYY-MM-DD'),
        endDate: values.user.period?.[1]?.format('YYYY-MM-DD'),
        title: values.user.name,
        keywords: values.user.keywords ? values.user.keywords.split(';').map(k => k.trim()).filter(k => k) : [],
        description: values.user.introduction,
        pet_image: imageUrl,
        createAt: new Date().toISOString()
      };
      
      if (isEditMode) {
        // 更新帖子
        const modified = [
          { title: postData.title },
          { description: postData.description }
        ];
        await updatePost(id, modified);
        message.success('Post updated successfully!');
      } else {
        // 创建新帖子
        await createPost(postData);
        message.success('Post created successfully!');
      }
      
      navigate('/profile');
    } catch (error) {
      console.error('Failed to save post:', error);
      message.error(error.message || 'Failed to save post. Please try again.');
    } finally {
      setLoading(false);
    }
  };
      
      // 统一的输入框样式
      const inputStyle = {
        fontSize: '18px',
        padding: '8px 12px'
      };
      
      // 统一的标签样式
      const formItemStyle = {
        fontSize: '18px'
      };
      
  return (
    <div className="post-form-container" style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: '50px 16px 0px 16px',
      width: '100%'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px', fontSize: '24px' }}>
        {isEditMode ? 'Edit Post' : 'Create New Post'}
      </h2>
      <Spin spinning={loading} tip={isEditMode ? "Loading post..." : "Saving..."}>
      <Form 
        form={form}
        name="post-form"
        onFinish={onFinish}
        validateMessages={validateMessages}
        style={{ width: '100%', fontSize: '18px' }}
        layout="vertical"
      >
          {/* Post title 和 Pet type 在同一行 */}
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item 
                name={['user', 'name']} 
                label={<span style={formItemStyle}>Post title</span>} 
                rules={[{ required: true }]}
              >
                <Input style={inputStyle} placeholder="Enter post title, please start with [help] or [story]" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item 
                name={['user', 'email']} 
                label={<span style={formItemStyle}>Pet type</span>} 
                rules={[{ required: true, type: 'pet_type' }]}
              >
                <Input style={inputStyle} placeholder="Enter pet type" />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={24}>
            <Col xs={24} md={12}>
              <Form.Item 
                name={['user', 'age']} 
                label={<span style={formItemStyle}>City</span>} 
                rules={[{ required: true, type: 'city' }]}
              >
                <Input style={inputStyle} placeholder="Enter city" />
              </Form.Item>
            </Col>
            
            <Col xs={24} md={12}>
              <Form.Item 
                name={['user', 'period']} 
                label={<span style={formItemStyle}>Boarding period</span>} 
                rules={[{ required: true }]}
              >
                <RangePicker style={{...inputStyle, width: '100%'}} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={24}>
            <Col xs={24} md={12}>
            <Form.Item
          name={['user', 'keywords']}
          label={<span style={formItemStyle}>Keywords</span>}
          >
            <Input style={inputStyle} placeholder="Enter keyword, e.g. Dog; Hangzhou; urgent" />
          </Form.Item>
          <Form.Item 
            name={['user', 'pet_image']}
            label={<span style={formItemStyle}>Pet Image</span>}
          >
            <Upload
              name="file"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={true}
              beforeUpload={(file) => {
                const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
                if (!isJpgOrPng) {
                  antdMessage.error('You can only upload JPG/PNG file!');
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  antdMessage.error('Image must smaller than 2MB!');
                }
                return isJpgOrPng && isLt2M;
              }}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  antdMessage.success(`${info.file.name} file uploaded successfully`);
                } else if (info.file.status === 'error') {
                  antdMessage.error(`${info.file.name} file upload failed.`);
                }
              }}
              customRequest={({ file, onSuccess }) => {
                // 不立即上传，只是保存文件信息
                console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
                
                // 创建一个包含文件信息的响应对象
                const uploadResponse = {
                  name: file.name,
                  status: 'done',
                  originFileObj: file // 保存原始文件对象，用于后续上传
                };
                onSuccess(uploadResponse, file);
              }}
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
            </Col>
          </Row>
        
          {/* Description 占据整行宽度 */}
          <Form.Item 
            name={['user', 'introduction']} 
            label={<span style={formItemStyle}>Description</span>}
          >
            <Input.TextArea 
              style={{...inputStyle, fontSize: '18px'}} 
              rows={8} 
              placeholder="Enter description"
            />
          </Form.Item>
          
          <Form.Item 
            style={{display:'flex',justifyContent:'center',marginTop:'30px', gap: '16px'}} 
          >
            <Button 
              size="large"
              style={{ fontSize: '18px', height: '50px', padding: '0 40px' }}
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              size="large"
              style={{ fontSize: '18px', height: '50px', padding: '0 40px' }}
            >
              {isEditMode ? 'Update Post' : 'Create Post'}
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </div>
  )
}