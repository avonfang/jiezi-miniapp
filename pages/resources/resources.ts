interface Article {
  id: string;
  category: string;
  categoryClass: string;
  title: string;
  desc: string;
  author: string;
  date: string;
  readTime: string;
  likes: number;
}

const ARTICLES: Article[] = [
  {
    id: '1',
    category: '产品方法',
    categoryClass: 'cat-method',
    title: '如何用 AI 快速验证你的产品想法？一套完整的实操框架',
    desc: '从定义问题到输出验证报告，教你用芥子 + AI 工具在 48 小时内完成一次低成本的产品验证。',
    author: '芥子团队',
    date: '2026.06.15',
    readTime: '8 分钟',
    likes: 342,
  },
  {
    id: '2',
    category: '市场分析',
    categoryClass: 'cat-market',
    title: '2026 年 AI 创业赛道扫描：哪些方向还有红利？',
    desc: '基于近半年数千份验证报告的数据分析，梳理出当前竞争密度低、用户需求强的 5 个细分方向。',
    author: '数据分析师 Leo',
    date: '2026.06.12',
    readTime: '12 分钟',
    likes: 521,
  },
  {
    id: '3',
    category: '实战案例',
    categoryClass: 'cat-case',
    title: '从 0 到 1：一个独立开发者用芥子验证想法到上线全过程',
    desc: '真实记录：如何用一周时间完成想法验证、生成 PRD、上线 MVP，并获得第一批种子用户。',
    author: '@独立开发者小王',
    date: '2026.06.08',
    readTime: '15 分钟',
    likes: 897,
  },
  {
    id: '4',
    category: '开发经验',
    categoryClass: 'cat-dev',
    title: '小程序云开发实战：快速搭建 AI 应用后端',
    desc: '分享使用微信云开发 + AI API 搭建生产级应用的最佳实践，包括成本控制和性能优化。',
    author: '全栈工程师 Alex',
    date: '2026.06.05',
    readTime: '10 分钟',
    likes: 234,
  },
  {
    id: '5',
    category: '产品方法',
    categoryClass: 'cat-method',
    title: 'MVP 砍功能指南：如何判断哪些功能真正值得做？',
    desc: '每次想加功能之前，先问自己三个问题。这套筛选框架帮我们砍掉了 60% 的冗余需求。',
    author: '芥子团队',
    date: '2026.05.28',
    readTime: '6 分钟',
    likes: 456,
  },
  {
    id: '6',
    category: '创业心得',
    categoryClass: 'cat-startup',
    title: '写给第一次创业的你：关于找方向、找人、找钱的 10 条建议',
    desc: '踩过无数坑后的真诚复盘。方向比努力重要，但验证方向的方法比方向本身更重要。',
    author: '连续创业者 老张',
    date: '2026.05.20',
    readTime: '20 分钟',
    likes: 1203,
  },
  {
    id: '7',
    category: '市场分析',
    categoryClass: 'cat-market',
    title: '垂直 SaaS 在 2026 年的机会：小而美的生存法则',
    desc: '大厂看不上的细分市场，往往是独立开发者的金矿。从选赛道到定价，一份完整的策略指南。',
    author: 'SaaS 观察者 Mia',
    date: '2026.05.15',
    readTime: '14 分钟',
    likes: 678,
  },
  {
    id: '8',
    category: '开发经验',
    categoryClass: 'cat-dev',
    title: '用 AI 写代码的真实体验：效率提升与踩坑记录',
    desc: '三个月深度使用 AI 辅助开发后的总结：哪些工作 AI 真的能替代，哪些还是得自己来。',
    author: '@代码诗人',
    date: '2026.05.10',
    readTime: '8 分钟',
    likes: 567,
  },
  {
    id: '9',
    category: '实战案例',
    categoryClass: 'cat-case',
    title: '上线首月获取 2000 用户的冷启动策略',
    desc: '不花一分钱广告费，纯靠内容运营和社交裂变实现用户增长的完整拆解。',
    author: '增长黑客 Joyce',
    date: '2026.05.05',
    readTime: '12 分钟',
    likes: 934,
  },
];

const CATEGORIES = [
  { key: 'all', label: '全部' },
  { key: 'cat-method', label: '产品方法' },
  { key: 'cat-market', label: '市场分析' },
  { key: 'cat-case', label: '实战案例' },
  { key: 'cat-dev', label: '开发经验' },
  { key: 'cat-startup', label: '创业心得' },
];

Page({
  data: {
    categories: CATEGORIES,
    activeCat: 'all',
    articles: ARTICLES,
    filteredArticles: ARTICLES,
  },

  switchCat(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string;
    if (key === this.data.activeCat) return;
    this.setData({ activeCat: key });
    this.filterArticles(key);
  },

  filterArticles(key: string) {
    if (key === 'all') {
      this.setData({ filteredArticles: this.data.articles });
    } else {
      this.setData({
        filteredArticles: this.data.articles.filter((a: Article) => a.categoryClass === key),
      });
    }
  },

  onArticleTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.showToast({ title: `文章 ${id} 详情开发中`, icon: 'none' });
  },

  onShareAppMessage() {
    return { title: '芥子 - AI 产品创意验证器', path: '/pages/index/index' };
  },
});
