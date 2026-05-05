import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { signup } from '@/lib/auth'
import { useAuthStore } from '@/stores/auth-store'

export default function SignupScreen() {
  const router = useRouter()
  const { setUser } = useAuthStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all fields')
      return
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const user = await signup(name, email, password)
      setUser(user)
      router.replace('/(tabs)')
    } catch (err: any) {
      Alert.alert('Signup Failed', err.response?.data?.message || 'Could not create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 48 }}>
          <View style={{ width: 64, height: 64, borderRadius: 16, backgroundColor: '#EA580C', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>F</Text>
          </View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>Create Account</Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Join FeastFlow Restaurant</Text>
        </View>

        <View style={{ gap: 16 }}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Full Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="John Doe"
              autoCapitalize="words"
              style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="staff@restaurant.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }}
            />
          </View>

          <View>
            <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
              style={{ borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 16, backgroundColor: '#fff' }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            style={{ backgroundColor: loading ? '#FB923C' : '#EA580C', borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 8 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center', paddingVertical: 8 }}>
            <Text style={{ color: '#64748b', fontSize: 14 }}>
              Already have an account? <Text style={{ color: '#EA580C', fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
