import React from 'react';
import { Alert, Share } from 'react-native';
import TestRenderer, { act } from 'react-test-renderer';

import { resetTestDatabase } from '../__mocks__/expo-sqlite';
import {
  createReading,
  deleteAllReadings,
  initDb,
  resetDbInstance,
} from '../db';
import {
  escapeCsvField,
  escapeXml,
  exportReadings,
  EXPORT_COLUMNS,
  generateCsv,
  generateExcelXml,
  generateXlsx,
  transformReadingsToWideFormat,
  WideExportRow,
} from '../export';
import { ExportSettings } from '../screens/settings/ExportSettings';
import { ThemeProvider } from '../state/ThemeContext';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

describe('Phase 7 — Export Pipeline & Wide Format Tests', () => {
  beforeEach(async () => {
    resetDbInstance();
    resetTestDatabase();
    await initDb();
    jest.clearAllMocks();
  });

  describe('1. Pure Wide-Format Data Transformation', () => {
    it('returns empty array when no readings are provided', () => {
      expect(transformReadingsToWideFormat([])).toEqual([]);
    });

    it('transforms readings into wide format with exact specified column names and slot order', () => {
      const readings = [
        {
          id: 1,
          slot: 'BB' as const,
          value: 95,
          timestamp: new Date('2026-10-14T08:00:00').getTime(),
          clinical_date: '2026-10-14',
          comment: 'fasting',
          created_at: Date.now(),
          updated_at: Date.now(),
          tags: [],
        },
        {
          id: 2,
          slot: 'AL' as const,
          value: 135,
          timestamp: new Date('2026-10-14T14:00:00').getTime(),
          clinical_date: '2026-10-14',
          comment: null,
          created_at: Date.now(),
          updated_at: Date.now(),
          tags: [],
        },
      ];

      const rows = transformReadingsToWideFormat(readings);
      expect(rows).toHaveLength(1);

      const row = rows[0];
      expect(row.date).toBe('2026-10-14');
      expect(row.BB).toBe(95);
      expect(row.AB).toBeNull();
      expect(row.BL).toBeNull();
      expect(row.AL).toBe(135);
      expect(row.BD).toBeNull();
      expect(row.AD).toBeNull();
      expect(row['3AM']).toBeNull();
      expect(row.comments).toBe('BB: fasting');
    });

    it('groups readings by clinical day using 4AM cutoff rule', () => {
      // 03:45 AM on Oct 15 -> clinical date Oct 14
      // 08:30 AM on Oct 15 -> clinical date Oct 15
      const tsLateNight = new Date('2026-10-15T03:45:00').getTime();
      const tsMorning = new Date('2026-10-15T08:30:00').getTime();

      const readings = [
        {
          id: 1,
          slot: '3AM' as const,
          value: 88,
          timestamp: tsLateNight,
          clinical_date: '', // intentionally empty to verify fallback to 4AM rule
          comment: null,
          created_at: Date.now(),
          updated_at: Date.now(),
          tags: [],
        },
        {
          id: 2,
          slot: 'BB' as const,
          value: 102,
          timestamp: tsMorning,
          clinical_date: '', // intentionally empty to verify fallback to 4AM rule
          comment: null,
          created_at: Date.now(),
          updated_at: Date.now(),
          tags: [],
        },
      ];

      const rows = transformReadingsToWideFormat(readings);
      expect(rows).toHaveLength(2);
      expect(rows[0].date).toBe('2026-10-14');
      expect(rows[0]['3AM']).toBe(88);
      expect(rows[1].date).toBe('2026-10-15');
      expect(rows[1].BB).toBe(102);
    });

    it('aggregates comments and tags across multiple slots on the same day', () => {
      const readings = [
        {
          id: 1,
          slot: 'BB' as const,
          value: 90,
          timestamp: Date.now(),
          clinical_date: '2026-10-14',
          comment: 'woke up early',
          created_at: Date.now(),
          updated_at: Date.now(),
          tags: [{ id: 1, name: 'Fasting', is_system_default: true, is_active: true }],
        },
        {
          id: 2,
          slot: 'BD' as const,
          value: 125,
          timestamp: Date.now(),
          clinical_date: '2026-10-14',
          comment: 'pasta meal',
          created_at: Date.now(),
          updated_at: Date.now(),
          tags: [{ id: 2, name: 'Heavy Carbs', is_system_default: true, is_active: true }],
        },
      ];

      const rows = transformReadingsToWideFormat(readings);
      expect(rows).toHaveLength(1);
      expect(rows[0].comments).toBe(
        'BB: woke up early [Fasting]; BD: pasta meal [Heavy Carbs]'
      );
    });

    it('correctly maps all 7 slots on a completely filled day', () => {
      const slots = ['BB', 'AB', 'BL', 'AL', 'BD', 'AD', '3AM'] as const;
      const readings = slots.map((slot, index) => ({
        id: index + 1,
        slot,
        value: 100 + index * 10,
        timestamp: Date.now(),
        clinical_date: '2026-10-14',
        comment: null,
        created_at: Date.now(),
        updated_at: Date.now(),
        tags: [],
      }));

      const rows = transformReadingsToWideFormat(readings);
      expect(rows).toHaveLength(1);
      expect(rows[0].BB).toBe(100);
      expect(rows[0].AB).toBe(110);
      expect(rows[0].BL).toBe(120);
      expect(rows[0].AL).toBe(130);
      expect(rows[0].BD).toBe(140);
      expect(rows[0].AD).toBe(150);
      expect(rows[0]['3AM']).toBe(160);
      expect(rows[0].comments).toBe('');
    });
  });

  describe('2. CSV Writer & RFC 4180 Escaping', () => {
    it('escapes fields with commas, quotes, and newlines per RFC 4180', () => {
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
      expect(escapeCsvField(120)).toBe('120');
      expect(escapeCsvField('normal text')).toBe('normal text');
      expect(escapeCsvField('has,comma')).toBe('"has,comma"');
      expect(escapeCsvField('has "quotes"')).toBe('"has ""quotes"""');
      expect(escapeCsvField('has\nnewline')).toBe('"has\nnewline"');
    });

    it('generates exact CSV output with header and empty slots as empty strings', () => {
      const rows: WideExportRow[] = [
        {
          date: '2026-10-14',
          BB: 95,
          AB: null,
          BL: null,
          AL: 140,
          BD: null,
          AD: null,
          '3AM': null,
          comments: 'BB: fasting, calm morning',
        },
      ];

      const csv = generateCsv(rows);
      const lines = csv.split('\r\n');

      expect(lines[0]).toBe('date,BB,AB,BL,AL,BD,AD,3AM,comments');
      expect(lines[1]).toBe('2026-10-14,95,,,140,,,,"BB: fasting, calm morning"');
    });
  });

  describe('3. Excel / XLSX Writer & XML Escaping', () => {
    it('escapes XML special characters correctly', () => {
      expect(escapeXml(null)).toBe('');
      expect(escapeXml('Salt & Pepper')).toBe('Salt &amp; Pepper');
      expect(escapeXml('<tag>')).toBe('&lt;tag&gt;');
      expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
      expect(escapeXml("'apostrophe'")).toBe('&apos;apostrophe&apos;');
    });

    it('generates valid SpreadsheetML XML with styles, headers, and correct cell types', () => {
      const rows: WideExportRow[] = [
        {
          date: '2026-10-14',
          BB: 95,
          AB: null,
          BL: null,
          AL: null,
          BD: null,
          AD: null,
          '3AM': null,
          comments: 'BB: fasting & resting',
        },
      ];

      const xml = generateExcelXml(rows);

      // Verify XML header and Excel workbook structure
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"');
      expect(xml).toContain('<Worksheet ss:Name="SMBG Logbook">');

      // Verify all export columns in header
      for (const col of EXPORT_COLUMNS) {
        expect(xml).toContain(`<Data ss:Type="String">${col}</Data>`);
      }

      // Verify data types: date is string, glucose is number
      expect(xml).toContain('<Cell ss:StyleID="DateStyle"><Data ss:Type="String">2026-10-14</Data></Cell>');
      expect(xml).toContain('<Cell ss:StyleID="NumberStyle"><Data ss:Type="Number">95</Data></Cell>');

      // Verify XML escaping in comments
      expect(xml).toContain('fasting &amp; resting');

      // generateXlsx is alias to generateExcelXml
      expect(generateXlsx(rows)).toBe(xml);
    });
  });

  describe('4. DB Layer End-to-End Export Pipeline', () => {
    it('queries by date range and produces full export result', async () => {
      // Seed 3 days
      await createReading({
        slot: 'BB',
        value: 92,
        timestamp: new Date('2026-09-01T08:00:00').getTime(),
        clinical_date: '2026-09-01',
        comment: 'early september',
      });
      await createReading({
        slot: 'BB',
        value: 98,
        timestamp: new Date('2026-10-10T08:00:00').getTime(),
        clinical_date: '2026-10-10',
        comment: 'mid october',
      });
      await createReading({
        slot: 'BL',
        value: 125,
        timestamp: new Date('2026-10-10T12:30:00').getTime(),
        clinical_date: '2026-10-10',
      });
      await createReading({
        slot: 'BB',
        value: 104,
        timestamp: new Date('2026-11-05T08:00:00').getTime(),
        clinical_date: '2026-11-05',
      });

      // Filter to October only
      const resultCsv = await exportReadings({
        startDate: '2026-10-01',
        endDate: '2026-10-31',
        format: 'csv',
      });

      expect(resultCsv.rowCount).toBe(1); // Only 1 day in October
      expect(resultCsv.readingCount).toBe(2); // 2 readings on that day
      expect(resultCsv.filename).toMatch(/^smbg_logbook_\d{4}-\d{2}-\d{2}\.csv$/);
      expect(resultCsv.mimeType).toBe('text/csv');
      expect(resultCsv.content).toContain('2026-10-10,98,,125,,,,,BB: mid october');
      expect(resultCsv.content).not.toContain('2026-09-01');
      expect(resultCsv.content).not.toContain('2026-11-05');

      expect(resultCsv.fileUri).toBeDefined();
      expect(resultCsv.fileUri).toContain(resultCsv.filename);

      // Export all in Excel format
      const resultXls = await exportReadings({
        format: 'xlsx',
      });
      expect(resultXls.rowCount).toBe(3); // 3 distinct clinical days
      expect(resultXls.readingCount).toBe(4);
      expect(resultXls.filename).toMatch(/^smbg_logbook_\d{4}-\d{2}-\d{2}\.xls$/);
      expect(resultXls.mimeType).toBe('application/vnd.ms-excel');
      expect(resultXls.fileUri).toBeDefined();
      expect(resultXls.fileUri).toContain(resultXls.filename);
      expect(resultXls.content).toContain('2026-09-01');
      expect(resultXls.content).toContain('2026-10-10');
      expect(resultXls.content).toContain('2026-11-05');
    });
  });

  describe('5. ExportSettings UI Component Tests', () => {
    it('renders format buttons, date range buttons, and triggers Share.share on export', async () => {
      // Seed 1 reading
      await createReading({
        slot: 'BB',
        value: 94,
        timestamp: Date.now(),
        clinical_date: '2026-10-14',
        comment: 'morning fasting',
      });

      const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as any);

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <ThemeProvider>
            <ExportSettings />
          </ThemeProvider>
        );
      });

      // Verify card and format options exist
      expect(tree!.root.findByProps({ testID: 'export-settings-card' })).toBeDefined();
      const csvBtn = tree!.root.findByProps({ testID: 'export-format-csv' });
      const xlsxBtn = tree!.root.findByProps({ testID: 'export-format-xlsx' });
      const allRangeBtn = tree!.root.findByProps({ testID: 'export-range-all' });
      const exportShareBtn = tree!.root.findByProps({ testID: 'export-share-button' });

      // Click Excel option
      await act(async () => {
        xlsxBtn.props.onPress();
      });

      // Click Export & Share
      await act(async () => {
        await exportShareBtn.props.onPress();
      });

      expect(shareSpy).toHaveBeenCalledTimes(1);
      const shareArg = shareSpy.mock.calls[0][0];
      expect(shareArg.title).toMatch(/\.xls$/);
      expect(shareArg.url).toMatch(/\.xls$/);
      expect(shareArg.message).toContain('SMBG Logbook Export:');
      expect(shareArg.message).toContain('<Workbook');

      // Check status message
      const statusText = tree!.root.findByProps({ testID: 'export-status-message' });
      expect(statusText.props.children).toMatch(/Generated smbg_logbook_.*\.xls \(1 days, 1 readings\)\./);
    });

    it('shows alert if no readings exist for the selected range', async () => {
      await deleteAllReadings();
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <ThemeProvider>
            <ExportSettings />
          </ThemeProvider>
        );
      });

      const exportShareBtn = tree!.root.findByProps({ testID: 'export-share-button' });
      await act(async () => {
        await exportShareBtn.props.onPress();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'No Readings',
        'There are no readings to export in the selected range.'
      );
    });

    it('saves physical file directly to device storage using StorageAccessFramework', async () => {
      await createReading({
        slot: 'BB',
        value: 110,
        timestamp: new Date('2026-10-14T08:00:00').getTime(),
        clinical_date: '2026-10-14',
      });

      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

      let tree: TestRenderer.ReactTestRenderer;
      await act(async () => {
        tree = TestRenderer.create(
          <ThemeProvider>
            <ExportSettings />
          </ThemeProvider>
        );
      });

      const saveFileBtn = tree!.root.findByProps({ testID: 'export-save-file-button' });
      await act(async () => {
        await saveFileBtn.props.onPress();
      });

      expect(alertSpy).toHaveBeenCalledWith(
        'File Saved',
        expect.stringMatching(/smbg_logbook_.*\.csv was saved to your device\./)
      );
    });
  });
});
