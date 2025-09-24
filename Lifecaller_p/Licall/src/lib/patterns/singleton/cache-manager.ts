import { CacheEntry } from '@/types'

// Singleton Pattern - Gerenciador de cache global
export class CacheManager {
  private static instance: CacheManager
  private cache: Map<string, CacheEntry> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutos em milissegundos

  private constructor() {
    // Construtor privado impede instanciação direta
    this.startCleanupInterval()
  }

  // Método estático para obter a instância única
  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager()
    }
    return CacheManager.instance
  }

  // Armazenar dados no cache
  public set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    }

    this.cache.set(key, entry)
  }

  // Recuperar dados do cache
  public get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Verificar se o cache expirou
    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  // Verificar se uma chave existe no cache e não expirou
  public has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  // Remover uma entrada específica do cache
  public delete(key: string): boolean {
    return this.cache.delete(key)
  }

  // Limpar todo o cache
  public clear(): void {
    this.cache.clear()
  }

  // Obter ou definir (get or set) - padrão comum em cache
  public async getOrSet<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key)

    if (cached !== null) {
      return cached
    }

    const data = await fetchFunction()
    this.set(key, data, ttl)
    return data
  }

  // Invalidar cache por padrão (útil para invalidar múltiplas chaves relacionadas)
  public invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern)
    const keysToDelete: string[] = []

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToDelete.push(key)
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  // Obter estatísticas do cache
  public getStats(): {
    size: number
    keys: string[]
    memoryUsage: number
    hitRate?: number
  } {
    const keys = Array.from(this.cache.keys())

    return {
      size: this.cache.size,
      keys,
      memoryUsage: this.estimateMemoryUsage(),
    }
  }

  // Definir TTL padrão
  public setDefaultTTL(ttl: number): void {
    this.defaultTTL = ttl
  }

  // Verificar se uma entrada expirou
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  // Estimar uso de memória (aproximado)
  private estimateMemoryUsage(): number {
    let size = 0
    for (const [key, entry] of this.cache) {
      size += key.length * 2 // string UTF-16
      size += JSON.stringify(entry.data).length * 2
      size += 24 // timestamp + ttl + overhead
    }
    return size
  }

  // Limpeza automática de entradas expiradas
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now()
      const keysToDelete: string[] = []

      for (const [key, entry] of this.cache) {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key)
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key))
    }, 60000) // Limpar a cada 1 minuto
  }

  // Métodos específicos para diferentes tipos de dados

  // Cache de KPIs
  public setKPIData(period: string, data: any, ttl?: number): void {
    this.set(`kpi:${period}`, data, ttl || 10 * 60 * 1000) // 10 min para KPIs
  }

  public getKPIData(period: string): any | null {
    return this.get(`kpi:${period}`)
  }

  // Cache de usuários
  public setUserData(userId: string, data: any, ttl?: number): void {
    this.set(`user:${userId}`, data, ttl || 15 * 60 * 1000) // 15 min para usuários
  }

  public getUserData(userId: string): any | null {
    return this.get(`user:${userId}`)
  }

  // Cache de atendimentos
  public setAtendimentoData(atendimentoId: string, data: any, ttl?: number): void {
    this.set(`atendimento:${atendimentoId}`, data, ttl || 5 * 60 * 1000) // 5 min para atendimentos
  }

  public getAtendimentoData(atendimentoId: string): any | null {
    return this.get(`atendimento:${atendimentoId}`)
  }

  // Invalidar cache relacionado a atendimentos
  public invalidateAtendimentoCache(atendimentoId?: string): void {
    if (atendimentoId) {
      this.invalidatePattern(`atendimento:${atendimentoId}`)
    } else {
      this.invalidatePattern('atendimento:')
    }
  }

  // Cache de relatórios/dashboards
  public setReportData(reportKey: string, data: any, ttl?: number): void {
    this.set(`report:${reportKey}`, data, ttl || 30 * 60 * 1000) // 30 min para relatórios
  }

  public getReportData(reportKey: string): any | null {
    return this.get(`report:${reportKey}`)
  }
}

// Factory method para criar instância do cache manager
export const createCacheManager = (): CacheManager => {
  return CacheManager.getInstance()
}

// Hook personalizado para usar o cache manager em componentes React
export const useCacheManager = () => {
  return CacheManager.getInstance()
}

// Utilitários para chaves de cache padronizadas
export class CacheKeys {
  static user(id: string): string {
    return `user:${id}`
  }

  static atendimento(id: string): string {
    return `atendimento:${id}`
  }

  static kpi(period: string, category?: string): string {
    return category ? `kpi:${period}:${category}` : `kpi:${period}`
  }

  static report(type: string, filters?: string): string {
    return filters ? `report:${type}:${filters}` : `report:${type}`
  }

  static dashboard(userId: string, period: string): string {
    return `dashboard:${userId}:${period}`
  }

  static list(entity: string, page: number, filters?: string): string {
    return filters
      ? `list:${entity}:${page}:${filters}`
      : `list:${entity}:${page}`
  }
}

// Exportar instância global (opcional, mas útil em alguns casos)
export const cacheManager = CacheManager.getInstance()