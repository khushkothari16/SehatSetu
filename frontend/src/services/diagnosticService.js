import { delay, getStored, setStored, STORAGE_KEYS } from './api';
import { INITIAL_TESTS, INITIAL_REPORTS } from '../data/mockData';

export const diagnosticService = {
  async getAvailableTests(searchTerm = '') {
    await delay(200);
    const tests = getStored(STORAGE_KEYS.TESTS, INITIAL_TESTS);
    if (!searchTerm || !searchTerm.trim()) return tests;
    const q = searchTerm.toLowerCase();
    return tests.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  },

  async bookTest({ testId, facilityName, date, time, sampleMode }) {
    await delay(350);
    const tests = getStored(STORAGE_KEYS.TESTS, INITIAL_TESTS);
    const test = tests.find(t => t.id === testId);
    if (!test) throw new Error('Test not found');

    const bookingRef = `DIAG-BK-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      bookingId: bookingRef,
      testName: test.name,
      facility: facilityName || 'Khed PHC Pathology Laboratory',
      date,
      time,
      sampleMode: sampleMode || 'Lab Visit',
      status: 'Confirmed',
      instructions: test.fastingRequired ? 'Please observe 8-10 hours overnight fasting.' : 'Normal diet allowed.'
    };
  }
};

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
