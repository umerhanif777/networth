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
import { useAccount } from '../account';
import { Logo } from '../components/Logo';
import { colors, font, radius, space } from '../theme';
import { Button } from '../ui';

type Step = 'method' | 'email' | 'emailSent' | 'phone' | 'otp' | 'name';

// The optional sign-in flow. Kept deliberately short: pick a method, do the
// minimum, and continue. Reachable only when a backend is configured.
export function OnboardingScreen({ onClose }: { onClose: () => void }) {
  const account = useAccount();
  const [step, setStep] = useState<Step>('method');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>, next?: Step) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      if (next) setStep(next);
    } catch (e: any) {
      setError(e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.topbar}>
        {step === 'method' ? (
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.link}>Not now</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => setStep('method')} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {step === 'method' && (
          <>
            <View style={styles.hero}>
              <Logo size={44} />
              <Text style={styles.title}>Back up your network</Text>
              <Text style={styles.subtitle}>
                Sync across your devices and reach the people you know. Your data stays
                private to you.
              </Text>
            </View>
            <MethodButton
              icon="logo-google"
              label="Continue with Google"
              onPress={() => run(account.signInWithGoogle, 'name')}
            />
            <MethodButton
              icon="mail-outline"
              label="Continue with email"
              onPress={() => setStep('email')}
            />
            <MethodButton
              icon="chatbubble-outline"
              label="Continue with phone"
              onPress={() => setStep('phone')}
            />
            <Text style={styles.fine}>
              You can keep using Networthit privately without signing in.
            </Text>
          </>
        )}

        {step === 'email' && (
          <StepPane title="What's your email?" hint="We'll send a one-tap sign-in link.">
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@email.com"
              placeholderTextColor={colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
              style={styles.input}
            />
            <Button
              title="Send sign-in link"
              onPress={() => run(() => account.sendEmailLink(email.trim()), 'emailSent')}
            />
          </StepPane>
        )}

        {step === 'emailSent' && (
          <StepPane
            title="Check your email"
            hint={`We sent a sign-in link to ${email || 'your inbox'}. Open it on this device to finish.`}
          >
            <Button title="Done" variant="secondary" onPress={onClose} />
          </StepPane>
        )}

        {step === 'phone' && (
          <StepPane title="What's your number?" hint="We'll text you a 6-digit code.">
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="+92 300 1234567"
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              autoFocus
              style={styles.input}
            />
            <Button
              title="Send code"
              onPress={() => run(() => account.sendPhoneCode(phone.trim()), 'otp')}
            />
          </StepPane>
        )}

        {step === 'otp' && (
          <StepPane title="Enter the code" hint={`Sent to ${phone || 'your phone'}.`}>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              autoFocus
              style={[styles.input, { letterSpacing: 6, textAlign: 'center' }]}
            />
            <Button
              title="Verify"
              onPress={() => run(() => account.verifyPhoneCode(phone.trim(), code.trim()), 'name')}
            />
          </StepPane>
        )}

        {step === 'name' && (
          <StepPane
            title="What should we call you?"
            hint="Optional — this is the name others see when you connect."
          >
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={account.user?.name ?? 'Your name'}
              placeholderTextColor={colors.textMuted}
              autoFocus
              style={styles.input}
            />
            <Button
              title="Continue"
              onPress={() => run(async () => {
                if (name.trim()) await account.setDisplayName(name.trim());
              }).then(onClose)}
            />
          </StepPane>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {busy && <Text style={styles.busy}>Working…</Text>}
        <View style={{ height: space.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MethodButton({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.method, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      <Ionicons name={icon} size={20} color={colors.textPrimary} />
      <Text style={styles.methodLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function StepPane({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepHint}>{hint}</Text>
      <View style={{ gap: space.md, marginTop: space.lg }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  topbar: { paddingHorizontal: space.lg, paddingVertical: space.md, minHeight: 48, justifyContent: 'center' },
  link: { fontSize: font.body, color: colors.textSecondary, fontWeight: '500' },
  body: { paddingHorizontal: space.lg, paddingTop: space.sm },
  hero: { alignItems: 'center', marginBottom: space.xl, gap: space.sm },
  title: { fontSize: font.h1, fontWeight: '700', color: colors.textPrimary, marginTop: space.sm },
  subtitle: {
    fontSize: font.body,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: space.sm,
  },
  method: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  methodLabel: { flex: 1, fontSize: font.body, fontWeight: '600', color: colors.textPrimary },
  fine: { fontSize: font.small, color: colors.textMuted, textAlign: 'center', marginTop: space.md },
  stepTitle: { fontSize: font.h2, fontWeight: '700', color: colors.textPrimary },
  stepHint: { fontSize: font.body, color: colors.textSecondary, marginTop: space.xs, lineHeight: 21 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 12,
    fontSize: font.body,
    color: colors.textPrimary,
  },
  error: { fontSize: font.small, color: colors.danger, marginTop: space.md, textAlign: 'center' },
  busy: { fontSize: font.small, color: colors.textMuted, marginTop: space.md, textAlign: 'center' },
});
