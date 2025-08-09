import { DatabaseProvider } from '../../providers/database'
import { User, Plan } from '@prisma/client'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class OptimizedUserRepository {
  private static instance: OptimizedUserRepository
  private cache = new Map<string, CacheEntry<any>>()
  private prisma = DatabaseProvider.getInstance()

  // Cache TTL в миллисекундах
  private readonly USER_CACHE_TTL = 5 * 60 * 1000 // 5 минут
  private readonly SUBSCRIPTION_CACHE_TTL = 10 * 60 * 1000 // 10 минут

  public static getInstance(): OptimizedUserRepository {
    if (!OptimizedUserRepository.instance) {
      OptimizedUserRepository.instance = new OptimizedUserRepository()
    }
    return OptimizedUserRepository.instance
  }

  private constructor() {
    // Очищаем устаревший кэш каждые 5 минут
    setInterval(() => {
      this.cleanupCache()
    }, 5 * 60 * 1000)
  }

  private getCachedData<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCachedData<T>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }

  private cleanupCache(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key)
      }
    }
  }

  public async getById(userId: string): Promise<User | null> {
    const cacheKey = `user:${userId}`
    const cached = this.getCachedData<User>(cacheKey)
    if (cached) return cached

    try {
      const user = await this.prisma.user.findUnique({
        where: { userId }
      })

      if (user) {
        this.setCachedData(cacheKey, user, this.USER_CACHE_TTL)
      }

      return user
    } catch (error) {
      console.error('Error fetching user:', error)
      return null
    }
  }

  public async createUser(userId: string, chatId: number): Promise<User | null> {
    try {
      const user = await this.prisma.user.create({
        data: {
          userId,
          chatId,
          plan: 'FREE' as Plan,
          notifications: true,
          subscriptionEnd: null
        }
      })

      // Инвалидируем кэш для этого пользователя
      this.cache.delete(`user:${userId}`)

      return user
    } catch (error) {
      console.error('Error creating user:', error)
      return null
    }
  }

  public async updateUserPlan(userId: string, plan: Plan, subscriptionEnd?: Date): Promise<boolean> {
    try {
      await this.prisma.user.update({
        where: { userId },
        data: {
          plan,
          subscriptionEnd
        }
      })

      // Инвалидируем кэш
      this.cache.delete(`user:${userId}`)

      return true
    } catch (error) {
      console.error('Error updating user plan:', error)
      return false
    }
  }

  public async getUsersWithDue(): Promise<User[]> {
    const cacheKey = 'users:due'
    const cached = this.getCachedData<User[]>(cacheKey)
    if (cached) return cached

    try {
      const users = await this.prisma.user.findMany({
        where: {
          subscriptionEnd: {
            lte: new Date()
          },
          plan: {
            not: 'FREE'
          }
        }
      })

      // Кэшируем на меньшее время для критических данных
      this.setCachedData(cacheKey, users, 2 * 60 * 1000) // 2 минуты

      return users
    } catch (error) {
      console.error('Error fetching users with due subscription:', error)
      return []
    }
  }

  public invalidateUserCache(userId: string): void {
    this.cache.delete(`user:${userId}`)
  }

  public clearCache(): void {
    this.cache.clear()
  }
}

export { OptimizedUserRepository }
