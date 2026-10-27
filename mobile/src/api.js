import * as SecureStore from 'expo-secure-store';
const BASE = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';
let token = null;
export const loadToken = async () => (token = await SecureStore.getItemAsync('token'));
export const setToken = async t => { token = t; t ? await SecureStore.setItemAsync('token', t) : await SecureStore.deleteItemAsync('token'); };

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
