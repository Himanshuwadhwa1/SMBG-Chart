import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  addCustomTag,
  deleteCustomTag,
  getAllTags,
  resetTagsToDefaults,
  setTagActiveStatus,
} from '../../db';
import { Tag } from '../../db/types';
import { useTheme } from '../../state/ThemeContext';

export const TagManager: React.FC = () => {
  const { colors } = useTheme();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState<string>('');
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const all = await getAllTags();
      setTags(all);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  const handleAddCustomTag = async () => {
    setMessage(null);
    if (!newTagName.trim()) {
      setMessage({ text: 'Tag name cannot be empty', isError: true });
      return;
    }

    try {
      await addCustomTag(newTagName.trim());
      setNewTagName('');
      await loadTags();
      setMessage({ text: `Custom tag "${newTagName.trim()}" added successfully`, isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to add custom tag', isError: true });
    }
  };

  const handleToggleActive = async (tag: Tag) => {
    setMessage(null);
    try {
      await setTagActiveStatus(tag.id, !tag.is_active);
      await loadTags();
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to update tag status', isError: true });
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    setMessage(null);
    try {
      await deleteCustomTag(tag.id);
      await loadTags();
      setMessage({ text: `Tag "${tag.name}" deleted successfully`, isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Cannot delete tag', isError: true });
    }
  };

  const handleResetDefaults = async () => {
    setMessage(null);
    try {
      await resetTagsToDefaults();
      await loadTags();
      setMessage({ text: 'Reset system default tags to active', isError: false });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to reset tags', isError: true });
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      testID="tag-manager"
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Tag Management</Text>

      {message && (
        <View
          style={[
            styles.messageBanner,
            message.isError
              ? { backgroundColor: colors.errorBg, borderColor: colors.error }
              : { backgroundColor: colors.successBg, borderColor: colors.success },
          ]}
          testID="tag-message"
        >
          <Text
            style={[
              styles.messageText,
              { color: message.isError ? colors.error : colors.success },
            ]}
          >
            {message.text}
          </Text>
        </View>
      )}

      {/* Add Custom Tag Form */}
      <View style={styles.addTagRow}>
        <TextInput
          style={[
            styles.addInput,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              color: colors.text,
            },
          ]}
          value={newTagName}
          onChangeText={setNewTagName}
          placeholder="New custom tag name..."
          placeholderTextColor={colors.textSecondary}
          testID="input-new-tag"
        />
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddCustomTag}
          testID="add-tag-button"
        >
          <Text style={styles.addButtonText}>Add Tag</Text>
        </TouchableOpacity>
      </View>

      {/* Tag List */}
      <View style={styles.tagList} testID="tag-list">
        {tags.map((tag) => (
          <View
            key={tag.id}
            style={[
              styles.tagItem,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            testID={`tag-item-${tag.id}`}
          >
            <View style={styles.tagInfo}>
              <Text
                style={[
                  styles.tagName,
                  { color: tag.is_active ? colors.text : colors.textSecondary },
                  !tag.is_active && styles.inactiveTagName,
                ]}
              >
                {tag.name}
              </Text>
              {tag.is_system_default ? (
                <Text style={[styles.badge, { backgroundColor: colors.border, color: colors.textSecondary }]}>
                  System
                </Text>
              ) : (
                <Text style={[styles.badge, { backgroundColor: colors.successBg, color: colors.success }]}>
                  Custom
                </Text>
              )}
            </View>

            <View style={styles.tagActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  tag.is_active
                    ? { backgroundColor: colors.card, borderColor: colors.border }
                    : { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                ]}
                onPress={() => handleToggleActive(tag)}
                testID={`toggle-tag-${tag.id}`}
              >
                <Text
                  style={[
                    styles.actionText,
                    { color: tag.is_active ? colors.textSecondary : colors.primary },
                  ]}
                >
                  {tag.is_active ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>

              {!tag.is_system_default && (
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    { backgroundColor: colors.errorBg, borderColor: colors.error },
                  ]}
                  onPress={() => handleDeleteTag(tag)}
                  testID={`delete-tag-${tag.id}`}
                >
                  <Text style={[styles.deleteText, { color: colors.error }]}>
                    Delete
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Reset Defaults Button */}
      <TouchableOpacity
        style={[styles.resetButton, { borderColor: colors.border }]}
        onPress={handleResetDefaults}
        testID="reset-tags-button"
      >
        <Text style={[styles.resetButtonText, { color: colors.textSecondary }]}>
          Reset System Tags to Defaults
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  messageBanner: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  tagList: {
    gap: 8,
    marginBottom: 16,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '600',
  },
  inactiveTagName: {
    textDecorationLine: 'line-through',
  },
  badge: {
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tagActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resetButton: {
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

