import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, screen, space, type } from '../theme';

const CATS = [['All', '✨'], ['Career', '💼'], ['Stress', '🌧️'], ['Relationships', '💞'], ['Life', '🌱'], ['Confidence', '💪'], ['Grief', '🕊️']];
const SCENE_MS = 5000;
const TOPIC_CATEGORY = { career: 'Career', stress: 'Stress', relationships: 'Relationships', life: 'Life' };

function Explainer({ data, question }) {
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const pop = useRef(new Animated.Value(0)).current;
  const bar = useRef(new Animated.Value(0)).current;
  const total = data.scenes.length;

  useEffect(() => { // restart the pop-in animation for each scene
    pop.setValue(0); Animated.spring(pop, { toValue: 1, useNativeDriver: true }).start();
  }, [i, pop]);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => (i < total - 1 ? setI(i + 1) : setPlaying(false)), SCENE_MS);
    return () => clearTimeout(t);
  }, [i, playing, total]);
  useEffect(() => { Animated.timing(bar, { toValue: (i + 1) / total, duration: SCENE_MS, useNativeDriver: false }).start(); }, [i, bar, total]);

  const [icon, caption] = data.scenes[i];
  return (
    <View style={{ margin: space.md, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card }}>
      <View style={{ aspectRatio: 16 / 9, backgroundColor: data.hue[i % 2], alignItems: 'center', justifyContent: 'center' }}>
        <Animated.Text style={{ fontSize: 56, opacity: pop, transform: [{ scale: pop }] }}>{icon}</Animated.Text>
        <Text style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: space.md, textAlign: 'center', color: '#fff', fontWeight: '600', backgroundColor: 'rgba(0,0,0,0.35)' }}>{caption}</Text>
      </View>
      <View style={{ height: 4, backgroundColor: colors.line }}><Animated.View style={{ height: 4, backgroundColor: colors.brandDeep, width: bar.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} /></View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: space.sm + 4 }}>
        <Text style={{ ...type.small, color: colors.muted, flex: 1 }} numberOfLines={1}>“{question}” · {total * 5}s</Text>
        <Pressable onPress={() => { if (!playing && i === total - 1) setI(0); setPlaying(p => !p); }}>
          <Text style={{ fontWeight: '700', color: colors.green }}>{playing ? 'Pause' : i === total - 1 ? 'Replay' : 'Play'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function GuideCard({ t, onPress }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={{ backgroundColor: colors.card, marginHorizontal: space.md, marginBottom: space.sm + 4, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line }}>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: colors.avatarPalette[t.id % colors.avatarPalette.length], alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>{t.name.replace('Dr. ', '').split(' ').map(w => w[0]).join('')}</Text>
          <View style={{ position: 'absolute', right: 0, bottom: 0, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff', backgroundColor: t.online ? colors.green : colors.offline }} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={type.h2}>{t.name}</Text>
          <Text style={{ ...type.small, color: colors.muted, marginTop: 2 }}>{t.role} · {t.exp_years} years</Text>
          <Text style={{ ...type.small, color: colors.ink, marginTop: 6 }} numberOfLines={2}>{t.bio}</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.sm }}>
        {t.tags.split(',').slice(0, 3).map(tag => <Text key={tag} style={{ ...type.small, color: colors.green, backgroundColor: colors.category, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill }}>{tag.trim()}</Text>)}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderColor: colors.line, marginTop: space.sm, paddingTop: space.sm }}>
        <View>
          <Text style={{ ...type.small, color: colors.muted }}>★ {t.rating}  ·  {t.online ? 'Available now' : 'In a conversation'}</Text>
          <Text style={{ ...type.small, color: colors.green, fontWeight: '600', marginTop: 3 }}>${(t.per_min_cents / 100).toFixed(2)}/min · first 3 min free</Text>
        </View>
        <Text style={{ ...type.small, color: colors.green, fontWeight: '700' }}>View profile  ›</Text>
      </View>
    </Pressable>
  );
}

export default function Home({ navigation }) {
  const { user, onMaintenance } = useApp();
  const [list, setList] = useState([]);
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [video, setVideo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try { setList(await api('/therapists')); } catch (e) { e.maintenance ? onMaintenance() : Alert.alert('Could not load guides', e.message); }
  }, [onMaintenance]);
  useEffect(() => { load(); }, [load]);

  async function ask() {
    if (!q.trim()) return;
    try {
      const result = await api('/explainer?q=' + encodeURIComponent(q));
      setCat(TOPIC_CATEGORY[result.topic] || 'All');
      setVideo({ ...result, question: q.trim(), key: Date.now() });
    } catch (e) { Alert.alert('Error', e.message); }
  }
  const shown = list.filter(t => cat === 'All' || (t.tags + t.role).toLowerCase().includes(cat.toLowerCase()));

  return (
    <FlatList
      data={shown} keyExtractor={t => String(t.id)} style={{ ...screen, backgroundColor: colors.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      renderItem={({ item }) => <GuideCard t={item} onPress={() => navigation.getParent().navigate('Guide', { id: item.id, name: item.name })} />}
      ListEmptyComponent={<View style={{ alignItems: 'center', padding: space.xl }}><Text style={{ ...type.h2 }}>No guides in this topic yet</Text><Text style={{ color: colors.muted, textAlign: 'center', marginTop: space.xs }}>Try another topic to find someone to talk with.</Text></View>}
      ListHeaderComponent={<View>
        <View style={{ padding: space.md, paddingTop: space.lg }}>
          <Text style={{ ...type.small, color: colors.green, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' }}>A moment for you</Text>
          <Text style={{ ...type.h1, color: colors.ink, marginTop: space.xs }}>What’s on your mind?</Text>
          <Text style={{ color: colors.muted, marginTop: space.xs, marginBottom: space.md }}>Find someone who understands what you’re going through.</Text>
          <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: 18, padding: 5, borderWidth: 1, borderColor: colors.line }}>
            <TextInput style={{ flex: 1, minHeight: 44, paddingHorizontal: space.md, color: colors.ink }} placeholder="Try “work has been stressful”" placeholderTextColor={colors.muted} value={q} onChangeText={setQ} onSubmitEditing={ask} returnKeyType="search" />
            <Pressable accessibilityRole="button" onPress={ask} style={{ backgroundColor: colors.green, borderRadius: 14, paddingHorizontal: 14, justifyContent: 'center' }}><Text style={{ color: '#fff', fontWeight: '700' }}>Find</Text></Pressable>
          </View>
        </View>
        {video && <Explainer key={video.key} data={video} question={video.question} />}
        <FlatList horizontal data={CATS} keyExtractor={c => c[0]} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.md, gap: space.sm, paddingVertical: space.sm }}
          renderItem={({ item: [c, icon] }) => (
            <Pressable onPress={() => setCat(c)} style={{ borderRadius: radius.pill, paddingHorizontal: 13, paddingVertical: 9, backgroundColor: cat === c ? colors.green : colors.card, borderWidth: 1, borderColor: cat === c ? colors.green : colors.line, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 13 }}>{icon}</Text>
              <Text style={{ ...type.small, color: cat === c ? '#fff' : colors.ink, fontWeight: '600' }}>{c}</Text>
            </Pressable>)}/>
        <Pressable onPress={() => navigation.navigate('Tabs', { screen: 'Mood' })} style={{ marginHorizontal: space.md, marginTop: space.sm, marginBottom: space.lg, padding: space.md, borderRadius: radius.md, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFFA8', alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 19 }}>☀</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.h2, color: colors.night }}>Check in with yourself</Text>
            <Text style={{ ...type.small, color: colors.night, marginTop: 2 }}>A small moment to notice how you feel.</Text>
          </View>
          <Text style={{ color: colors.night, fontSize: 20 }}>›</Text>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: space.sm }}>
          <Text style={type.h2}>{video ? `People who understand ${video.topic}` : 'People here to listen'}</Text>
          <Text style={{ ...type.small, color: colors.muted }}>{shown.length} guides</Text>
        </View>
      </View>}
    />
  );
}
