import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { Input } from '@/components/ui'
import type { MenuCategory, MenuItem } from '@/types'

export default function MenuScreen() {
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: categories, isLoading: loadingCategories } = useQuery<MenuCategory[]>({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data } = await api.get('/menu/categories')
      return data.data
    },
  })

  const { data: menuItems, isLoading: loadingItems, refetch } = useQuery<MenuItem[]>({
    queryKey: ['menu-items', selectedCategory, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
      if (searchQuery) params.set('search', searchQuery)
      const { data } = await api.get(`/menu/items?${params}`)
      return data.data
    },
  })

  const isLoading = loadingCategories || loadingItems

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Search */}
      <View style={{ backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <Input
          placeholder="Search menu items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Category Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          <TouchableOpacity
            onPress={() => setSelectedCategory('all')}
            style={{
              paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
              backgroundColor: selectedCategory === 'all' ? '#EA580C' : '#f1f5f9',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategory === 'all' ? '#fff' : '#64748b' }}>
              All
            </Text>
          </TouchableOpacity>
          {(categories || []).map((cat) => (
            <TouchableOpacity
              key={cat.id}
              onPress={() => setSelectedCategory(cat.id)}
              style={{
                paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
                backgroundColor: selectedCategory === cat.id ? '#EA580C' : '#f1f5f9',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategory === cat.id ? '#fff' : '#64748b' }}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="#EA580C" style={{ marginTop: 40 }} />
        ) : !menuItems?.length ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="restaurant-outline" size={48} color="#cbd5e1" />
            <Text style={{ color: '#94a3b8', marginTop: 12 }}>No menu items found</Text>
          </View>
        ) : (
          menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => router.push(`/menu-item/${item.id}`)}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                opacity: item.isAvailable ? 1 : 0.6,
              }}
            >
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#f1f5f9' }}
                />
              ) : (
                <View style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                  <Ionicons name="restaurant-outline" size={28} color="#EA580C" />
                </View>
              )}

              <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{
                    width: 16, height: 16, borderRadius: 3,
                    borderWidth: 1.5,
                    borderColor: item.isVegetarian ? '#16A34A' : '#EF4444',
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <View style={{
                      width: 8, height: 8, borderRadius: 4,
                      backgroundColor: item.isVegetarian ? '#16A34A' : '#EF4444',
                    }} />
                  </View>
                  <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15, flex: 1 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>

                {item.description ? (
                  <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#EA580C' }}>
                    {formatCurrency(item.price)}
                  </Text>
                  {!item.isAvailable && (
                    <Text style={{ fontSize: 11, fontWeight: '600', color: '#ef4444' }}>Unavailable</Text>
                  )}
                  {item.preparationTime && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                      <Ionicons name="time-outline" size={12} color="#94a3b8" />
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{item.preparationTime} min</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  )
}
