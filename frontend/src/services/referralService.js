import { delay, getStored, STORAGE_KEYS } from './api';
import { INITIAL_REFERRALS, INITIAL_FOLLOW_UPS } from '../data/mockData';

export const referralService = {
  async getReferrals() {
    await delay(200);
    return getStored(STORAGE_KEYS.REFERRALS, INITIAL_REFERRALS);
  },

  async getReferralById(id) {
    await delay(150);
    const referrals = getStored(STORAGE_KEYS.REFERRALS, INITIAL_REFERRALS);
    const ref = referrals.find(r => r.id === id);
    if (!ref) throw new Error('Referral not found');
    return ref;
  }
};

export const followUpService = {
  async getFollowUps() {
    await delay(200);
    return getStored(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
  }
};
