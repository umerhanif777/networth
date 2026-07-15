import React from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors, font, radius, space } from '../theme';
import { Avatar, AvailabilityPill, Button, Card, SectionLabel, Tag } from '../ui';

export function PortfolioScreen({
  personId,
  onEdit,
  onBack,
  onOpenPerson,
}: {
  personId: string;
  onEdit: () => void;
  onBack: () => void;
  onOpenPerson: (id: string) => void;
}) {
  const { getPerson, removePerson, people } = useStore();
  const person = getPerson(personId);

  if (!person) {
    return (
      <View style={styles.screen}>
        <TopBar onBack={onBack} />
        <View style={{ padding: space.xl }}>
          <Text style={{ color: colors.textMuted }}>This person no longer exists.</Text>
        </View>
      </View>
    );
  }

  const referredBy = person.referredById ? getPerson(person.referredById) : undefined;
  const referred = people.filter((p) => p.referredById === person.id);

  const ask = () => {
    const msg = `Hi ${person.name}, I need some help${
      person.skills.length ? ` with ${person.skills[0].toLowerCase()}` : ''
    }. Are you available, or could you point me to someone? Thanks!`;
    const text = encodeURIComponent(msg);
    // WhatsApp needs an international number with no symbols; keep digits only.
    const digits = (person.phone ?? '').replace(/[^\d]/g, '');

    const openWhatsApp = () => {
      // wa.me opens the WhatsApp app on mobile and offers WhatsApp Web / the
      // desktop app on the web. Without a number it opens the contact picker.
      const url = digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
      Linking.openURL(url).catch(() => Alert.alert('WhatsApp unavailable', msg, [{ text: 'OK' }]));
    };
    const openSms = () => {
      const sep = Platform.OS === 'ios' ? '&' : '?';
      Linking.openURL(`sms:${person.phone}${sep}body=${text}`).catch(() =>
        Alert.alert('Message ready', msg, [{ text: 'OK' }])
      );
    };

    // Web app: WhatsApp only (the browser/OS lets them pick the associated app).
    if (Platform.OS === 'web') return openWhatsApp();

    // Mobile: choose between WhatsApp and a text message.
    const buttons: any[] = [{ text: 'WhatsApp', onPress: openWhatsApp }];
    if (person.phone) buttons.push({ text: 'Text message', onPress: openSms });
    buttons.push({ text: 'Cancel', style: 'cancel' });
    Alert.alert(`Ask ${person.name}`, 'How do you want to reach them?', buttons);
  };

  const call = () => person.phone && Linking.openURL(`tel:${person.phone}`);
  const openMap = (q: string) =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`);

  const confirmDelete = () => {
    const doDelete = () => {
      removePerson(person.id);
      onBack();
    };
    if (Platform.OS === 'web') {
      // RN Web Alert has no buttons; use confirm().
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm(`Remove ${person.name}?`)) doDelete();
    } else {
      Alert.alert('Remove person', `Remove ${person.name} from your network?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      <TopBar onBack={onBack} onEdit={onEdit} />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.hero}>
          <Avatar name={person.name} size={72} />
          <Text style={styles.name}>{person.name}</Text>
          <Text style={styles.rel}>{person.relationship || 'contact'}</Text>
          <View style={{ marginTop: space.sm }}>
            <AvailabilityPill value={person.availability} />
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Ask for help"
            onPress={ask}
            icon={<Ionicons name="chatbubble-ellipses-outline" size={18} color="#fff" />}
            style={{ flex: 1 }}
          />
          {person.phone ? (
            <Button
              title="Call"
              variant="secondary"
              onPress={call}
              icon={<Ionicons name="call-outline" size={18} color={colors.textPrimary} />}
              style={{ flex: 1 }}
            />
          ) : null}
        </View>

        {person.skills.length > 0 && (
          <>
            <SectionLabel>Good at</SectionLabel>
            <View style={styles.tags}>
              {person.skills.map((s) => (
                <Tag key={s} label={s} tone="accent" />
              ))}
            </View>
          </>
        )}

        {(person.phone || person.email) && (
          <>
            <SectionLabel>Reach them</SectionLabel>
            <Card style={{ padding: 0 }}>
              {person.phone ? (
                <ContactRow icon="call-outline" label={person.phone} onPress={call} />
              ) : null}
              {person.email ? (
                <ContactRow
                  icon="mail-outline"
                  label={person.email}
                  onPress={() => Linking.openURL(`mailto:${person.email}`)}
                  last={!person.phone}
                />
              ) : null}
            </Card>
          </>
        )}

        {(person.city || person.address) && (
          <>
            <SectionLabel>Location</SectionLabel>
            <Card style={{ padding: 0 }}>
              {person.city ? (
                <ContactRow
                  icon="location-outline"
                  label={person.city}
                  onPress={() => openMap(person.city!)}
                  last={!person.address}
                />
              ) : null}
              {person.address ? (
                <ContactRow icon="map-outline" label={person.address} onPress={() => openMap(person.address!)} last />
              ) : null}
            </Card>
          </>
        )}

        {person.notes ? (
          <>
            <SectionLabel>Notes</SectionLabel>
            <Card>
              <Text style={styles.notes}>{person.notes}</Text>
            </Card>
          </>
        ) : null}

        {(referredBy || referred.length > 0) && (
          <>
            <SectionLabel>Network</SectionLabel>
            <Card>
              {referredBy && (
                <Pressable style={styles.netRow} onPress={() => onOpenPerson(referredBy.id)}>
                  <Ionicons name="arrow-back-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.netText}>
                    Introduced by <Text style={styles.netName}>{referredBy.name}</Text>
                  </Text>
                </Pressable>
              )}
              {referred.map((r) => (
                <Pressable key={r.id} style={styles.netRow} onPress={() => onOpenPerson(r.id)}>
                  <Ionicons name="arrow-forward-outline" size={16} color={colors.textMuted} />
                  <Text style={styles.netText}>
                    Introduced you to <Text style={styles.netName}>{r.name}</Text>
                  </Text>
                </Pressable>
              ))}
            </Card>
          </>
        )}

        <Pressable onPress={confirmDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.deleteText}>Remove from network</Text>
        </Pressable>
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </View>
  );
}

function TopBar({ onBack, onEdit }: { onBack: () => void; onEdit?: () => void }) {
  return (
    <View style={styles.topbar}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.iconBtn}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      {onEdit && (
        <Pressable onPress={onEdit} hitSlop={8}>
          <Text style={styles.edit}>Edit</Text>
        </Pressable>
      )}
    </View>
  );
}

function ContactRow({
  icon,
  label,
  onPress,
  last,
}: {
  icon: any;
  label: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.contactRow, !last && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
    >
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.contactText}>{label}</Text>
      <Ionicons name="open-outline" size={16} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.md,
    paddingBottom: space.sm,
  },
  iconBtn: { padding: 4 },
  edit: { fontSize: font.body, fontWeight: '600', color: colors.accent, paddingRight: space.sm },
  body: { paddingHorizontal: space.lg },
  hero: { alignItems: 'center', paddingVertical: space.md },
  name: { fontSize: font.h1, fontWeight: '700', color: colors.textPrimary, marginTop: space.md },
  rel: { fontSize: font.body, color: colors.textSecondary, marginTop: 2 },
  actions: { flexDirection: 'row', gap: space.md, marginTop: space.md, marginBottom: space.sm },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  contactText: { flex: 1, fontSize: font.body, color: colors.textPrimary },
  notes: { fontSize: font.body, color: colors.textPrimary, lineHeight: 22 },
  netRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingVertical: 6 },
  netText: { fontSize: font.body, color: colors.textSecondary },
  netName: { color: colors.accentText, fontWeight: '600' },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: space.xl,
    paddingVertical: space.md,
  },
  deleteText: { color: colors.danger, fontSize: font.body, fontWeight: '500' },
});
