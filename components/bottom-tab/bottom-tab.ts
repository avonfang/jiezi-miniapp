function toDataUri(svg: string, color: string): string {
  return 'data:image/svg+xml,' + encodeURIComponent(svg.replace(/C/g, color));
}

const GRAY = '#9D9DB0';
const BRAND = '#5B6FE6';

const ICONS: Record<string, string> = {
  validate:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/></svg>',
  history:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/></svg>',
  contact:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg>',
  profile:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-2a6 6 0 016-6h4a6 6 0 016 6v2"/></svg>',
};

const TAB_DEFS = [
  { key: 'validate', path: '/pages/index/index', icon: toDataUri(ICONS.validate, GRAY), iconSel: toDataUri(ICONS.validate, BRAND), label: '验证' },
  { key: 'history', path: '/pages/history/history', icon: toDataUri(ICONS.history, GRAY), iconSel: toDataUri(ICONS.history, BRAND), label: '历史' },
  { key: 'contact', path: '/pages/contact/contact', icon: toDataUri(ICONS.contact, GRAY), iconSel: toDataUri(ICONS.contact, BRAND), label: '社区' },
  { key: 'profile', path: '/pages/profile/profile', icon: toDataUri(ICONS.profile, GRAY), iconSel: toDataUri(ICONS.profile, BRAND), label: '我的' },
];

Component({
  properties: {
    activeTab: {
      type: String,
      value: '',
    },
  },

  data: {
    safeBottom: 0,
    tabs: TAB_DEFS,
  },

  lifetimes: {
    attached() {
      try {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({
          safeBottom: sysInfo.safeArea ? sysInfo.screenHeight - sysInfo.safeArea.bottom : 0,
        });
      } catch (_) {}
    },
  },

  methods: {
    switchTab(e: WechatMiniprogram.TouchEvent) {
      const key = e.currentTarget.dataset.tab;
      const tab = this.data.tabs.find((t: any) => t.key === key);
      if (!tab || tab.key === this.data.activeTab) return;
      wx.reLaunch({ url: tab.path });
    },
  },
});
