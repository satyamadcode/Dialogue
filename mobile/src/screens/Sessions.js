import React, { useCallback, useState } from 'react';
import { Alert, Animated, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { ScrollMotionProvider, ScrollReveal, useScrollMotion } from '../ScrollMotion';
import { colors, money, radius, screen, space, type } from '../theme';

export default function Sessions() {
  const scrollMotion = useScrollMotion();
  const { onMaintenance } = useApp();
  const [items, setItems] = useState([]);
  const load = useCallback(() => { api('/bookings').then(setItems).catch(e => e.maintenance ? onMaintenance() : Alert.alert('Error', e.message)); }, [onMaintenance]);
  useFocusEffect(load);
  const cancel = id => api('/bookings/' + id, { method: 'DELETE' }).then(load);
  const sessionTitle = type => type === 'clarity' ? '1:1 Clarity Session' : 'Growth Alignment';
  const sessionDate = slot => {
    const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})$/.exec(slot);
    if (!match) return slot;
    const date = new Date(`${match[1]}T12:00:00`);
    return `${date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${match[2]}`;
  };
  return (
    <ScrollMotionProvider scrollY={scrollMotion.scrollY}>
    <Animated.FlatList onScroll={scrollMotion.onScroll} scrollEventThrottle={16} style={{ ...screen, backgroundColor: 'transparent' }} data={items} keyExtractor={b => String(b.id)} contentContainerStyle={{ padding: space.md, gap: space.md, flexGrow: 1 }}
      ListHeaderComponent={<ScrollReveal><View style={{ marginBottom: space.sm }}><Text style={type.h1}>Your time, your pace</Text><Text style={{ color: colors.muted, marginTop: space.xs }}>Upcoming conversations and plans.</Text></View></ScrollReveal>}
      ListEmptyComponent={<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.xl }}><Text style={{ fontSize: 34, color: colors.accent }}>◷</Text><Text style={{ ...type.h2, marginTop: space.sm }}>Nothing scheduled yet</Text><Text style={{ color: colors.muted, textAlign: 'center', marginTop: space.xs }}>When you find someone you’d like to talk with, your sessions will show up here.</Text></View>}
      renderItem={({ item: b }) => (
        <ScrollReveal><View style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line }}>
          <Text style={type.h2}>{b.therapist_name}</Text>
          <Text style={{ color: colors.accent, fontWeight: '600', marginTop: 4 }}>{sessionTitle(b.session_type)} · {b.duration_minutes} min</Text>
          <Text style={{ marginTop: 3 }}>{sessionDate(b.slot)} · {b.role}</Text>
          <Text style={{ ...type.small, color: colors.muted, marginTop: 3 }}>Session rate: {money(b.price_cents)}</Text>
          <Text style={{ ...type.small, color: colors.muted }}>Shared: {b.resources.length ? b.resources.join(', ') : 'nothing'}</Text>
          <Pressable onPress={() => cancel(b.id)} style={{ marginTop: space.sm }}><Text style={{ color: colors.danger, fontWeight: '600' }}>Cancel session</Text></Pressable>
        </View></ScrollReveal>)} />
    </ScrollMotionProvider>
  );
}
