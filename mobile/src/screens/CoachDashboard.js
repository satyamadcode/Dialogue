import React, { useCallback, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api';
import { useApp } from '../AppContext';
import { colors, radius, space, type } from '../theme';

export default function CoachDashboard() {
  const { user, onMaintenance } = useApp();
  const [entries, setEntries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setEntries(await api('/coach/reflections'));
    } catch (error) {
      if (error.maintenance) onMaintenance();
      else Alert.alert('Could not load shared reflections', error.message);
    }
  }, [onMaintenance]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: space.md, gap: space.md, flexGrow: 1 }}
      data={entries}
      keyExtractor={entry => String(entry.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={{ marginBottom: space.sm }}>
          <Text style={type.h1}>Hello, {user.name.split(' ')[0]}</Text>
          <Text style={{ color: colors.muted, marginTop: space.xs }}>Reflections clients chose to share with you.</Text>
        </View>
      }
      ListEmptyComponent={
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: space.xl }}>
          <Text style={{ fontSize: 36, marginBottom: space.sm }}>☕</Text>
          <Text style={{ ...type.h2, textAlign: 'center' }}>A quiet moment</Text>
          <Text style={{ color: colors.muted, textAlign: 'center', marginTop: space.xs }}>Shared reflections will appear here when a client chooses to share one with you.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={{ backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line }}>
          <Text style={{ ...type.small, color: colors.green, fontWeight: '700' }}>{item.client_name} · {item.entry_date}</Text>
          <Text style={{ ...type.h2, marginTop: space.xs }}>{item.kind === 'gratitude' ? 'Gratitude' : 'Journal reflection'}</Text>
          <Text style={{ color: colors.ink, lineHeight: 22, marginTop: space.sm }}>{item.body}</Text>
          {item.session_id ? <Text style={{ ...type.small, color: colors.muted, marginTop: space.sm }}>Shared after a conversation</Text> : null}
        </View>
      )}
    />
  );
}
