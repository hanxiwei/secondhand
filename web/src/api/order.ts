import http from './http'

export interface MyOrderItem {
  id: string
  orderNo: string
  role: 'buyer' | 'seller'
  status: number
  remark: string | null
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
  completedAt: string | null
  canceledAt: string | null
  canConfirm: boolean
  canCancel: boolean
  canComplete: boolean
  product: {
    id: string
    title: string
    coverImage: string | null
    campus: string | null
    price: number
    status: number | null
  }
  partner: {
    id: string
    nickname: string
    campus: string | null
  } | null
}

export interface MyOrdersResponse {
  list: MyOrderItem[]
  total: number
}

export async function getMyOrders() {
  const { data } = await http.get<MyOrdersResponse>('/orders/my')
  return data
}

export async function createOrder(payload: { productId: number; remark?: string }) {
  const { data } = await http.post<{ id: string; message: string }>('/orders', payload)
  return data
}

export async function confirmOrder(id: string) {
  const { data } = await http.patch<{ id: string; message: string }>(`/orders/${id}/confirm`)
  return data
}

export async function cancelOrder(id: string) {
  const { data } = await http.patch<{ id: string; message: string }>(`/orders/${id}/cancel`)
  return data
}

export async function completeOrder(id: string) {
  const { data } = await http.patch<{ id: string; message: string }>(`/orders/${id}/complete`)
  return data
}

export async function clearCanceledOrders() {
  const { data } = await http.post<{ message: string; count: number }>('/orders/clear-canceled')
  return data
}
