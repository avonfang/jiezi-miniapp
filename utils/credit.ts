import { request } from './api';

let cachedBalance = 0;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

function toNumber(v: any): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseInt(v, 10) || 0;
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    // 服务端可能返回 { remaining: n } 或 { total: n } 等嵌套格式
    return toNumber(v.remaining ?? v.total ?? v.balance ?? 0);
  }
  return 0;
}

export async function getBalance(): Promise<number> {
  const now = Date.now();
  if (now - lastFetchTime < CACHE_TTL) {
    return cachedBalance;
  }
  try {
    const res = await request<any>({
      path: '/api/credits',
      method: 'GET',
    });
    const b = toNumber(res.balance ?? res.data?.balance ?? res.remaining ?? 0);
    cachedBalance = b;
    lastFetchTime = now;
    return b;
  } catch {
    return cachedBalance;
  }
}

export function getCachedBalance(): number {
  return cachedBalance;
}

export function setCachedBalance(b: number) {
  cachedBalance = toNumber(b);
}

/** 使余额缓存失效，下次 getBalance 会重新请求服务端 */
export function invalidateBalanceCache() {
  lastFetchTime = 0;
}

/** 领取新用户奖励（20 积分） */
export async function claimNewUserBonus(): Promise<number> {
  try {
    const res = await request<any>({
      path: '/api/auth/bonus/new-user',
      method: 'POST',
    });
    if (res.success) {
      const b = toNumber(res.balance ?? res.data?.balance ?? 0);
      cachedBalance = b;
      lastFetchTime = Date.now();
      return b;
    }
    return toNumber(cachedBalance);
  } catch {
    return toNumber(cachedBalance);
  }
}

/** 领取分享奖励（5 积分） */
export async function claimShareBonus(): Promise<number> {
  try {
    const res = await request<any>({
      path: '/api/credits/bonus/share',
      method: 'POST',
    });
    if (res.success) {
      const b = toNumber(res.balance ?? res.data?.balance ?? 0);
      cachedBalance = b;
      lastFetchTime = Date.now();
      return b;
    }
    return toNumber(cachedBalance);
  } catch {
    return toNumber(cachedBalance);
  }
}
