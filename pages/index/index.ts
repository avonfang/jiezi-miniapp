import { requestNonStream } from '../../utils/api';
import { saveHistory, saveReport, getReport, saveLastIdea, getLastIdea, removeLastIdea } from '../../utils/storage';
import { invalidateBalanceCache } from '../../utils/credit';
import { getSharePath } from '../../utils/auth';

interface Example {
  idea: string;
  icon: string;
  tag: string;
}

const EXAMPLES: Example[] = [
  { idea: '一个面向独立开发者的 AI 代码审查工具', icon: '🔍', tag: 'AI工具' },
  { idea: '为老年人设计的智能健康监测手环', icon: '❤️', tag: '银发经济' },
  { idea: '基于 AI 的二手书交易平台', icon: '📚', tag: '电商' },
];

const PLACEHOLDERS = [
  '为独居老人设计的智能药盒...',
  '帮留学生找室友的平台...',
  'AI 模拟面试工具，帮程序员练手...',
  'AI 记账工具，自动分析账单...',
];

let placeholderTimer: number | null = null;
let placeholderIndex = 0;
let stepTimer: number | null = null;

Page({
  data: {
    examples: EXAMPLES,
    idea: '',
    loading: false,
    timelineStep: 0,
    loadingText: '',
    report: null as any,
    hasPrd: false,
    error: '',
    placeholderText: PLACEHOLDERS[0],
  },

  onShow() {
    const saved = getLastIdea();
    if (saved) {
      this.setData({ idea: saved });
    }

    // Restore report if page was re-created (under memory pressure)
    if (!this.data.report && getReport()) {
      this.setData({ report: getReport() });
    }

    // Check if PRD already generated (for button state)
    if (this.data.report || getReport()) {
      this.setData({ hasPrd: !!wx.getStorageSync('jiezi-prd') });
    }

    // Only cycle placeholder when nothing is showing
    if (!saved && !this.data.report) {
      this.startPlaceholderCycle();
    }
  },

  onHide() {
    this.stopPlaceholderCycle();
    if (stepTimer !== null) {
      clearInterval(stepTimer);
      stepTimer = null;
    }
  },

  startPlaceholderCycle() {
    this.stopPlaceholderCycle();
    placeholderTimer = setInterval(() => {
      placeholderIndex = (placeholderIndex + 1) % PLACEHOLDERS.length;
      this.setData({
        placeholderText: PLACEHOLDERS[placeholderIndex],
      });
    }, 3000);
  },

  stopPlaceholderCycle() {
    if (placeholderTimer !== null) {
      clearInterval(placeholderTimer);
      placeholderTimer = null;
    }
  },

  fillIdea(e: WechatMiniprogram.TouchEvent) {
    const idea = e.currentTarget.dataset.idea as string;
    this.setData({ idea, report: null, error: '' });
    // Clear placeholder cycling once user fills something
    this.stopPlaceholderCycle();
  },

  onIdeaInput(e: WechatMiniprogram.InputEvent) {
    const val = e.detail.value;
    this.setData({ idea: val, report: null, error: '' });
    // Restart cycling if input is cleared
    if (!val) {
      this.startPlaceholderCycle();
    } else {
      this.stopPlaceholderCycle();
    }
  },

  async onValidate(e?: WechatMiniprogram.TouchEvent | any) {
    if (this.data.loading) return;

    let idea = e?.detail?.idea || this.data.idea;
    idea = idea.trim();
    if (idea.length < 4) {
      wx.showToast({ title: '至少输入 4 个字符', icon: 'none' });
      return;
    }

    const LOADING_TEXTS = [
      '',
      '正在提取产品创意关键要素...',
      '正在搜索同类竞品和市场数据...',
      'AI 正在深度分析市场前景...',
      '正在整理分析结果...',
    ];

    this.setData({ loading: true, timelineStep: 1, report: null, error: '', loadingText: LOADING_TEXTS[1] });
    saveLastIdea(idea);

    // Progressive step advancement while awaiting API
    stepTimer = setInterval(() => {
      const next = this.data.timelineStep + 1;
      if (next <= 3) {
        this.setData({ timelineStep: next, loadingText: LOADING_TEXTS[next] });
      }
    }, 3000);

    try {
      const result = await requestNonStream<{ success: boolean; report: any }>('/api/validate', { idea });
      clearInterval(stepTimer);

      this.setData({ timelineStep: 4, loadingText: LOADING_TEXTS[4], loading: false });

      if (result.success && result.report) {
        invalidateBalanceCache();
        const report = result.report;
        this.setData({ report });
        saveReport(report);
        saveHistory({ idea, verdict: report.verdict, timestamp: Date.now(), hasPrd: false, hasPreview: false });
      } else {
        this.setData({ error: '验证失败，请稍后重试', loading: false });
      }
    } catch (err: any) {
      clearInterval(stepTimer);
      console.error('Validate error', err);
      if (err?.code === 402) {
        wx.showToast({ title: '积分不足，请稍后再试', icon: 'none' });
      } else {
        this.setData({ error: err?.data?.error || err?.message || '验证失败，请稍后重试', loading: false });
      }
    }
  },

  goReport() {
    if (this.data.report) {
      wx.navigateTo({ url: `/pages/report/report` });
    }
  },

  goPrd() {
    if (this.data.report) {
      const param = this.data.hasPrd ? '' : '?auto=1';
      wx.navigateTo({ url: `/pages/prd/prd${param}` });
    }
  },

  goSettings() {
    wx.navigateTo({ url: '/pages/settings/settings' });
  },

  goHistory() {
    wx.reLaunch({ url: '/pages/history/history' });
  },

  goProfile() {
    wx.reLaunch({ url: '/pages/profile/profile' });
  },

  onShareAppMessage() {
    const report = this.data.report;
    let imageUrl: string | undefined;

    if (report) {
      const idea = this.data.idea;
      const p: Record<string, string> = {
        idea: idea.slice(0, 200),
        verdict: report.verdict || '',
        market_score: String(report.market_score || 0),
        feasibility_score: String(report.feasibility_score || 0),
      };
      if (report.summary?.one_liner) {
        p.one_liner = report.summary.one_liner.slice(0, 200);
      }
      const qs = Object.keys(p).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(p[k])}`).join('&');
      imageUrl = `https://jiezi.site/api/share-card?${qs}`;
    }

    return {
      title: `芥子验证：${this.data.idea.slice(0, 40)}`,
      path: getSharePath(),
      imageUrl,
    };
  },

  goPricing() {
    wx.navigateTo({ url: '/pages/pricing/pricing' });
  },

  retry() {
    // 出错后重试：保留输入，只清除错误状态，重新验证
    this.setData({ error: '', loading: false });
    this.onValidate();
  },

  reset() {
    this.setData({ idea: '', report: null, error: '', loading: false, timelineStep: 0 });
    wx.removeStorageSync('jiezi-full-report');
    removeLastIdea();
    wx.removeStorageSync('jiezi-prd');
    wx.removeStorageSync('jiezi-preview');
    this.startPlaceholderCycle();
  },
});
