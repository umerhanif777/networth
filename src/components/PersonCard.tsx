import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Person } from '../types';
import { colors, font, space } from '../theme';
import { Avatar, AvailabilityPill, Card, Tag } from '../ui';

const norm = (s: string) => s.toLowerCase().trim();

/**
 * A person as they appear in a list. When `matched` skills are supplied (from a
 * search) those tags are highlighted so you see *why* they surfaced.
 */
export function PersonCard({
  person,
  matched = [],
  onPress,
  referredByName,
}: {
  person: Person;
  matched?: string[];
  onPress: () => void;
  referredByName?: string;
}) {
  const matchedSet = new Set(matched.map(norm));
  const isMatch = (skill: string) =>
    [...matchedSet].some((m) => norm(skill).includes(m));

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <Avatar name={person.name} size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.rel} numberOfLines={1}>
            {person.relationship || 'contact'}
            {referredByName ? ` · via ${referredByName}` : ''}
          </Text>
        </View>
        <AvailabilityPill value={person.availability} />
      </View>

      {person.skills.length > 0 && (
        <View style={styles.tags}>
          {person.skills.map((s) => (
            <Tag key={s} label={s} tone={isMatch(s) ? 'accent' : 'neutral'} />
          ))}
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.reach}>
          {person.phone ? (
            <>
              <Ionicons name="call-outline" size={13} color={colors.textMuted} />{' '}
              {person.phone}
            </>
          ) : (
            <Text style={{ color: colors.textMuted }}>tap to open</Text>
          )}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: space.md, padding: space.md + 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  name: { fontSize: font.h3, fontWeight: '600', color: colors.textPrimary },
  rel: { fontSize: font.small, color: colors.textSecondary, marginTop: 1 },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: space.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space.md,
  },
  reach: { fontSize: font.small, color: colors.textSecondary },
});
