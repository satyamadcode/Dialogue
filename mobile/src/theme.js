// Warm ivory surfaces and soft terracotta accents create a brighter, more human feel.
export const colors = {
  bg: '#FFFAF5', card: '#FFFFFF', ink: '#3B302C', muted: '#897970', line: '#F0E5DC',
  brand: '#F7E5DA', brandDeep: '#A95740', green: '#B5654C', danger: '#B85C50', night: '#493631',
  category: '#FFF1E8', avatarPalette: ['#A95740', '#B66B50', '#9E6658', '#A47A52', '#895F65'],
  onDarkMuted: '#E9DCD5', offline: '#C08B59',
  online: '#71947A', disabled: '#E8DCD4', highlight: '#FFF2E8',
};
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const radius = { sm: 12, md: 16, lg: 24, pill: 999 };
export const type = {
  display: { fontSize: 32, fontWeight: '700', letterSpacing: -0.8, lineHeight: 38 },
  h1: { fontSize: 27, fontWeight: '700', letterSpacing: -0.4, lineHeight: 33 },
  h2: { fontSize: 17, fontWeight: '700', letterSpacing: -0.15, lineHeight: 23 },
  body: { fontSize: 15, lineHeight: 22 },
  small: { fontSize: 12, lineHeight: 17 },
};
export const screen = { flex: 1, width: '100%', maxWidth: 480, alignSelf: 'center' };
export const card = { backgroundColor: colors.card, borderRadius: radius.md, padding: space.md, borderWidth: 1, borderColor: colors.line };
export const money = c => '$' + (c / 100).toFixed(2);
