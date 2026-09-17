import { delay, getStored, setStored, STORAGE_KEYS } from './api';
import { INITIAL_FOLLOW_UPS } from '../data/mockData';

export const followUpService = {
  async getFollowUps() {
    await delay(200);
    return getStored(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
  },

  async createFollowUp(followUpData) {
    await delay(200);
    const existing = getStored(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
    const newFollowUp = {
      id: followUpData.id || `FUP-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Upcoming',
      ...followUpData
    };
    const updated = [newFollowUp, ...existing.filter(f => f.id !== newFollowUp.id)];
    setStored(STORAGE_KEYS.FOLLOW_UPS, updated);
    window.dispatchEvent(new CustomEvent('followup_created', { detail: newFollowUp }));
    return newFollowUp;
  },

  async updateFollowUp(id, updates) {
    await delay(200);
    const existing = getStored(STORAGE_KEYS.FOLLOW_UPS, INITIAL_FOLLOW_UPS);
    const updated = existing.map(f => f.id === id ? { ...f, ...updates } : f);
    setStored(STORAGE_KEYS.FOLLOW_UPS, updated);
    window.dispatchEvent(new CustomEvent('followup_created', { detail: { id, ...updates } }));
    return updated.find(f => f.id === id);
  }
};
