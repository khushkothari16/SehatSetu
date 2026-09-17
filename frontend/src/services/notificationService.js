import { delay, getStored, setStored, STORAGE_KEYS } from './api';
import { INITIAL_NOTIFICATIONS } from '../data/mockData';

export const notificationService = {
  async getNotifications() {
    await delay(150);
    return getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  },

  async markAsRead(id) {
    await delay(100);
    const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  },

  async markAllAsRead() {
    await delay(100);
    const notifs = getStored(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const updated = notifs.map(n => ({ ...n, read: true }));
    setStored(STORAGE_KEYS.NOTIFICATIONS, updated);
    return updated;
  }
};
