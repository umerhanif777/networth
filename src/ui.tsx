import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { colors, font, radius, space, avatarColorFor, initials } from './theme';
import type { Availability } from './types';

// --- Avatar -------------------------------------------------------------
export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const c = avatarColorFor(name);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: c.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: c.fg, fontWeight: '600', fontSize: size * 0.34 }}>
        {initials(name)}
      </Text>
    </View>
  );
}

// --- Skill tag ----------------------------------------------------------
export function Tag({
  label,
  tone = 'neutral',
  onPress,
  selected,
}: {
  label: string;
  tone?: 'neutral' | 'accent';
  onPress?: () => void;
  selected?: boolean;
}) {
  const accent = tone === 'accent' || selected;
  const body = (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: accent ? colors.accentBg : colors.surfaceMuted,
          borderColor: selected ? colors.accent : 'transparent',
        },
      ]}
    >
      <Text
        style={{
          color: accent ? colors.accentText : colors.textSecondary,
          fontSize: font.small,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
    </View>
  );
  if (onPress)
    return (
      <Pressable onPress={onPress} hitSlop={4}>
        {body}
      </Pressable>
    );
  return body;
}

// --- Availability pill --------------------------------------------------
const availLabel: Record<Availability, string> = {
  available: 'available',
  busy: 'busy',
  unknown: 'ask',
};
export function AvailabilityPill({ value }: { value: Availability }) {
  const map = {
    available: { bg: colors.successBg, fg: colors.success },
    busy: { bg: colors.warningBg, fg: colors.warning },
    unknown: { bg: colors.surfaceMuted, fg: colors.textMuted },
  }[value];
  return (
    <View style={[styles.pill, { backgroundColor: map.bg }]}>
      <Text style={{ color: map.fg, fontSize: font.tiny, fontWeight: '600' }}>
        {availLabel[value]}
      </Text>
    </View>
  );
}

// --- Button -------------------------------------------------------------
export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const v = {
    primary: { bg: colors.accent, fg: '#fff', border: colors.accent },
    secondary: { bg: colors.surface, fg: colors.textPrimary, border: colors.borderStrong },
    danger: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBg },
    ghost: { bg: 'transparent', fg: colors.textSecondary, border: 'transparent' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: v.bg, borderColor: v.border, opacity: pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {icon}
      <Text style={{ color: v.fg, fontWeight: '600', fontSize: font.body }}>{title}</Text>
    </Pressable>
  );
}

// --- Card ---------------------------------------------------------------
export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const Comp: any = onPress ? Pressable : View;
  return (
    <Comp
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        styles.card,
        onPress && pressed ? { backgroundColor: colors.surfaceMuted } : null,
        style,
      ]}
    >
      {children}
    </Comp>
  );
}

// --- Section label ------------------------------------------------------
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

// --- Empty state --------------------------------------------------------
export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: space.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pill: {
    paddingHorizontal: space.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  sectionLabel: {
    fontSize: font.small,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: space.sm,
    marginTop: space.lg,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: space.xxl,
    paddingHorizontal: space.xl,
  },
  emptyTitle: {
    fontSize: font.h3,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: space.xs,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: font.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 21,
  },
});
