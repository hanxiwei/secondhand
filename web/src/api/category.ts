import http from './http'

export interface CategoryTreeItem {
  id: string
  name: string
  parentId: string
  children: CategoryTreeItem[]
}

export async function getCategoryTree() {
  const { data } = await http.get<CategoryTreeItem[]>('/categories/tree')
  return data
}
