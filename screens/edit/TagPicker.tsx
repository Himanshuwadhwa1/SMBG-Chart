import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tag } from '../../db/types';

interface TagPickerProps {
  activeTags: Tag[];
  selectedTagIds: number[];
  onToggleTag: (tagId: number) => void;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  activeTags,
  selectedTagIds,
  onToggleTag,
}) => {
  if (activeTags.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID="tag-picker">
      <Text style={styles.label}>Tags (Optional)</Text>
      <View style={styles.chipContainer}>
        {activeTags.map((tag) => {
          const isSelected = selectedTagIds.includes(tag.id);
          return (
            <TouchableOpacity
              key={tag.id}
              testID={`tag-chip-${tag.id}`}
              style={[styles.chip, isSelected && styles.selectedChip]}
              onPress={() => onToggleTag(tag.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.chipText, isSelected && styles.selectedChipText]}>
                {tag.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d0d7de',
    backgroundColor: '#ffffff',
  },
  selectedChip: {
    backgroundColor: '#ddf4ff',
    borderColor: '#0969da',
  },
  chipText: {
    fontSize: 13,
    color: '#57606a',
  },
  selectedChipText: {
    color: '#0969da',
    fontWeight: '600',
  },
});
