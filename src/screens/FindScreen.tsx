import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore, searchNetwork } from '../store';
import { colors, font, radius, space } from '../theme';
import { EmptyState, SectionLabel, Tag } from '../ui';
import { PersonCard } from '../components/PersonCard';

export function FindScreen({ onOpenPerson }: { onOpenPerson: (id: string) => void }) {
  const { people, allSkills, getPerson } = useStore();
  const [text, setText] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSkill = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );

  const results = useMemo(
    () => searchNetwork(people, selected, text),
    [people, selected, text]
  );

  const hasQuery = selected.length > 0 || text.trim().length > 0;
  const totalMatches = results.matchesAll.length + results.matchesSome.length;
  const nameOf = (id?: string) => (id ? getPerson(id)?.name : undefined);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.h1}>Who do you need?</Text>
        <Text style={styles.sub}>Search your network by what people are good at.</Text>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Try “catering” or a name"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCorrect={false}
          />
          {text.length > 0 && (
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textMuted}
              onPress={() => setText('')}
            />
          )}
        </View>

        {allSkills.length > 0 && (
          <>
            <Text style={styles.filterHint}>
              {selected.length > 0
                ? `Combining ${selected.length} — showing who covers ${
                    selected.length > 1 ? 'them all' : 'it'
                  }`
                : 'Filter by expertise (tap to combine)'}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {allSkills.map((s) => (
                <Tag
                  key={s.name}
                  label={s.name}
                  onPress={() => toggleSkill(s.name)}
                  selected={selected.includes(s.name)}
                />
              ))}
            </ScrollView>
          </>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      >
        {!hasQuery ? (
          <EmptyState
            title="Start typing"
            subtitle="Search a skill or pick expertise chips above. Combine two — like catering and marketing — to find the person who covers both."
          />
        ) : totalMatches === 0 ? (
          <EmptyState
            title="No one yet"
            subtitle="Nobody in your network matches that. Add more people, or tag them with this skill."
          />
        ) : (
          <>
            {results.matchesAll.length > 0 && (
              <>
                {selected.length > 1 && (
                  <SectionLabel>
                    ★ Covers all {selected.length} skills ({results.matchesAll.length})
                  </SectionLabel>
                )}
                {results.matchesAll.map((r) => (
                  <PersonCard
                    key={r.person.id}
                    person={r.person}
                    matched={r.matched}
                    referredByName={nameOf(r.person.referredById)}
                    onPress={() => onOpenPerson(r.person.id)}
                  />
                ))}
              </>
            )}

            {results.matchesSome.length > 0 && (
              <>
                <SectionLabel>
                  Covers some ({results.matchesSome.length})
                </SectionLabel>
                {results.matchesSome.map((r) => (
                  <PersonCard
                    key={r.person.id}
                    person={r.person}
                    matched={r.matched}
                    referredByName={nameOf(r.person.referredById)}
                    onPress={() => onOpenPerson(r.person.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.md,
  },
  h1: { fontSize: font.h1, fontWeight: '700', color: colors.textPrimary },
  sub: {
    fontSize: font.body,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: space.lg,
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
  filterHint: {
    fontSize: font.small,
    color: colors.textMuted,
    marginTop: space.md,
    marginBottom: space.sm,
  },
  chipRow: { flexDirection: 'row', gap: 8, paddingRight: space.lg },
  list: { paddingHorizontal: space.lg, paddingTop: space.xs },
});
