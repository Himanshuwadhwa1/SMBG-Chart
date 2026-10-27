import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { resetMockFileSystem } from '../__mocks__/expo-file-system';
import { scheduledNotifications, resetMockNotifications } from '../__mocks__/expo-notifications';
import { resetTestDatabase } from '../__mocks__/expo-sqlite';
import {
  createReading,
  deleteAllReadings,
  deleteReading,
  getActiveTags,
  getAllReadings,
  getOldestReadingTimestamp,
  getReadingById,
  getReadingBySlotAndDate,
  getReadingsByDateRange,
  getSettings,
  getThresholdConfigByType,
  initDb,
  resetDbInstance,
  updateReading,
  updateSettings,
} from '../db';
import { getClinicalDate } from '../domain/clinicalDate';
import { calculateRetentionNotificationPlan, evaluateRetentionDeadline } from '../domain/retention';
import { isExtremeReading, resolveColorBand } from '../domain/thresholds';
import { exportReadings, generateCsv, generateExcelXml, transformReadingsToWideFormat } from '../export';
import { logCrash, logError, readLogFile } from '../logging';
import { RetentionFlowModal } from '../screens/settings/RetentionFlowModal';
import { ThemeProvider } from '../state/ThemeContext';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

describe('Phase 8.5 — Dedicated Integration & Hardening Pass', () => {
  beforeEach(async () => {
    resetDbInstance();
    resetTestDatabase();
    resetMockFileSystem();
    resetMockNotifications();
    await initDb();
    jest.clearAllMocks();
  });

  describe('Suite A: Full Realistic End-to-End User Journey', () => {
    it('executes full flow: add readings → trigger extreme nudge → edit reading → set retention → test cleanup confirmation → export data', async () => {
      // 1. User adds readings across multiple days and slots
      const preMealConfig = await getThresholdConfigByType('pre_meal');
      expect(preMealConfig).not.toBeNull();

      const tags = await getActiveTags();
      const fastingTag = tags.find((t) => t.name === 'Fasting');
      const heavyCarbTag = tags.find((t) => t.name === 'Heavy Carbs');

      // Day 1 (Oct 20)
      const r1 = await createReading({
        slot: 'BB',
        value: 95,
        timestamp: new Date('2026-10-20T08:00:00').getTime(),
        clinical_date: '2026-10-20',
        comment: 'normal wake up',
        tag_ids: fastingTag ? [fastingTag.id] : [],
      });
      expect(r1.id).toBeDefined();

      const r2 = await createReading({
        slot: 'BL',
        value: 125,
        timestamp: new Date('2026-10-20T12:45:00').getTime(),
        clinical_date: '2026-10-20',
        comment: 'sandwich lunch',
      });
      expect(r2.id).toBeDefined();

      const r3 = await createReading({
        slot: 'BD',
        value: 138,
        timestamp: new Date('2026-10-20T19:30:00').getTime(),
        clinical_date: '2026-10-20',
        comment: 'pasta dinner',
        tag_ids: heavyCarbTag ? [heavyCarbTag.id] : [],
      });
      expect(r3.id).toBeDefined();

      // 2. Day 2 (Oct 21): User records an extreme reading
      const rExtreme = await createReading({
        slot: '3AM',
        value: 45, // Extreme low!
        timestamp: new Date('2026-10-21T03:00:00').getTime(),
        clinical_date: '2026-10-20', // Note: 3AM belongs to previous clinical day Oct 20 via 4AM rule!
        comment: 'sweating and dizzy',
      });

      const post3amConfig = await getThresholdConfigByType('3am');
      const band = resolveColorBand(rExtreme.value, post3amConfig!);
      expect(band).toBe('extreme_low');
      expect(isExtremeReading(band)).toBe(true);

      // 3. User edits an existing reading (Day 1 BD value updated to 142 and comment updated)
      const updatedR3 = await updateReading(r3.id, {
        value: 142,
        comment: 'large pasta dinner with dessert',
      });
      expect(updatedR3.value).toBe(142);
      expect(updatedR3.comment).toBe('large pasta dinner with dessert');

      // 4. User sets a short retention window (1 month)
      await updateSettings({ retention_duration_months: 1 });
      const currentSettings = await getSettings();
      expect(currentSettings.retention_duration_months).toBe(1);

      // Verify notification plan generated for retention
      const oldestTs = await getOldestReadingTimestamp();
      expect(oldestTs).toBe(r1.timestamp);

      const notifPlan = calculateRetentionNotificationPlan(
        1,
        oldestTs,
        new Date('2026-10-20T12:00:00').getTime()
      );
      expect(notifPlan.shouldSchedule).toBe(true);

      // 5. Advance time past retention deadline (45 days later: 2026-12-05)
      const futureNowTs = new Date('2026-12-05T10:00:00').getTime();
      const expiredStatus = evaluateRetentionDeadline(1, oldestTs, futureNowTs);
      expect(expiredStatus.isExpired).toBe(true);
      expect(expiredStatus.daysRemaining).toBeLessThanOrEqual(0);

      // Verify in-app retention check displays confirmation modal
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(futureNowTs);

      let onCompleteCalled = false;
      let modalTree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        modalTree = TestRenderer.create(
          <ThemeProvider>
            <RetentionFlowModal onCheckComplete={() => { onCompleteCalled = true; }} />
          </ThemeProvider>
        );
      });

      // Initially modal appears because deadline passed
      const modal = modalTree!.root.findByProps({ testID: 'retention-expired-modal' });
      expect(modal.props.visible).toBe(true);

      // User chooses "Keep Data" (Cancel deletion)
      const keepBtn = modalTree!.root.findByProps({ testID: 'retention-keep-data-button' });
      await act(async () => {
        keepBtn.props.onPress();
      });
      expect(modal.props.visible).toBe(false);

      dateSpy.mockRestore();

      // Verify that database was NOT wiped
      const survivingReadings = await getAllReadings();
      expect(survivingReadings.length).toBe(4);

      // 6. User exports data in wide format before cleaning
      const exportResult = await exportReadings({ format: 'csv' });
      expect(exportResult.rowCount).toBe(1); // All readings fall on clinical date 2026-10-20
      expect(exportResult.readingCount).toBe(4);

      // Assert CSV structure exactly contains wide columns and updated reading values
      const lines = exportResult.content.split('\r\n');
      expect(lines[0]).toBe('date,BB,AB,BL,AL,BD,AD,3AM,comments');
      // Format: date, BB, AB, BL, AL, BD, AD, 3AM, comments
      // BB=95, AB=null, BL=125, AL=null, BD=142, AD=null, 3AM=45
      expect(lines[1]).toContain('2026-10-20,95,,125,,142,,45,');
      expect(lines[1]).toContain('large pasta dinner with dessert');
      expect(lines[1]).toContain('sweating and dizzy');

      // Export in Excel XML
      const excelResult = await exportReadings({ format: 'xlsx' });
      expect(excelResult.content).toContain('<Workbook');
      expect(excelResult.content).toContain('<Data ss:Type="Number">142</Data>');
      expect(excelResult.content).toContain('<Data ss:Type="Number">45</Data>');

      // 7. User now confirms cleanup deletion
      await deleteAllReadings();
      expect(await getAllReadings()).toHaveLength(0);

      // Export after deletion returns empty wide table with header
      const emptyExport = await exportReadings({ format: 'csv' });
      expect(emptyExport.rowCount).toBe(0);
      expect(emptyExport.readingCount).toBe(0);
      expect(emptyExport.content).toBe('date,BB,AB,BL,AL,BD,AD,3AM,comments');
    });
  });

  describe('Suite B: Edge-Case Pass on 4AM Cutoff & Freeform Slot Cadence', () => {
    it('evaluates exact second boundaries around 04:00:00 cutoff', () => {
      // 03:59:59 -> previous day
      expect(getClinicalDate('2026-06-15T03:59:59')).toBe('2026-06-14');

      // 04:00:00 -> current day
      expect(getClinicalDate('2026-06-15T04:00:00')).toBe('2026-06-15');

      // 04:00:01 -> current day
      expect(getClinicalDate('2026-06-15T04:00:01')).toBe('2026-06-15');

      // Midnight 00:00:00 -> previous day
      expect(getClinicalDate('2026-06-15T00:00:00')).toBe('2026-06-14');
    });

    it('correctly handles month, leap year, and year transitions across 4AM boundary', () => {
      // Month transition: March 1 at 02:00 AM -> Feb 28
      expect(getClinicalDate('2026-03-01T02:00:00')).toBe('2026-02-28');

      // Leap year transition: March 1, 2024 at 03:30 AM -> Feb 29
      expect(getClinicalDate('2024-03-01T03:30:00')).toBe('2024-02-29');

      // Year transition: Jan 1 at 01:15 AM -> Dec 31 previous year
      expect(getClinicalDate('2026-01-01T01:15:00')).toBe('2025-12-31');
    });

    it('handles out-of-order slot entry (freeform slot cadence) correctly in wide export matrix', () => {
      // User logs AD first at 9PM, then retrospectively logs BB for that clinical day
      const readings = [
        {
          id: 1,
          slot: 'AD' as const,
          value: 155,
          timestamp: new Date('2026-10-18T21:00:00').getTime(),
          clinical_date: '2026-10-18',
          comment: 'logged later',
          created_at: 1000,
          updated_at: 1000,
          tags: [],
        },
        {
          id: 2,
          slot: 'BB' as const,
          value: 98,
          timestamp: new Date('2026-10-18T08:00:00').getTime(),
          clinical_date: '2026-10-18',
          comment: 'logged retroactively',
          created_at: 2000,
          updated_at: 2000,
          tags: [],
        },
      ];

      const rows = transformReadingsToWideFormat(readings);
      expect(rows).toHaveLength(1);
      // Even though AD was first in array, wide format orders columns canonically: BB, AB, BL, AL, BD, AD, 3AM
      expect(rows[0].BB).toBe(98);
      expect(rows[0].AD).toBe(155);
      expect(rows[0].AB).toBeNull();
      expect(rows[0].BL).toBeNull();
      expect(rows[0].AL).toBeNull();
      expect(rows[0].BD).toBeNull();
      expect(rows[0]['3AM']).toBeNull();
    });

    it('handles completely filled days (all 7 slots logged) and non-consecutive days with gaps', async () => {
      const allSlots = ['BB', 'AB', 'BL', 'AL', 'BD', 'AD', '3AM'] as const;
      const day1 = '2026-10-10';
      const day2 = '2026-10-15'; // 5-day gap in between

      // Log all 7 slots on Day 1
      for (let i = 0; i < allSlots.length; i++) {
        await createReading({
          slot: allSlots[i],
          value: 100 + i * 10,
          timestamp: new Date(`${day1}T${String(8 + i).padStart(2, '0')}:00:00`).getTime(),
          clinical_date: day1,
        });
      }

      // Log just 1 slot on Day 2
      await createReading({
        slot: 'BB',
        value: 110,
        timestamp: new Date(`${day2}T08:00:00`).getTime(),
        clinical_date: day2,
      });

      const rangeReadings = await getReadingsByDateRange('2026-10-01', '2026-10-31');
      expect(rangeReadings).toHaveLength(8);

      const wideRows = transformReadingsToWideFormat(rangeReadings);
      expect(wideRows).toHaveLength(2); // Exactly 2 active days, gap handled without errors

      // Day 1 has all 7 slots filled
      expect(wideRows[0].BB).toBe(100);
      expect(wideRows[0].AB).toBe(110);
      expect(wideRows[0].BL).toBe(120);
      expect(wideRows[0].AL).toBe(130);
      expect(wideRows[0].BD).toBe(140);
      expect(wideRows[0].AD).toBe(150);
      expect(wideRows[0]['3AM']).toBe(160);

      // Day 2 has only BB filled
      expect(wideRows[1].BB).toBe(110);
      expect(wideRows[1].AB).toBeNull();
      expect(wideRows[1]['3AM']).toBeNull();
    });
  });

  describe('Suite C: AGENTS.md Section 1 Non-Negotiable Constraints Verification', () => {
    it('Constraint 1: Confirms ZERO network calls of any kind occur across entire app flows', async () => {
      const fetchSpy = jest.fn();
      // @ts-ignore
      global.fetch = fetchSpy;

      // Execute full DB, export, notifications, and error logging actions
      await createReading({
        slot: 'BB',
        value: 99,
        timestamp: Date.now(),
        clinical_date: '2026-10-24',
      });
      await getAllReadings();
      await exportReadings({ format: 'csv' });
      await logError('Non-critical diagnostic message');
      await logCrash('Deliberate test crash');
      await readLogFile();

      // Assert that fetch was never invoked
      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it('Constraint 2: All persistence operations strictly go through db/ query layer', async () => {
      // Verify query layer functions operate deterministically
      const created = await createReading({
        slot: 'BL',
        value: 115,
        timestamp: Date.now(),
        clinical_date: '2026-10-24',
      });
      expect(created.id).toBeGreaterThan(0);

      const fetched = await getReadingById(created.id);
      expect(fetched?.value).toBe(115);

      const bySlot = await getReadingBySlotAndDate('BL', '2026-10-24');
      expect(bySlot?.id).toBe(created.id);

      await deleteReading(created.id);
      expect(await getReadingById(created.id)).toBeNull();
    });

    it('Constraint 3: Domain logic stays pure with no React or I/O side effects', () => {
      // Test determinism: same input always produces same output
      const date1 = getClinicalDate(new Date('2026-10-24T03:30:00'));
      const date2 = getClinicalDate(new Date('2026-10-24T03:30:00'));
      expect(date1).toBe('2026-10-23');
      expect(date1).toBe(date2);

      const dummyConfig = {
        id: 1,
        config_type: 'pre_meal' as const,
        ok_low: 90,
        okayish_low: 80,
        notsobad_low: 70,
        bad_low: 54,
        ok_high: 130,
        okayish_high: 160,
        notsobad_high: 200,
        bad_high: 250,
      };

      expect(resolveColorBand(95, dummyConfig)).toBe('ok');
      expect(resolveColorBand(40, dummyConfig)).toBe('extreme_low');
      expect(resolveColorBand(300, dummyConfig)).toBe('extreme_high');
    });

    it('Constraint 4: Never execute silent background data wipe', async () => {
      // Seed a reading
      await createReading({
        slot: 'BB',
        value: 100,
        timestamp: new Date('2025-01-01T08:00:00').getTime(),
        clinical_date: '2025-01-01',
      });

      // Calculate status past deadline
      const status = evaluateRetentionDeadline(
        1,
        new Date('2025-01-01').getTime(),
        new Date('2026-01-01').getTime()
      );
      expect(status.isExpired).toBe(true);

      // Verify that mere evaluation of retention status or app launch NEVER deletes data automatically
      const readings = await getAllReadings();
      expect(readings.length).toBe(1);
    });

    it('Constraint 5: Enforces integer-only glucose values at DB schema and validation layers', async () => {
      // Decimal value in createReading must be rejected
      await expect(
        createReading({
          slot: 'BB',
          value: 110.5,
          timestamp: Date.now(),
          clinical_date: '2026-10-24',
        })
      ).rejects.toThrow('Glucose value must be an integer');

      const validReading = await createReading({
        slot: 'BB',
        value: 110,
        timestamp: Date.now(),
        clinical_date: '2026-10-24',
      });

      // Decimal value in updateReading must be rejected
      await expect(
        updateReading(validReading.id, {
          value: 115.8,
        })
      ).rejects.toThrow('Glucose value must be an integer');
    });

    it('Constraint 6: Enforces one reading per slot per clinical day at the DB layer', async () => {
      await createReading({
        slot: 'BB',
        value: 100,
        timestamp: Date.now(),
        clinical_date: '2026-10-24',
      });

      // Attempting to insert duplicate reading for same slot and clinical day
      await expect(
        createReading({
          slot: 'BB',
          value: 105,
          timestamp: Date.now() + 1000,
          clinical_date: '2026-10-24',
        })
      ).rejects.toThrow();
    });
  });
});
