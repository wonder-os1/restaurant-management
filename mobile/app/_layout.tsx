import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
})

export default function RootLayout() {
  const { loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="order/[id]" options={{ headerShown: true, title: 'Order Details' }} />
        <Stack.Screen name="order/new" options={{ headerShown: true, title: 'New Order' }} />
        <Stack.Screen name="reservation/index" options={{ headerShown: true, title: 'Reservations' }} />
        <Stack.Screen name="reservation/[id]" options={{ headerShown: true, title: 'Reservation Details' }} />
        <Stack.Screen name="reservation/new" options={{ headerShown: true, title: 'New Reservation' }} />
        <Stack.Screen name="table/[id]" options={{ headerShown: true, title: 'Table Details' }} />
        <Stack.Screen name="kitchen/index" options={{ headerShown: true, title: 'Kitchen Display' }} />
        <Stack.Screen name="menu-item/[id]" options={{ headerShown: true, title: 'Menu Item' }} />
        <Stack.Screen name="settings/index" options={{ headerShown: true, title: 'Settings' }} />
      </Stack>
    </QueryClientProvider>
  )
}
