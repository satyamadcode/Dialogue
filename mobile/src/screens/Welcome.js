import React from 'react';
import { Animated, Image, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollMotionProvider, ScrollReveal, useScrollMotion } from '../ScrollMotion';
import { colors, radius, screen, space, type } from '../theme';

export default function Welcome({ navigation }) {
  const scrollMotion = useScrollMotion();
  return (
    <ScrollMotionProvider scrollY={scrollMotion.scrollY}>
    <Animated.ScrollView
      onScroll={scrollMotion.onScroll}
      scrollEventThrottle={16}
      style={{ flex: 1, backgroundColor: 'transparent' }}
      contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.md }}
    >
      <View style={{ ...screen, maxWidth: 430, justifyContent: 'center', gap: space.lg }}>
        <ScrollReveal><View style={{ alignItems: 'center', gap: space.sm }}>
          <Image
            source={require('../../assets/untold-logo.png')}
            resizeMode="contain"
            accessibilityLabel="Untold"
            style={{ width: 240, height: 62 }}
          />
          <Text style={{ color: colors.muted, fontSize: 15 }}>A little more heard. A little less alone.</Text>
        </View></ScrollReveal>
        <ScrollReveal><LinearGradient colors={[colors.brand, colors.night]} style={{ borderRadius: radius.lg, minHeight: 230, overflow: 'hidden', justifyContent: 'flex-end' }}>
          <View pointerEvents="none" style={{ position: 'absolute', width: 270, height: 270, borderRadius: 135, right: -112, top: -98, backgroundColor: 'rgba(33,216,117,0.16)' }} />
          <View pointerEvents="none" style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, left: -118, bottom: -132, backgroundColor: 'rgba(255,138,42,0.24)' }} />
          <View pointerEvents="none" style={{ position: 'absolute', width: 66, height: 66, borderRadius: 33, right: 34, bottom: 24, borderWidth: 1, borderColor: 'rgba(33,216,117,0.35)' }} />
          <View style={{ padding: space.lg, minHeight: 230, justifyContent: 'flex-end' }}>
            <Text style={{ color: colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>A moment for you</Text>
            <Text style={{ ...type.h1, color: '#FFFFFF', marginTop: space.sm }}>A softer place to land.</Text>
            <Text style={{ ...type.body, color: colors.onDarkMuted, marginTop: space.xs }}>Talk with someone who listens, and take your next step at your own pace.</Text>
          </View>
        </LinearGradient></ScrollReveal>
        <ScrollReveal><View style={{ gap: space.md }}>
          <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Auth', { mode: 'register' })} style={{ padding: 16, borderRadius: radius.pill, backgroundColor: colors.brandDeep, alignItems: 'center' }}>
            <Text style={{ color: colors.onBrand, fontWeight: '700', fontSize: 15 }}>Create your account</Text>
          </Pressable>
          <Text style={{ color: colors.muted, textAlign: 'center' }}>
            Already have an account?{' '}
            <Text accessibilityRole="link" onPress={() => navigation.navigate('Auth', { mode: 'login' })} style={{ color: colors.accent, fontWeight: '700' }}>Sign in</Text>
          </Text>
          <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Auth', { mode: 'login', accountType: 'coach' })} style={{ alignSelf: 'center', padding: space.xs }}>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Coach sign in</Text>
          </Pressable>
        </View></ScrollReveal>
      </View>
    </Animated.ScrollView>
    </ScrollMotionProvider>
  );
}
