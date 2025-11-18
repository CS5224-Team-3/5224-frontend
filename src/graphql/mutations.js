/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const createPost = /* GraphQL */ `
  mutation CreatePost(
    $input: CreatePostInput!
    $condition: ModelPostConditionInput
  ) {
    createPost(input: $input, condition: $condition) {
      id
      title
      content
      description
      pet_type
      city
      startDate
      endDate
      keywords
      pet_image
      pet_image_key
      owner
      createdAt
      updatedAt
      comments {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const updatePost = /* GraphQL */ `
  mutation UpdatePost(
    $input: UpdatePostInput!
    $condition: ModelPostConditionInput
  ) {
    updatePost(input: $input, condition: $condition) {
      id
      title
      content
      description
      pet_type
      city
      startDate
      endDate
      keywords
      pet_image
      pet_image_key
      owner
      createdAt
      updatedAt
      comments {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const deletePost = /* GraphQL */ `
  mutation DeletePost(
    $input: DeletePostInput!
    $condition: ModelPostConditionInput
  ) {
    deletePost(input: $input, condition: $condition) {
      id
      title
      content
      description
      pet_type
      city
      startDate
      endDate
      keywords
      pet_image
      pet_image_key
      owner
      createdAt
      updatedAt
      comments {
        nextToken
        __typename
      }
      __typename
    }
  }
`;
export const createComment = /* GraphQL */ `
  mutation CreateComment(
    $input: CreateCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    createComment(input: $input, condition: $condition) {
      id
      postId
      content
      owner
      createdAt
      updatedAt
      post {
        id
        title
        content
        description
        pet_type
        city
        startDate
        endDate
        keywords
        pet_image
        pet_image_key
        owner
        createdAt
        updatedAt
        __typename
      }
      __typename
    }
  }
`;
export const updateComment = /* GraphQL */ `
  mutation UpdateComment(
    $input: UpdateCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    updateComment(input: $input, condition: $condition) {
      id
      postId
      content
      owner
      createdAt
      updatedAt
      post {
        id
        title
        content
        description
        pet_type
        city
        startDate
        endDate
        keywords
        pet_image
        pet_image_key
        owner
        createdAt
        updatedAt
        __typename
      }
      __typename
    }
  }
`;
export const deleteComment = /* GraphQL */ `
  mutation DeleteComment(
    $input: DeleteCommentInput!
    $condition: ModelCommentConditionInput
  ) {
    deleteComment(input: $input, condition: $condition) {
      id
      postId
      content
      owner
      createdAt
      updatedAt
      post {
        id
        title
        content
        description
        pet_type
        city
        startDate
        endDate
        keywords
        pet_image
        pet_image_key
        owner
        createdAt
        updatedAt
        __typename
      }
      __typename
    }
  }
`;
