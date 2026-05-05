import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { formatCurrency, getStatusColor, getOrderTypeLabel, minutesAgo } from '@/lib/utils'
import type { Order } from '@/types'

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  const router = useRouter()
  const statusColor = getStatusColor(order.status)

  return (
    <TouchableOpacity
      onPress={() => router.push(`/order/${order.id}`)}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#FFF7ED',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Ionicons name="receipt-outline" size={20} color="#EA580C" />
          </View>
          <View>
            <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>
              #{order.orderNumber}
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              {getOrderTypeLabel(order.type)}
              {order.table ? ` - Table ${order.table.number}` : ''}
            </Text>
          </View>
        </View>

        <View style={{
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 12,
          backgroundColor: statusColor + '20',
        }}>
          <Text style={{ fontSize: 11, fontWeight: '600', color: statusColor }}>
            {order.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="fast-food-outline" size={14} color="#94a3b8" />
          <Text style={{ fontSize: 13, color: '#64748b' }}>
            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Ionicons name="time-outline" size={14} color="#94a3b8" />
          <Text style={{ fontSize: 13, color: '#64748b' }}>{minutesAgo(order.createdAt)}</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
          {formatCurrency(order.total)}
        </Text>
      </View>
    </TouchableOpacity>
  )
}
