export const colors = {
  bg: '#080B09', card: '#121813', ink: '#F1F5F0', muted: '#A3AEA5', line: '#29342B',
  brand: '#17271B', brandDeep: '#21D875', green: '#21D875', accent: '#FF8A2A',
  pink: '#FF8A2A', danger: '#FF625C', night: '#080B09', onBrand: '#07100A',
  onAccent: '#171009', brandText: '#5CE99A', category: '#17251A',
  avatarPalette: ['#167A43', '#245D38', '#A64E16', '#1B8D50', '#79502B'],
  onDarkMuted: '#BAC5BC', offline: '#778279',
  online: '#21D875', disabled: '#414A43', highlight: '#1C3322',
  coachCard: '#121813', coachCardLine: '#29342B', coachInk: '#F1F5F0',
  coachMuted: '#A3AEA5', coachTag: '#17251A',
};
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 12, md: 16, lg: 24, pill: 999 };
export const type = {
  display: { color: colors.ink, fontFamily: 'Sora_700Bold', fontSize: 40, fontWeight: '700', letterSpacing: -1.2, lineHeight: 48 },
  h1: { color: colors.ink, fontFamily: 'Sora_700Bold', fontSize: 28, fontWeight: '700', letterSpacing: -0.6, lineHeight: 34 },
  h2: { color: colors.ink, fontFamily: 'Sora_600SemiBold', fontSize: 20, fontWeight: '600', letterSpacing: -0.25, lineHeight: 26 },
  body: { color: colors.ink, fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24 },
  small: { color: colors.ink, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 },
};
export const screen = { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' };
export const card = { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line };
export const money = c => '$' + (c / 100).toFixed(2);
