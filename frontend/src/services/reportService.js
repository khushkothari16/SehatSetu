import { delay, getStored, STORAGE_KEYS } from './api';
import { INITIAL_REPORTS } from '../data/mockData';

export const reportService = {
  async getReports() {
    await delay(200);
    return getStored(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
  },

  async getReportById(id) {
    await delay(150);
    const reports = getStored(STORAGE_KEYS.REPORTS, INITIAL_REPORTS);
    const rep = reports.find(r => r.id === id);
    if (!rep) throw new Error('Report not found');
    return rep;
  }
};
