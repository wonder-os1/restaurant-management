import { View, Text, ScrollView, ActivityIndicator, Image } from 'react-native'
import { useLocalSearchParams } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'

export default function MenuItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const { data: item, isLoading } = useQuery({
    queryKey: ['menu-item', id],
    queryFn: async () => {
      const { data } = await api.get(`/menu/items/${id}`)
      return data.data
    },
  })

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#EA580C" /></View>
  if (!item) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Image */}
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={{ width: '100%', height: 250, backgroundColor: '#f1f5f9' }}
          resizeMode="cover"
        />
      ) : (
        <View style={{ width: '100%', height: 200, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="restaurant-outline" size={64} color="#EA580C" />
        </View>
      )}

      <View style={{ padding: 20 }}>
        {/* Name & Price */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <View style={{
            width: 20, height: 20, borderRadius: 4,
            borderWidth: 2,
            borderColor: item.isVegetarian ? '#16A34A' : '#EF4444',
            justifyContent: 'center', alignItems: 'center',
          }}>
            <View style={{
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: item.isVegetarian ? '#16A34A' : '#EF4444',
            }} />
          </View>
          {item.isVegan && (
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#f0fdf4' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#16A34A' }}>VEGAN</Text>
            </View>
          )}
        </View>

        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>{item.name}</Text>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#EA580C', marginTop: 4 }}>{formatCurrency(item.price)}</Text>

        {item.description && (
          <Text style={{ fontSize: 15, color: '#64748b', marginTop: 12, lineHeight: 22 }}>{item.description}</Text>
        )}

        {/* Details */}
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 20 }}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Details</Text>

          {item.category && <InfoRow icon="pricetag-outline" label="Category" value={item.category.name} />}
          {item.preparationTime && <InfoRow icon="time-outline" label="Prep Time" value={`${item.preparationTime} minutes`} />}
          {item.spiceLevel !== undefined && item.spiceLevel !== null && (
            <InfoRow icon="flame-outline" label="Spice Level" value={'🌶'.repeat(item.spiceLevel) || 'Mild'} />
          )}
          <InfoRow
            icon="checkmark-circle-outline"
            label="Availability"
            value={item.isAvailable ? 'Available' : 'Unavailable'}
          />
        </View>

        {/* Allergens */}
        {item.allergens && item.allergens.length > 0 && (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Ionicons name="warning-outline" size={18} color="#eab308" />
              <Text style={{ fontWeight: '600', color: '#374151' }}>Allergens</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
              {item.allergens.map((allergen: string, idx: number) => (
                <View key={idx} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: '#fefce8' }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: '#92400e' }}>{allergen}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
      <Ionicons name={icon as any} size={18} color="#94a3b8" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: '#94a3b8' }}>{label}</Text>
        <Text style={{ fontWeight: '500', color: '#0f172a', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  )
}
