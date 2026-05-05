import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatCurrency, getStatusColor, minutesAgo } from '@/lib/utils'

export default function TableDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: table, isLoading } = useQuery({
    queryKey: ['table', id],
    queryFn: async () => {
      const { data } = await api.get(`/tables/${id}`)
      return data.data
    },
  })

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/tables/${id}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', id] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update table status.')
    },
  })

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#EA580C" /></View>
  if (!table) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  const statusColor = getStatusColor(table.status)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Table Header */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: statusColor + '15',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Ionicons name="grid" size={36} color={statusColor} />
        </View>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0f172a', marginTop: 12 }}>
          Table {table.number}
        </Text>
        <View style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: statusColor + '20', marginTop: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '600', color: statusColor, textTransform: 'uppercase' }}>
            {table.status}
          </Text>
        </View>
      </View>

      {/* Table Info */}
      <InfoCard title="Table Info" icon="information-circle-outline">
        <DetailRow label="Capacity" value={`${table.capacity} seats`} />
        {table.section && <DetailRow label="Section" value={table.section} />}
        <DetailRow label="Status" value={table.status} />
      </InfoCard>

      {/* Current Order */}
      {table.currentOrder && (
        <TouchableOpacity onPress={() => router.push(`/order/${table.currentOrder.id}`)}>
          <InfoCard title="Current Order" icon="receipt-outline">
            <DetailRow label="Order" value={`#${table.currentOrder.orderNumber}`} />
            <DetailRow label="Items" value={`${table.currentOrder.items?.length || 0} items`} />
            <DetailRow label="Total" value={formatCurrency(table.currentOrder.total)} />
            <DetailRow label="Status" value={table.currentOrder.status} />
            <DetailRow label="Created" value={minutesAgo(table.currentOrder.createdAt)} />
          </InfoCard>
        </TouchableOpacity>
      )}

      {/* Actions */}
      <View style={{ gap: 12, marginTop: 8 }}>
        {table.status === 'AVAILABLE' && (
          <TouchableOpacity
            onPress={() => router.push('/order/new')}
            style={{ backgroundColor: '#EA580C', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="add-circle-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Start New Order</Text>
          </TouchableOpacity>
        )}
        {table.status === 'OCCUPIED' && !table.currentOrder && (
          <TouchableOpacity
            onPress={() => updateStatusMutation.mutate('AVAILABLE')}
            style={{ backgroundColor: '#16A34A', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Mark Available</Text>
          </TouchableOpacity>
        )}
        {table.status === 'CLEANING' && (
          <TouchableOpacity
            onPress={() => updateStatusMutation.mutate('AVAILABLE')}
            style={{ backgroundColor: '#16A34A', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Mark as Clean</Text>
          </TouchableOpacity>
        )}
        {table.status === 'OCCUPIED' && (
          <TouchableOpacity
            onPress={() => updateStatusMutation.mutate('CLEANING')}
            style={{ backgroundColor: '#eab308', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="water-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Mark for Cleaning</Text>
          </TouchableOpacity>
        )}
      </View>
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
