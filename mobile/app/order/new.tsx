import { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, Alert, Image } from 'react-native'
import { useRouter, Stack } from 'expo-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { api } from '@/lib/api'
import { Button, Card, Input, EmptyState } from '@/components/ui'
import { formatCurrency } from '@/lib/utils'
import type { MenuItem, Table, MenuCategory } from '@/types'

interface CartItem {
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
  notes?: string
}

const ORDER_TYPES = ['DINE_IN', 'TAKEAWAY', 'DELIVERY']

export default function NewOrderScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()

  const [step, setStep] = useState(1)
  const [orderType, setOrderType] = useState('DINE_IN')
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [notes, setNotes] = useState('')

  const { data: tables } = useQuery<Table[]>({
    queryKey: ['tables-available'],
    queryFn: async () => {
      const { data } = await api.get('/tables?status=AVAILABLE')
      return data.data
    },
    enabled: orderType === 'DINE_IN',
  })

  const { data: categories } = useQuery<MenuCategory[]>({
    queryKey: ['menu-categories'],
    queryFn: async () => {
      const { data } = await api.get('/menu/categories')
      return data.data
    },
  })

  const { data: menuItems, isLoading: loadingItems } = useQuery<MenuItem[]>({
    queryKey: ['menu-items-order', selectedCategory],
    queryFn: async () => {
      const params = new URLSearchParams({ available: 'true' })
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
      const { data } = await api.get(`/menu/items?${params}`)
      return data.data
    },
  })

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/orders', {
        type: orderType,
        tableId: selectedTable?.id,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.unitPrice,
          quantity: item.quantity,
          notes: item.notes,
        })),
        notes,
      })
      return data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['mobile-orders'] })
      queryClient.invalidateQueries({ queryKey: ['mobile-dashboard'] })
      Alert.alert('Order Created', `Order #${data.orderNumber} has been placed.`, [
        { text: 'View', onPress: () => router.replace(`/order/${data.id}`) },
        { text: 'OK', onPress: () => router.back() },
      ])
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Could not create order.')
    },
  })

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.id)
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === item.id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItemId: item.id, name: item.name, quantity: 1, unitPrice: item.price }]
    })
  }

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => (c.menuItemId === menuItemId ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    )
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)

  return (
    <>
      <Stack.Screen options={{ title: 'New Order', headerBackTitle: 'Back' }} />
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

          {/* Step 1: Order Type & Table */}
          {step === 1 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Order Type</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Select the type of order</Text>

              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                {ORDER_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => { setOrderType(type); setSelectedTable(null) }}
                    style={{
                      flex: 1,
                      paddingVertical: 14,
                      borderRadius: 10,
                      backgroundColor: orderType === type ? '#EA580C' : '#fff',
                      borderWidth: 1,
                      borderColor: orderType === type ? '#EA580C' : '#e2e8f0',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons
                      name={(type === 'DINE_IN' ? 'restaurant' : type === 'TAKEAWAY' ? 'bag-handle' : 'bicycle') as any}
                      size={20}
                      color={orderType === type ? '#fff' : '#64748b'}
                    />
                    <Text style={{ fontSize: 12, fontWeight: '500', color: orderType === type ? '#fff' : '#374151', marginTop: 4 }}>
                      {type.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {orderType === 'DINE_IN' && (
                <>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>Select Table</Text>
                  {!tables?.length ? (
                    <EmptyState icon="grid-outline" title="No available tables" description="All tables are currently occupied" />
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                      {tables.map((table) => (
                        <TouchableOpacity
                          key={table.id}
                          onPress={() => setSelectedTable(table)}
                          style={{
                            width: '30%',
                            paddingVertical: 16,
                            borderRadius: 10,
                            backgroundColor: selectedTable?.id === table.id ? '#FFF7ED' : '#fff',
                            borderWidth: 2,
                            borderColor: selectedTable?.id === table.id ? '#EA580C' : '#e2e8f0',
                            alignItems: 'center',
                          }}
                        >
                          <Text style={{ fontWeight: '700', fontSize: 16, color: selectedTable?.id === table.id ? '#EA580C' : '#0f172a' }}>
                            {table.number}
                          </Text>
                          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{table.capacity} seats</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              <Button
                title="Next - Select Items"
                onPress={() => setStep(2)}
                disabled={orderType === 'DINE_IN' && !selectedTable}
                style={{ marginTop: 24 }}
              />
            </View>
          )}

          {/* Step 2: Add Menu Items */}
          {step === 2 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Add Items</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                {cart.length} item{cart.length !== 1 ? 's' : ''} in cart
                {cartTotal > 0 ? ` - ${formatCurrency(cartTotal)}` : ''}
              </Text>

              {/* Category filters */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => setSelectedCategory('all')}
                    style={{
                      paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                      backgroundColor: selectedCategory === 'all' ? '#EA580C' : '#f1f5f9',
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategory === 'all' ? '#fff' : '#64748b' }}>All</Text>
                  </TouchableOpacity>
                  {(categories || []).map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => setSelectedCategory(cat.id)}
                      style={{
                        paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                        backgroundColor: selectedCategory === cat.id ? '#EA580C' : '#f1f5f9',
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '500', color: selectedCategory === cat.id ? '#fff' : '#64748b' }}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {loadingItems ? (
                <EmptyState icon="hourglass-outline" title="Loading menu..." />
              ) : !menuItems?.length ? (
                <EmptyState icon="restaurant-outline" title="No items found" />
              ) : (
                menuItems.filter((i) => i.isAvailable).map((item) => {
                  const inCart = cart.find((c) => c.menuItemId === item.id)
                  return (
                    <View
                      key={item.id}
                      style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}
                    >
                      <View style={{ width: 48, height: 48, borderRadius: 8, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' }}>
                        <Ionicons name="restaurant-outline" size={20} color="#EA580C" />
                      </View>
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 14 }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: '#EA580C', marginTop: 2 }}>{formatCurrency(item.price)}</Text>
                      </View>
                      {inCart ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <TouchableOpacity onPress={() => updateQuantity(item.id, -1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="remove" size={16} color="#374151" />
                          </TouchableOpacity>
                          <Text style={{ fontWeight: '600', fontSize: 15, minWidth: 20, textAlign: 'center' }}>{inCart.quantity}</Text>
                          <TouchableOpacity onPress={() => updateQuantity(item.id, 1)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#EA580C', justifyContent: 'center', alignItems: 'center' }}>
                            <Ionicons name="add" size={16} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => addToCart(item)} style={{ backgroundColor: '#EA580C', borderRadius: 6, paddingHorizontal: 14, paddingVertical: 6 }}>
                          <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>ADD</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )
                })
              )}

              <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
                <Button title="Back" variant="outline" onPress={() => setStep(1)} style={{ flex: 1 }} />
                <Button
                  title={`Review (${cart.length})`}
                  onPress={() => setStep(3)}
                  disabled={cart.length === 0}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* Step 3: Review & Confirm */}
          {step === 3 && (
            <View>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 }}>Review Order</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>Confirm your order details</Text>

              <Card style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Type</Text>
                  <Text style={{ fontWeight: '500', color: '#0f172a' }}>{orderType.replace('_', ' ')}</Text>
                </View>
                {selectedTable && (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 12, color: '#64748b' }}>Table</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>Table {selectedTable.number}</Text>
                  </View>
                )}
              </Card>

              <Card style={{ marginBottom: 16 }}>
                {cart.map((item, idx) => (
                  <View key={item.menuItemId} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: '#f1f5f9' }}>
                    <Text style={{ color: '#0f172a' }}>{item.quantity}x {item.name}</Text>
                    <Text style={{ fontWeight: '500', color: '#0f172a' }}>{formatCurrency(item.unitPrice * item.quantity)}</Text>
                  </View>
                ))}
                <View style={{ borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontWeight: '700', fontSize: 16 }}>Total</Text>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: '#EA580C' }}>{formatCurrency(cartTotal)}</Text>
                </View>
              </Card>

              <Input
                label="Order Notes (optional)"
                placeholder="Any special instructions..."
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
                  title="Place Order"
                  onPress={() => createOrderMutation.mutate()}
                  loading={createOrderMutation.isPending}
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
