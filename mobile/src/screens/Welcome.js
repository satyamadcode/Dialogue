import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { BrandMark } from '../BrandMark';
import { colors, radius, screen, space, type } from '../theme';

export default function Welcome({ navigation }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.md }}>
      <View style={{ ...screen, maxWidth: 430, justifyContent: 'center', gap: space.lg }}>
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <BrandMark size={68} />
          <Text style={{ ...type.display, color: colors.ink }}>Dialogue</Text>
          <Text style={{ color: colors.muted, fontSize: 15 }}>A little more heard. A little less alone.</Text>
        </View>
        <View style={{ backgroundColor: colors.brand, borderRadius: radius.lg, padding: space.lg, minHeight: 210, justifyContent: 'space-between', overflow: 'hidden' }}>
          <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: '#FFFFFFA8', alignItems: 'center', justifyContent: 'center' }}>
            <BrandMark size={44} />
          </View>
          <View>
            <Text style={{ ...type.h1, color: colors.night }}>A softer place to land.</Text>
            <Text style={{ ...type.body, color: colors.night, marginTop: space.xs }}>Talk with someone who listens, and take your next step at your own pace.</Text>
          </View>
        </View>
        <View style={{ gap: space.md }}>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Auth', { mode: 'register' })} style={{ padding: 16, borderRadius: radius.pill, backgroundColor: colors.green, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Create your account</Text>
          </Pressable>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            Already have an account?{' '}
            <Text accessibilityRole="link" onPress={() => navigation.navigate('Auth', { mode: 'login' })} style={{ color: colors.green, fontWeight: '700' }}>Sign in</Text>
          </Text>
          <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Auth', { mode: 'login', accountType: 'coach' })} style={{ alignSelf: 'center', padding: space.xs }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Coach sign in</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
