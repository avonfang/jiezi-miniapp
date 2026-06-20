import { request } from '../../utils/api';
import { getBalance, setCachedBalance, invalidateBalanceCache } from '../../utils/credit';
import { getUserId } from '../../utils/auth';

const PLANS = [
  { key: 'basic', name: '体验装', credits: 7, price: '6.90', perPrice: '0.99', recommended: false },
  { key: 'standard', name: '标准装', credits: 15, price: '12.90', perPrice: '0.86', recommended: true },
  { key: 'premium', name: '畅享装', credits: 35, price: '29.90', perPrice: '0.85', recommended: false },
];

const TOPUPS = [
  { key: 'topup_small', name: '小份加油', credits: 3, price: '2.90' },
  { key: 'topup_large', name: '大份加油', credits: 5, price: '3.90' },
];

Page({
  data: {
    plans: PLANS,
    topups: TOPUPS,
    selectedPlan: '',
    currentPrice: '0',
    addedCredits: 0,
    balance: 0,
    paying: false,
    paySuccess: false,
    qrCode: '',
  },

  onShow() {
    this.setData({ paySuccess: false, qrCode: '', selectedPlan: '', currentPrice: '0' });
    getBalance().then(balance => {
      this.setData({ balance: Number(balance) || 0 });
    });
  },

  selectPlan(e: WechatMiniprogram.TouchEvent) {
    const key = e.currentTarget.dataset.key as string;
    const all = [...PLANS, ...TOPUPS];
    const plan = all.find(p => p.key === key);
    if (plan) {
      this.setData({
        selectedPlan: key,
        currentPrice: plan.price,
        addedCredits: plan.credits,
        paySuccess: false,
        qrCode: '',
      });
    }
  },

  async handlePay() {
    if (this.data.paying) return;
    if (!this.data.selectedPlan) return;
    this.setData({ paying: true, qrCode: '' });
    wx.showLoading({ title: '正在创建支付...' });

    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('用户未登录，请重启小程序');
      }

      const res = await request<{
        success: boolean;
        orderId?: string;
        payment?: { timeStamp: string; nonceStr: string; package: string; signType: string; paySign: string };
        qrCode?: string;
      }>({
        path: '/api/wxpay/pay',
        data: { plan: this.data.selectedPlan, userId },
      });

      wx.hideLoading();

      if (!res.success) {
        throw new Error('支付参数获取失败');
      }

      // Auto-confirmed in dev mode (no real payment needed)
      if (!res.payment && !res.qrCode) {
        invalidateBalanceCache();
        const newBalance = await getBalance();
        setCachedBalance(newBalance);
        this.setData({ paySuccess: true, balance: Number(newBalance) || 0, paying: false });
        return;
      }

      // JSAPI mode: wx.requestPayment (works on real devices)
      if (res.payment) {
        const payErr = await wx.requestPayment({
          timeStamp: res.payment.timeStamp,
          nonceStr: res.payment.nonceStr,
          package: res.payment.package,
          signType: res.payment.signType,
          paySign: res.payment.paySign,
        }).catch((e: any) => e);
        if (payErr) {
          throw payErr;
        }
      } else if (res.qrCode) {
        // QR code mode (dev tools / desktop fallback)
        this.setData({ qrCode: res.qrCode, paying: false });
        this.startPollPayment(res.orderId || '');
        return;
      }

      // 支付成功（JSAPI 模式）
      invalidateBalanceCache();
      const newBalance = await getBalance();
      setCachedBalance(newBalance);
      this.setData({ paySuccess: true, balance: Number(newBalance) || 0, paying: false });

    } catch (err: any) {
      wx.hideLoading();
      console.error('支付失败', err);
      // Extract meaningful error message
      let errMsg = '';
      if (err.errMsg) {
        if (err.errMsg.includes('cancel') || err.errMsg.includes('Cancel')) {
          errMsg = '已取消支付';
        } else {
          errMsg = err.errMsg;
        }
      } else if (err.data?.error) {
        errMsg = err.data.error;
      } else if (err.message) {
        errMsg = err.message;
      } else {
        errMsg = '支付失败，请重试';
      }
      wx.showToast({ title: errMsg.length > 20 ? errMsg.slice(0, 19) + '...' : errMsg, icon: 'none', duration: 3000 });
      this.setData({ paying: false });
    }
  },

  startPollPayment(orderId: string) {
    const self = this as any;
    if (self._payTimer || !orderId) return;
    let polls = 0;
    self._payTimer = setInterval(async () => {
      polls++;
      if (polls > 40) {
        clearInterval(self._payTimer);
        self._payTimer = 0;
        wx.showToast({ title: '支付确认超时，请返回查看余额', icon: 'none' });
        return;
      }
      try {
        const res = await request<{ success: boolean; confirmed: boolean }>({
          path: `/api/wxpay/query?orderId=${orderId}`,
          method: 'GET',
        });
        if (res.success && res.confirmed) {
          clearInterval(self._payTimer);
          self._payTimer = 0;
          invalidateBalanceCache();
          const balance = await getBalance();
          setCachedBalance(balance);
          this.setData({ paySuccess: true, balance: Number(balance) || 0, qrCode: '' });
        }
      } catch {}
    }, 3000);
  },

  onUnload() {
    const self = this as any;
    if (self._payTimer) {
      clearInterval(self._payTimer);
      self._payTimer = 0;
    }
  },

  goBack() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  onShareAppMessage() {
    return {
      title: '芥子 - AI 产品创意验证器',
      path: '/pages/index/index',
    };
  },
});
