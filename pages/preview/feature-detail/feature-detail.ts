Page({
  data: {
    feature: null as any,
    loaded: false,
    error: '',
  },

  onLoad() {
    const feature = getApp().globalData.featureDetail;
    if (feature) {
      this.setData({ feature, loaded: true });
    } else {
      this.setData({ error: '暂无功能详情', loaded: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },

  onShareAppMessage() {
    return {
      title: '芥子 - AI 产品创意验证器',
      path: '/pages/index/index',
    };
  },
});
