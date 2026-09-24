import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { resetTestDatabase } from '../__mocks__/expo-sqlite';
import {
  addCustomTag,
  createReading,
  getActiveTags,
  getAllReadings,
  getThresholdConfigByType,
  initDb,
  resetDbInstance,
} from '../db';
import { resolveColorBand } from '../domain/thresholds';
import { RetentionSettings } from '../screens/settings/RetentionSettings';
import SettingsScreen from '../screens/settings/SettingsScreen';
import { TagManager } from '../screens/settings/TagManager';
import { ThresholdEditor } from '../screens/settings/ThresholdEditor';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

describe('Phase 5 — Settings Component & Logic Tests', () => {
  beforeEach(async () => {
    resetDbInstance();
    resetTestDatabase();
    await initDb();
  });

  it('1. ThresholdEditor persists edited boundary values and updates domain band resolution', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<ThresholdEditor />);
    });

    const okLowInput = tree!.root.findByProps({ testID: 'input-ok_low' });
    const saveButton = tree!.root.findByProps({ testID: 'save-thresholds-button' });

    // Change pre_meal ok_low from 90 to 85
    await act(async () => {
      okLowInput.props.onChangeText('85');
    });

    await act(async () => {
      saveButton.props.onPress();
    });

    const updatedConfig = await getThresholdConfigByType('pre_meal');
    expect(updatedConfig?.ok_low).toBe(85);

    // Value 88 with new config (ok_low = 85, ok_high = 130) resolves to 'ok' instead of 'okayish_low'
    const band = resolveColorBand(88, updatedConfig!);
    expect(band).toBe('ok');
  });

  it('2. TagManager adding custom tag and deactivating tag hides it from getActiveTags() while preserving historical readings', async () => {
    // Add custom tag
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TagManager />);
    });

    const newTagInput = tree!.root.findByProps({ testID: 'input-new-tag' });
    const addTagButton = tree!.root.findByProps({ testID: 'add-tag-button' });

    await act(async () => {
      newTagInput.props.onChangeText('Late Supper');
    });

    await act(async () => {
      addTagButton.props.onPress();
    });

    let active = await getActiveTags();
    const createdTag = active.find((t) => t.name === 'Late Supper');
    expect(createdTag).toBeTruthy();

    // Attach to historical reading
    const reading = await createReading({
      slot: 'AD',
      value: 140,
      timestamp: Date.now(),
      clinical_date: '2026-09-24',
      tag_ids: [createdTag!.id],
    });

    // Deactivate tag via manager
    const toggleButton = tree!.root.findByProps({ testID: `toggle-tag-${createdTag!.id}` });
    await act(async () => {
      toggleButton.props.onPress();
    });

    // Deactivated tag must NOT appear in getActiveTags()
    active = await getActiveTags();
    expect(active.find((t) => t.id === createdTag!.id)).toBeUndefined();

    // Historical reading MUST still preserve the tag!
    const allReadings = await getAllReadings();
    const historical = allReadings.find((r) => r.id === reading.id);
    expect(historical?.tags.some((t) => t.id === createdTag!.id)).toBe(true);
  });

  it('3. TagManager blocks deletion of tag referenced by a reading', async () => {
    const tag = await addCustomTag('Workout Session');
    await createReading({
      slot: 'AL',
      value: 120,
      timestamp: Date.now(),
      clinical_date: '2026-09-24',
      tag_ids: [tag.id],
    });

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<TagManager />);
    });

    const deleteButton = tree!.root.findByProps({ testID: `delete-tag-${tag.id}` });
    await act(async () => {
      deleteButton.props.onPress();
    });

    // Error banner should report deletion blocked
    const messageBanner = tree!.root.findByProps({ testID: 'tag-message' });
    expect(messageBanner).toBeTruthy();
  });

  it('4. RetentionSettings allows selecting retention duration and manual Clean Now deletes all readings', async () => {
    // Seed readings
    await createReading({
      slot: 'BB',
      value: 100,
      timestamp: Date.now(),
      clinical_date: '2026-09-24',
    });

    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<RetentionSettings />);
    });

    // Select 4 Months retention
    const opt4m = tree!.root.findByProps({ testID: 'retention-opt-4' });
    await act(async () => {
      opt4m.props.onPress();
    });

    // Manual Clean Now (deletes all readings)
    const cleanButton = tree!.root.findByProps({ testID: 'clean-now-button' });
    await act(async () => {
      cleanButton.props.onPress();
    });

    const remaining = await getAllReadings();
    expect(remaining).toHaveLength(0);
  });

  it('5. SettingsScreen renders all section cards', async () => {
    let tree: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<SettingsScreen />);
    });

    expect(tree!.root.findByProps({ testID: 'settings-screen' })).toBeTruthy();
    expect(tree!.root.findByProps({ testID: 'unit-system-card' })).toBeTruthy();
    expect(tree!.root.findByProps({ testID: 'threshold-editor' })).toBeTruthy();
    expect(tree!.root.findByProps({ testID: 'tag-manager' })).toBeTruthy();
    expect(tree!.root.findByProps({ testID: 'retention-settings' })).toBeTruthy();
  });
});
