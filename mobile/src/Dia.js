import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Rect, Circle, Ellipse, Path, Line } from 'react-native-svg';
import { colors } from './theme';

// Friendly AI greeter, drawn in SVG so it stays sharp at any size.
export default function Dia({ size = 220 }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(y, { toValue: -8, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(y, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ])).start();
  }, [y]);
  return (
    <Animated.View style={{ transform: [{ translateY: y }] }}>
      <Svg width={size} height={size * 0.87} viewBox="0 0 300 260">
        <Defs><LinearGradient id="g" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor={colors.accent} /><Stop offset="1" stopColor={colors.brandDeep} /></LinearGradient></Defs>
        <Path d="M70 250c0-45 35-70 80-70s80 25 80 70z" fill={colors.brandDeep} />
        <Line x1="150" y1="22" x2="150" y2="42" stroke={colors.accent} strokeWidth="5" strokeLinecap="round" />
        <Circle cx="150" cy="18" r="8" fill={colors.accent} />
        <Rect x="85" y="40" width="130" height="125" rx="48" fill="url(#g)" />
        <Rect x="100" y="66" width="100" height="70" rx="30" fill="#fff" />
        <Ellipse cx="127" cy="96" rx="9" ry="11" fill={colors.night} /><Ellipse cx="173" cy="96" rx="9" ry="11" fill={colors.night} />
        <Path d="M130 116q20 18 40 0" stroke={colors.night} strokeWidth="5" fill="none" strokeLinecap="round" />
        <Rect x="222" y="112" width="18" height="62" rx="9" fill={colors.brandDeep} rotation="-25" origin="231, 175" />
        <Circle cx="252" cy="110" r="15" fill="url(#g)" />
      </Svg>
    </Animated.View>
  );
}
