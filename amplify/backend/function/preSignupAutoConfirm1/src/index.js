/* Amplify Params - DO NOT EDIT
  ENV
  REGION
Amplify Params - DO NOT EDIT */

// 这是 Cognito Pre Sign-up 触发器的实现；注意必须返回 event（不是返回 statusCode/body）
exports.handler = async (event) => {
  console.log('Cognito trigger event:', JSON.stringify(event));

  // 仅在用户自行注册（控制台/前端 SignUp）时自动确认
  // 其他来源(如 AdminCreateUser)也可以根据需要放开
  if (
    event.triggerSource === 'PreSignUp_SignUp' ||
    event.triggerSource === 'PreSignUp_ExternalProvider' ||
    event.triggerSource === 'PreSignUp_AdminCreateUser'
  ) {
    event.response.autoConfirmUser = true;   // 自动确认
    event.response.autoVerifyEmail = true;   // 若收集了 email
    event.response.autoVerifyPhone = true;   // 若收集了 phone_number
  }

  // 关键：返回 event，而不是 { statusCode, body }
  return event;
};
