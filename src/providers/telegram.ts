import TelegramBot from 'node-telegram-bot-api'
import dotenv from 'dotenv'

dotenv.config()

// Export createBot function for use in main.ts
export function createBot(token: string): TelegramBot {
  return new TelegramBot(token)
}

// Optional exports for backwards compatibility
const TEST_BOT_TOKEN = process.env.TEST_BOT_TOKEN
const APP_URL = process.env.APP_URL

// Export bot for scripts and other legacy usage
const firstToken = process.env.BOT_TOKENS?.split(',')[0]?.trim()
export const bot = firstToken ? new TelegramBot(firstToken) : null
