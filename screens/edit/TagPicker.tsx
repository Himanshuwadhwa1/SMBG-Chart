import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tag } from '../../db/types';
import { useTheme } from '../../state/ThemeContext';

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
  const { colors, activeTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  if (activeTags.length === 0) {
    return null;
  }

  const selectedCount = selectedTagIds.length;
  const selectedTags = activeTags.filter((t) => selectedTagIds.includes(t.id));

  return (
    <View style={styles.container} testID="tag-picker">
      <View style={styles.headerRow}>
        <Text style={[styles.label, { color: colors.text }]}>Tags (Optional)</Text>
        {selectedCount > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.countBadgeText, { color: colors.primary }]}>
              {selectedCount} selected
            </Text>
          </View>
        )}
      </View>

      {/* Dropdown Toggle Header */}
      <TouchableOpacity
        style={[
          styles.dropdownHeader,
          {
            backgroundColor: colors.surface,
            borderColor: isOpen ? colors.primary : colors.border,
          },
        ]}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.75}
        testID="tag-picker-dropdown-trigger"
        accessibilityRole="button"
        accessibilityLabel="Select tags"
      >
        <View style={styles.dropdownHeaderContent}>
          <Text style={[styles.dropdownPlaceholder, { color: colors.textSecondary }]}>
            {selectedCount === 0
              ? 'Tap to select tags...'
              : selectedTags.map((t) => t.name).join(', ')}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: isOpen ? colors.primary : colors.textSecondary }]}>
          {isOpen ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {/* Selected Tags Quick-Pills (Visible when collapsed) */}
      {!isOpen && selectedTags.length > 0 && (
        <View style={styles.selectedPillsRow}>
          {selectedTags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.selectedPill,
                {
                  backgroundColor: colors.primaryLight,
                  borderColor: colors.primary,
                },
              ]}
              onPress={() => onToggleTag(tag.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.selectedPillText, { color: colors.primary }]}>{tag.name}</Text>
              <Text style={[styles.removeX, { color: colors.primary }]}>✕</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Expandable Tag Selection Menu */}
      {isOpen && (
        <View
          style={[
            styles.dropdownMenu,
            {
              backgroundColor: activeTheme === 'dark' ? '#161b22' : '#ffffff',
              borderColor: colors.border,
            },
          ]}
          testID="tag-picker-menu"
        >
          <View style={styles.chipContainer}>
            {activeTags.map((tag) => {
              const isSelected = selectedTagIds.includes(tag.id);
              return (
                <TouchableOpacity
                  key={tag.id}
                  testID={`tag-chip-${tag.id}`}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => onToggleTag(tag.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: isSelected ? colors.primary : colors.textSecondary },
                      isSelected && styles.selectedChipText,
                    ]}
                  >
                    {isSelected ? '✓ ' : ''}{tag.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  dropdownHeaderContent: {
    flex: 1,
    marginRight: 8,
  },
  dropdownPlaceholder: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  selectedPillText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  removeX: {
    fontSize: 11,
    fontWeight: '800',
  },
  dropdownMenu: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
  },
  selectedChipText: {
    fontWeight: '600',
  },
});
