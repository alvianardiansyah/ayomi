import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function generateCustomerSession(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function getOrCreateCustomerSession(): string {
  let session = localStorage.getItem('customer_session')
  if (!session) {
    session = generateCustomerSession()
    localStorage.setItem('customer_session', session)
  }
  return session
}

export function getOrderStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Menunggu',
    waiting_payment: 'Menunggu Pembayaran QRIS',
    waiting_cash_payment: 'Menunggu Pembayaran Tunai',
    paid: 'Dibayar',
    diproses: 'Diproses',
    dimasak: 'Sedang Dimasak',
    siap_diantar: 'Siap Diantar',
    selesai: 'Selesai',
    cancelled: 'Dibatalkan',
  }
  return labels[status] || status
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    waiting_payment: 'bg-orange-100 text-orange-800',
    waiting_cash_payment: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    diproses: 'bg-purple-100 text-purple-800',
    dimasak: 'bg-indigo-100 text-indigo-800',
    siap_diantar: 'bg-teal-100 text-teal-800',
    selesai: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function generateOrderNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.floor(Math.random() * 9000) + 1000
  return `ORD-${date}-${rand}`
}
