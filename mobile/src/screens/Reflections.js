import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, space, type } from '../theme';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function Reflections({ route }) {
  const { onMaintenance } = useApp();
  const [tab, setTab] = useState('journal');
  const [items, setItems] = useState([]);
  const [guides, setGuides] = useState([]);
  const [guideId, setGuideId] = useState('');
  const [body, setBody] = useState('');
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const sessionId = route.params?.sessionId || null;

  const load = useCallback(async () => {
    try {
      const [entries, people] = await Promise.all([
        api('/reflections?kind=' + tab),
        guides.length ? Promise.resolve(guides) : api('/therapists'),
      ]);
      setItems(entries);
      setGuides(people);
    } catch (e) {
      if (e.maintenance) onMaintenance();
      else Alert.alert('Could not load reflections', e.message);
    }
  }, [guides, onMaintenance, tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (route.params?.therapistId) {
      setGuideId(String(route.params.therapistId));
      setShare(true);
    }
    if (route.params?.sessionId) {
      setTab('journal');
      setShare(true);
    }
  }, [route.params?.sessionId, route.params?.therapistId]);

  async function save() {
    setError('');
    if (!body.trim()) {
      setError(tab === 'journal' ? 'Write a few words before saving.' : 'Add something you feel grateful for.');
      return;
    }
    if (tab === 'journal' && share && !guideId) {
      setError('Choose the person you want to share this with.');
      return;
    }
    setSaving(true);
    try {
      await api('/reflections', {
        method: 'POST',
        body: {
          kind: tab,
          body,
          entry_date: today(),
          therapist_id: guideId || undefined,
          session_id: sessionId || undefined,
          shared: tab === 'journal' && share,
        },
      });
      setBody('');
      setError('');
      await load();
    } catch (e) {
      if (e.maintenance) onMaintenance();
      else setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isJournal = tab === 'journal';
  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.md, gap: space.md }}
      data={items}
      keyExtractor={entry => String(entry.id)}
      ListHeaderComponent={
        <View style={{ gap: space.md }}>
          <View>
            <Text style={type.h1}>A moment for you</Text>
            <Text style={{ color: colors.muted, marginTop: space.xs }}>Make room for what you’re feeling, in your own words.</Text>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: colors.category, padding: 4, borderRadius: radius.pill }}>
            {['journal', 'gratitude'].map(option => (
              <Pressable key={option} onPress={() => { setTab(option); setError(''); }} style={{ flex: 1, padding: 10, borderRadius: radius.pill, backgroundColor: tab === option ? colors.card : 'transparent' }}>
                <Text style={{ textAlign: 'center', color: tab === option ? colors.green : colors.muted, fontWeight: '700' }}>{option === 'journal' ? 'Journal' : 'Gratitude'}</Text>
              </Pressable>
            ))}
          </View>
          <View style={card}>
            <Text style={type.h2}>{isJournal ? 'What’s on your mind?' : 'What felt good today?'}</Text>
            <TextInput
              multiline
              value={body}
              onChangeText={setBody}
              placeholder={isJournal ? 'No need to make it perfect. Start wherever you are.' : 'A person, a small win, a quiet moment…'}
              placeholderTextColor={colors.muted}
              style={{ minHeight: 110, textAlignVertical: 'top', backgroundColor: '#FAFCF9', borderWidth: 1, borderColor: colors.line, borderRadius: 14, padding: space.md, color: colors.ink, marginTop: space.sm }}
            />
            {isJournal ? (
              <>
                <Text style={{ ...type.small, color: colors.muted, marginTop: space.md }}>Share with a therapist or coach</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm }}>
                  {guides.map(guide => (
                    <Pressable key={guide.id} onPress={() => { setGuideId(String(guide.id)); setShare(true); }} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: guideId === String(guide.id) ? colors.brandDeep : colors.line, backgroundColor: guideId === String(guide.id) ? colors.category : colors.card }}>
                      <Text style={{ color: colors.ink, fontSize: 12 }}>{guide.name}</Text>
                    </Pressable>
                  ))}
                </View>
                {guideId ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs }}>
                  <Text style={{ ...type.small, color: colors.ink }}>Let them read this reflection</Text>
                  <Switch value={share} onValueChange={setShare} trackColor={{ true: colors.brandDeep }} />
                </View> : null}
                {sessionId ? <Text style={{ ...type.small, color: colors.green, marginTop: space.xs }}>This note will be linked to your conversation.</Text> : null}
              </>
            ) : null}
            {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: space.sm }}>{error}</Text> : null}
            <Pressable disabled={saving} onPress={save} style={{ marginTop: space.md, padding: 13, borderRadius: radius.pill, alignItems: 'center', backgroundColor: colors.green, opacity: saving ? 0.6 : 1 }}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>{saving ? 'Saving…' : isJournal ? 'Save reflection' : 'Save today’s gratitude'}</Text>
            </Pressable>
          </View>
          <Text style={{ ...type.h2, marginTop: space.xs }}>{isJournal ? 'Your journal' : 'Grateful for'}</Text>
        </View>
      }
      ListEmptyComponent={<Text style={{ color: colors.muted, paddingVertical: space.md }}>Your saved reflections will live here.</Text>}
      renderItem={({ item }) => (
        <View style={card}>
          <Text style={{ ...type.small, color: colors.green, fontWeight: '700' }}>{item.entry_date}{item.therapist_name && item.shared ? ` · Shared with ${item.therapist_name}` : ''}</Text>
          <Text style={{ color: colors.ink, lineHeight: 22, marginTop: space.sm }}>{item.body}</Text>
        </View>
      )}
    />
  );
}

const card = { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line };
