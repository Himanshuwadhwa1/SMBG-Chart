import { getDb } from './schema';
import { SYSTEM_DEFAULT_TAGS } from './seed';
import { Tag } from './types';

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Tag>('SELECT * FROM tags ORDER BY name ASC');
  return rows.map((t) => ({
    ...t,
    is_system_default: Boolean(t.is_system_default),
    is_active: Boolean(t.is_active),
  }));
}

export async function getActiveTags(): Promise<Tag[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Tag>(
    'SELECT * FROM tags WHERE is_active = 1 ORDER BY name ASC'
  );
  return rows.map((t) => ({
    ...t,
    is_system_default: Boolean(t.is_system_default),
    is_active: Boolean(t.is_active),
  }));
}

export async function addCustomTag(name: string): Promise<Tag> {
  const db = await getDb();
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Tag name cannot be empty');
  }

  // Check if tag with same name exists (active or inactive)
  const existing = await db.getFirstAsync<Tag>(
    'SELECT * FROM tags WHERE LOWER(name) = LOWER(?)',
    [trimmedName]
  );

  if (existing) {
    if (!existing.is_active) {
      // Re-activate tag if it was deactivated
      await db.runAsync('UPDATE tags SET is_active = 1 WHERE id = ?', [existing.id]);
      return {
        ...existing,
        is_system_default: Boolean(existing.is_system_default),
        is_active: true,
      };
    }
    throw new Error(`Tag "${trimmedName}" already exists`);
  }

  const result = await db.runAsync(
    'INSERT INTO tags (name, is_system_default, is_active) VALUES (?, 0, 1)',
    [trimmedName]
  );

  return {
    id: result.lastInsertRowId,
    name: trimmedName,
    is_system_default: false,
    is_active: true,
  };
}

export async function setTagActiveStatus(id: number, isActive: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE tags SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
}

export async function isTagReferenced(id: number): Promise<boolean> {
  const db = await getDb();
  const count = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reading_tags WHERE tag_id = ?',
    [id]
  );
  return Boolean(count && count.count > 0);
}

export async function deleteCustomTag(id: number): Promise<void> {
  const db = await getDb();

  const tag = await db.getFirstAsync<Tag>('SELECT * FROM tags WHERE id = ?', [id]);
  if (!tag) {
    throw new Error(`Tag with id ${id} not found`);
  }

  if (tag.is_system_default) {
    throw new Error('System default tags cannot be permanently deleted. Deactivate them instead.');
  }

  const referenced = await isTagReferenced(id);
  if (referenced) {
    throw new Error(
      'Cannot delete tag referenced by historical readings. Deactivate the tag instead.'
    );
  }

  await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}

export async function resetTagsToDefaults(): Promise<Tag[]> {
  const db = await getDb();

  // Activate all system default tags
  for (const name of SYSTEM_DEFAULT_TAGS) {
    const existing = await db.getFirstAsync<Tag>(
      'SELECT * FROM tags WHERE name = ?',
      [name]
    );

    if (existing) {
      await db.runAsync('UPDATE tags SET is_active = 1 WHERE id = ?', [existing.id]);
    } else {
      await db.runAsync(
        'INSERT INTO tags (name, is_system_default, is_active) VALUES (?, 1, 1)',
        [name]
      );
    }
  }

  return getAllTags();
}
