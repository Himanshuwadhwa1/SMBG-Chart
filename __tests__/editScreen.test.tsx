import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';

import { resetTestDatabase } from '../__mocks__/expo-sqlite';
import { createReading, getAllReadings, initDb, resetDbInstance } from '../db';
import EditScreen from '../screens/edit/EditScreen';
import { ExtremeNudgeModal } from '../screens/edit/ExtremeNudgeModal';
import { SlotPicker, SLOTS } from '../screens/edit/SlotPicker';
import { TagPicker } from '../screens/edit/TagPicker';

// @ts-ignore
global.IS_REACT_ACT_ENVIRONMENT = true;

describe('Phase 3 — Edit Mode Component & Flow Tests', () => {
  beforeEach(async () => {
    resetDbInstance();
    resetTestDatabase();
    await initDb();
  });

  it('1. Slot picker renders all 7 fixed slot options', () => {
    let selectedSlot = 'BB';
    let tree: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        <SlotPicker
          selectedSlot={selectedSlot as any}
          onSelectSlot={(s) => (selectedSlot = s)}
        />
      );
    });

    const picker = tree!.root.findByProps({ testID: 'slot-picker' });
    expect(picker).toBeTruthy();

    SLOTS.forEach((slot) => {
      const button = tree!.root.findByProps({ testID: `slot-option-${slot.code}` });
      expect(button).toBeTruthy();
    });

    expect(SLOTS).toHaveLength(7);
  });

  it('2. TagPicker renders active tags and supports toggling', () => {
    const mockTags = [
      { id: 1, name: 'Missed meal', is_system_default: true, is_active: true },
      { id: 2, name: 'Heavy meal', is_system_default: true, is_active: true },
    ];
    let selectedIds: number[] = [1];

    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <TagPicker
          activeTags={mockTags}
          selectedTagIds={selectedIds}
          onToggleTag={(id) => {
            selectedIds = selectedIds.includes(id)
              ? selectedIds.filter((x) => x !== id)
              : [...selectedIds, id];
          }}
        />
      );
    });

    const chip1 = tree!.root.findByProps({ testID: 'tag-chip-1' });
    const chip2 = tree!.root.findByProps({ testID: 'tag-chip-2' });

    expect(chip1).toBeTruthy();
    expect(chip2).toBeTruthy();

    // Toggle chip 2
    act(() => {
      chip2.props.onPress();
    });
    expect(selectedIds).toContain(2);
  });

  it('3. ExtremeNudgeModal renders and supports dismissal and comment saving', () => {
    let dismissed = false;
    let savedComment = '';

    let tree: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(
        <ExtremeNudgeModal
          visible={true}
          colorBand="extreme_low"
          value={35}
          initialComment=""
          onDismiss={() => (dismissed = true)}
          onSaveComment={(c) => (savedComment = c)}
        />
      );
    });

    const modal = tree!.root.findByProps({ testID: 'extreme-nudge-modal' });
    expect(modal).toBeTruthy();

    const input = tree!.root.findByProps({ testID: 'extreme-nudge-input' });
    act(() => {
      input.props.onChangeText('Skipped lunch due to meeting');
    });

    const saveButton = tree!.root.findByProps({ testID: 'extreme-nudge-save' });
    act(() => {
      saveButton.props.onPress();
    });

    expect(savedComment).toBe('Skipped lunch due to meeting');

    const dismissButton = tree!.root.findByProps({ testID: 'extreme-nudge-dismiss' });
    act(() => {
      dismissButton.props.onPress();
    });

    expect(dismissed).toBe(true);
  });

  it('4. EditScreen renders, logs reading, and edits/deletes reading correctly', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<EditScreen />);
    });

    const valueInput = tree!.root.findByProps({ testID: 'value-input' });
    const saveButton = tree!.root.findByProps({ testID: 'save-button' });

    // Enter glucose value
    await act(async () => {
      valueInput.props.onChangeText('115');
    });

    // Save reading
    await act(async () => {
      saveButton.props.onPress();
    });

    // Verify reading was saved to DB
    const readings = await getAllReadings();
    expect(readings.length).toBeGreaterThan(0);
    const saved = readings[0];
    expect(saved.value).toBe(115);
    expect(saved.slot).toBe('BB');

    // Edit value to 125
    await act(async () => {
      valueInput.props.onChangeText('125');
    });

    await act(async () => {
      saveButton.props.onPress();
    });

    const updatedReadings = await getAllReadings();
    expect(updatedReadings[0].value).toBe(125);

    // Delete entry
    const deleteButton = tree!.root.findByProps({ testID: 'delete-button' });
    await act(async () => {
      deleteButton.props.onPress();
    });

    const remainingReadings = await getAllReadings();
    expect(remainingReadings).toHaveLength(0);
  });

  it('5. EditScreen rejects non-integer inputs with error message', async () => {
    let tree: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(<EditScreen />);
    });

    const valueInput = tree!.root.findByProps({ testID: 'value-input' });
    const saveButton = tree!.root.findByProps({ testID: 'save-button' });

    await act(async () => {
      valueInput.props.onChangeText('120.5');
    });

    await act(async () => {
      saveButton.props.onPress();
    });

    const errorBanner = tree!.root.findByProps({ testID: 'error-banner' });
    expect(errorBanner).toBeTruthy();
  });
});
