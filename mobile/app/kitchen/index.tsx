import { View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { minutesAgo, getStatusColor, getOrderTypeLabel } from '@/lib/utils'
import type { KitchenOrder } from '@/types'

export default function KitchenDisplayScreen() {
  const queryClient = useQueryClient()

  const { data: kitchenOrders, isLoading, refetch } = useQuery<KitchenOrder[]>({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const { data } = await api.get('/kitchen/orders')
      return data.data
    },
    refetchInterval: 15000,
  })

  const updateItemMutation = useMutation({
    mutationFn: async ({ orderId, itemId, status }: { orderId: string; itemId: string; status: string }) => {
      await api.patch(`/kitchen/orders/${orderId}/items/${itemId}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update item status.')
    },
  })

  const markOrderReady = useMutation({
    mutationFn: async (orderId: string) => {
      await api.patch(`/orders/${orderId}`, { status: 'READY' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-orders'] })
    },
  })

  const priorityColors: Record<string, string> = {
    LOW: '#94a3b8',
    NORMAL: '#3b82f6',
    HIGH: '#f97316',
    URGENT: '#ef4444',
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#1e293b' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#0f172a', padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>Kitchen Display</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
          <Text style={{ color: '#94a3b8', fontSize: 13 }}>Live</Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor="#fff" />}
      >
        {!kitchenOrders?.length ? (
          <View style={{ alignItems: 'center', marginTop: 80 }}>
            <Ionicons name="checkmark-circle" size={64} color="#22c55e" />
            <Text style={{ color: '#94a3b8', fontSize: 18, marginTop: 16 }}>All caught up!</Text>
            <Text style={{ color: '#64748b', marginTop: 4 }}>No pending kitchen orders</Text>
          </View>
        ) : (
          kitchenOrders.map((order) => {
            const allReady = order.items.every((i) => i.status === 'READY')
            return (
              <View
                key={order.id}
                style={{
                  backgroundColor: '#334155',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  borderLeftWidth: 4,
                  borderLeftColor: priorityColors[order.priority] || '#3b82f6',
                }}
              >
                {/* Order Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ color: '#fff', fontWeight: '700', fontSize: 18 }}>#{order.orderNumber}</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#475569' }}>
                      <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '600' }}>
                        {getOrderTypeLabel(order.type)}
                      </Text>
                    </View>
                    {order.tableNumber && (
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#475569' }}>
                        <Text style={{ color: '#cbd5e1', fontSize: 11, fontWeight: '600' }}>T{order.tableNumber}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>{minutesAgo(order.createdAt)}</Text>
                </View>

                {/* Items */}
                {order.items.map((item) => {
                  const itemStatusColor = item.status === 'READY' ? '#22c55e' : item.status === 'PREPARING' ? '#f97316' : '#eab308'
                  return (
                    <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#475569' }}>
                      <TouchableOpacity
                        onPress={() => {
                          const next = item.status === 'PENDING' ? 'PREPARING' : item.status === 'PREPARING' ? 'READY' : null
                          if (next) updateItemMutation.mutate({ orderId: order.id, itemId: item.id, status: next })
                        }}
                        style={{
                          width: 28, height: 28, borderRadius: 14,
                          backgroundColor: itemStatusColor + '30',
                          justifyContent: 'center', alignItems: 'center', marginRight: 10,
                        }}
                      >
                        <Ionicons
                          name={item.status === 'READY' ? 'checkmark' : item.status === 'PREPARING' ? 'flame' : 'time'}
                          size={16}
                          color={itemStatusColor}
                        />
                      </TouchableOpacity>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15, textDecorationLine: item.status === 'READY' ? 'line-through' : 'none' }}>
                          {item.quantity}x {item.name}
                        </Text>
                        {item.notes && <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{item.notes}</Text>}
                      </View>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: itemStatusColor + '20' }}>
                        <Text style={{ color: itemStatusColor, fontSize: 10, fontWeight: '600' }}>{item.status}</Text>
                      </View>
                    </View>
                  )
                })}

                {/* Mark All Ready */}
                {allReady && (
                  <TouchableOpacity
                    onPress={() => markOrderReady.mutate(order.id)}
                    style={{
                      backgroundColor: '#22c55e', borderRadius: 8, padding: 12,
                      alignItems: 'center', marginTop: 12, flexDirection: 'row', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontWeight: '700' }}>ORDER READY</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}
