import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, Pressable, Switch, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { ScrollMotionProvider, ScrollReveal, useScrollMotion } from '../ScrollMotion';
import { colors, radius, screen, space, type } from '../theme';

const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function Reflections({ route }) {
  const scrollMotion = useScrollMotion();
  const { onMaintenance } = useApp();
  const [tab, setTab] = useState('journal');
  const [items, setItems] = useState([]);
  const [guides, setGuides] = useState([]);
  const [guideId, setGuideId] = useState('');
  const [body, setBody] = useState('');
  const [share, setShare] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const sessionId = route.params?.sessionId || null;

  const load = useCallback(async () => {
    try {
      setItems(await api('/reflections?kind=' + tab));
    } catch (e) {
      if (e.maintenance) onMaintenance();
      else Alert.alert('Could not load reflections', e.message);
    }
  }, [onMaintenance, tab]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    let active = true;
    api('/therapists')
      .then(people => { if (active) setGuides(people); })
      .catch(error => {
        if (active) {
          if (error.maintenance) onMaintenance();
          else Alert.alert('Could not load coaches', error.message);
        }
      });
    return () => { active = false; };
  }, [onMaintenance]);

  useEffect(() => {
    if (route.params?.therapistId) {
      setGuideId(String(route.params.therapistId));
      setShare(false);
    }
    if (route.params?.sessionId) {
      setTab('journal');
      setShare(false);
    }
  }, [route.params?.sessionId, route.params?.therapistId]);

  async function save() {
    setError('');
    setSuccess('');
    if (!body.trim()) {
      setError(tab === 'journal' ? 'Write a few words before saving.' : 'Add something you feel grateful for.');
      return;
    }
    if (tab === 'journal' && share && !guideId) {
      setError('Choose the person you want to share this with.');
      return;
    }
    setSaving(true);
    const kind = tab;
    const entryBody = body.trim();
    try {
      await api('/reflections', {
        method: 'POST',
        body: {
          kind,
          body: entryBody,
          entry_date: today(),
          therapist_id: guideId || undefined,
          session_id: sessionId || undefined,
          shared: kind === 'journal' && share,
        },
      });
      setBody('');
      setError('');
      setSuccess(kind === 'journal' ? 'Your reflection is saved.' : 'Your gratitude note is saved.');
      try {
        const entries = await api('/reflections?kind=' + kind);
        if (kind === tab) setItems(entries);
      } catch (refreshError) {
        if (refreshError.maintenance) onMaintenance();
        else setError('Saved successfully, but the list could not refresh. Reopen this tab to see your entry.');
      }
    } catch (e) {
      if (e.maintenance) onMaintenance();
      else setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const isJournal = tab === 'journal';
  return (
    <ScrollMotionProvider scrollY={scrollMotion.scrollY}>
    <Animated.FlatList
      onScroll={scrollMotion.onScroll}
      scrollEventThrottle={16}
      style={{ ...screen, backgroundColor: 'transparent' }}
      contentContainerStyle={{ padding: space.md, gap: space.md }}
      data={items}
      keyExtractor={entry => String(entry.id)}
      ListHeaderComponent={
        <View style={{ gap: space.md }}>
          <ScrollReveal><View>
            <Text style={type.h1}>A moment for you</Text>
            <Text style={{ color: colors.muted, marginTop: space.xs }}>Make room for what you’re feeling, in your own words.</Text>
          </View></ScrollReveal>
          <ScrollReveal><View style={{ flexDirection: 'row', backgroundColor: colors.category, padding: 4, borderRadius: radius.pill }}>
            {['journal', 'gratitude'].map(option => (
              <Pressable key={option} onPress={() => { setTab(option); setError(''); setSuccess(''); }} style={{ flex: 1, padding: 10, borderRadius: radius.pill, backgroundColor: tab === option ? colors.card : 'transparent' }}>
                <Text style={{ textAlign: 'center', color: tab === option ? colors.accent : colors.muted, fontWeight: '700' }}>{option === 'journal' ? 'Journal' : 'Gratitude'}</Text>
              </Pressable>
            ))}
          </View></ScrollReveal>
          <ScrollReveal><View style={card}>
            <Text style={type.h2}>{isJournal ? 'What’s on your mind?' : 'What felt good today?'}</Text>
            <TextInput
              multiline
              value={body}
              onChangeText={setBody}
              placeholder={isJournal ? 'No need to make it perfect. Start wherever you are.' : 'A person, a small win, a quiet moment…'}
              placeholderTextColor={colors.muted}
              style={{ minHeight: 130, textAlignVertical: 'top', backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: 16, padding: space.md, color: colors.ink, marginTop: space.sm, fontSize: 15, lineHeight: 23 }}
            />
            {isJournal ? (
              <>
                <Text style={{ ...type.small, color: colors.muted, marginTop: space.md }}>Share with a therapist or coach</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.sm }}>
                  {guides.map(guide => (
                    <Pressable key={guide.id} onPress={() => setGuideId(String(guide.id))} style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.pill, borderWidth: 1, borderColor: guideId === String(guide.id) ? colors.brandDeep : colors.line, backgroundColor: guideId === String(guide.id) ? colors.category : colors.card }}>
                      <Text style={{ color: colors.ink, fontSize: 12 }}>{guide.name}</Text>
                    </Pressable>
                  ))}
                </View>
                {guideId ? <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.xs }}>
                  <Text style={{ ...type.small, color: colors.ink }}>Let them read this reflection</Text>
                  <Switch value={share} onValueChange={setShare} trackColor={{ true: colors.brandDeep }} />
                </View> : null}
                <Text style={{ ...type.small, color: colors.muted, marginTop: space.xs }}>Private to you unless you choose to share it.</Text>
                {sessionId ? <Text style={{ ...type.small, color: colors.accent, marginTop: space.xs }}>This note will be linked to your conversation.</Text> : null}
              </>
            ) : null}
            {error ? <Text accessibilityRole="alert" style={{ color: colors.danger, marginTop: space.sm }}>{error}</Text> : null}
            {success ? <Text accessibilityRole="status" style={{ color: colors.accent, marginTop: space.sm, fontWeight: '600' }}>{success}</Text> : null}
            <Pressable accessibilityRole="button" disabled={saving} onPress={save} style={({ pressed }) => ({ marginTop: space.md, minHeight: 50, padding: 14, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.brandDeep, opacity: saving ? 0.6 : pressed ? 0.86 : 1 })}>
              <Text style={{ color: colors.onBrand, fontWeight: '700' }}>{saving ? 'Saving…' : isJournal ? 'Save reflection' : 'Save today’s gratitude'}</Text>
            </Pressable>
          </View></ScrollReveal>
          <ScrollReveal><Text style={{ ...type.h2, marginTop: space.xs }}>{isJournal ? 'Your journal' : 'Grateful for'}</Text></ScrollReveal>
        </View>
      }
      ListEmptyComponent={<Text style={{ color: colors.muted, paddingVertical: space.md }}>Your saved reflections will live here.</Text>}
      renderItem={({ item }) => (
        <ScrollReveal><View style={card}>
          <Text style={{ ...type.small, color: colors.accent, fontWeight: '700' }}>{item.entry_date}{item.therapist_name && item.shared ? ` · Shared with ${item.therapist_name}` : ''}</Text>
          <Text style={{ color: colors.ink, lineHeight: 22, marginTop: space.sm }}>{item.body}</Text>
        </View></ScrollReveal>
      )}
    />
    </ScrollMotionProvider>
  );
}

const card = { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line };
