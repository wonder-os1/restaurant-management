import { View, Text, TouchableOpacity, Image } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem } from '@/types'

interface MenuItemCardProps {
  item: MenuItem
  onAdd?: (item: MenuItem) => void
}

export function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
  const router = useRouter()

  return (
    <TouchableOpacity
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
          {item.isVegetarian && (
            <View style={{ width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: '#16A34A', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#16A34A' }} />
            </View>
          )}
          {!item.isVegetarian && (
            <View style={{ width: 16, height: 16, borderRadius: 3, borderWidth: 1.5, borderColor: '#EF4444', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' }} />
            </View>
          )}
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

          {!item.isAvailable ? (
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#ef4444' }}>Unavailable</Text>
          ) : onAdd ? (
            <TouchableOpacity
              onPress={() => onAdd(item)}
              style={{ backgroundColor: '#EA580C', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 6 }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>ADD</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  )
}
