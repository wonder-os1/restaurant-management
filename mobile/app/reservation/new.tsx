import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { Button, Card, Input, EmptyState } from '@/components/ui'
import type { Table } from '@/types'

const TIME_SLOTS = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '18:00', '18:30', '19:00', '19:30',
  '20:00', '20:30', '21:00', '21:30',
]

const PARTY_SIZES = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12]

export default function NewReservationScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [partySize, setPartySize] = useState(2)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [notes, setNotes] = useState('')

  const { data: tables } = useQuery<Table[]>({
    queryKey: ['tables-for-reservation', selectedDate, selectedTime],
    queryFn: async () => {
      const { data } = await api.get('/tables', {
        params: { status: 'AVAILABLE', minCapacity: partySize },
      })
      return data.data
    },
    enabled: !!selectedDate && !!selectedTime,
  })

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/reservations', {
        customerName,
        customerPhone,
        customerEmail: customerEmail || undefined,
        partySize,
        date: selectedDate,
        time: selectedTime,
        tableId: selectedTable?.id,
        notes: notes || undefined,
      })
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
      Alert.alert('Reservation Created', 'The reservation has been booked successfully.', [
        { text: 'View', onPress: () => router.replace(`/reservation/${data.id}`) },
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Could not create reservation.')
    },
  })

  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    if (d.getTime() === today.getTime()) return 'Today'
    if (d.getTime() === tomorrow.getTime()) return 'Tomorrow'
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <>
      <Stack.Screen options={{ title: 'New Reservation', headerBackTitle: 'Back' }} />
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <View style={{ padding: 20 }}>
          {/* Step Indicators */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
            {[1, 2, 3].map((s) => (
              <View
                key={s}
                style={{
                  width: s === step ? 32 : 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: s <= step ? '#EA580C' : '#e2e8f0',
                }}
              />
            ))}
          </View>

          {/* Step 1: Guest Details */}
          {step === 1 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Guest Details</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Enter guest information</Text>

              <Input label="Guest Name" placeholder="John Doe" value={customerName} onChangeText={setCustomerName} containerStyle={{ marginBottom: 16 }} />
              <Input label="Phone Number" placeholder="+91 98765 43210" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" containerStyle={{ marginBottom: 16 }} />
              <Input label="Email (optional)" placeholder="guest@email.com" value={customerEmail} onChangeText={setCustomerEmail} keyboardType="email-address" autoCapitalize="none" containerStyle={{ marginBottom: 16 }} />

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Party Size</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
                {PARTY_SIZES.map((size) => (
                  <TouchableOpacity
                    key={size}
                    onPress={() => setPartySize(size)}
                    style={{
                      width: 48, height: 48, borderRadius: 24,
                      backgroundColor: partySize === size ? '#EA580C' : '#fff',
                      borderWidth: 1,
                      borderColor: partySize === size ? '#EA580C' : '#e2e8f0',
                      justifyContent: 'center', alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontWeight: '600', color: partySize === size ? '#fff' : '#374151' }}>{size}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Button
                title="Next"
                onPress={() => setStep(2)}
                disabled={!customerName || !customerPhone}
              />
            </View>
          )}

          {/* Step 2: Date & Time */}
          {step === 2 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Date & Time</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Select when</Text>

              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {dates.map((date) => (
                    <TouchableOpacity
                      key={date}
                      onPress={() => { setSelectedDate(date); setSelectedTime('') }}
                      style={{
                        paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
                        backgroundColor: selectedDate === date ? '#EA580C' : '#fff',
                        borderWidth: 1, borderColor: selectedDate === date ? '#EA580C' : '#e2e8f0',
                        minWidth: 80, alignItems: 'center',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: selectedDate === date ? '#fff' : '#374151' }}>
                        {formatDateLabel(date)}
                      </Text>
                      <Text style={{ fontSize: 11, color: selectedDate === date ? '#fed7aa' : '#94a3b8', marginTop: 2 }}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {selectedDate ? (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Time</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {TIME_SLOTS.map((slot) => (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => setSelectedTime(slot)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
                          backgroundColor: selectedTime === slot ? '#EA580C' : '#fff',
                          borderWidth: 1, borderColor: selectedTime === slot ? '#EA580C' : '#e2e8f0',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: '500', color: selectedTime === slot ? '#fff' : '#374151' }}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              ) : null}

              {selectedDate && selectedTime && tables && tables.length > 0 && (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Preferred Table (optional)</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {tables.map((table) => (
                      <TouchableOpacity
                        key={table.id}
                        onPress={() => setSelectedTable(selectedTable?.id === table.id ? null : table)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8,
                          backgroundColor: selectedTable?.id === table.id ? '#FFF7ED' : '#fff',
                          borderWidth: 2,
                          borderColor: selectedTable?.id === table.id ? '#EA580C' : '#e2e8f0',
                        }}
                      >
                        <Text style={{ fontWeight: '600', color: selectedTable?.id === table.id ? '#EA580C' : '#374151' }}>
                          Table {table.number}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{table.capacity} seats</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
                <Button
                  title="Next"
                  onPress={() => setStep(3)}
                  disabled={!selectedDate || !selectedTime}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Confirm Reservation</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Review the details</Text>

              <Card style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={20} color="#EA580C" />
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ fontWeight: '600', color: '#0f172a' }}>{customerName}</Text>
                    <Text style={{ fontSize: 13, color: '#64748b' }}>{customerPhone}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Date</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{formatDateLabel(selectedDate)}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Time</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{selectedTime}</Text>
                  </View>
                  <View>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Guests</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{partySize}</Text>
                  </View>
                </View>
                {selectedTable && (
                  <View style={{ marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Table</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>Table {selectedTable.number}</Text>
                  </View>
                )}
              </Card>

              <Input
                label="Special Requests (optional)"
                placeholder="Any allergies, preferences..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                style={{ height: 80, textAlignVertical: 'top' }}
                containerStyle={{ marginBottom: 24 }}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(2)} style={{ flex: 1 }} />
                <Button
                  title="Confirm Booking"
                  onPress={() => createMutation.mutate()}
                  loading={createMutation.isPending}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  )
}
