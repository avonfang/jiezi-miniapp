import { getHistory, deleteHistoryItem, saveLastIdea } from '../../utils/storage';

const VERDICT_COLORS: Record<string, string> = {
  '建议尝试': 'green',
  '值得探索': 'yellow',
  '暂不建议': 'red',
};

Page({
  data: {
    list: [] as any[],
    filteredList: [] as any[],
    filter: '',
    stats: { try: 0, explore: 0, no: 0 },
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    const raw = getHistory();
    const list = raw.map((item, index) => ({
      ...item,
      originalIndex: index,
      tagColor: VERDICT_COLORS[item.verdict] || 'gray',
      timeStr: this.formatTime(item.timestamp),
      verdictClass: item.verdict === '建议尝试' ? 'try'
        : item.verdict === '值得探索' ? 'explore' : 'no',
    }));

    const stats = {
      try: list.filter((i: any) => i.verdict === '建议尝试').length,
      explore: list.filter((i: any) => i.verdict === '值得探索').length,
      no: list.filter((i: any) => i.verdict === '暂不建议').length,
    };

    const filteredList = this.applyFilterLocal(list, this.data.filter);
    this.setData({ list, stats, filteredList });
  },

  setFilter(e: WechatMiniprogram.TouchEvent) {
    const filter = e.currentTarget.dataset.filter as string;
    const filteredList = this.applyFilterLocal(this.data.list, filter);
    this.setData({ filter, filteredList });
  },

  applyFilterLocal(list: any[], filter: string) {
    if (!filter) return list;
    return list.filter((i: any) => i.verdict === filter);
  },

  restoreItem(e: WechatMiniprogram.TouchEvent) {
    if (this._deleting) return;
    const index = e.currentTarget.dataset.index as number;
    const raw = getHistory();
    const item = raw[index];
    if (item) {
      saveLastIdea(item.idea);
      wx.reLaunch({ url: '/pages/index/index' });
    }
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    return {
      title: '芥子 - AI 产品创意验证器',
      path: '/pages/history/history',
    };
  },

  deleteItem(e: WechatMiniprogram.TouchEvent) {
    if (this._deleting) return;
    const index = e.currentTarget.dataset.index as number;
    this._deleting = true;
    wx.showModal({
      title: '删除记录',
      content: '确定删除这条验证记录吗？',
      success: (r) => {
        if (r.confirm) {
          deleteHistoryItem(index);
          this.loadHistory();
        }
        this._deleting = false;
      },
      fail: () => { this._deleting = false; },
    });
  },

  // Flag to prevent tap-after-longpress navigation
  _deleting: false,

  formatTime(ts: number): string {
    if (!ts || isNaN(ts)) return '';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return '';
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  },
});
