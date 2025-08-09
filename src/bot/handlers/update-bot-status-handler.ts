import TelegramBot from 'node-telegram-bot-api'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { SUB_MENU } from '../../config/bot-menus'

export class UpdateBotStatusHandler {
  private prismaUserRepository: PrismaUserRepository
  constructor(private bot: TelegramBot) {
    this.prismaUserRepository = new PrismaUserRepository()
    this.bot = bot
  }

  public async pauseResumeBot(msg: TelegramBot.Message) {
    const chatId = msg.chat.id

    const botPaused = await this.prismaUserRepository.updateUserHandiCatStatus(String(chatId))

    if (botPaused.status !== 'ok') return

    const changedStatus = botPaused.changedStatus

    const messageText = `
${
  changedStatus === 'PAUSED'
    ? `
✨ Bot поставлен на <u>паузу</u>, уведомления приходить не будут, пока вы не возобновите его!

Вы всегда можете включить бота в меню настроек
`
    : changedStatus === 'ACTIVE'
      ? `
✨ Bot <u>возобновлён</u>, вы снова начнёте получать уведомления!

Вы можете менять настройки в любое время в меню настроек
`
      : changedStatus === 'NONE'
        ? `
Произошла ошибка при обновлении статуса, попробуйте позже
`
        : ''
}
`

    this.bot.editMessageText(messageText, {
      chat_id: chatId,
      message_id: msg.message_id,
      reply_markup: SUB_MENU,
      parse_mode: 'HTML',
    })
  }
}
