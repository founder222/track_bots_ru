import TelegramBot from 'node-telegram-bot-api'
import { Payments } from '../../lib/payments'
import { PromotionType } from '@prisma/client'
import { GeneralMessages } from '../messages/general-messages'
import { PaymentsMessageEnum } from '../../types/messages-types'
import { INSUFFICIENT_BALANCE_SUB_MENU, SUB_MENU } from '../../config/bot-menus'

export class PromotionHandler {
  private payments: Payments
  constructor(private bot: TelegramBot) {
    this.bot = bot
    this.payments = new Payments()
  }

  public async buyPromotion(message: TelegramBot.Message, promotionPrice: number, promotionType: PromotionType) {
    const userId = String(message.chat.id)
    const chatId = message.chat.id

    const { message: paymentMessage, success } = await this.payments.chargePromotion(
      userId,
      promotionPrice,
      promotionType,
    )

    if (paymentMessage === PaymentsMessageEnum.INSUFFICIENT_BALANCE) {
      this.bot.editMessageText(GeneralMessages.insufficientBalanceMessage, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: INSUFFICIENT_BALANCE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.USER_ALREADY_PAID) {
      this.bot.editMessageText('Похоже, вы уже приобрели эту акцию', {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: INSUFFICIENT_BALANCE_SUB_MENU,
        parse_mode: 'HTML',
      })
    } else if (paymentMessage === PaymentsMessageEnum.TRANSACTION_SUCCESS) {
      this.bot.editMessageText(
        `
😸 Акция успешно куплена!

Спасибо за покупку.

Теперь вы сможете отслеживать до 50 кошельков одновременно навсегда! ✨
`,
        {
          chat_id: chatId,
          message_id: message.message_id,
          reply_markup: SUB_MENU,
          parse_mode: 'HTML',
        },
      )
    } else {
      this.bot.editMessageText(GeneralMessages.generalMessageError, {
        chat_id: chatId,
        message_id: message.message_id,
        reply_markup: SUB_MENU,
        parse_mode: 'HTML',
      })
    }

    return
  }
}
