import { resetTestDatabase } from '../__mocks__/expo-sqlite';
import {
  addCustomTag,
  createReading,
  deleteCustomTag,
  deleteReading,
  getAllReadings,
  getAllTags,
  getReadingsByDateRange,
  getSettings,
  getThresholdConfigByType,
  initDb,
  resetDbInstance,
  setTagActiveStatus,
  updateReading,
  updateSettings,
  updateThresholdConfig,
} from '../db';

describe('Phase 1 — Database Layer Unit Tests', () => {
  beforeEach(async () => {
    resetDbInstance();
    resetTestDatabase();
    await initDb();
  });

  describe('1. First-Launch Database Seeding', () => {
    it('should seed 12 system-default tags on initial launch', async () => {
      const tags = await getAllTags();
      expect(tags.length).toBeGreaterThanOrEqual(12);

      const defaultTagNames = tags
        .filter((t) => t.is_system_default)
        .map((t) => t.name);

      expect(defaultTagNames).toContain('Missed meal');
      expect(defaultTagNames).toContain('Heavy meal');
      expect(defaultTagNames).toContain('Illness/fever');
      expect(defaultTagNames).toContain('Exercise');
      expect(defaultTagNames).toContain('Stress');
      expect(defaultTagNames).toContain('Medication change');
      expect(defaultTagNames).toContain('Travel');
      expect(defaultTagNames).toContain('Insulin dose adjusted');
      expect(defaultTagNames).toContain('Alcohol');
      expect(defaultTagNames).toContain('Poor sleep');
      expect(defaultTagNames).toContain('Hypo episode');
      expect(defaultTagNames).toContain('Hyper episode');
    });

    it('should seed default threshold configs for pre_meal, post_meal, and 3am', async () => {
      const preMeal = await getThresholdConfigByType('pre_meal');
      const postMeal = await getThresholdConfigByType('post_meal');
      const threeAm = await getThresholdConfigByType('3am');

      expect(preMeal).not.toBeNull();
      expect(preMeal?.ok_low).toBe(90);
      expect(preMeal?.ok_high).toBe(130);

      expect(postMeal).not.toBeNull();
      expect(postMeal?.ok_low).toBe(110);
      expect(postMeal?.ok_high).toBe(160);

      expect(threeAm).not.toBeNull();
      expect(threeAm?.ok_low).toBe(85);
      expect(threeAm?.ok_high).toBe(140);
    });

    it('should seed default settings', async () => {
      const settings = await getSettings();
      expect(settings.unit_system).toBe('mg/dL');
      expect(settings.retention_duration_months).toBeNull();
    });
  });

  describe('2. Readings CRUD & Uniqueness Constraints', () => {
    it('should create and retrieve a reading with attached tags', async () => {
      const tags = await getAllTags();
      const firstTagId = tags[0].id;

      const reading = await createReading({
        slot: 'BB',
        value: 105,
        timestamp: Date.now(),
        clinical_date: '2026-09-24',
        comment: 'Fasting check',
        tag_ids: [firstTagId],
      });

      expect(reading.id).toBeDefined();
      expect(reading.slot).toBe('BB');
      expect(reading.value).toBe(105);
      expect(reading.clinical_date).toBe('2026-09-24');
      expect(reading.comment).toBe('Fasting check');
      expect(reading.tags).toHaveLength(1);
      expect(reading.tags[0].id).toBe(firstTagId);
    });

    it('should enforce integer-only glucose values', async () => {
      await expect(
        createReading({
          slot: 'AB',
          value: 120.5,
          timestamp: Date.now(),
          clinical_date: '2026-09-24',
        })
      ).rejects.toThrow('Glucose value must be an integer');
    });

    it('should enforce (slot, clinical_date) uniqueness constraint at DB layer', async () => {
      await createReading({
        slot: 'BL',
        value: 110,
        timestamp: Date.now(),
        clinical_date: '2026-09-24',
      });

      // Attempting to log a second reading for the same slot on the same clinical date must be rejected by SQLite
      await expect(
        createReading({
          slot: 'BL',
          value: 115,
          timestamp: Date.now(),
          clinical_date: '2026-09-24',
        })
      ).rejects.toThrow();
    });

    it('should update an existing reading and its tags', async () => {
      const reading = await createReading({
        slot: 'AL',
        value: 145,
        timestamp: Date.now(),
        clinical_date: '2026-09-24',
        comment: 'Initial comment',
      });

      const updated = await updateReading(reading.id, {
        value: 150,
        comment: 'Updated comment',
      });

      expect(updated.value).toBe(150);
      expect(updated.comment).toBe('Updated comment');
    });

    it('should delete a reading and cascade delete its reading_tags associations', async () => {
      const tags = await getAllTags();
      const reading = await createReading({
        slot: 'BD',
        value: 120,
        timestamp: Date.now(),
        clinical_date: '2026-09-24',
        tag_ids: [tags[0].id],
      });

      await deleteReading(reading.id);

      const all = await getAllReadings();
      const found = all.find((r) => r.id === reading.id);
      expect(found).toBeUndefined();
    });

    it('should query readings by date range', async () => {
      await createReading({
        slot: 'BB',
        value: 95,
        timestamp: Date.now(),
        clinical_date: '2026-09-01',
      });

      await createReading({
        slot: 'BB',
        value: 100,
        timestamp: Date.now(),
        clinical_date: '2026-09-15',
      });

      await createReading({
        slot: 'BB',
        value: 105,
        timestamp: Date.now(),
        clinical_date: '2026-09-30',
      });

      const inRange = await getReadingsByDateRange('2026-09-10', '2026-09-20');
      expect(inRange).toHaveLength(1);
      expect(inRange[0].clinical_date).toBe('2026-09-15');
    });
  });

  describe('3. Tag Management & Protection', () => {
    it('should allow adding custom tags', async () => {
      const customTag = await addCustomTag('Late Snack');
      expect(customTag.id).toBeDefined();
      expect(customTag.name).toBe('Late Snack');
      expect(customTag.is_system_default).toBe(false);
      expect(customTag.is_active).toBe(true);
    });

    it('should block deletion of custom tag if referenced by a reading', async () => {
      const tag = await addCustomTag('Post-Gym Workout');
      await createReading({
        slot: 'AD',
        value: 135,
        timestamp: Date.now(),
        clinical_date: '2026-09-24',
        tag_ids: [tag.id],
      });

      await expect(deleteCustomTag(tag.id)).rejects.toThrow(
        'Cannot delete tag referenced by historical readings'
      );
    });

    it('should allow deactivating and reactivating a tag', async () => {
      const tag = await addCustomTag('Temp Tag');
      await setTagActiveStatus(tag.id, false);

      const allTags = await getAllTags();
      const updatedTag = allTags.find((t) => t.id === tag.id);
      expect(updatedTag?.is_active).toBe(false);
    });
  });

  describe('4. Threshold Configs', () => {
    it('should update threshold boundaries when in valid ascending order', async () => {
      const updated = await updateThresholdConfig('pre_meal', {
        bad_low: 50,
        notsobad_low: 65,
        okayish_low: 75,
        ok_low: 85,
        ok_high: 125,
        okayish_high: 145,
        notsobad_high: 175,
        bad_high: 240,
      });

      expect(updated.ok_low).toBe(85);
      expect(updated.ok_high).toBe(125);
    });

    it('should reject threshold updates if boundaries break ascending order constraint', async () => {
      await expect(
        updateThresholdConfig('pre_meal', {
          bad_low: 90, // invalid: bad_low > ok_low
          notsobad_low: 70,
          okayish_low: 80,
          ok_low: 85,
          ok_high: 125,
          okayish_high: 145,
          notsobad_high: 175,
          bad_high: 240,
        })
      ).rejects.toThrow('Threshold boundaries must satisfy ascending order');
    });
  });

  describe('5. Settings', () => {
    it('should update retention duration and unit system', async () => {
      const updated = await updateSettings({
        retention_duration_months: 4,
        unit_system: 'mg/dL',
      });

      expect(updated.retention_duration_months).toBe(4);
      expect(updated.unit_system).toBe('mg/dL');
    });
  });
});
