import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Button, EmptyState } from '../ui';
import { PersonCard } from '../components/PersonCard';

export function PeopleScreen({
  onOpenPerson,
  onAdd,
}: {
  onOpenPerson: (id: string) => void;
  onAdd: () => void;
}) {
  const { people, getPerson } = useStore();
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    const norm = q.toLowerCase().trim();
    const list = norm
      ? people.filter(
          (p) =>
            p.name.toLowerCase().includes(norm) ||
            p.relationship.toLowerCase().includes(norm) ||
            p.skills.some((s) => s.toLowerCase().includes(norm))
        )
      : people;
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [people, q]);

  const nameOf = (id?: string) => (id ? getPerson(id)?.name : undefined);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.h1}>Your people</Text>
          <Text style={styles.count}>{people.length}</Text>
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search name, relationship or skill"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
        {people.length === 0 ? (
          <EmptyState
            title="No one here yet"
            subtitle="Add the people you know and tag what they’re good at. Later, you’ll find them in seconds by expertise."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="No matches" subtitle="Nobody matches that search." />
        ) : (
          filtered.map((p) => (
            <PersonCard
              key={p.id}
              person={p}
              referredByName={nameOf(p.referredById)}
              onPress={() => onOpenPerson(p.id)}
            />
          ))
        )}
        <View style={{ height: 96 }} />
      </ScrollView>

      <View style={styles.fabWrap} pointerEvents="box-none">
        <Button
          title="Add person"
          onPress={onAdd}
          icon={<Ionicons name="add" size={20} color="#fff" />}
          style={styles.fab}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { paddingHorizontal: space.lg, paddingTop: space.sm, paddingBottom: space.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginBottom: space.md },
  h1: { fontSize: font.h1, fontWeight: '700', color: colors.textPrimary },
  count: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: font.body,
    color: colors.textPrimary,
    height: '100%',
  },
  list: { paddingHorizontal: space.lg, paddingTop: space.xs },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space.lg,
    alignItems: 'center',
  },
  fab: {
    paddingHorizontal: space.xl,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
