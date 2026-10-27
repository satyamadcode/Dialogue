import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Animated, FlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, space, type } from '../theme';

const CATS = [['All', '✨'], ['Career', '💼'], ['Stress', '🌧️'], ['Relationships', '💞'], ['Life', '🌱'], ['Confidence', '💪'], ['Grief', '🕊️']];
const SCENE_MS = 5000;

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
    <Pressable onPress={onPress} style={{ backgroundColor: colors.card, marginHorizontal: space.md, marginBottom: space.md, borderRadius: radius.md, padding: space.md, flexDirection: 'row', gap: space.md, borderWidth: 1, borderColor: colors.line }}>
      <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: t.color, borderWidth: 3, borderColor: colors.brand, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>{t.name.replace('Dr. ', '').split(' ').map(w => w[0]).join('')}</Text>
        <View style={{ position: 'absolute', right: -2, bottom: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#fff', backgroundColor: t.online ? colors.green : '#E0A030' }} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.h2}>{t.name}</Text>
        <Text style={{ ...type.small, color: colors.muted }}>{t.role} · {t.tags}</Text>
        <Text style={{ ...type.small, color: colors.muted }}>Exp {t.exp_years} yrs · ★ {t.rating} · {t.online ? 'Online' : 'Busy'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ ...type.small, color: colors.muted, textDecorationLine: 'line-through' }}>${(t.per_min_cents / 100).toFixed(2)}/min</Text>
        <Text style={{ ...type.small, color: colors.green, fontWeight: '700' }}>3 min FREE</Text>
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
    try { setVideo({ ...(await api('/explainer?q=' + encodeURIComponent(q))), question: q.trim(), key: Date.now() }); } catch (e) { Alert.alert('Error', e.message); }
  }
  const shown = list.filter(t => cat === 'All' || (t.tags + t.role).toLowerCase().includes(cat.toLowerCase()));

  return (
    <FlatList
      data={shown} keyExtractor={t => String(t.id)} style={{ backgroundColor: colors.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
      renderItem={({ item }) => <GuideCard t={item} onPress={() => navigation.getParent().navigate('Guide', { id: item.id, name: item.name })} />}
      ListHeaderComponent={<View>
        <View style={{ padding: space.md }}>
          <Text style={type.h1}>Hi {user.name.split(' ')[0]} 👋</Text>
          <Text style={{ color: colors.muted, marginVertical: space.sm }}>What would you like to talk about today?</Text>
          <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.pill, padding: 6, borderWidth: 1, borderColor: colors.line }}>
            <TextInput style={{ flex: 1, paddingHorizontal: space.md, color: colors.ink }} placeholder="e.g. I’m unhappy at my job" placeholderTextColor={colors.muted} value={q} onChangeText={setQ} onSubmitEditing={ask} returnKeyType="search" />
            <Pressable onPress={ask} style={{ backgroundColor: colors.brand, borderRadius: radius.pill, paddingHorizontal: 18, justifyContent: 'center' }}><Text style={{ fontWeight: '700' }}>Show me</Text></Pressable>
          </View>
        </View>
        {video && <Explainer key={video.key} data={video} question={video.question} />}
        <FlatList horizontal data={CATS} keyExtractor={c => c[0]} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.md, gap: space.md, paddingVertical: space.sm }}
          renderItem={({ item: [c, icon] }) => (
            <Pressable onPress={() => setCat(c)} style={{ alignItems: 'center', width: 68 }}>
              <View style={{ width: 54, height: 54, borderRadius: 27, backgroundColor: '#FFF3C4', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: cat === c ? colors.brandDeep : 'transparent' }}><Text style={{ fontSize: 24 }}>{icon}</Text></View>
              <Text style={{ ...type.small, marginTop: 4 }}>{c}</Text>
            </Pressable>)} />
        <View style={{ margin: space.md, padding: space.lg, borderRadius: radius.md, backgroundColor: colors.night }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>First 3 minutes free</Text>
          <Text style={{ color: '#B8C0D9' }}>With every guide you chat with</Text>
        </View>
        <Text style={{ ...type.h2, paddingHorizontal: space.md, paddingBottom: space.sm }}>Guides</Text>
      </View>}
    />
  );
}
