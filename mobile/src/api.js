import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
const BASE = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000');
let token = null;
export const loadToken = async () => {
  token = Platform.OS === 'web' ? localStorage.getItem('token') : await SecureStore.getItemAsync('token');
  return token;
};
export const setToken = async t => {
  token = t;
  if (Platform.OS === 'web') {
    t ? localStorage.setItem('token', t) : localStorage.removeItem('token');
  } else {
    t ? await SecureStore.setItemAsync('token', t) : await SecureStore.deleteItemAsync('token');
  }
};

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Something went wrong'); e.status = res.status; e.maintenance = !!data.maintenance; throw e; }
  return data;
}
