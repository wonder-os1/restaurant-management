import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/auth-store'
import { formatCurrency, getStatusColor, minutesAgo } from '@/lib/utils'
import type { DashboardStats } from '@/types'

export default function HomeScreen() {
  const router = useRouter()
  const { user } = useAuthStore()

  const { data: stats, isLoading, refetch } = useQuery<DashboardStats>({
    queryKey: ['mobile-dashboard'],
    queryFn: async () => {
      const { data } = await api.get('/dashboard/stats')
      return data.data
    },
  })

  const firstName = user?.name?.split(' ')[0] || 'User'

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
    >
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>Hello, {firstName}</Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>
          {user?.role?.toLowerCase().replace('_', ' ')}
        </Text>

        {/* Stats Cards */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 }}>
          <StatCard
            title="Today's Orders"
            value={String(stats?.todayOrders || 0)}
            icon="receipt"
            color="#EA580C"
            bg="#FFF7ED"
          />
          <StatCard
            title="Active Orders"
            value={String(stats?.activeOrders || 0)}
            icon="flame"
            color="#f97316"
            bg="#FFF7ED"
          />
          <StatCard
            title="Tables"
            value={`${stats?.tablesOccupied || 0}/${stats?.totalTables || 0}`}
            icon="grid"
            color="#8b5cf6"
            bg="#f5f3ff"
          />
          <StatCard
            title="Revenue"
            value={formatCurrency(stats?.todayRevenue || 0)}
            icon="cash"
            color="#16A34A"
            bg="#f0fdf4"
          />
        </View>

        {/* Quick Actions */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 24, marginBottom: 12 }}>Quick Actions</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <QuickAction title="New Order" icon="add-circle" onPress={() => router.push('/order/new')} />
          <QuickAction title="Tables" icon="grid" onPress={() => router.push('/reservation')} />
          <QuickAction title="Kitchen" icon="flame" onPress={() => router.push('/kitchen')} />
        </View>

        {/* Recent Orders */}
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#0f172a', marginTop: 24, marginBottom: 12 }}>Recent Orders</Text>
        {!stats?.recentOrders?.length ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#94a3b8' }}>No recent orders</Text>
          </View>
        ) : (
          stats.recentOrders.slice(0, 5).map((order) => (
            <TouchableOpacity
              key={order.id}
              onPress={() => router.push(`/order/${order.id}`)}
              style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
            >
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="receipt-outline" size={20} color="#EA580C" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ fontWeight: '500', color: '#0f172a' }}>#{order.orderNumber}</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  {order.items?.length || 0} items - {minutesAgo(order.createdAt)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: getStatusColor(order.status) + '20' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: getStatusColor(order.status) }}>
                    {order.status.replace(/_/g, ' ')}
                  </Text>
                </View>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a', marginTop: 4 }}>
                  {formatCurrency(order.total)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  )
}

function StatCard({ title, value, icon, color, bg }: { title: string; value: string; icon: string; color: string; bg: string }) {
  return (
    <View style={{ width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: '#64748b' }}>{title}</Text>
        <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: bg, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name={icon as any} size={16} color={color} />
        </View>
      </View>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 8 }}>{value}</Text>
    </View>
  )
}

function QuickAction({ title, icon, onPress }: { title: string; icon: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center' }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon as any} size={20} color="#EA580C" />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '500', color: '#374151', marginTop: 8 }}>{title}</Text>
    </TouchableOpacity>
  )
}
