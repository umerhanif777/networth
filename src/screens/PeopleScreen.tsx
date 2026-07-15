import React, { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Button, EmptyState } from '../ui';
import { PersonCard } from '../components/PersonCard';
import { contactsSupported, importContactsWeb } from '../contacts';

export function PeopleScreen({
  onOpenPerson,
  onAdd,
}: {
  onOpenPerson: (id: string) => void;
  onAdd: () => void;
}) {
  const { people, getPerson, addPerson } = useStore();
  const [q, setQ] = useState('');
  const [importing, setImporting] = useState(false);

  const notify = (title: string, message?: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    } else {
      Alert.alert(title, message);
    }
  };

  const onImport = async () => {
    if (Platform.OS !== 'web' || !contactsSupported()) {
      notify(
        'Contacts import needs a phone',
        'Open the installed Networthit app on an Android phone (Chrome) to import from your contacts. Meanwhile you can add people manually.'
      );
      return;
    }
    setImporting(true);
    try {
      const res = await importContactsWeb(addPerson);
      if (res.added === 0) {
        notify(
          'Nothing imported',
          'None of the selected contacts had a recognisable skill. Tip: name them like “Imran Mechanic”, then import again.'
        );
      } else {
        notify(
          `Imported ${res.added} ${res.added === 1 ? 'person' : 'people'}`,
          `${res.addedNames.join(', ')}${res.skipped ? `\n\nSkipped ${res.skipped} without a skill keyword.` : ''}`
        );
      }
    } catch (e: any) {
      if (e && (e.name === 'AbortError' || /cancel|abort/i.test(e.message || ''))) return;
      notify('Couldn’t open contacts', e?.message || 'Please try again.');
    } finally {
      setImporting(false);
    }
  };

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
        <Pressable onPress={onImport} style={styles.importRow} disabled={importing}>
          <Ionicons name="cloud-download-outline" size={18} color={colors.accentText} />
          <Text style={styles.importText}>
            {importing ? 'Importing…' : 'Import from contacts'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </Pressable>
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
  importRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginTop: space.sm,
    paddingVertical: 10,
    paddingHorizontal: space.md,
    backgroundColor: colors.accentBg,
    borderRadius: radius.md,
  },
  importText: { flex: 1, fontSize: font.body, fontWeight: '600', color: colors.accentText },
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
