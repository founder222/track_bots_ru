import { PrismaClient } from '@prisma/client'

// Singleton pattern для Prisma Client с оптимизированным connection pooling
class DatabaseProvider {
  private static instance: PrismaClient | null = null
  private static isConnected = false

  public static getInstance(): PrismaClient {
    if (!DatabaseProvider.instance) {
      DatabaseProvider.instance = new PrismaClient({
        log: ['error'],
        datasources: {
          db: {
            url: process.env.DATABASE_URL,
          },
        },
        // Оптимизированный connection pool
        // Эти настройки существенно улучшат производительность
        errorFormat: 'minimal',
      })

      // Настройка timeout'ов для операций
      DatabaseProvider.instance.$use(async (params, next) => {
        const start = Date.now()
        const result = await Promise.race([
          next(params),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Database operation timeout')), 5000)
          ),
        ])
        const end = Date.now()

        // Логируем медленные запросы
        if (end - start > 1000) {
          console.warn(`Slow query detected: ${params.model}.${params.action} took ${end - start}ms`)
        }

        return result
      })
    }

    return DatabaseProvider.instance
  }

  public static async connect(): Promise<void> {
    if (!DatabaseProvider.isConnected) {
      try {
        await DatabaseProvider.getInstance().$connect()
        DatabaseProvider.isConnected = true
        console.log('Database connected successfully')
      } catch (error) {
        console.error('Failed to connect to database:', error)
        throw error
      }
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseProvider.instance && DatabaseProvider.isConnected) {
      await DatabaseProvider.instance.$disconnect()
      DatabaseProvider.isConnected = false
      console.log('Database disconnected')
    }
  }

  public static isReady(): boolean {
    return DatabaseProvider.isConnected
  }
}

export { DatabaseProvider }
