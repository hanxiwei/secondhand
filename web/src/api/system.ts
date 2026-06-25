import http from './http'

export interface HealthResponse {
  status: string
  timestamp: string
  project: string
  version: string
}

export interface OverviewResponse {
  projectName: string
  slogan: string
  currentStage: string
  frontend: string
  backend: string
  database: string
  coreModules: string[]
}

export async function getSystemHealth() {
  const { data } = await http.get<HealthResponse>('/health')
  return data
}

export async function getSystemOverview() {
  const { data } = await http.get<OverviewResponse>('/system/overview')
  return data
}
