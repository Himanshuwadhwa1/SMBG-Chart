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

export const TagManager: React.FC = () => {
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
    <View style={styles.container} testID="tag-manager">
      <Text style={styles.sectionTitle}>Tag Management</Text>

      {message && (
        <View
          style={[styles.messageBanner, message.isError ? styles.errorBanner : styles.successBanner]}
          testID="tag-message"
        >
          <Text style={[styles.messageText, message.isError ? styles.errorText : styles.successText]}>
            {message.text}
          </Text>
        </View>
      )}

      {/* Add Custom Tag Form */}
      <View style={styles.addTagRow}>
        <TextInput
          style={styles.addInput}
          value={newTagName}
          onChangeText={setNewTagName}
          placeholder="New custom tag name..."
          testID="input-new-tag"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCustomTag} testID="add-tag-button">
          <Text style={styles.addButtonText}>Add Tag</Text>
        </TouchableOpacity>
      </View>

      {/* Tag List */}
      <View style={styles.tagList} testID="tag-list">
        {tags.map((tag) => (
          <View key={tag.id} style={styles.tagItem} testID={`tag-item-${tag.id}`}>
            <View style={styles.tagInfo}>
              <Text style={[styles.tagName, !tag.is_active && styles.inactiveTagName]}>
                {tag.name}
              </Text>
              {tag.is_system_default ? (
                <Text style={styles.systemBadge}>System</Text>
              ) : (
                <Text style={styles.customBadge}>Custom</Text>
              )}
            </View>

            <View style={styles.tagActions}>
              <TouchableOpacity
                style={[styles.actionButton, tag.is_active ? styles.deactivateButton : styles.activateButton]}
                onPress={() => handleToggleActive(tag)}
                testID={`toggle-tag-${tag.id}`}
              >
                <Text style={[styles.actionText, tag.is_active ? styles.deactivateText : styles.activateText]}>
                  {tag.is_active ? 'Deactivate' : 'Activate'}
                </Text>
              </TouchableOpacity>

              {!tag.is_system_default && (
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTag(tag)}
                  testID={`delete-tag-${tag.id}`}
                >
                  <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Reset Defaults Button */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={handleResetDefaults}
        testID="reset-tags-button"
      >
        <Text style={styles.resetButtonText}>Reset System Tags to Defaults</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d0d7de',
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2328',
    marginBottom: 12,
  },
  messageBanner: {
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
  },
  errorBanner: {
    backgroundColor: '#ffebe9',
    borderColor: '#ff8182',
  },
  successBanner: {
    backgroundColor: '#dafbe1',
    borderColor: '#4ac26b',
  },
  messageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  errorText: {
    color: '#cf222e',
  },
  successText: {
    color: '#1a7f37',
  },
  addTagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d0d7de',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#ffffff',
  },
  addButton: {
    backgroundColor: '#0969da',
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
    backgroundColor: '#f6f8fa',
    borderWidth: 1,
    borderColor: '#f0f2f5',
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#24292f',
  },
  inactiveTagName: {
    color: '#8c959f',
    textDecorationLine: 'line-through',
  },
  systemBadge: {
    fontSize: 11,
    color: '#57606a',
    backgroundColor: '#ddf4ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  customBadge: {
    fontSize: 11,
    color: '#1a7f37',
    backgroundColor: '#dafbe1',
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
  deactivateButton: {
    borderColor: '#d0d7de',
    backgroundColor: '#ffffff',
  },
  activateButton: {
    borderColor: '#0969da',
    backgroundColor: '#ddf4ff',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deactivateText: {
    color: '#57606a',
  },
  activateText: {
    color: '#0969da',
  },
  deleteButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ffebe9',
    borderColor: '#ff8182',
    borderWidth: 1,
  },
  deleteText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cf222e',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#d0d7de',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#57606a',
  },
});
