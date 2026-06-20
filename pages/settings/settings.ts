import { getBalance } from '../../utils/credit';
import { getHistory, HistoryItem, saveLastIdea } from '../../utils/storage';
import { getUsername, getUserId } from '../../utils/auth';

interface GroupItem {
  label: string;
  ideas: { text: string; count: number }[];
}

Page({
  data: {
    username: '',
    userId: '',
    initial: '',
    balance: 0,
    barWidth: 0,
    groupedHistory: [] as GroupItem[],
  },

  onShow() {
    this.loadData();
  },

  async loadData() {
    const username = getUsername() || '用户';
    const balance = await getBalance();
    this.setData({
      username,
      userId: getUserId(),
      initial: username.charAt(0),
      balance: Number(balance) || 0,
      barWidth: 0,
      groupedHistory: this.groupHistory(getHistory()),
    });
  },

  groupHistory(list: HistoryItem[]): GroupItem[] {
    const groups: Record<string, { text: string; count: number }[]> = {};
    for (const item of list) {
      const key = new Date(item.timestamp).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
      if (!groups[key]) groups[key] = [];
      groups[key].push({ text: item.idea.slice(0, 30), count: groups[key].length + 1 });
    }
    return Object.entries(groups).map(([label, ideas]) => ({ label, ideas }));
  },

  restoreItem(e: WechatMiniprogram.TouchEvent) {
    const idea = e.currentTarget.dataset.idea as string;
    saveLastIdea(idea);
    wx.reLaunch({ url: '/pages/index/index' });
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

  goAbout() {
    wx.showModal({
      title: '关于芥子',
      content: '芥子是一款 AI 驱动的产品创意验证工具，帮你快速验证产品想法、分析市场、生成 PRD 和产品预览。',
      showCancel: false,
    });
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },
});
