import { requestNonStream } from '../../utils/api';
import { getReport, savePrd, updateHistoryItem, getLastIdea } from '../../utils/storage';
import { invalidateBalanceCache } from '../../utils/credit';

const PRD_LOADING_TEXTS = [
  '',
  '正在解析你的产品需求要素...',
  '正在设计产品方案和功能结构...',
  'AI 正在生成功能详情和数据模型...',
  '正在整理 PRD 文档...',
];

let prdStepTimer: number | null = null;

Page({
  data: {
    prd: null as any,
    loading: false,
    generating: false,
    timelineStep: 0,
    loadingText: '',
    hasPreview: false,
  },

  onLoad(options: Record<string, string>) {
    const saved = wx.getStorageSync('jiezi-prd');
    if (saved) {
      this.setData({ prd: this.normalizePrd(saved) });
    } else if (options?.auto === '1') {
      this.generatePrd();
    }
  },

  onShow() {
    this.checkPreviewState();
  },

  checkPreviewState() {
    const preview = wx.getStorageSync('jiezi-preview');
    const hasPreview = !!(preview?.html && preview?.product_name);
    if (hasPreview !== this.data.hasPreview) {
      this.setData({ hasPreview });
    }
  },

  onUnload() {
    this.clearStepTimer();
  },

  /** Map API PRD fields to display-friendly structure */
  normalizePrd(raw: any) {
    const features = raw.features || [];
    return {
      // Display fields
      productName: raw.product_name || '',
      oneLiner: raw.one_liner || '',
      positioning: raw.positioning || '',
      targetUsers: raw.target_users || '',
      userStory: raw.user_story || '',
      userFlow: raw.user_flow || '',
      techStack: raw.tech_stack_suggestion || raw.tech_stack || '',
      nextSteps: raw.next_steps
        ? (Array.isArray(raw.next_steps) ? raw.next_steps : [raw.next_steps])
        : [],
      dataModels: raw.data_models || [],
      featuresP0: features.filter((f: any) => f.priority === 'P0'),
      featuresP1: features.filter((f: any) => f.priority === 'P1'),
      featuresP2: features.filter((f: any) => f.priority === 'P2'),
      hasFeatures: features.length > 0,
    };
  },

  async generatePrd() {
    if (this.data.generating) return;
    const report = getReport();
    if (!report) {
      wx.showToast({ title: '请先完成验证', icon: 'none' });
      return;
    }

    this.clearStepTimer();
    this.setData({ generating: true, loading: true, timelineStep: 1, loadingText: PRD_LOADING_TEXTS[1] });

    // Progressive step advancement while awaiting API
    prdStepTimer = setInterval(() => {
      const next = this.data.timelineStep + 1;
      if (next <= 4) {
        this.setData({ timelineStep: next, loadingText: PRD_LOADING_TEXTS[next] });
      }
    }, 3000);

    try {
      const idea = getLastIdea();
      const result = await requestNonStream<{ success: boolean; prd: any }>('/api/generate-prd', {
        idea,
        report,
      });

      if (result.success && result.prd) {
        this.clearStepTimer();
        invalidateBalanceCache();
        this.setData({ timelineStep: 4, loadingText: PRD_LOADING_TEXTS[4], prd: this.normalizePrd(result.prd), loading: false, generating: false });
        savePrd(result.prd);
        updateHistoryItem(idea, { hasPrd: true });
      } else {
        throw new Error('生成失败');
      }
    } catch (err: any) {
      this.clearStepTimer();
      this.setData({ loading: false, generating: false });
      if (err?.code === 402) {
        wx.showToast({ title: '积分不足，无法生成 PRD', icon: 'none' });
      } else {
        wx.showToast({ title: err?.data?.error || err?.message || '生成失败，请重试', icon: 'none' });
      }
    }
  },

  clearStepTimer() {
    if (prdStepTimer !== null) {
      clearInterval(prdStepTimer);
      prdStepTimer = null;
    }
  },

  goPreview() {
    const param = this.data.hasPreview ? '' : '?auto=1';
    wx.navigateTo({ url: '/pages/preview/preview' + param });
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
