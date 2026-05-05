import React from 'react'
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { formatDate, formatTime, getStatusColor } from '@/lib/utils'

export default function ReservationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: reservation, isLoading } = useQuery({
    queryKey: ['reservation', id],
    queryFn: async () => {
      const { data } = await api.get(`/reservations/${id}`)
      return data.data
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (status: string) => {
      await api.patch(`/reservations/${id}`, { status })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservation', id] })
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update reservation.')
    },
  })

  const handleCancel = () => {
    Alert.alert(
      'Cancel Reservation',
      'Are you sure you want to cancel this reservation?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => updateMutation.mutate('CANCELLED') },
      ]
    )
  }

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#EA580C" /></View>
  if (!reservation) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#94a3b8' }}>Not found</Text></View>

  const canConfirm = reservation.status === 'PENDING'
  const canSeat = reservation.status === 'CONFIRMED'
  const canComplete = reservation.status === 'SEATED'
  const canCancel = ['PENDING', 'CONFIRMED'].includes(reservation.status)

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ padding: 20 }}>
      {/* Status Badge */}
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: getStatusColor(reservation.status) + '20' }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: getStatusColor(reservation.status) }}>
            {reservation.status.replace(/_/g, ' ')}
          </Text>
        </View>
      </View>

      {/* Guest Info */}
      <InfoCard title="Guest" icon="person-outline">
        <Text style={{ fontWeight: '600', fontSize: 16 }}>{reservation.customerName}</Text>
        <Text style={{ color: '#64748b', marginTop: 2 }}>{reservation.customerPhone}</Text>
        {reservation.customerEmail && <Text style={{ color: '#64748b' }}>{reservation.customerEmail}</Text>}
      </InfoCard>

      {/* Reservation Details */}
      <InfoCard title="Details" icon="information-circle-outline">
        <DetailRow label="Date" value={formatDate(reservation.date)} />
        <DetailRow label="Time" value={formatTime(reservation.time)} />
        <DetailRow label="Party Size" value={`${reservation.partySize} guest${reservation.partySize !== 1 ? 's' : ''}`} />
        {reservation.table && <DetailRow label="Table" value={`Table ${reservation.table.number}`} />}
        {reservation.notes && <DetailRow label="Notes" value={reservation.notes} />}
      </InfoCard>

      {/* Actions */}
      <View style={{ gap: 12, marginTop: 8 }}>
        {canConfirm && (
          <TouchableOpacity
            onPress={() => updateMutation.mutate('CONFIRMED')}
            disabled={updateMutation.isPending}
            style={{ backgroundColor: '#3b82f6', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Confirm Reservation</Text>
          </TouchableOpacity>
        )}
        {canSeat && (
          <TouchableOpacity
            onPress={() => updateMutation.mutate('SEATED')}
            disabled={updateMutation.isPending}
            style={{ backgroundColor: '#16A34A', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="log-in-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Mark as Seated</Text>
          </TouchableOpacity>
        )}
        {canComplete && (
          <TouchableOpacity
            onPress={() => updateMutation.mutate('COMPLETED')}
            disabled={updateMutation.isPending}
            style={{ backgroundColor: '#EA580C', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600' }}>Complete</Text>
          </TouchableOpacity>
        )}
        {canCancel && (
          <TouchableOpacity
            onPress={handleCancel}
            disabled={updateMutation.isPending}
            style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#fecaca' }}
          >
            <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
            <Text style={{ color: '#ef4444', fontWeight: '600' }}>Cancel Reservation</Text>
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
