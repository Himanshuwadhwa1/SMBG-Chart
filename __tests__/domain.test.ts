import { DEFAULT_THRESHOLDS } from '../db/seed';
import {
  calculateRetentionDeadline,
  evaluateRetentionDeadline,
  getClinicalDate,
  isExtremeReading,
  resolveColorBand,
} from '../domain';

describe('Phase 2 — Pure Domain Logic Unit Tests', () => {
  describe('1. Clinical Day Boundary Math (4AM Cutoff Rule)', () => {
    it('should assign timestamps before 04:00:00 to the previous calendar date', () => {
      // 03:59:59 AM on May 15, 2026 -> May 14, 2026
      const dateBeforeCutoff = new Date(2026, 4, 15, 3, 59, 59);
      expect(getClinicalDate(dateBeforeCutoff)).toBe('2026-05-14');
    });

    it('should assign timestamps at exactly 04:00:00 to the current calendar date', () => {
      // 04:00:00 AM on May 15, 2026 -> May 15, 2026
      const dateAtCutoff = new Date(2026, 4, 15, 4, 0, 0);
      expect(getClinicalDate(dateAtCutoff)).toBe('2026-05-15');
    });

    it('should assign timestamps after 04:00:00 to the current calendar date', () => {
      // 04:00:01 AM on May 15, 2026 -> May 15, 2026
      const dateAfterCutoff = new Date(2026, 4, 15, 4, 0, 1);
      expect(getClinicalDate(dateAfterCutoff)).toBe('2026-05-15');
    });

    it('should assign 00:00:00 midnight to the previous calendar date', () => {
      // 00:00:00 AM on May 15, 2026 -> May 14, 2026
      const midnight = new Date(2026, 4, 15, 0, 0, 0);
      expect(getClinicalDate(midnight)).toBe('2026-05-14');
    });

    it('should handle month transitions across 4AM boundary correctly', () => {
      // 03:30:00 AM on May 1, 2026 -> April 30, 2026
      const monthBoundary = new Date(2026, 4, 1, 3, 30, 0);
      expect(getClinicalDate(monthBoundary)).toBe('2026-04-30');
    });

    it('should handle year transitions across 4AM boundary correctly', () => {
      // 02:15:00 AM on Jan 1, 2026 -> Dec 31, 2025
      const yearBoundary = new Date(2026, 0, 1, 2, 15, 0);
      expect(getClinicalDate(yearBoundary)).toBe('2025-12-31');
    });

    it('should handle leap year transitions across 4AM boundary correctly', () => {
      // 01:00:00 AM on March 1, 2024 (leap year) -> Feb 29, 2024
      const leapYearBoundary = new Date(2024, 2, 1, 1, 0, 0);
      expect(getClinicalDate(leapYearBoundary)).toBe('2024-02-29');
    });
  });

  describe('2. Threshold & Color Band Resolution (8 Boundaries x 3 Configs)', () => {
    const preMealConfig = DEFAULT_THRESHOLDS.find((c) => c.config_type === 'pre_meal')!;
    const postMealConfig = DEFAULT_THRESHOLDS.find((c) => c.config_type === 'post_meal')!;
    const threeAmConfig = DEFAULT_THRESHOLDS.find((c) => c.config_type === '3am')!;

    const configsToTest = [
      { name: 'Pre-Meal (BB/BL/BD)', config: preMealConfig },
      { name: 'Post-Meal (AB/AL/AD)', config: postMealConfig },
      { name: '3AM Overnight', config: threeAmConfig },
    ];

    configsToTest.forEach(({ name, config }) => {
      describe(`Config: ${name}`, () => {
        // Boundary 1: bad_low
        it(`bad_low boundary (${config.bad_low})`, () => {
          expect(resolveColorBand(config.bad_low - 1, config)).toBe('extreme_low');
          expect(resolveColorBand(config.bad_low, config)).toBe('bad_low');
          expect(resolveColorBand(config.bad_low + 1, config)).toBe('bad_low');
        });

        // Boundary 2: notsobad_low
        it(`notsobad_low boundary (${config.notsobad_low})`, () => {
          expect(resolveColorBand(config.notsobad_low - 1, config)).toBe('bad_low');
          expect(resolveColorBand(config.notsobad_low, config)).toBe('notsobad_low');
          expect(resolveColorBand(config.notsobad_low + 1, config)).toBe('notsobad_low');
        });

        // Boundary 3: okayish_low
        it(`okayish_low boundary (${config.okayish_low})`, () => {
          expect(resolveColorBand(config.okayish_low - 1, config)).toBe('notsobad_low');
          expect(resolveColorBand(config.okayish_low, config)).toBe('okayish_low');
          expect(resolveColorBand(config.okayish_low + 1, config)).toBe('okayish_low');
        });

        // Boundary 4: ok_low
        it(`ok_low boundary (${config.ok_low})`, () => {
          expect(resolveColorBand(config.ok_low - 1, config)).toBe('okayish_low');
          expect(resolveColorBand(config.ok_low, config)).toBe('ok');
          expect(resolveColorBand(config.ok_low + 1, config)).toBe('ok');
        });

        // Boundary 5: ok_high
        it(`ok_high boundary (${config.ok_high})`, () => {
          expect(resolveColorBand(config.ok_high - 1, config)).toBe('ok');
          expect(resolveColorBand(config.ok_high, config)).toBe('ok');
          expect(resolveColorBand(config.ok_high + 1, config)).toBe('okayish_high');
        });

        // Boundary 6: okayish_high
        it(`okayish_high boundary (${config.okayish_high})`, () => {
          expect(resolveColorBand(config.okayish_high - 1, config)).toBe('okayish_high');
          expect(resolveColorBand(config.okayish_high, config)).toBe('okayish_high');
          expect(resolveColorBand(config.okayish_high + 1, config)).toBe('notsobad_high');
        });

        // Boundary 7: notsobad_high
        it(`notsobad_high boundary (${config.notsobad_high})`, () => {
          expect(resolveColorBand(config.notsobad_high - 1, config)).toBe('notsobad_high');
          expect(resolveColorBand(config.notsobad_high, config)).toBe('notsobad_high');
          expect(resolveColorBand(config.notsobad_high + 1, config)).toBe('bad_high');
        });

        // Boundary 8: bad_high
        it(`bad_high boundary (${config.bad_high})`, () => {
          expect(resolveColorBand(config.bad_high - 1, config)).toBe('bad_high');
          expect(resolveColorBand(config.bad_high, config)).toBe('bad_high');
          expect(resolveColorBand(config.bad_high + 1, config)).toBe('extreme_high');
        });
      });
    });

    it('should identify extreme readings correctly', () => {
      expect(isExtremeReading('extreme_low')).toBe(true);
      expect(isExtremeReading('extreme_high')).toBe(true);
      expect(isExtremeReading('bad_low')).toBe(false);
      expect(isExtremeReading('bad_high')).toBe(false);
      expect(isExtremeReading('ok')).toBe(false);
    });
  });

  describe('3. Retention Deadline Evaluation', () => {
    const oldestTimestamp = new Date(2026, 0, 1, 10, 0, 0).getTime(); // Jan 1, 2026
    const retentionMonths = 4;
    const deadlineTimestamp = calculateRetentionDeadline(oldestTimestamp, retentionMonths); // May 1, 2026

    it('should return isConfigured: false when retention setting is null', () => {
      const status = evaluateRetentionDeadline(null, oldestTimestamp);
      expect(status.isConfigured).toBe(false);
      expect(status.isApproaching).toBe(false);
      expect(status.isExpired).toBe(false);
    });

    it('should evaluate retention one day before deadline (approaching warning active)', () => {
      const oneDayBefore = deadlineTimestamp - 24 * 60 * 60 * 1000;
      const status = evaluateRetentionDeadline(
        retentionMonths,
        oldestTimestamp,
        oneDayBefore,
        7
      );

      expect(status.isConfigured).toBe(true);
      expect(status.isApproaching).toBe(true);
      expect(status.isExpired).toBe(false);
      expect(status.daysRemaining).toBe(1);
    });

    it('should evaluate retention at the exact deadline (expired)', () => {
      const status = evaluateRetentionDeadline(
        retentionMonths,
        oldestTimestamp,
        deadlineTimestamp,
        7
      );

      expect(status.isConfigured).toBe(true);
      expect(status.isExpired).toBe(true);
      expect(status.isApproaching).toBe(false);
      expect(status.daysRemaining).toBe(0);
    });

    it('should evaluate retention one day after deadline (expired)', () => {
      const oneDayAfter = deadlineTimestamp + 24 * 60 * 60 * 1000;
      const status = evaluateRetentionDeadline(
        retentionMonths,
        oldestTimestamp,
        oneDayAfter,
        7
      );

      expect(status.isConfigured).toBe(true);
      expect(status.isExpired).toBe(true);
      expect(status.isApproaching).toBe(false);
      expect(status.daysRemaining).toBeLessThan(0);
    });
  });
});
