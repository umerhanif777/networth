import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { invalidReferrers } from '../network';
import type { Availability } from '../types';
import { colors, font, radius, space } from '../theme';
import { Button } from '../ui';

const AVAIL: { value: Availability; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'unknown', label: 'Not sure' },
];

export function PersonForm({
  personId,
  onDone,
  onCancel,
}: {
  personId?: string;
  onDone: (id: string) => void;
  onCancel: () => void;
}) {
  const { getPerson, addPerson, updatePerson, allSkills, people } = useStore();
  const existing = personId ? getPerson(personId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [relationship, setRelationship] = useState(existing?.relationship ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [availability, setAvailability] = useState<Availability>(
    existing?.availability ?? 'unknown'
  );
  const [skills, setSkills] = useState<string[]>(existing?.skills ?? []);
  const [skillDraft, setSkillDraft] = useState('');
  const [referredById, setReferredById] = useState<string | undefined>(
    existing?.referredById
  );

  // Who can be picked as the referrer: everyone except this person and their
  // own sub-network (which would create a loop).
  const blocked = existing ? invalidReferrers(people, existing.id) : new Set<string>();
  const referrerChoices = people
    .filter((p) => !blocked.has(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const addSkill = (raw: string) => {
    const s = raw.trim().replace(/,$/, '').trim();
    if (!s) return;
    setSkills((prev) =>
      prev.some((x) => x.toLowerCase() === s.toLowerCase()) ? prev : [...prev, s]
    );
    setSkillDraft('');
  };
  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  // Suggest popular skills the person doesn't already have.
  const suggestions = allSkills
    .map((s) => s.name)
    .filter((n) => !skills.some((s) => s.toLowerCase() === n.toLowerCase()))
    .slice(0, 6);

  const canSave = name.trim().length > 0;

  const save = () => {
    if (!canSave) return;
    const payload = {
      name: name.trim(),
      relationship: relationship.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      availability,
      skills,
      referredById,
    };
    if (existing) {
      updatePerson(existing.id, payload);
      onDone(existing.id);
    } else {
      const p = addPerson(payload);
      onDone(p.id);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topbar}>
        <Pressable onPress={onCancel} hitSlop={8} style={styles.topBtn}>
          <Text style={styles.cancel}>Cancel</Text>
        </Pressable>
        <Text style={styles.topTitle}>{existing ? 'Edit person' : 'Add person'}</Text>
        <Pressable onPress={save} hitSlop={8} style={styles.topBtn} disabled={!canSave}>
          <Text style={[styles.save, !canSave && { color: colors.textMuted }]}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
      >
        <Field label="Name">
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Rashid"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus={!existing}
          />
        </Field>

        <Field label="How you know them">
          <TextInput
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. uncle, college friend, neighbour"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </Field>

        <Field label="What are they good at?">
          <View style={styles.skillBox}>
            {skills.map((s) => (
              <Pressable key={s} onPress={() => removeSkill(s)} style={styles.skillChip}>
                <Text style={styles.skillChipText}>{s}</Text>
                <Ionicons name="close" size={14} color={colors.accentText} />
              </Pressable>
            ))}
            <TextInput
              value={skillDraft}
              onChangeText={(t) => {
                if (t.endsWith(',')) addSkill(t);
                else setSkillDraft(t);
              }}
              onSubmitEditing={() => addSkill(skillDraft)}
              placeholder={skills.length ? 'Add another…' : 'e.g. Catering'}
              placeholderTextColor={colors.textMuted}
              style={styles.skillInput}
              blurOnSubmit={false}
              returnKeyType="done"
            />
          </View>
          <Text style={styles.help}>Type a skill and press enter. Tap a tag to remove it.</Text>
          {suggestions.length > 0 && (
            <View style={styles.suggestRow}>
              {suggestions.map((s) => (
                <Pressable key={s} onPress={() => addSkill(s)} style={styles.suggest}>
                  <Ionicons name="add" size={13} color={colors.textSecondary} />
                  <Text style={styles.suggestText}>{s}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </Field>

        <Field label="Can they help right now?">
          <View style={styles.segment}>
            {AVAIL.map((a) => {
              const active = availability === a.value;
              return (
                <Pressable
                  key={a.value}
                  onPress={() => setAvailability(a.value)}
                  style={[styles.segItem, active && styles.segItemActive]}
                >
                  <Text style={[styles.segText, active && styles.segTextActive]}>
                    {a.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Field>

        {referrerChoices.length > 0 && (
          <Field label="Who introduced them? (optional)">
            <View style={styles.referRow}>
              <Pressable
                onPress={() => setReferredById(undefined)}
                style={[styles.referChip, !referredById && styles.referChipActive]}
              >
                <Text
                  style={[styles.referText, !referredById && styles.referTextActive]}
                >
                  No one / direct
                </Text>
              </Pressable>
              {referrerChoices.map((p) => {
                const active = referredById === p.id;
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => setReferredById(active ? undefined : p.id)}
                    style={[styles.referChip, active && styles.referChipActive]}
                  >
                    <Text style={[styles.referText, active && styles.referTextActive]}>
                      {p.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.help}>
              Links them into your network tree under whoever connected you.
            </Text>
          </Field>
        )}

        <View style={styles.rowFields}>
          <Field label="Phone" style={{ flex: 1 }}>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Optional"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              keyboardType="phone-pad"
            />
          </Field>
        </View>

        <Field label="Email">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Optional"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>

        <Field label="Notes">
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Anything worth remembering — contacts they have, how good they are…"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, styles.textarea]}
            multiline
          />
        </Field>

        <Button title={existing ? 'Save changes' : 'Add to network'} onPress={save} style={{ marginTop: space.sm }} />
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBtn: { minWidth: 56 },
  topTitle: { fontSize: font.h3, fontWeight: '600', color: colors.textPrimary },
  cancel: { fontSize: font.body, color: colors.textSecondary },
  save: { fontSize: font.body, fontWeight: '700', color: colors.accent, textAlign: 'right' },
  body: { padding: space.lg },
  field: { marginBottom: space.lg },
  rowFields: { flexDirection: 'row', gap: space.md },
  label: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: space.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 11,
    fontSize: font.body,
    color: colors.textPrimary,
  },
  textarea: { minHeight: 88, textAlignVertical: 'top' },
  help: { fontSize: font.tiny, color: colors.textMuted, marginTop: 6 },
  skillBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    padding: space.sm,
    minHeight: 46,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentBg,
    paddingLeft: space.md,
    paddingRight: space.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  skillChipText: { color: colors.accentText, fontSize: font.small, fontWeight: '500' },
  skillInput: {
    flexGrow: 1,
    minWidth: 120,
    fontSize: font.body,
    color: colors.textPrimary,
    paddingVertical: 6,
    paddingHorizontal: space.sm,
  },
  suggestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: space.sm },
  suggest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  suggestText: { color: colors.textSecondary, fontSize: font.small },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.sm,
  },
  segItemActive: { backgroundColor: colors.surface },
  segText: { fontSize: font.small, color: colors.textSecondary, fontWeight: '500' },
  segTextActive: { color: colors.textPrimary, fontWeight: '600' },
  referRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  referChip: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
    paddingHorizontal: space.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  referChipActive: { backgroundColor: colors.accentBg, borderColor: colors.accent },
  referText: { fontSize: font.small, color: colors.textSecondary, fontWeight: '500' },
  referTextActive: { color: colors.accentText, fontWeight: '600' },
});
