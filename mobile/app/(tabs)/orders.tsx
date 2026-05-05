import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatCurrency, getStatusColor, getOrderTypeLabel, minutesAgo } from '@/lib/utils'

const TABS = ['all', 'PENDING', 'PREPARING', 'READY', 'SERVED', 'COMPLETED']

export default function OrdersScreen() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-orders', activeTab, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (activeTab !== 'all') params.set('status', activeTab)
      const { data } = await api.get(`/orders?${params}`)
      return data
    },
  })

  const orders = data?.data || []

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Status Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => { setActiveTab(tab); setPage(1) }}
              style={{
                paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20,
                backgroundColor: activeTab === tab ? '#EA580C' : '#f1f5f9',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '500', color: activeTab === tab ? '#fff' : '#64748b', textTransform: 'capitalize' }}>
                {tab === 'all' ? 'All' : tab.replace(/_/g, ' ').toLowerCase()}
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
        {isLoading && !orders.length ? (
          <ActivityIndicator size="large" color="#EA580C" style={{ marginTop: 40 }} />
        ) : orders.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
            <Text style={{ color: '#94a3b8', marginTop: 12 }}>No orders found</Text>
          </View>
        ) : (
          orders.map((order: any) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push(`/order/${order.id}`)}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 15 }}>
                    #{order.orderNumber}
                  </Text>
                  <Text style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                    {getOrderTypeLabel(order.type)}
                    {order.table ? ` - Table ${order.table.number}` : ''}
                  </Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: getStatusColor(order.status) + '20' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: getStatusColor(order.status) }}>
                    {order.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', marginTop: 12, gap: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="fast-food-outline" size={14} color="#94a3b8" />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{order.items?.length || 0} items</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color="#94a3b8" />
                  <Text style={{ fontSize: 13, color: '#64748b' }}>{minutesAgo(order.createdAt)}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{formatCurrency(order.total)}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB for new order */}
      <TouchableOpacity
        onPress={() => router.push('/order/new')}
        style={{
          position: 'absolute', bottom: 24, right: 24,
          width: 56, height: 56, borderRadius: 28,
          backgroundColor: '#EA580C', justifyContent: 'center', alignItems: 'center',
          shadowColor: '#EA580C', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  )
}
