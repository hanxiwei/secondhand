import http from './http'

export interface CurrentUserResponse {
  id: string
  username: string
  nickname: string
  avatarUrl: string | null
  phone: string | null
  email: string | null
  schoolName: string | null
  collegeName: string | null
  grade: string | null
  campus: string | null
  contactInfo: string | null
  bio: string | null
  creditScore: number
  authStatus: number
  createdAt: string
}

export interface UpdateProfilePayload {
  nickname?: string
  phone?: string
  email?: string
  schoolName?: string
  collegeName?: string
  grade?: string
  campus?: string
  contactInfo?: string
  bio?: string
}

export interface MyProductsResponse {
  list: Array<{
    id: string
    title: string
    subtitle: string | null
    price: number
    originalPrice: number | null
    status: number
    auditStatus: number
    campus: string | null
    viewCount: number
    favoriteCount: number
    publishedAt: string | null
  }>
  total: number
}

export interface SummaryResponse {
  productCount: number
  favoriteCount: number
}

export async function getCurrentUser() {
  const { data } = await http.get<CurrentUserResponse>('/users/me')
  return data
}

export async function getMyProducts() {
  const { data } = await http.get<MyProductsResponse>('/users/me/products')
  return data
}

export async function getMySummary() {
  const { data } = await http.get<SummaryResponse>('/users/me/summary')
  return data
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const { data } = await http.patch<{ message: string; user: CurrentUserResponse }>('/users/me', payload)
  return data
}

export async function uploadAvatar(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await http.post<{ message: string; user: CurrentUserResponse }>('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return data
}
