import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '@/stores/auth-store'

export default function IndexScreen() {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(tabs)')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [user, isLoading])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF7ED' }}>
      <ActivityIndicator size="large" color="#EA580C" />
    </View>
  )
}
