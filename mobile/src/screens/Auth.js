import React, { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Dia from '../Dia';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, space, type } from '../theme';

const GREETING = 'Hi there! I’m Dia, your Dialogue guide. Create an account and I’ll help you find someone to talk to.';

export default function Auth() {
  const { signIn, onMaintenance } = useApp();
  const [mode, setMode] = useState('register');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { // typewriter greeting
    let i = 0; const t = setInterval(() => { i++; setTyped(GREETING.slice(0, i)); if (i >= GREETING.length) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, []);

  async function submit() {
    setBusy(true);
    try {
      const d = await api(mode === 'register' ? '/auth/register' : '/auth/login', { method: 'POST', body: f });
      await signIn(d.token, d.user);
    } catch (e) { e.maintenance ? onMaintenance() : Alert.alert('Oops', e.message); }
    setBusy(false);
  }
  const input = (k, ph, extra = {}) => (
    <TextInput style={s.input} placeholder={ph} placeholderTextColor={colors.muted} value={f[k]} onChangeText={v => setF({ ...f, [k]: v })} autoCapitalize="none" {...extra} />
  );
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingTop: 72, alignItems: 'center', gap: space.md }} keyboardShouldPersistTaps="handled">
        <Text style={{ ...type.h1, fontSize: 30 }}>Dialogue</Text>
        <Dia />
        <View style={s.bubble}><Text style={{ ...type.body, color: colors.ink }}>{typed}</Text></View>
        <View style={{ width: '100%', gap: space.sm + 4 }}>
          {mode === 'register' && input('name', 'Your name', { autoCapitalize: 'words' })}
          {input('email', 'Email', { keyboardType: 'email-address' })}
          {input('password', 'Password (6+ characters)', { secureTextEntry: true })}
          <Pressable style={[s.btn, busy && { opacity: 0.6 }]} disabled={busy} onPress={submit}>
            <Text style={{ fontWeight: '700' }}>{mode === 'register' ? 'Get started · 3 free minutes' : 'Sign in'}</Text>
          </Pressable>
          <Pressable onPress={() => setMode(mode === 'register' ? 'login' : 'register')}>
            <Text style={{ textAlign: 'center', color: colors.muted }}>{mode === 'register' ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = {
  bubble: { backgroundColor: colors.card, padding: space.md, borderRadius: radius.md, minHeight: 80, width: '100%', borderWidth: 1, borderColor: colors.line },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line, borderRadius: 12, padding: 14, fontSize: 15, color: colors.ink },
  btn: { backgroundColor: colors.brand, padding: 15, borderRadius: radius.pill, alignItems: 'center' },
};
