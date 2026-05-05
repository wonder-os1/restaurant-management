import * as SecureStore from 'expo-secure-store'

export async function getItem(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key)
  } catch {
    return null
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value)
}

export async function removeItem(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key)
}

export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  await SecureStore.setItemAsync(key, JSON.stringify(value))
}
