import http from './http'

export interface FavoriteListResponse {
  list: Array<{
    id: string
    title: string
    subtitle: string | null
    price: number
    originalPrice: number | null
    campus: string | null
    favoriteCount: number
    coverImage: string | null
  }>
  total: number
}

export async function getMyFavorites() {
  const { data } = await http.get<FavoriteListResponse>('/favorites')
  return data
}

export async function getFavoriteStatus(productId: string) {
  const { data } = await http.get<{ isFavorite: boolean }>(`/favorites/${productId}/status`)
  return data
}

export async function addFavorite(productId: string) {
  const { data } = await http.post<{ message: string }>(`/favorites/${productId}`)
  return data
}

export async function removeFavorite(productId: string) {
  const { data } = await http.delete<{ message: string }>(`/favorites/${productId}`)
  return data
}
