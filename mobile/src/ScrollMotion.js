import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, View } from 'react-native';
import Svg, { Defs, Ellipse, LinearGradient, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { colors } from './theme';

const ScrollMotionContext = createContext(null);

export function useScrollMotion() {
  const scrollY = useRef(new Animated.Value(0)).current;
  const onScroll = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: Platform.OS !== 'web' },
  ), [scrollY]);
  return { scrollY, onScroll };
}

export function ScrollMotionProvider({ scrollY, children }) {
  return (
    <ScrollMotionContext.Provider value={scrollY}>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <MotionBackdrop scrollY={scrollY} />
        {children}
      </View>
    </ScrollMotionContext.Provider>
  );
}

export function MotionBackdrop({ scrollY }) {
  const backdropDrift = scrollY.interpolate({
    inputRange: [0, 900],
    outputRange: [0, -90],
    extrapolate: 'clamp',
  });
  return (
    <Animated.View pointerEvents="none" style={{
      position: 'absolute', top: -40, left: 0, right: 0, bottom: -40,
      transform: [{ translateY: backdropDrift }],
    }}>
      <Svg width="100%" height="100%" viewBox="0 0 1000 1000" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="untoldBase" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.night} />
            <Stop offset="0.55" stopColor="#0E1710" />
            <Stop offset="1" stopColor="#101A12" />
          </LinearGradient>
          <RadialGradient id="untoldGreenGlow" cx="82%" cy="20%" r="70%">
            <Stop offset="0" stopColor={colors.green} stopOpacity="0.18" />
            <Stop offset="0.48" stopColor={colors.green} stopOpacity="0.08" />
            <Stop offset="1" stopColor={colors.green} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="untoldOrangeGlow" cx="20%" cy="77%" r="68%">
            <Stop offset="0" stopColor={colors.accent} stopOpacity="0.14" />
            <Stop offset="0.52" stopColor={colors.accent} stopOpacity="0.06" />
            <Stop offset="1" stopColor={colors.accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width="1000" height="1000" fill="url(#untoldBase)" />
        <Ellipse cx="820" cy="210" rx="620" ry="500" fill="url(#untoldGreenGlow)" />
        <Ellipse cx="190" cy="760" rx="600" ry="470" fill="url(#untoldOrangeGlow)" />
        <Path d="M100 0V1000 M200 0V1000 M300 0V1000 M400 0V1000 M600 0V1000 M700 0V1000 M800 0V1000 M900 0V1000 M0 100H1000 M0 200H1000 M0 300H1000 M0 400H1000 M0 600H1000 M0 700H1000 M0 800H1000 M0 900H1000" stroke={colors.green} strokeOpacity="0.08" strokeWidth="1.5" fill="none" />
        <Path d="M500 0V1000 M0 500H1000" stroke={colors.accent} strokeOpacity="0.13" strokeWidth="2" fill="none" />
      </Svg>
    </Animated.View>
  );
}

export function ScrollReveal({ children, style, offset = 0, delay = 0 }) {
  const scrollY = useContext(ScrollMotionContext);
  const [layoutY, setLayoutY] = useState(null);
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(entrance, {
      toValue: 1,
      duration: 520,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [delay, entrance]);

  const revealStyle = useMemo(() => {
    const start = (layoutY || 0) + offset - 600;
    const end = (layoutY || 0) + offset - 300;
    const scrollProgress = scrollY && layoutY !== null
      ? scrollY.interpolate({
        inputRange: [start, end],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      })
      : 1;
    const entranceOffset = entrance.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 0],
      extrapolate: 'clamp',
    });
    const scrollOffset = scrollY && layoutY !== null
      ? scrollY.interpolate({
        inputRange: [start, end],
        outputRange: [18, 0],
        extrapolate: 'clamp',
      })
      : null;
    return {
      opacity: Animated.multiply(entrance, scrollProgress),
      transform: [{
        translateY: scrollOffset ? Animated.add(entranceOffset, scrollOffset) : entranceOffset,
      }],
    };
  }, [entrance, layoutY, offset, scrollY]);

  return (
    <Animated.View onLayout={event => setLayoutY(event.nativeEvent.layout.y)} style={[style, revealStyle]}>
      {children}
    </Animated.View>
  );
}
