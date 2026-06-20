import { getBalance, claimNewUserBonus, claimShareBonus } from '../../utils/credit';
import { getUsername, getUserId, getAvatarUrl, isLoggedIn, wechatLogin, updateProfile, fetchProfile, getSharePath } from '../../utils/auth';
import { request } from '../../utils/api';

const MAX_CREDITS = 100;

Page({
  data: {
    username: '',
    userId: '',
    initial: '',
    avatarUrl: '',
    balance: 0,
    barWidth: 0,
    feedback: '',
    contact: '',
    feedbackMsg: '',
    feedbackCanSubmit: false,
    loggedIn: false,
    showProfileEditor: false,
    editNickName: '',
    hasEditNickName: false,
    feedbackTypeIndex: 0,
    feedbackTypes: ['功能异常', '产品建议', '内容问题', '其他'],
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const userId = getUserId();
    const isLogged = isLoggedIn();
    let username = getUsername();
    let avatarUrl = getAvatarUrl();

    // Fetch profile data and balance in parallel
    const [profile, balance] = await Promise.all([
      (isLogged && !avatarUrl) ? fetchProfile() : Promise.resolve(null),
      getBalance(),
    ]);

    if (profile) {
      username = profile.nickName || username;
      if (profile.avatarBase64) {
        avatarUrl = profile.avatarBase64.startsWith('data:') ? profile.avatarBase64 : `data:image/png;base64,${profile.avatarBase64}`;
      }
    }
    this.setData({
      username,
      userId,
      initial: username.charAt(0),
      avatarUrl,
      balance: Number(balance) || 0,
      barWidth: Math.min(((Number(balance) || 0) / MAX_CREDITS) * 100, 100),
      loggedIn: isLogged,
      showProfileEditor: false,
    });
  },

  onFeedbackInput(e: WechatMiniprogram.InputEvent) {
    const val = e.detail.value;
    this.setData({ feedback: val, feedbackMsg: '', feedbackCanSubmit: val.trim().length > 0 });
  },

  onContactInput(e: WechatMiniprogram.InputEvent) {
    this.setData({ contact: e.detail.value });
  },

  onFeedbackTypeChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ feedbackTypeIndex: Number(e.detail.value) });
  },

  async doWechatLogin() {
    const result = await wechatLogin();
    if (result) {
      wx.showToast({ title: '登录成功', icon: 'success' });
      if (result.isNew) {
        this._pendingBonus = true;
        await this.loadData();
        this.setData({ showProfileEditor: true });
        wx.showModal({
          title: '🎉 欢迎加入芥子',
          content: '请先完善资料（设置昵称），即可领取 20 积分奖励！',
          showCancel: false,
        });
      } else {
        this.loadData();
      }
    } else {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' });
    }
  },

  async onShareSuccess() {
    const balance = await claimShareBonus();
    this.setData({ balance: Number(balance) || 0, barWidth: Math.min(((Number(balance) || 0) / MAX_CREDITS) * 100, 100) });
    wx.showToast({ title: '分享成功 +5 积分', icon: 'success' });
  },

  chooseAvatar() {
    if (!this.data.loggedIn) return;
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0];
        // 读取为 base64
        const fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: tempPath,
          encoding: 'base64',
          success: (readRes) => {
            const base64 = `data:image/jpeg;base64,${readRes.data}`;
            this._editingAvatarBase64 = base64;
            this.setData({
              avatarUrl: base64, // immediately show the new avatar
            });
          },
        });
      },
    });
  },

  onNicknameInput(e: WechatMiniprogram.InputEvent) {
    const val = e.detail.value;
    this.setData({ editNickName: val, hasEditNickName: val.trim().length > 0 });
  },

  toggleEditor() {
    const showing = !this.data.showProfileEditor;
    this.setData({
      showProfileEditor: showing,
      editNickName: showing ? this.data.username : '',
      hasEditNickName: showing ? this.data.username.trim().length > 0 : false,
    });
  },

  async saveProfile() {
    if (this._savingProfile) return;
    const { editNickName } = this.data;
    if (!editNickName.trim()) return;

    this._savingProfile = true;
    wx.showLoading({ title: '保存中...' });
    // 头像 base64 去掉 data:image/... 前缀，只存纯 base64
    const avatarB64: string = this._editingAvatarBase64 || '';
    const pureBase64 = avatarB64 ? avatarB64.replace(/^data:image\/\w+;base64,/, '') : '';
    const ok = await updateProfile(editNickName.trim(), pureBase64 || undefined);
    wx.hideLoading();
    if (ok) {
      wx.showToast({ title: '保存成功', icon: 'success' });
      if (this._pendingBonus) {
        this._pendingBonus = false;
        const balance = await claimNewUserBonus();
        this.setData({ balance: Number(balance) || 0, barWidth: Math.min(((Number(balance) || 0) / MAX_CREDITS) * 100, 100) });
        wx.showModal({
          title: '🎉 奖励已发放',
          content: '感谢完善资料！送你 20 积分体验 AI 产品验证，快去试试吧！',
          showCancel: false,
        });
      }
      this.loadData();
    } else {
      wx.showToast({ title: '保存失败', icon: 'none' });
    }
    this._savingProfile = false;
  },

  async submitFeedback() {
    if (this._savingFeedback) return;
    const { feedback, contact, feedbackTypes, feedbackTypeIndex } = this.data;
    if (!feedback.trim()) return;

    this._savingFeedback = true;
    try {
      await request({ path: '/api/feedback', data: { type: feedbackTypes[feedbackTypeIndex], content: feedback.trim(), contact: contact.trim() } });
      this.setData({ feedback: '', contact: '', feedbackTypeIndex: 0, feedbackMsg: '感谢你的反馈！' });
    } catch {
      this.setData({ feedbackMsg: '提交失败，请稍后重试' });
    }
    this._savingFeedback = false;
  },

  goPricing() {
    wx.navigateTo({ url: '/pages/pricing/pricing' });
  },

  goHistory() {
    wx.reLaunch({ url: '/pages/history/history' });
  },

  goContact() {
    wx.navigateTo({ url: '/pages/contact-us/contact-us' });
  },

  doLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？退出后可用微信快速重新登录。',
      success: (r) => {
        if (r.confirm) {
          const { logout } = require('../../utils/auth');
          logout();
          this.setData({
            loggedIn: false,
            username: '',
            userId: '',
            initial: '',
            avatarUrl: '',
            balance: 0,
            barWidth: 0,
          });
          wx.reLaunch({ url: '/pages/index/index' });
        }
      },
    });
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  onShareAppMessage() {
    return {
      title: '芥子 - AI 产品创意验证器',
      path: getSharePath(),
    };
  },
});
