// app.ts
import { wechatLogin } from './utils/auth';
import { request } from './utils/api';

App({
  globalData: {
    userId: '',
    token: '',
    balance: 0,
    username: '',
    featureDetail: null as any,
  },

  async onLaunch() {
    // Handle shared link tracking
    this.handleSharedBy();

    // 开发环境：尝试真实微信登录以获取有效 token，失败则回退到测试账号
    try {
      const env = wx.getAccountInfoSync().miniProgram.envVersion;
      if (env === 'develop') {
        const result = await wechatLogin();
        if (result && result.token) {
          this.globalData.userId = result.userId;
          this.globalData.token = result.token;
          this.globalData.username = result.nickName || result.username;
          this.globalData.balance = result.balance || 0;
          return;
        }
        // 真实登录失败，回退到测试账号
        wx.setStorageSync('jiezi-user-id', 'dev_user_001');
        wx.setStorageSync('jiezi-username', '测试账号');
        this.globalData.userId = 'dev_user_001';
        this.globalData.token = '';
        this.globalData.username = '测试账号';
        this.globalData.balance = 1000;
        return;
      }
    } catch {}

    // 静默登录：获取微信 code → 后端换取 JWT
    const result = await wechatLogin();
    if (result) {
      this.globalData.userId = result.userId;
      this.globalData.token = result.token;
      this.globalData.username = result.nickName || result.username;
      this.globalData.balance = result.balance || 0;
    }

  },

  onShow(options?: any) {
    // Cold-start share tracking is handled in onLaunch.
    // If app is woken from background via a share link, onShow receives options.
    if (options?.query?.sharedBy) {
      this.creditShareReferrer(options.query.sharedBy);
    }
  },

  handleSharedBy() {
    try {
      const launch = wx.getLaunchOptionsSync();
      if (launch.query?.sharedBy) {
        this.creditShareReferrer(launch.query.sharedBy);
      }
    } catch {}
  },

  async creditShareReferrer(sharedBy: string) {
    try {
      await request({
        path: '/api/credits/bonus/share-referrer',
        method: 'POST',
        data: { sharedBy },
        noAuth: true,
      });
    } catch {}
  },
});
