interface RateLimit {
  count: number
  resetTime: number
}

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

class EnhancedRateLimit {
  private limits = new Map<string, RateLimit>()
  private configs = new Map<string, RateLimitConfig>()

  // Очищаем старые записи каждые 5 минут для экономии памяти
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)

    // Настройки по умолчанию для разных типов операций
    this.configs.set('callback_query', { maxRequests: 10, windowMs: 60000 }) // 10 в минуту
    this.configs.set('command', { maxRequests: 30, windowMs: 60000 }) // 30 в минуту
    this.configs.set('database', { maxRequests: 100, windowMs: 60000 }) // 100 в минуту
  }

  public isAllowed(userId: string, action: string = 'default'): boolean {
    const key = `${userId}:${action}`
    const config = this.configs.get(action) || { maxRequests: 20, windowMs: 60000 }
    const now = Date.now()

    let limit = this.limits.get(key)

    if (!limit || now > limit.resetTime) {
      // Создаем новое окно или сбрасываем существующее
      limit = {
        count: 1,
        resetTime: now + config.windowMs
      }
      this.limits.set(key, limit)
      return true
    }

    if (limit.count >= config.maxRequests) {
      return false
    }

    limit.count++
    return true
  }

  public getRemainingRequests(userId: string, action: string = 'default'): number {
    const key = `${userId}:${action}`
    const config = this.configs.get(action) || { maxRequests: 20, windowMs: 60000 }
    const limit = this.limits.get(key)

    if (!limit || Date.now() > limit.resetTime) {
      return config.maxRequests
    }

    return Math.max(0, config.maxRequests - limit.count)
  }

  public getResetTime(userId: string, action: string = 'default'): number {
    const key = `${userId}:${action}`
    const limit = this.limits.get(key)
    return limit?.resetTime || 0
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, limit] of this.limits.entries()) {
      if (now > limit.resetTime) {
        this.limits.delete(key)
      }
    }
  }

  public setConfig(action: string, config: RateLimitConfig): void {
    this.configs.set(action, config)
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.limits.clear()
    this.configs.clear()
  }
}

// Singleton instance
export const rateLimiter = new EnhancedRateLimit()
