import { requestNonStream } from '../../utils/api';
import { invalidateBalanceCache } from '../../utils/credit';
import { savePreview, updateHistoryItem, getLastIdea } from '../../utils/storage';

const FALLBACK_EMOJIS = ['🚀', '⚡', '🎯', '💡', '🔒', '🔄', '📊', '🤖', '🎨', '📱'];
const TINTS = ['rgba(91,111,230,0.06)', 'rgba(52,196,114,0.06)', 'rgba(245,158,107,0.06)', 'rgba(139,111,232,0.06)'];

const PREVIEW_LOADING_TEXTS = [
  '',
  '正在分析产品数据和需求...',
  '正在设计页面结构和布局...',
  'AI 正在生成页面内容...',
  '正在生成预览页面...',
];

let previewStepTimer: number | null = null;

Page({
  data: {
    previewHtml: '',
    productName: '',
    generating: false,
    error: '',
    isFallback: false,
    timelineStep: 0,
    loadingText: '',
    fbData: {
      name: '', tagline: '', features: [] as any[],
      targetUsers: '', positioning: '', userStory: '',
      techStack: '', techTags: [] as string[], hasFeatures: false,
      nextSteps: [] as string[], pricingSuggestion: '',
      dataModels: [] as any[], userFlow: '', hasDataModels: false,
      hasNextSteps: false,
    },
  },

  onLoad(options?: Record<string, string>) {
    const prd = wx.getStorageSync('jiezi-prd');
    if (prd) {
      const fbData = this.buildFallbackData(prd);
      this.setData({
        fbData,
        productName: prd.product_name || '',
        isFallback: true,
        previewHtml: '',
      });
      // Only auto-generate when navigated from PRD page with ?auto=1
      if (options?.auto === '1') {
        this.generatePreview();
      }
    } else {
      const saved = wx.getStorageSync('jiezi-preview');
      if (saved?.html && saved?.product_name) {
        const html = this.cleanHtml(saved.html);
        this.setData({ previewHtml: html, productName: saved.product_name });
      } else {
        this.setData({ error: '请先生成 PRD 文档' });
      }
    }
  },

  onUnload() {
    this.clearStepTimer();
  },

  cleanHtml(html: string): string {
    const styleMap = new Map<string, string>();
    const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
    let styleMatch;
    while ((styleMatch = styleRegex.exec(html)) !== null) {
      const cssText = styleMatch[1];
      const ruleRegex = /([^{]+)\{([^}]+)\}/g;
      let ruleMatch;
      while ((ruleMatch = ruleRegex.exec(cssText)) !== null) {
        const selector = ruleMatch[1].trim();
        const decls = ruleMatch[2].trim();
        if (selector.startsWith('@')) continue;
        if (/^[a-zA-Z0-9._-]+$/.test(selector) && !selector.includes(':') && !selector.includes('*') && !selector.includes('#')) {
          const existing = styleMap.get(selector);
          styleMap.set(selector, existing ? existing + ';' + decls : decls);
        }
      }
    }

    let h = html
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<\/html>/gi, '')
      .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      .replace(/<\/body>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '');

    styleMap.forEach((declarations, selector) => {
      if (selector.startsWith('.')) {
        const cls = selector.substring(1);
        const words = cls.split('.');
        const classPattern = words.map(w => `(?=.*\\b${w}\\b)`).join('');
        const clsRegex = new RegExp(`class="(${classPattern}[^"]*)"`, 'g');
        h = h.replace(clsRegex, (match, classStr) => {
          if (/style="[^"]*"/.test(match)) return match;
          return `style="${declarations}" ${match}`;
        });
      }
      if (/^[a-z][a-z0-9]*$/i.test(selector)) {
        const tagRegex = new RegExp(`<${selector}(\\s[^>]*)?>`, 'gi');
        h = h.replace(tagRegex, (tagMatch, attrs) => {
          if (/style="[^"]*"/.test(tagMatch)) return tagMatch;
          if (attrs && attrs.trim()) {
            return `<${selector} style="${declarations}"${attrs}>`;
          }
          return `<${selector} style="${declarations}">`;
        });
      }
    });

    h = h.replace(/\sclass=""(\s|>)/g, '$1');
    return h;
  },

  buildFallbackData(prd: any) {
    const features = (prd.features || []).map((f: any, i: number) => ({
      icon: FALLBACK_EMOJIS[i % FALLBACK_EMOJIS.length],
      title: f.name || f.title || '',
      desc: f.description || f.desc || '',
      iconBg: TINTS[i % TINTS.length],
    }));

    const techStack = prd.tech_stack_suggestion || prd.tech_stack || '';
    const techTags = techStack
      ? techStack.split(/[,，、;；\/]/).map((s: string) => s.trim()).filter((s: string) => s.length > 0)
      : [];

    const nextSteps = prd.next_steps
      ? (Array.isArray(prd.next_steps) ? prd.next_steps : [prd.next_steps])
      : [];

    const dataModels = prd.data_models || [];

    return {
      name: prd.product_name || '产品预览',
      tagline: prd.one_liner || '',
      positioning: prd.positioning || '',
      targetUsers: prd.target_users || '',
      userStory: prd.user_story || '',
      userFlow: prd.user_flow || '',
      techStack,
      techTags,
      features,
      hasFeatures: features.length > 0,
      nextSteps,
      hasNextSteps: nextSteps.length > 0,
      pricingSuggestion: prd.pricing_suggestion || '',
      dataModels,
      hasDataModels: dataModels.length > 0,
    };
  },

  async generatePreview() {
    if (this.data.generating) return;
    const prd = wx.getStorageSync('jiezi-prd');
    if (!prd) {
      this.setData({ error: '请先生成 PRD 文档' });
      return;
    }

    this.clearStepTimer();
    this.setData({ generating: true, error: '', timelineStep: 1, loadingText: PREVIEW_LOADING_TEXTS[1] });

    previewStepTimer = setInterval(() => {
      const next = this.data.timelineStep + 1;
      if (next <= 4) {
        this.setData({ timelineStep: next, loadingText: PREVIEW_LOADING_TEXTS[next] });
      }
    }, 3000);

    try {
      const result = await requestNonStream<any>('/api/generate-preview', { prd });

      this.clearStepTimer();

      if (result?.success && result?.preview?.html) {
        invalidateBalanceCache();
        savePreview(result.preview);

        const fbData = this.buildFallbackData(prd);
        this.setData({
          previewHtml: '',
          productName: result.preview.product_name || '',
          generating: false,
          isFallback: true,
          timelineStep: 4,
          loadingText: PREVIEW_LOADING_TEXTS[4],
          fbData,
        });
        updateHistoryItem(getLastIdea(), { hasPreview: true });
      } else {
        // API succeeded but no HTML — still show the native view
        const fbData = this.buildFallbackData(prd);
        this.setData({
          generating: false,
          isFallback: true,
          fbData,
        });
      }
    } catch (err: any) {
      this.clearStepTimer();

      if (err?.code !== 402 && prd) {
        const fbData = this.buildFallbackData(prd);
        this.setData({
          generating: false,
          isFallback: true,
          fbData,
          error: '',
        });
        return;
      }

      this.setData({ generating: false });
      if (err?.code === 402) {
        this.setData({ error: '积分不足，无法生成预览页' });
      } else {
        this.setData({ error: err?.data?.error || err?.message || '生成失败，请重试' });
        wx.showToast({ title: '生成失败', icon: 'none' });
      }
    }
  },

  clearStepTimer() {
    if (previewStepTimer !== null) {
      clearInterval(previewStepTimer);
      previewStepTimer = null;
    }
  },

  retry() { this.generatePreview(); },
  goBack() { wx.navigateBack(); },

  onShareAppMessage() {
    return {
      title: `${this.data.productName || '产品预览'} - 芥子 AI 生成`,
      path: '/pages/index/index',
    };
  },

  onFeatureTap(e: any) {
    const idx = e.currentTarget.dataset.index;
    const features = this.data.fbData.features;
    if (idx >= 0 && idx < features.length) {
      getApp().globalData.featureDetail = features[idx];
      wx.navigateTo({ url: '/pages/preview/feature-detail/feature-detail' });
    }
  },
});
