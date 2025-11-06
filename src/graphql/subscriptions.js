/* eslint-disable */
// this is an auto generated file. This will be overwritten

export const onCreatePost = /* GraphQL */ `
  subscription OnCreatePost(
    $filter: ModelSubscriptionPostFilterInput
    $owner: String
  ) {
    onCreatePost(filter: $filter, owner: $owner) {
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
export const onUpdatePost = /* GraphQL */ `
  subscription OnUpdatePost(
    $filter: ModelSubscriptionPostFilterInput
    $owner: String
  ) {
    onUpdatePost(filter: $filter, owner: $owner) {
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
export const onDeletePost = /* GraphQL */ `
  subscription OnDeletePost(
    $filter: ModelSubscriptionPostFilterInput
    $owner: String
  ) {
    onDeletePost(filter: $filter, owner: $owner) {
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
export const onCreateComment = /* GraphQL */ `
  subscription OnCreateComment(
    $filter: ModelSubscriptionCommentFilterInput
    $owner: String
  ) {
    onCreateComment(filter: $filter, owner: $owner) {
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
export const onUpdateComment = /* GraphQL */ `
  subscription OnUpdateComment(
    $filter: ModelSubscriptionCommentFilterInput
    $owner: String
  ) {
    onUpdateComment(filter: $filter, owner: $owner) {
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
export const onDeleteComment = /* GraphQL */ `
  subscription OnDeleteComment(
    $filter: ModelSubscriptionCommentFilterInput
    $owner: String
  ) {
    onDeleteComment(filter: $filter, owner: $owner) {
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
