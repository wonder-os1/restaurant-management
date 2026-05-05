export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount / 100)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  const h = parseInt(hours)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${minutes} ${ampm}`
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    // Order statuses
    PENDING: '#eab308',
    CONFIRMED: '#3b82f6',
    PREPARING: '#f97316',
    READY: '#8b5cf6',
    SERVED: '#22c55e',
    COMPLETED: '#10b981',
    CANCELLED: '#ef4444',
    // Payment statuses
    PAID: '#22c55e',
    UNPAID: '#eab308',
    REFUNDED: '#6b7280',
    // Table statuses
    AVAILABLE: '#22c55e',
    OCCUPIED: '#ef4444',
    RESERVED: '#3b82f6',
    CLEANING: '#eab308',
    // Reservation statuses
    SCHEDULED: '#3b82f6',
    SEATED: '#10b981',
    NO_SHOW: '#6b7280',
    // Kitchen statuses
    IN_PROGRESS: '#f97316',
    FIRED: '#ef4444',
  }
  return colors[status] || '#6b7280'
}

export function getOrderTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    DINE_IN: 'Dine In',
    TAKEAWAY: 'Takeaway',
    DELIVERY: 'Delivery',
    ONLINE: 'Online',
  }
  return labels[type] || type
}

export function minutesAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}
