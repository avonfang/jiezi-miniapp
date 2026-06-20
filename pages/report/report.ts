import { getReport, getLastIdea } from '../../utils/storage';

Page({
  data: {
    report: {} as any,
    verdictClass: '',
    summaryItems: [] as any[],
    scoreItems: [] as any[],
    hasPrd: false,
  },

  onLoad() {
    const report = getReport();
    if (!report) {
      wx.showToast({ title: '没有报告数据', icon: 'none' });
      return;
    }

    const verdictClass = report.verdict === '建议尝试' ? 'try'
      : report.verdict === '值得探索' ? 'explore' : 'no';

    const summaryItems = [
      { label: '市场机会', value: report.summary?.market_opportunity || '-', icon: '📊' },
      { label: '技术难度', value: report.summary?.tech_difficulty || '-', icon: '🔧' },
      { label: '启动成本', value: report.summary?.startup_cost || '-', icon: '💰' },
      { label: '回本周期', value: report.summary?.payback_period || '-', icon: '⏱' },
    ];

    const SCORE_DEFS: { key: string; label: string }[] = [
      { key: 'market_size', label: '市场规模' },
      { key: 'user_demand', label: '用户需求' },
      { key: 'competition_density', label: '竞争密度' },
      { key: 'monetization_potential', label: '付费潜力' },
      { key: 'tech_feasibility', label: '技术可行性' },
      { key: 'team_cost', label: '团队成本' },
    ];

    const rawScoring = report.scoring || {};
    const scoreItems = SCORE_DEFS
      .filter(d => rawScoring[d.key] !== undefined)
      .map(d => {
        const value = rawScoring[d.key] as number;
        let colorClass = 'mid';
        if (value > 3) colorClass = 'high';
        else if (value < 3) colorClass = 'low';
        return { key: d.key, label: d.label, value, colorClass };
      });

    const hasPrd = !!wx.getStorageSync('jiezi-prd');
    this.setData({ report, verdictClass, summaryItems, scoreItems, hasPrd });
  },

  goPrd() {
    const hasPrd = !!wx.getStorageSync('jiezi-prd');
    wx.navigateTo({ url: hasPrd ? '/pages/prd/prd' : '/pages/prd/prd?auto=1' });
  },

  goBack() {
    wx.navigateBack();
  },

  goHome() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    const idea = getLastIdea();

    // Build share card image URL
    const report = this.data.report;
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

    return {
      title: `芥子验证：${idea.slice(0, 40)}`,
      path: '/pages/index/index',
      imageUrl: `https://jiezi.site/api/share-card?${qs}`,
    };
  },
});
