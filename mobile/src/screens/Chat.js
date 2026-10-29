import React, { useEffect, useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, money, radius, space, type } from '../theme';

const QUICK = ['I feel stuck', 'I’m stressed about work', 'Relationship worries', 'I want a plan'];
const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');

export default function Chat({ route, navigation }) {
  const { id, name } = route.params;
  const { user, setWallet } = useApp();
  const [session, setSession] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const [sec, setSec] = useState(0);
  const [ended, setEnded] = useState(false);
  const [ending, setEnding] = useState(false);
  const list = useRef(null);
  const sessionIdRef = useRef(null);
  const endedRef = useRef(false);

  useEffect(() => {
    let active = true;
    api('/sessions', { method: 'POST', body: { therapist_id: id } })
      .then(s => {
        if (!active) {
          api(`/sessions/${s.id}/end`, { method: 'POST' }).catch(() => {});
          return;
        }
        sessionIdRef.current = s.id;
        setSession(s);
        setMsgs([{ id: 'h', me: false, body: s.hello }]);
      })
      .catch(e => { if (active) { Alert.alert('Cannot start chat', e.message); navigation.goBack(); } });
    return () => {
      active = false;
      if (sessionIdRef.current && !endedRef.current) {
        endedRef.current = true;
        api(`/sessions/${sessionIdRef.current}/end`, { method: 'POST' }).then(r => setWallet(r.wallet_cents)).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // start exactly one session per screen visit

  useEffect(() => { if (!session) return; const t = setInterval(() => setSec(Math.floor(Date.now() / 1000) - session.started_at), 1000); return () => clearInterval(t); }, [session]);

  async function send(body) {
    body = (body ?? text).trim();
    if (!body || typing || !session || ended) return;
    setText(''); setTyping(true);
    setMsgs(m => [...m, { id: 'u' + Date.now(), me: true, body }]);
    try {
      const r = await api(`/sessions/${session.id}/messages`, { method: 'POST', body: { body } });
      setWallet(r.wallet_cents);
      setMsgs(m => [...m, { id: 'g' + Date.now(), me: false, body: r.reply }]);
    } catch (e) { Alert.alert('Session', e.message); if (e.status === 402) navigation.goBack(); }
    setTyping(false);
  }

  async function endSession() {
    if (!session || ending || ended) return;
    setEnding(true);
    endedRef.current = true;
    try {
      const result = await api(`/sessions/${session.id}/end`, { method: 'POST' });
      setEnded(true);
      setWallet(result.wallet_cents);
    } catch (e) {
      endedRef.current = false;
      Alert.alert('Could not end conversation', e.message);
    } finally {
      setEnding(false);
    }
  }

  const free = sec < 180;
  if (ended) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: space.xl }}>
        <Text style={{ fontSize: 44 }}>🌿</Text>
        <Text style={{ ...type.h1, color: colors.ink, textAlign: 'center', marginTop: space.md }}>Thank you for showing up.</Text>
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: space.sm }}>Take a moment to note what you want to carry with you from this conversation.</Text>
        <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Reflections', params: { sessionId: session.id, therapistId: id } })} style={{ marginTop: space.lg, padding: 14, paddingHorizontal: 22, borderRadius: radius.pill, backgroundColor: colors.green }}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Write a reflection</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Home' })} style={{ marginTop: space.md, padding: 10 }}>
          <Text style={{ color: colors.green, fontWeight: '700' }}>Back to Dialogue</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: space.sm, gap: space.md }}>
        <Text style={{ ...type.small, color: colors.muted }}>{mmss(sec)} · {free ? 'First 3 minutes are free' : `${money(session?.per_min_cents || 0)}/min`} · Balance {money(user.wallet_cents)}</Text>
        <Pressable onPress={endSession} disabled={ending || !session} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: colors.category }}>
          <Text style={{ color: colors.green, fontWeight: '700', fontSize: 12 }}>{ending ? 'Ending…' : 'End'}</Text>
        </Pressable>
      </View>
      <FlatList ref={list} data={msgs} keyExtractor={m => m.id} contentContainerStyle={{ padding: space.md, gap: space.sm }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={{ maxWidth: '80%', alignSelf: item.me ? 'flex-end' : 'flex-start', backgroundColor: item.me ? colors.brand : colors.card, padding: 12, borderRadius: 16, borderWidth: item.me ? 0 : 1, borderColor: colors.line }}>
            <Text>{item.body}</Text>
          </View>)}
        ListFooterComponent={typing ? <Text style={{ color: colors.muted }}>typing…</Text> : null} />
      <FlatList horizontal data={QUICK} keyExtractor={q => q} showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: space.md, gap: space.sm, paddingBottom: space.sm }}
        renderItem={({ item }) => <Pressable onPress={() => send(item)} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}><Text style={type.small}>{item}</Text></Pressable>} />
      <View style={{ flexDirection: 'row', gap: space.sm, padding: space.md, backgroundColor: colors.card, borderTopWidth: 1, borderColor: colors.line }}>
        <TextInput style={{ flex: 1, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingHorizontal: space.md, backgroundColor: colors.bg, color: colors.ink }} placeholder="Type a message" placeholderTextColor={colors.muted} value={text} onChangeText={setText} onSubmitEditing={() => send()} />
        <Pressable onPress={() => send()} style={{ backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 18, justifyContent: 'center' }}><Text style={{ fontWeight: '700' }}>Send</Text></Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
