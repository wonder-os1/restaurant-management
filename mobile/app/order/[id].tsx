import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatCurrency, formatDateTime, getStatusColor, getOrderTypeLabel } from '@/lib/utils'

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const { data } = await api.get(`/orders/${id}`)
      return data.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/orders/${id}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['mobile-orders'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update order status.')
    },
  })

  const cancelMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/orders/${id}`, { status: 'CANCELLED' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] })
      queryClient.invalidateQueries({ queryKey: ['mobile-orders'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
      Alert.alert('Cancelled', 'Order has been cancelled.')
    },
    onError: () => {
      Alert.alert('Error', 'Failed to cancel order.')
    },
  })

  const handleCancel = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    )
  }

  const nextStatus: Record<string, string> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'SERVED',
    SERVED: 'COMPLETED',
  }

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#EA580C" /></View>
  if (!order) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  const canAdvance = nextStatus[order.status]
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Status Badge */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: getStatusColor(order.status) + '20' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: getStatusColor(order.status) }}>
            {order.status.replace(/_/g, ' ')}
          </Text>
        </View>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0f172a', marginTop: 12 }}>
          #{order.orderNumber}
        </Text>
      </View>

      {/* Order Info */}
      <InfoCard title="Order Info" icon="receipt-outline">
        <DetailRow label="Type" value={getOrderTypeLabel(order.type)} />
        {order.table && <DetailRow label="Table" value={`Table ${order.table.number}`} />}
        <DetailRow label="Created" value={formatDateTime(order.createdAt)} />
        <DetailRow label="Payment" value={order.paymentStatus} />
        {order.paymentMethod && <DetailRow label="Method" value={order.paymentMethod} />}
        {order.notes && <DetailRow label="Notes" value={order.notes} />}
      </InfoCard>

      {/* Customer Info */}
      {order.customer && (
        <InfoCard title="Customer" icon="person-outline">
          <Text style={{ fontWeight: '600', fontSize: 16 }}>{order.customer.name}</Text>
          {order.customer.phone && <Text style={{ color: '#64748b', marginTop: 2 }}>{order.customer.phone}</Text>}
          {order.customer.email && <Text style={{ color: '#64748b' }}>{order.customer.email}</Text>}
        </InfoCard>
      )}

      {/* Order Items */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Ionicons name="fast-food-outline" size={18} color="#EA580C" />
          <Text style={{ fontWeight: '600', color: '#374151' }}>Items</Text>
        </View>

        {(order.items || []).map((item: any, idx: number) => (
          <View key={item.id || idx} style={{ paddingVertical: 12, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: '#f1f5f9' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: '#0f172a' }}>
                  {item.quantity}x {item.name || item.menuItem?.name}
                </Text>
                {item.notes && <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{item.notes}</Text>}
              </View>
              <Text style={{ fontWeight: '500', color: '#0f172a' }}>{formatCurrency(item.total)}</Text>
            </View>
          </View>
        ))}

        {/* Totals */}
        <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12, marginTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#64748b' }}>Subtotal</Text>
            <Text style={{ color: '#0f172a' }}>{formatCurrency(order.subtotal)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text style={{ color: '#64748b' }}>Tax</Text>
            <Text style={{ color: '#0f172a' }}>{formatCurrency(order.tax)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: '#16A34A' }}>Discount</Text>
              <Text style={{ color: '#16A34A' }}>-{formatCurrency(order.discount)}</Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#0f172a' }}>Total</Text>
            <Text style={{ fontWeight: '700', fontSize: 16, color: '#EA580C' }}>{formatCurrency(order.total)}</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      {(canAdvance || canCancel) && (
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          {canAdvance && (
            <TouchableOpacity
              onPress={() => updateStatusMutation.mutate(canAdvance)}
              disabled={updateStatusMutation.isPending}
              style={{ flex: 1, backgroundColor: '#EA580C', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                {updateStatusMutation.isPending ? 'Updating...' : `Mark ${canAdvance}`}
              </Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
              style={{ flex: canAdvance ? 0 : 1, backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#fecaca', paddingHorizontal: 20 }}
            >
              <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
              <Text style={{ color: '#ef4444', fontWeight: '600' }}>
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </ScrollView>
  )
}

function InfoCard({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Ionicons name={icon as any} size={18} color="#EA580C" />
        <Text style={{ fontWeight: '600', color: '#374151' }}>{title}</Text>
      </View>
      {children}
    </View>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: '#64748b', fontSize: 14 }}>{label}</Text>
      <Text style={{ fontWeight: '500', color: '#0f172a', fontSize: 14, maxWidth: '60%', textAlign: 'right' }}>{value}</Text>
    </View>
  )
}
