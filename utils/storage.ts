/** 本地存储封装，统一管理 key */

const KEYS = {
  HISTORY: 'jiezi-history',
  REPORT: 'jiezi-full-report',
  PRD: 'jiezi-prd',
  PREVIEW: 'jiezi-preview',
  LAST_IDEA: 'jiezi-last-idea',
};

export const STORAGE_KEYS = KEYS;

export interface HistoryItem {
  idea: string;
  verdict: string;
  timestamp: number;
  hasPrd: boolean;
  hasPreview: boolean;
}

/** 保存历史记录（最多 20 条） */
export function saveHistory(item: HistoryItem) {
  if (!item.idea || !item.idea.trim()) return;
  const list = getHistory();
  list.unshift(item);
  // 去重（同 idea + 同 timestamp 视为重复）
  const seen = new Set<string>();
  const unique = list.filter(i => {
    const key = `${i.idea}|${i.verdict}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  wx.setStorageSync(KEYS.HISTORY, unique.slice(0, 20));
}

export function getHistory(): HistoryItem[] {
  try {
    return wx.getStorageSync(KEYS.HISTORY) || [];
  } catch {
    return [];
  }
}

export function clearHistory() {
  wx.setStorageSync(KEYS.HISTORY, []);
}

export function deleteHistoryItem(index: number) {
  const list = getHistory();
  list.splice(index, 1);
  wx.setStorageSync(KEYS.HISTORY, list);
}

// 当前验证报告（临时存储）
export function saveReport(report: any) {
  wx.setStorageSync(KEYS.REPORT, report);
}

export function getReport(): any {
  try {
    return wx.getStorageSync(KEYS.REPORT) || null;
  } catch {
    return null;
  }
}

export function savePrd(prd: any) {
  wx.setStorageSync(KEYS.PRD, prd);
}

export function savePreview(preview: any) {
  wx.setStorageSync(KEYS.PREVIEW, preview);
}

/** 更新历史记录中匹配项的标记（如 hasPrd / hasPreview），只更新最新一条 */
export function updateHistoryItem(idea: string, updates: Partial<Pick<HistoryItem, 'hasPrd' | 'hasPreview'>>) {
  const list = getHistory();
  for (const item of list) {
    if (item.idea === idea) {
      if (updates.hasPrd !== undefined) { item.hasPrd = updates.hasPrd; }
      if (updates.hasPreview !== undefined) { item.hasPreview = updates.hasPreview; }
      wx.setStorageSync(KEYS.HISTORY, list);
      return;
    }
  }
}

/** 保存/获取当前验证的产品想法 */
export function saveLastIdea(idea: string) {
  wx.setStorageSync(KEYS.LAST_IDEA, idea);
}
export function getLastIdea(): string {
  try { return wx.getStorageSync(KEYS.LAST_IDEA) || ''; } catch { return ''; }
}
export function removeLastIdea() {
  wx.removeStorageSync(KEYS.LAST_IDEA);
}
