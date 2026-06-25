import http from './http'

export interface MessageSessionListItem {
  id: string
  productId: string | null
  productTitle: string
  productCover: string | null
  productPrice: number | null
  partner: {
    id: string
    nickname: string
    avatarUrl: string | null
    campus: string | null
  } | null
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export interface MessageSessionsResponse {
  list: MessageSessionListItem[]
  total: number
  unreadTotal: number
}

export interface SessionMessagesResponse {
  session: {
    id: string
    product: {
      id: string
      title: string
      price: number
      campus: string | null
      coverImage: string | null
    } | null
    partner: {
      id: string
      nickname: string
      avatarUrl: string | null
      campus: string | null
      schoolName: string | null
    } | null
  }
  messages: Array<{
    id: string
    senderId: string | null
    receiverId: string
    content: string
    isRead: number
    createdAt: string
  }>
}

export async function getMessageSessions() {
  const { data } = await http.get<MessageSessionsResponse>('/messages/sessions')
  return data
}

export async function getSessionMessages(sessionId: string) {
  const { data } = await http.get<SessionMessagesResponse>(`/messages/sessions/${sessionId}/messages`)
  return data
}

export async function createMessageSession(payload: { productId: number; content: string }) {
  const { data } = await http.post<{ sessionId: string; message: string }>('/messages/sessions', payload)
  return data
}

export async function sendSessionMessage(sessionId: string, content: string) {
  const { data } = await http.post<{ sessionId: string; message: string }>(
    `/messages/sessions/${sessionId}/messages`,
    { content },
  )
  return data
}
