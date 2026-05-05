import { View, Text, TouchableOpacity } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { getStatusColor } from '@/lib/utils'
import type { Table } from '@/types'

interface TableCardProps {
  table: Table
}

export function TableCard({ table }: TableCardProps) {
  const router = useRouter()
  const statusColor = getStatusColor(table.status)

  const statusIcons: Record<string, string> = {
    AVAILABLE: 'checkmark-circle',
    OCCUPIED: 'people',
    RESERVED: 'calendar',
    CLEANING: 'water',
  }

  return (
    <TouchableOpacity
      onPress={() => router.push(`/table/${table.id}`)}
      style={{
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '47%',
        borderWidth: 2,
        borderColor: statusColor + '30',
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: statusColor + '15',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Ionicons name={(statusIcons[table.status] || 'grid') as any} size={20} color={statusColor} />
        </View>
        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 8,
          backgroundColor: statusColor + '20',
        }}>
          <Text style={{ fontSize: 10, fontWeight: '600', color: statusColor, textTransform: 'uppercase' }}>
            {table.status}
          </Text>
        </View>
      </View>

      <Text style={{ fontWeight: '700', color: '#0f172a', fontSize: 18, marginTop: 12 }}>
        Table {table.number}
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 }}>
        <Ionicons name="people-outline" size={14} color="#94a3b8" />
        <Text style={{ fontSize: 13, color: '#64748b' }}>
          {table.capacity} seats
        </Text>
      </View>

      {table.section && (
        <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
          {table.section}
        </Text>
      )}
    </TouchableOpacity>
  )
}
