import TelegramBot from 'node-telegram-bot-api'

export type BotInstance = TelegramBot

export function createBot(token: string): BotInstance {
  // Create bot instance without polling or webhook setup here.
  // Webhook registration and update routing will be handled in the server.
  const bot = new TelegramBot(token, { webHook: {} })
  return bot
}
