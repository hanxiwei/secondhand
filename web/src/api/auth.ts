import http from './http'

export interface LoginPayload {
  account: string
  password: string
}

export interface LoginResponse {
  token: string
  expiresIn: number
  userInfo: {
    id: string
    username: string
    nickname: string
    avatarUrl: string | null
    schoolName: string | null
  }
}

export interface RegisterPayload {
  username: string
  password: string
  nickname: string
  phone?: string
  email?: string
  schoolName?: string
  collegeName?: string
  grade?: string
  campus?: string
}

export async function login(payload: LoginPayload) {
  const { data } = await http.post<LoginResponse>('/auth/login', payload)
  return data
}

export async function register(payload: RegisterPayload) {
  const { data } = await http.post<LoginResponse>('/auth/register', payload)
  return data
}
