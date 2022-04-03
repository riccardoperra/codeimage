const IOS_REG_EXP = /ipad|iphone|ipod/;

const userAgent = navigator.userAgent;

export const IS_IOS =
  IOS_REG_EXP.test(userAgent.toLowerCase()) ||
  (userAgent.toLowerCase().includes('apple') && navigator.maxTouchPoints > 1);
