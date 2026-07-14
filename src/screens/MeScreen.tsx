import React from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Button, Card, SectionLabel } from '../ui';

export function MeScreen() {
  const { people, allSkills, clearAll, restoreSample } = useStore();

  const stats = [
    { label: 'People', value: people.length },
    { label: 'Skills', value: allSkills.length },
    {
      label: 'Available',
      value: people.filter((p) => p.availability === 'available').length,
    },
  ];

  const confirmClear = () => {
    const doClear = () => clearAll();
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Clear all people? This cannot be undone.'))
        doClear();
    } else {
      Alert.alert('Clear everything', 'Remove all people from your network?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear all', style: 'destructive', onPress: doClear },
      ]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.h1}>You</Text>
      <Text style={styles.sub}>Your network lives on this device — private to you.</Text>

      <View style={styles.statRow}>
        {stats.map((s) => (
          <View key={s.label} style={styles.stat}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {allSkills.length > 0 && (
        <>
          <SectionLabel>Top expertise in your network</SectionLabel>
          <Card>
            {allSkills.slice(0, 8).map((s, i) => (
              <View
                key={s.name}
                style={[
                  styles.skillRow,
                  i < Math.min(allSkills.length, 8) - 1 && styles.skillRowBorder,
                ]}
              >
                <Text style={styles.skillName}>{s.name}</Text>
                <Text style={styles.skillCount}>
                  {s.count} {s.count === 1 ? 'person' : 'people'}
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionLabel>Data</SectionLabel>
      <View style={{ gap: space.sm }}>
        <Button
          title="Restore sample network"
          variant="secondary"
          onPress={restoreSample}
          icon={<Ionicons name="refresh-outline" size={18} color={colors.textPrimary} />}
        />
        <Button
          title="Clear all people"
          variant="danger"
          onPress={confirmClear}
          icon={<Ionicons name="trash-outline" size={18} color={colors.danger} />}
        />
      </View>

      <View style={styles.aboutBox}>
        <Text style={styles.aboutTitle}>Networth · Phase 1</Text>
        <Text style={styles.aboutText}>
          Your private, searchable network. Next up: reach people in-app, referral chains,
          and the visual network tree.
        </Text>
      </View>
      <View style={{ height: space.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg },
  h1: { fontSize: font.h1, fontWeight: '700', color: colors.textPrimary },
  sub: { fontSize: font.body, color: colors.textSecondary, marginTop: 2, marginBottom: space.lg },
  statRow: { flexDirection: 'row', gap: space.md, marginBottom: space.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: space.lg,
    alignItems: 'center',
  },
  statValue: { fontSize: 26, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: font.small, color: colors.textSecondary, marginTop: 2 },
  skillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space.md,
  },
  skillRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  skillName: { fontSize: font.body, color: colors.textPrimary, fontWeight: '500' },
  skillCount: { fontSize: font.small, color: colors.textMuted },
  aboutBox: {
    marginTop: space.xl,
    padding: space.lg,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
  },
  aboutTitle: { fontSize: font.body, fontWeight: '600', color: colors.textPrimary },
  aboutText: { fontSize: font.small, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
});
