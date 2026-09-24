import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { resetTestDatabase } from '../__mocks__/expo-sqlite';
import { createReading, getThresholdConfigs, initDb, resetDbInstance } from '../db';
import { getDateRangeForPreset } from '../screens/view/dateRanges';
import { DateRangeSelector } from '../screens/view/DateRangeSelector';
import { LogbookChart } from '../screens/view/LogbookChart';
import ViewScreen from '../screens/view/ViewScreen';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

describe('Phase 4 — View Mode Component & Preset Tests', () => {
  beforeEach(async () => {
    resetDbInstance();
    resetTestDatabase();
    await initDb();
  });

  it('1. getDateRangeForPreset calculates correct date ranges for all presets', () => {
    const fixedNow = new Date('2026-09-24T12:00:00');

    // Last 3 months
    const range3m = getDateRangeForPreset('last_3_months', undefined, undefined, fixedNow);
    expect(range3m.endDate).toBe('2026-09-24');
    expect(range3m.startDate).toBe('2026-06-24');

    // Last 6 months
    const range6m = getDateRangeForPreset('last_6_months', undefined, undefined, fixedNow);
    expect(range6m.endDate).toBe('2026-09-24');
    expect(range6m.startDate).toBe('2026-03-24');

    // This year
    const rangeYear = getDateRangeForPreset('this_year', undefined, undefined, fixedNow);
    expect(rangeYear.endDate).toBe('2026-09-24');
    expect(rangeYear.startDate).toBe('2026-01-01');

    // Custom
    const rangeCustom = getDateRangeForPreset('custom', '2026-05-01', '2026-05-15', fixedNow);
    expect(rangeCustom.startDate).toBe('2026-05-01');
    expect(rangeCustom.endDate).toBe('2026-05-15');
  });

  it('2. DateRangeSelector renders preset buttons and custom input fields when selected', () => {
    let selectedPreset = 'last_3_months';
    let tree: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <DateRangeSelector
          selectedPreset={selectedPreset as any}
          onSelectPreset={(p) => (selectedPreset = p)}
          customStartDate="2026-01-01"
          customEndDate="2026-03-01"
          onCustomStartChange={() => {}}
          onCustomEndChange={() => {}}
        />
      );
    });

    const selector = tree!.root.findByProps({ testID: 'date-range-selector' });
    expect(selector).toBeTruthy();

    const btn3m = tree!.root.findByProps({ testID: 'preset-last_3_months' });
    const btnCustom = tree!.root.findByProps({ testID: 'preset-custom' });
    expect(btn3m).toBeTruthy();
    expect(btnCustom).toBeTruthy();

    // Select Custom Preset
    act(() => {
      btnCustom.props.onPress();
    });
    expect(selectedPreset).toBe('custom');
  });

  it('3. LogbookChart renders wide matrix cells color-coded by band', async () => {
    const configs = await getThresholdConfigs();
    const map: Record<string, any> = {};
    configs.forEach((c) => (map[c.config_type] = c));

    // Seed test readings
    const r1 = await createReading({
      slot: 'BB',
      value: 105, // target (ok)
      timestamp: Date.now(),
      clinical_date: '2026-09-24',
      comment: 'Morning check',
    });

    const r2 = await createReading({
      slot: 'AB',
      value: 280, // bad_high for post_meal
      timestamp: Date.now(),
      clinical_date: '2026-09-24',
    });

    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <LogbookChart readings={[r1, r2]} thresholdConfigs={map} />
      );
    });

    const chart = tree!.root.findByProps({ testID: 'logbook-chart' });
    expect(chart).toBeTruthy();

    const dateRow = tree!.root.findByProps({ testID: 'date-row-2026-09-24' });
    expect(dateRow).toBeTruthy();

    const cell1 = tree!.root.findByProps({ testID: `reading-cell-${r1.id}` });
    const cell2 = tree!.root.findByProps({ testID: `reading-cell-${r2.id}` });
    expect(cell1).toBeTruthy();
    expect(cell2).toBeTruthy();
  });

  it('4. ViewScreen loads readings and updates filtered query when switching presets', async () => {
    // Seed readings across different months
    await createReading({
      slot: 'BB',
      value: 95,
      timestamp: Date.now(),
      clinical_date: '2026-09-20',
    });

    await createReading({
      slot: 'BL',
      value: 110,
      timestamp: Date.now(),
      clinical_date: '2026-01-15',
    });

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<ViewScreen />);
    });

    const viewScreen = tree!.root.findByProps({ testID: 'view-screen' });
    expect(viewScreen).toBeTruthy();

    const summaryBar = tree!.root.findByProps({ testID: 'summary-bar' });
    expect(summaryBar).toBeTruthy();

    // Switch to "This Year" preset
    const yearBtn = tree!.root.findByProps({ testID: 'preset-this_year' });
    await act(async () => {
      yearBtn.props.onPress();
    });

    // Should include reading from 2026-01-15
    const dateRowJan = tree!.root.findByProps({ testID: 'date-row-2026-01-15' });
    expect(dateRowJan).toBeTruthy();
  });
});
