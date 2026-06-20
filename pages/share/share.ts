import { request } from '../../utils/api';

Page({
  data: {
    data: null as any,
    loading: true,
    error: '',
  },

  onLoad(options: Record<string, string>) {
    const id = options.id;
    if (!id) {
      this.setData({ loading: false, error: '分享链接无效' });
      return;
    }
    this.loadShare(id);
  },

  async loadShare(id: string) {
    try {
      const res = await request<{ success: boolean; data: any }>({
        path: `/api/share/${id}`,
        method: 'GET',
        noAuth: true,
      });
      this.setData({ data: res.data, loading: false });
    } catch {
      this.setData({ loading: false, error: '分享不存在或已过期' });
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    return {
      title: '芥子 - AI 产品创意验证',
      path: '/pages/index/index',
    };
  },
});
