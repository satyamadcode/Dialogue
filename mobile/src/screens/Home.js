import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList as NativeFlatList, Pressable, RefreshControl, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { api } from '../api';
import { useApp } from '../AppContext';
import {
  FadeInUp,
  ParallaxOrb,
  PressableScale,
  useCollapsingHeaderStyle,
  useCompactHeaderStyle,
  useReduceMotion,
  useScrollY,
} from '../motion';
import { colors, radius, screen, space, type } from '../theme';

const CATS = [['All', '✦'], ['Career', '↗'], ['Stress', '≈'], ['Relationships', '♡'], ['Life', '⌖'], ['Confidence', '✧'], ['Grief', '☼']];
const SCENE_MS = 5000;
const TOPIC_CATEGORY = { career: 'Career', stress: 'Stress', relationships: 'Relationships', life: 'Life' };
const CATEGORY_INTERVAL = 112;

function Explainer({ data, question }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const progress = useSharedValue(0);
  const reduceMotion = useReduceMotion();
  const total = data.scenes.length;
  const illustrationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.08]) }],
  }));

  useEffect(() => {
    if (!playing) return undefined;
    const timer = setTimeout(() => {
      if (index < total - 1) setIndex(current => current + 1);
      else setPlaying(false);
    }, SCENE_MS);
    return () => clearTimeout(timer);
  }, [index, playing, total]);

  useEffect(() => {
    progress.value = 0;
    if (!reduceMotion) progress.value = withTiming(1, { duration: SCENE_MS });
    else progress.value = 1;
  }, [index, progress, reduceMotion]);

  const [icon, caption] = data.scenes[index];
  return (
    <FadeInUp style={{ marginHorizontal: space.md, marginBottom: space.md }}>
      <View style={{ overflow: 'hidden', backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line }}>
        <LinearGradient colors={[colors.brand, colors.night]} style={{ aspectRatio: 16 / 9, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, illustrationStyle]}>
            <Text style={{ fontSize: 56 }}>{icon}</Text>
          </Animated.View>
          <Text style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: space.md, color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', textAlign: 'center', backgroundColor: 'rgba(8,11,9,0.72)' }}>{caption}</Text>
        </LinearGradient>
        <View style={{ height: 4, backgroundColor: colors.line }}>
          <View style={{ height: 4, width: `${((index + 1) / total) * 100}%`, backgroundColor: colors.accent }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.md, padding: space.md }}>
          <Text style={{ ...type.small, color: colors.muted, flex: 1 }} numberOfLines={1}>“{question}” · {total * 5}s</Text>
          <PressableScale accessibilityRole="button" onPress={() => {
            if (!playing && index === total - 1) setIndex(0);
            setPlaying(value => !value);
          }}>
            <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.brandDeep }}>{playing ? 'Pause' : index === total - 1 ? 'Replay' : 'Play'}</Text>
          </PressableScale>
        </View>
      </View>
    </FadeInUp>
  );
}

function GuideCard({ guide, onPress, index }) {
  return (
    <FadeInUp delay={index * 60} style={{ marginHorizontal: space.md, marginBottom: space.md }}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${guide.name}, ${guide.role}. View profile`}
        onPress={onPress}
        style={{ backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, borderWidth: 1, borderColor: colors.coachCardLine, shadowColor: colors.night, shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 2 }}
      >
        <View style={{ flexDirection: 'row', gap: space.md }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.avatarPalette[guide.id % colors.avatarPalette.length], alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#FFFFFF', fontFamily: 'Sora_600SemiBold', fontSize: 16 }}>{guide.name.replace('Dr. ', '').split(' ').map(word => word[0]).join('')}</Text>
            <View style={{ position: 'absolute', right: 0, bottom: 0, width: 13, height: 13, borderRadius: 7, borderWidth: 2, borderColor: colors.card, backgroundColor: guide.online ? colors.online : colors.offline }} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.h2, color: colors.coachInk }}>{guide.name}</Text>
            <Text style={{ ...type.small, color: colors.coachMuted, marginTop: 2 }}>{guide.role} · {guide.exp_years} years</Text>
            <Text style={{ ...type.body, color: colors.coachInk, fontSize: 14, lineHeight: 21, marginTop: space.xs }} numberOfLines={2}>{guide.bio}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.xs, marginTop: space.md }}>
          {guide.tags.split(',').slice(0, 3).map(tag => (
            <Text key={tag} style={{ ...type.small, color: colors.brandDeep, backgroundColor: colors.category, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>{tag.trim()}</Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm, borderTopWidth: 1, borderColor: colors.coachCardLine, marginTop: space.md, paddingTop: space.md }}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...type.small, color: colors.coachMuted }}>★ {guide.rating}  ·  {guide.online ? 'Available now' : 'In a conversation'}</Text>
            <Text style={{ ...type.small, color: colors.coachInk, fontFamily: 'Inter_600SemiBold', marginTop: 3 }}>${(guide.per_min_cents / 100).toFixed(2)}/min · first 3 min free</Text>
          </View>
          <Text style={{ ...type.small, color: colors.brandDeep, fontFamily: 'Inter_600SemiBold' }}>View profile  ›</Text>
        </View>
      </PressableScale>
    </FadeInUp>
  );
}

function GuideSkeleton() {
  return (
    <View accessibilityLabel="Loading guides" style={{ marginHorizontal: space.md, marginBottom: space.md, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.md, borderWidth: 1, borderColor: colors.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.brand }} />
        <View style={{ flex: 1, gap: space.sm }}>
          <View style={{ height: 16, width: '52%', borderRadius: radius.pill, backgroundColor: colors.brand }} />
          <View style={{ height: 12, width: '72%', borderRadius: radius.pill, backgroundColor: colors.bg }} />
        </View>
      </View>
      <View style={{ height: 12, width: '86%', borderRadius: radius.pill, backgroundColor: colors.bg, marginTop: space.md }} />
      <View style={{ height: 12, width: '64%', borderRadius: radius.pill, backgroundColor: colors.bg, marginTop: space.sm }} />
    </View>
  );
}

export default function Home({ navigation }) {
  const { user, onMaintenance } = useApp();
  const { scrollY, onScroll } = useScrollY();
  const heroStyle = useCollapsingHeaderStyle(scrollY);
  const compactStyle = useCompactHeaderStyle(scrollY);
  const [list, setList] = useState([]);
  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');
  const [video, setVideo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (showSkeleton = false) => {
    if (showSkeleton) setLoading(true);
    try {
      setList(await api('/therapists'));
    } catch (error) {
      if (error.maintenance) onMaintenance();
      else Alert.alert('Could not load guides', error.message);
    } finally {
      if (showSkeleton) setLoading(false);
    }
  }, [onMaintenance]);

  useEffect(() => { load(true); }, [load]);

  async function ask() {
    if (!query.trim()) return;
    try {
      const result = await api('/explainer?q=' + encodeURIComponent(query));
      setCategory(TOPIC_CATEGORY[result.topic] || 'All');
      setVideo({ ...result, question: query.trim(), key: Date.now() });
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  }

  const shown = list.filter(guide => category === 'All' || (guide.tags + guide.role).toLowerCase().includes(category.toLowerCase()));

  const listHeader = (
    <View>
      <View style={{ overflow: 'hidden', marginBottom: space.md }}>
        <LinearGradient colors={[colors.night, '#102318', '#173B25']} style={{ padding: space.md, paddingTop: space.lg, paddingBottom: space.lg, minHeight: 266 }}>
          <ParallaxOrb scrollY={scrollY} size={210} color={colors.green} top={-70} right={-80} speed={0.12} opacity={0.24} />
          <ParallaxOrb scrollY={scrollY} size={116} color={colors.accent} top={104} right={30} speed={0.2} opacity={0.18} />
          <Animated.View style={heroStyle}>
            <Text style={{ ...type.small, color: colors.accent, fontFamily: 'Inter_600SemiBold', letterSpacing: 1.1, textTransform: 'uppercase' }}>A moment for you</Text>
            <Text style={{ ...type.display, color: '#FFFFFF', marginTop: space.sm }}>What’s on{'\n'}your mind?</Text>
            <Text style={{ ...type.body, color: colors.onDarkMuted, marginTop: space.sm, marginBottom: space.lg }}>Find someone who understands what you’re going through.</Text>
          </Animated.View>
          <View style={{ flexDirection: 'row', backgroundColor: colors.card, borderRadius: radius.md, padding: 5, borderWidth: 1, borderColor: colors.line }}>
            <TextInput
              style={{ flex: 1, minHeight: 48, paddingHorizontal: space.md, color: colors.ink, fontFamily: 'Inter_400Regular' }}
              placeholder="Try “work has been stressful”"
              placeholderTextColor={colors.muted}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={ask}
              returnKeyType="search"
              accessibilityLabel="Describe what is on your mind"
            />
            <PressableScale accessibilityRole="button" accessibilityLabel="Find a guide" onPress={ask} style={{ backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: space.md, justifyContent: 'center' }}>
              <Text style={{ color: colors.onAccent, fontFamily: 'Inter_600SemiBold' }}>Find</Text>
            </PressableScale>
          </View>
        </LinearGradient>
      </View>
      {video && <Explainer key={video.key} data={video} question={video.question} />}
      <NativeFlatList
        horizontal
        data={CATS}
        keyExtractor={item => item[0]}
        showsHorizontalScrollIndicator={false}
        snapToInterval={CATEGORY_INTERVAL}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: space.md, gap: space.sm, paddingVertical: space.sm }}
        renderItem={({ item: [label, icon] }) => {
          const selected = category === label;
          return (
            <PressableScale
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setCategory(label)}
              style={{ width: CATEGORY_INTERVAL - space.sm, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 10, backgroundColor: selected ? colors.accent : colors.card, borderWidth: 1, borderColor: selected ? colors.accent : colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Text style={{ fontSize: 13, color: selected ? colors.onAccent : colors.brandDeep }}>{icon}</Text>
              <Text style={{ ...type.small, color: selected ? colors.onAccent : colors.ink, fontFamily: 'Inter_600SemiBold' }}>{label}</Text>
            </PressableScale>
          );
        }}
      />
      <PressableScale onPress={() => navigation.navigate('Tabs', { screen: 'Mood' })} style={{ marginHorizontal: space.md, marginTop: space.sm, marginBottom: space.lg, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.brand, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 20, color: colors.accent }}>☀</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={type.h2}>Check in with yourself</Text>
          <Text style={{ ...type.small, color: colors.muted, marginTop: 2 }}>A small moment to notice how you feel.</Text>
        </View>
        <Text style={{ color: colors.brandDeep, fontSize: 22 }}>›</Text>
      </PressableScale>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.md, paddingBottom: space.md }}>
        <Text style={{ ...type.h2, flex: 1, paddingRight: space.sm }}>{video ? `People who understand ${video.topic}` : 'People here to listen'}</Text>
        <Text style={{ ...type.small, color: colors.muted }}>{shown.length} guides</Text>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.View pointerEvents="none" style={[{ position: 'absolute', zIndex: 2, top: 0, left: 0, right: 0, paddingHorizontal: space.md, paddingTop: space.sm, paddingBottom: space.sm, backgroundColor: 'rgba(8,11,9,0.96)', borderBottomWidth: 1, borderBottomColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, compactStyle]}>
        <Text style={{ ...type.h2, fontSize: 17 }}>Untold</Text>
        <Text style={{ ...type.small, color: colors.brandDeep, fontFamily: 'Inter_600SemiBold' }}>{user?.wallet_cents != null ? `$${(user.wallet_cents / 100).toFixed(2)}` : ''}</Text>
      </Animated.View>
      <Animated.FlatList
        onScroll={onScroll}
        scrollEventThrottle={16}
        data={loading ? [] : shown}
        keyExtractor={guide => String(guide.id)}
        style={screen}
        contentContainerStyle={{ paddingBottom: space.xl }}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.brandDeep} colors={[colors.brandDeep, colors.accent]} onRefresh={async () => {
          setRefreshing(true);
          await load();
          setRefreshing(false);
        }} />}
        renderItem={({ item, index }) => (
          <GuideCard guide={item} index={index} onPress={() => navigation.getParent().navigate('Guide', { id: item.id, name: item.name })} />
        )}
        ListEmptyComponent={loading
          ? <View><GuideSkeleton /><GuideSkeleton /><GuideSkeleton /></View>
          : <View style={{ alignItems: 'center', padding: space.xl }}>
            <Text style={type.h2}>No guides in this topic yet</Text>
            <Text style={{ ...type.body, color: colors.muted, textAlign: 'center', marginTop: space.xs }}>Try another topic to find someone to talk with.</Text>
          </View>}
        ListHeaderComponent={listHeader}
      />
    </View>
  );
}
