import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, space, type } from '../theme';
import { BrandMark } from '../BrandMark';

export default function Auth({ route }) {
  const { signIn, onMaintenance } = useApp();
  const [mode, setMode] = useState(route.params?.mode || 'register');
  const [accountType, setAccountType] = useState(route.params?.accountType || 'client');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (accountType === 'client' && mode === 'register' && !f.name.trim()) {
      setError('Add your name to create an account.');
      return;
    }
    if (f.password.length < 6) {
      setError('Your password needs at least 6 characters.');
      return;
    }
    setBusy(true);
    try {
      const path = accountType === 'coach' ? '/auth/coach/login' : mode === 'register' ? '/auth/register' : '/auth/login';
      const d = await api(path, { method: 'POST', body: { ...f, email: f.email.trim().toLowerCase() } });
      await signIn(d.token, d.user);
    } catch (e) {
      if (e.maintenance) onMaintenance();
      else setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const input = (k, ph, extra = {}) => (
    <TextInput style={s.input} placeholder={ph} placeholderTextColor={colors.muted} value={f[k]} onChangeText={v => setF({ ...f, [k]: v })} autoCapitalize="none" {...extra} />
  );
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ height: 4, backgroundColor: colors.brandDeep }} />
      <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.brand}><BrandMark size={44} /><Text style={{ ...type.h1, fontSize: 24 }}>Dialogue</Text></View>
          <Text style={s.tagline}>A little more heard. A little less alone.</Text>
          <View style={s.connection}><Text style={{ color: colors.brandDeep, fontSize: 12, fontWeight: '700' }}>A real person, when you’re ready</Text></View>
          <Text style={s.title}>{accountType === 'coach' ? 'Welcome, coach' : mode === 'register' ? 'Start with a conversation' : 'Welcome back'}</Text>
          <Text style={s.subtitle}>{accountType === 'coach' ? 'Sign in to read reflections shared with you.' : 'Find a thoughtful person to talk things through with.'}</Text>
          {accountType === 'client' && mode === 'register' && input('name', 'Your name', { autoCapitalize: 'words', textContentType: 'name' })}
          {input('email', 'Email address', { keyboardType: 'email-address', textContentType: 'emailAddress' })}
          {input('password', 'Password (at least 6 characters)', { secureTextEntry: true, textContentType: mode === 'register' ? 'newPassword' : 'password' })}
          {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
          <Pressable style={[s.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}>
            <Text style={{ fontWeight: '700', color: '#fff' }}>{busy ? 'One moment…' : accountType === 'coach' ? 'Sign in as coach' : mode === 'register' ? 'Create your account' : 'Sign in'}</Text>
          </Pressable>
          {accountType === 'client' ? (
            <Text style={s.switchLine}>
              {mode === 'register' ? 'Already with us? ' : 'New to Dialogue? '}
              <Text accessibilityRole="link" onPress={() => { setError(''); setMode(mode === 'register' ? 'login' : 'register'); }} style={s.link}>
                {mode === 'register' ? 'Sign in' : 'Create an account'}
              </Text>
            </Text>
          ) : (
            <Text style={s.switchLine}>Coach account access is provided by Dialogue.</Text>
          )}
          <Pressable onPress={() => { setError(''); setAccountType(accountType === 'client' ? 'coach' : 'client'); setMode('login'); }}>
            <Text accessibilityRole="link" style={s.secondaryLink}>{accountType === 'client' ? 'Coach sign in' : 'Back to client sign in'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = {
  page: { flexGrow: 1, minHeight: '100%', alignItems: 'center', justifyContent: 'center', padding: space.sm + 4 },
  card: { width: '100%', maxWidth: 380, padding: space.md + 4, borderRadius: 24, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, gap: space.sm + 2, shadowColor: colors.night, shadowOpacity: 0.07, shadowRadius: 20, shadowOffset: { width: 0, height: 8 } },
  brand: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  tagline: { textAlign: 'center', color: colors.muted, fontSize: 13 },
  connection: { alignSelf: 'center', marginVertical: 1, borderWidth: 1, borderColor: colors.line, backgroundColor: '#F6F9F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  title: { ...type.h2, color: colors.ink, textAlign: 'center', marginTop: 2 },
  subtitle: { ...type.small, color: colors.muted, textAlign: 'center', marginBottom: 2 },
  input: { backgroundColor: '#FAFCF9', borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: 12, fontSize: 14, color: colors.ink },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center' },
  btn: { backgroundColor: colors.green, padding: 12, borderRadius: radius.pill, alignItems: 'center', marginTop: 2 },
  switchLine: { textAlign: 'center', color: colors.muted, fontSize: 13, marginTop: 1 },
  link: { color: colors.green, fontWeight: '700' },
  secondaryLink: { textAlign: 'center', color: colors.muted, fontSize: 12, textDecorationLine: 'underline', padding: 4 },
};
