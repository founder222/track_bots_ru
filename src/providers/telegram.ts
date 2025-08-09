import TelegramBot from 'node-telegram-bot-api'

export type BotInstance = TelegramBot

export function createBot(token: string): BotInstance {
  // Create bot instance without starting polling or local webhook listener.
  // Webhook registration and update routing are handled in the main Express server.
  const bot = new TelegramBot(token)
  return bot
}
