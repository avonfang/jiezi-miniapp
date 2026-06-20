Page({

  onContactCopy(e: WechatMiniprogram.TouchEvent) {
    const text = e.currentTarget.dataset.text as string;
    wx.setClipboardData({
      data: text,
      success: () => wx.showToast({ title: '已复制', icon: 'success' }),
    });
  },

  onSiteTap() {
    wx.setClipboardData({
      data: 'https://jiezi.site',
      success: () => wx.showToast({ title: '官网链接已复制', icon: 'success' }),
    });
  },

  onShareAppMessage() {
    return {
      title: '芥子 - AI 产品创意验证器',
      path: '/pages/index/index',
    };
  },
});
