import { request } from './api';

const TOKEN_KEY = 'jiezi-auth-token';
const USER_ID_KEY = 'jiezi-user-id';
const USERNAME_KEY = 'jiezi-username';
const AVATAR_KEY = 'jiezi-avatar';

// 内存缓存，避免重复同步读 storage
let _cache: { token: string; userId: string; username: string; avatar: string } | null = null;

function readCache() {
  if (!_cache) {
    _cache = {
      token: wx.getStorageSync(TOKEN_KEY) || '',
      userId: wx.getStorageSync(USER_ID_KEY) || '',
      username: wx.getStorageSync(USERNAME_KEY) || '',
      avatar: wx.getStorageSync(AVATAR_KEY) || '',
    };
  }
  return _cache;
}

function invalidateCache() {
  _cache = null;
}

interface LoginResult {
  success: boolean;
  userId: string;
  token: string;
  balance: number;
  username: string;
  nickName?: string;
  avatarBase64?: string;
  isNew: boolean;
}

/** 微信静默登录 */
export async function wechatLogin(): Promise<LoginResult | null> {
  try {
    const token = wx.getStorageSync(TOKEN_KEY);
    if (token) {
      // 已有 token，恢复用户信息
      const userId = wx.getStorageSync(USER_ID_KEY);
      const username = wx.getStorageSync(USERNAME_KEY);
      if (userId) {
        return { userId, token, username, success: true, balance: 0, isNew: false };
      }
    }

    // 获取微信 code
    const loginRes = await wx.login();
    if (!loginRes.code) {
      console.error('微信登录失败', loginRes);
      return null;
    }

    const anonymousId = wx.getStorageSync('jiezi-client-id') || '';

    // 调用后端微信登录
    const res = await request<LoginResult>({
      path: '/api/auth/wechat',
      data: { code: loginRes.code, anonymousId },
      noAuth: true,
    });

    if (res.success && res.token) {
      wx.setStorageSync(TOKEN_KEY, res.token);
      wx.setStorageSync(USER_ID_KEY, res.userId);
      const displayName = res.nickName || res.username || `用户${res.userId.slice(-4)}`;
      wx.setStorageSync(USERNAME_KEY, displayName);
      if (res.avatarBase64) {
        wx.setStorageSync(AVATAR_KEY, res.avatarBase64);
      }
      invalidateCache();
    }

    return res;
  } catch (err) {
    console.error('静默登录失败', err);
    return null;
  }
}

/** 更新用户资料（昵称、头像） */
export async function updateProfile(nickName: string, avatarBase64?: string): Promise<boolean> {
  try {
    const body: any = { nickName };
    if (avatarBase64) body.avatarBase64 = avatarBase64;

    await request({
      path: '/api/auth/wechat/profile',
      method: 'PUT',
      data: body,
    });

    wx.setStorageSync(USERNAME_KEY, nickName);
    if (avatarBase64) {
      wx.setStorageSync(AVATAR_KEY, avatarBase64);
    }
    invalidateCache();
    return true;
  } catch (err) {
    console.error('更新资料失败', err);
    return false;
  }
}

/** 从后端获取用户资料 */
export async function fetchProfile(): Promise<{ nickName: string; avatarBase64?: string } | null> {
  try {
    const res = await request<{ success: boolean; nickName: string; avatarBase64?: string }>({
      path: '/api/auth/wechat/profile',
      method: 'GET',
    });
    return res.success ? { nickName: res.nickName, avatarBase64: res.avatarBase64 } : null;
  } catch {
    return null;
  }
}

export function logout() {
  wx.removeStorageSync(TOKEN_KEY);
  wx.removeStorageSync(USER_ID_KEY);
  wx.removeStorageSync(USERNAME_KEY);
  wx.removeStorageSync(AVATAR_KEY);
  invalidateCache();
}

export function getToken(): string {
  return readCache().token;
}

export function getUserId(): string {
  return readCache().userId;
}

export function getUsername(): string {
  const cached = readCache().username;
  return cached || `用户${getUserId().slice(-4)}`;
}

export function getAvatarUrl(): string {
  return readCache().avatar;
}

export function isLoggedIn(): boolean {
  return !!(readCache().token || readCache().userId);
}

/** 生成带分享追踪的路径 */
export function getSharePath(): string {
  const userId = readCache().userId;
  return userId ? `/pages/index/index?sharedBy=${userId}` : '/pages/index/index';
}
