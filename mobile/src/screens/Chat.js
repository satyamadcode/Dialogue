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
  const list = useRef(null);

  useEffect(() => {
    let sid;
    api('/sessions', { method: 'POST', body: { therapist_id: id } })
      .then(s => { sid = s.id; setSession(s); setMsgs([{ id: 'h', me: false, body: s.hello }]); })
      .catch(e => { Alert.alert('Cannot start chat', e.message); navigation.goBack(); });
    return () => { if (sid) api(`/sessions/${sid}/end`, { method: 'POST' }).then(r => setWallet(r.wallet_cents)).catch(() => {}); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // start exactly one session per screen visit

  useEffect(() => { if (!session) return; const t = setInterval(() => setSec(Math.floor(Date.now() / 1000) - session.started_at), 1000); return () => clearInterval(t); }, [session]);

  async function send(body) {
    body = (body ?? text).trim();
    if (!body || typing) return;
    setText(''); setTyping(true);
    setMsgs(m => [...m, { id: 'u' + Date.now(), me: true, body }]);
    try {
      const r = await api(`/sessions/${session.id}/messages`, { method: 'POST', body: { body } });
      setWallet(r.wallet_cents);
      setMsgs(m => [...m, { id: 'g' + Date.now(), me: false, body: r.reply }]);
    } catch (e) { Alert.alert('Session', e.message); if (e.status === 402) navigation.goBack(); }
    setTyping(false);
  }
  const free = sec < 180;
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <Text style={{ textAlign: 'center', padding: space.sm, ...type.small, color: colors.muted }}>
        {mmss(sec)} · {free ? 'First 3 minutes are free' : `${money(session?.per_min_cents || 0)}/min`} · Balance {money(user.wallet_cents)}
      </Text>
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
