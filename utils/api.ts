const BASE_URL = (() => {
  try {
    const env = wx.getAccountInfoSync().miniProgram.envVersion;
    return env === 'develop' ? 'http://localhost:3000' : 'https://jiezi.site';
  } catch {
    return 'https://jiezi.site';
  }
})();
const STORAGE_TOKEN = 'jiezi-auth-token';
const STORAGE_CLIENT_ID = 'jiezi-client-id';

function getClientId(): string {
  let id = wx.getStorageSync(STORAGE_CLIENT_ID);
  if (!id) {
    id = 'wx_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    wx.setStorageSync(STORAGE_CLIENT_ID, id);
  }
  return id;
}

export function request<T>(options: {
  path: string;
  method?: 'GET' | 'POST' | 'PUT';
  data?: any;
  noAuth?: boolean;
  timeout?: number;
}): Promise<T> {
  return new Promise((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!options.noAuth) {
      const token = wx.getStorageSync(STORAGE_TOKEN);
      if (token) {
        header['Authorization'] = `Bearer ${token}`;
      } else {
        header['x-client-id'] = getClientId();
      }
    }

    wx.request({
      url: `${BASE_URL}${options.path}`,
      method: options.method || 'POST',
      data: options.data,
      header,
      timeout: options.timeout || 120000,
      success: (res) => {
        if (res.statusCode >= 400) {
          reject({ code: res.statusCode, data: res.data });
        } else {
          resolve(res.data as T);
        }
      },
      fail: (err) => reject({ code: 0, message: err.errMsg || '网络错误' }),
    });
  });
}

/** 非流式调用验证/PRD/预览接口（mode=json 模式） */
export async function requestNonStream<T>(path: string, data: any, timeout = 180000): Promise<T> {
  const sep = path.includes('?') ? '&' : '?';
  return request<T>({ path: `${path}${sep}mode=json`, data, timeout });
}
