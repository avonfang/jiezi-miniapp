interface PostTag {
  label: string;
  class?: string;
}

interface DataPoint {
  label: string;
  value: string;
}

interface Post {
  id: string;
  type: 'idea' | 'project' | 'showcase';
  accent: string;
  tags: PostTag[];
  title: string;
  desc: string;
  author: string;
  actionText: string;
  progress?: number;
  roles?: string[];
  dataPoints?: DataPoint[];
}

const POSTS: Post[] = [
  {
    id: '1',
    type: 'idea',
    accent: 'orange',
    tags: [
      { label: '🔥 热门讨论', class: 'hot' },
      { label: 'AI 应用' },
    ],
    title: '有没有人觉得现在的待办清单太复杂了？我想做一个"只做三件事"的极简 App。',
    desc: '现在的 Todo 软件功能太多了，我只想每天专注最重要的三件事。大家觉得这个切入点怎么样？求拍砖！',
    author: '@产品小王',
    actionText: '💬 128 条评论完善想法',
  },
  {
    id: '2',
    type: 'project',
    accent: 'blue',
    tags: [
      { label: '🚀 开发中', class: 'dev' },
    ],
    title: '[项目招募] 独立开发者寻找 UI 搭档，做一个 AI 写作助手',
    desc: '核心 Prompt 调试已完成，后端接口已通。目前缺一个能设计简洁风格界面的 UI 设计师，感兴趣的一起聊聊？',
    author: '@独立开发者',
    actionText: '🤝 加入讨论',
    progress: 65,
    roles: ['🎨 寻 UI 设计', '⏱️ 预计耗时 2 周'],
  },
  {
    id: '3',
    type: 'showcase',
    accent: 'green',
    tags: [
      { label: '✅ 已上线', class: 'live' },
    ],
    title: '我的小程序上线首周复盘：从 0 到 500 用户',
    desc: '分享我在小红书引流的实操经验，以及第一版被用户吐槽最多的功能点...',
    author: '@创业阿强',
    actionText: '👍 2k+ 点赞学习',
    dataPoints: [
      { label: '次日留存率', value: '12%' },
      { label: '平均使用时长', value: '3.5min' },
    ],
  },
  {
    id: '4',
    type: 'idea',
    accent: 'orange',
    tags: [
      { label: '💡 创意', class: '' },
      { label: 'AI 工具' },
    ],
    title: '用 AI 帮用户自动生成小红书文案，这个方向有搞头吗？',
    desc: '调研了一圈竞品，发现大部分只是套模板生成。如果能结合用户的产品卖点和目标人群做差异化，会不会是壁垒？',
    author: '@运营小林',
    actionText: '💬 67 条评论',
  },
  {
    id: '5',
    type: 'project',
    accent: 'blue',
    tags: [
      { label: '🛠️ 招募中', class: 'dev' },
    ],
    title: '想做一款面向独居老人的智能提醒硬件，寻嵌入式开发者',
    desc: '软件原型已做好，找有硬件经验的伙伴一起搞。初期聚焦用药提醒和摔倒检测两个核心功能。',
    author: '@硬件小白',
    actionText: '🤝 私聊合作',
    progress: 20,
    roles: ['🔧 嵌入式开发', '📱 小程序开发'],
  },
  {
    id: '6',
    type: 'showcase',
    accent: 'green',
    tags: [
      { label: '📊 数据复盘', class: 'live' },
    ],
    title: '产品上线 30 天，我们主动砍掉了 40% 的功能',
    desc: 'MVP 上线后发现 80% 的用户只用 3 个核心功能。果断砍掉冗余功能后，留存反而涨了。',
    author: '@产品老王',
    actionText: '📈 查看详情',
    dataPoints: [
      { label: '功能砍掉', value: '40%' },
      { label: '留存提升', value: '+15%' },
    ],
  },
];

const TAB_DEFS = [
  { key: 'all', label: '全部' },
  { key: 'idea', label: '灵感 💡' },
  { key: 'project', label: '招募 🛠️' },
  { key: 'showcase', label: '复盘 📊' },
];

Page({
  data: {
    tabs: TAB_DEFS,
    activeTab: 'all',
    posts: POSTS,
    filteredPosts: POSTS,
  },

  onShow() {
  },

  switchTab(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string;
    if (key === this.data.activeTab) return;
    this.setData({ activeTab: key });
    this.filterPosts(key);
  },

  filterPosts(key: string) {
    if (key === 'all') {
      this.setData({ filteredPosts: this.data.posts });
    } else {
      this.setData({
        filteredPosts: this.data.posts.filter((p: Post) => p.type === key),
      });
    }
  },

  onPublish() {
    wx.showToast({ title: '即将开放，敬请期待', icon: 'none' });
  },

  onCardTap(e: WechatMiniprogram.TouchEvent) {
    const id = e.currentTarget.dataset.id as string;
    wx.showToast({ title: `帖子 ${id} 详情开发中`, icon: 'none' });
  },

  onShareAppMessage() {
    return {
      title: '芥子 - AI 产品创意验证器',
      path: '/pages/index/index',
    };
  },
});
