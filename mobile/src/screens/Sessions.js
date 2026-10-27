import React, { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, space, type } from '../theme';

export default function Sessions() {
  const { onMaintenance } = useApp();
  const [items, setItems] = useState([]);
  const load = useCallback(() => { api('/bookings').then(setItems).catch(e => e.maintenance ? onMaintenance() : Alert.alert('Error', e.message)); }, [onMaintenance]);
  useFocusEffect(load);
  const cancel = id => api('/bookings/' + id, { method: 'DELETE' }).then(load);
  return (
    <FlatList style={{ backgroundColor: colors.bg }} data={items} keyExtractor={b => String(b.id)} contentContainerStyle={{ padding: space.md, gap: space.md }}
      ListEmptyComponent={<Text style={{ color: colors.muted, textAlign: 'center', marginTop: space.xl }}>No sessions yet. Open a guide and tap Schedule.</Text>}
      renderItem={({ item: b }) => (
        <View style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line }}>
          <Text style={type.h2}>{b.therapist_name}</Text>
          <Text>{b.slot} · {b.role}</Text>
          <Text style={{ ...type.small, color: colors.muted }}>Shared: {b.resources.length ? b.resources.join(', ') : 'nothing'}</Text>
          <Pressable onPress={() => cancel(b.id)} style={{ marginTop: space.sm }}><Text style={{ color: colors.danger, fontWeight: '600' }}>Cancel session</Text></Pressable>
        </View>)} />
  );
}
