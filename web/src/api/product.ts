import http from './http'

export interface ProductListItem {
  id: string
  title: string
  subtitle: string | null
  description: string
  price: number
  originalPrice: number | null
  conditionLevel: number
  campus: string | null
  tradeMethod: number
  viewCount: number
  favoriteCount: number
  publishedAt: string | null
  categoryName: string
  coverImage: string | null
}

export interface ProductListResponse {
  list: ProductListItem[]
  total: number
}

export interface ProductDetailResponse extends ProductListItem {
  categoryId?: number
  contactInfo: string | null
  status: number
  images: string[]
  seller: {
    id: string
    nickname: string
    schoolName: string | null
    collegeName: string | null
    campus: string | null
  } | null
}

export interface ManageProductResponse {
  id: string
  categoryId: number
  title: string
  subtitle: string | null
  description: string
  price: number
  originalPrice: number | null
  conditionLevel: number
  campus: string | null
  tradeMethod: number
  contactInfo: string | null
  status: number
  imageUrls: string[]
}

export interface CreateProductPayload {
  categoryId: number
  title: string
  subtitle?: string
  description: string
  price: number
  originalPrice?: number
  conditionLevel: number
  campus?: string
  tradeMethod: number
  contactInfo?: string
  imageUrls?: string[]
}

export interface UploadProductImagesResponse {
  urls: string[]
}

export interface ProductListQuery {
  keyword?: string
  categoryId?: number
  campus?: string
}

export async function getProductList(params?: ProductListQuery) {
  const { data } = await http.get<ProductListResponse>('/products', { params })
  return data
}

export async function getProductDetail(id: string) {
  const { data } = await http.get<ProductDetailResponse>(`/products/${id}`)
  return data
}

export async function createProduct(payload: CreateProductPayload) {
  const { data } = await http.post<{ id: string; message: string }>('/products', payload)
  return data
}

export async function uploadProductImages(files: File[]) {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append('files', file)
  })

  const { data } = await http.post<UploadProductImagesResponse>('/products/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 20000,
  })

  return data
}

export async function getManageProduct(id: string) {
  const { data } = await http.get<ManageProductResponse>(`/products/${id}/manage`)
  return data
}

export async function updateProduct(id: string, payload: CreateProductPayload) {
  const { data } = await http.patch<{ id: string; message: string }>(`/products/${id}`, payload)
  return data
}

export async function updateProductStatus(id: string, status: 0 | 1) {
  const { data } = await http.patch<{ id: string; message: string }>(`/products/${id}/status`, {
    status,
  })
  return data
}

export async function deleteProduct(id: string) {
  const { data } = await http.delete<{ id: string; message: string }>(`/products/${id}`)
  return data
}
