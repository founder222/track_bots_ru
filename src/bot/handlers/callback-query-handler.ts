import TelegramBot, { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { AddCommand } from '../commands/add-command'
import { START_MENU, SUB_MENU } from '../../config/bot-menus'
import { ManageCommand } from '../commands/manage-command'
import { DeleteCommand } from '../commands/delete-command'
import { userExpectingDonation, userExpectingGroupId, userExpectingWalletAddress } from '../../constants/flags'
import { MyWalletCommand } from '../commands/mywallet-command'
import { GeneralMessages } from '../messages/general-messages'
import { UpgradePlanCommand } from '../commands/upgrade-plan-command'
import { UpgradePlanHandler } from './upgrade-plan-handler'
import { DonateCommand } from '../commands/donate-command'
import { DonateHandler } from './donate-handler'
import { SettingsCommand } from '../commands/settings-command'
import { UpdateBotStatusHandler } from './update-bot-status-handler'
import { PromotionHandler } from './promotion-handler'
import { GET_50_WALLETS_PROMOTION } from '../../constants/promotions'
import { OptimizedUserRepository } from '../../repositories/optimized/user'
import { GroupsCommand } from '../commands/groups-command'
import { HelpCommand } from '../commands/help-command'
import { rateLimiter } from '../../lib/enhanced-rate-limit'

export class CallbackQueryHandler {
  private addCommand: AddCommand
  private manageCommand: ManageCommand
  private deleteCommand: DeleteCommand
  private myWalletCommand: MyWalletCommand
  private upgradePlanCommand: UpgradePlanCommand
  private donateCommand: DonateCommand
  private settingsCommand: SettingsCommand
  private groupsCommand: GroupsCommand
  private helpCommand: HelpCommand

  private updateBotStatusHandler: UpdateBotStatusHandler

  private userRepository: OptimizedUserRepository

  private upgradePlanHandler: UpgradePlanHandler
  private donateHandler: DonateHandler
  private promotionHandler: PromotionHandler
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.addCommand = new AddCommand(this.bot)
    this.manageCommand = new ManageCommand(this.bot)
    this.deleteCommand = new DeleteCommand(this.bot)
    this.myWalletCommand = new MyWalletCommand(this.bot)
    this.upgradePlanCommand = new UpgradePlanCommand(this.bot)
    this.donateCommand = new DonateCommand(this.bot)
    this.settingsCommand = new SettingsCommand(this.bot)
    this.groupsCommand = new GroupsCommand(this.bot)
    this.helpCommand = new HelpCommand(this.bot)

    this.updateBotStatusHandler = new UpdateBotStatusHandler(this.bot)

    this.userRepository = OptimizedUserRepository.getInstance()

    this.upgradePlanHandler = new UpgradePlanHandler(this.bot)
    this.donateHandler = new DonateHandler(this.bot)
    this.promotionHandler = new PromotionHandler(this.bot)
  }

  public call() {
    this.bot.on('callback_query', async (callbackQuery) => {
      const message = callbackQuery.message
      const chatId = message?.chat.id
      const data = callbackQuery.data

      // Immediate feedback to user - CRITICAL FIX
      if (callbackQuery.id) {
        // Не блокируем выполнение, отвечаем сразу
        this.bot.answerCallbackQuery(callbackQuery.id).catch(err => {
          console.error('Failed to answer callback query:', err)
        })
      }

      const userId = message?.chat.id.toString()

      if (!chatId || !userId) {
        return
      }

      // Добавляем общий timeout и обработку ошибок
      try {
        await Promise.race([
          this.processCallbackQuery(data, message, userId, chatId),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Callback query timeout')), 10000)
          )
        ])
      } catch (error) {
        console.error(`Error processing callback query for user ${userId}:`, error)
        // Уведомляем пользователя о проблеме
        this.bot.sendMessage(chatId, '⚠️ Произошла ошибка при обработке команды. Попробуйте еще раз.')
          .catch(err => console.error('Failed to send error message:', err))
      }
    })
  }

  private async processCallbackQuery(data: string | undefined, message: TelegramBot.Message, userId: string, chatId: number) {
      // Проверяем rate limit
      if (!rateLimiter.isAllowed(userId, 'callback_query')) {
        const resetTime = rateLimiter.getResetTime(userId, 'callback_query')
        const waitMinutes = Math.ceil((resetTime - Date.now()) / 60000)

        await this.bot.sendMessage(chatId,
          `⚠️ Слишком много запросов. Подождите ${waitMinutes} мин.`
        ).catch(() => {}) // Игнорируем ошибки отправки
        return
      }

      let responseText

      // handle donations
      if (data?.startsWith('donate_action')) {
        const donationAmount = data.split('_')[2]
        console.log(`User wants to donate ${donationAmount} SOL`)
        await this.donateHandler.makeDonation(message, Number(donationAmount))
        return
      }

      switch (data) {
        case 'add':
          this.addCommand.addButtonHandler(message)
          break
        case 'manage':
          await this.manageCommand.manageButtonHandler(message)
          break
        case 'delete':
          this.deleteCommand.deleteButtonHandler(message)
          break
        case 'settings':
          this.settingsCommand.settingsCommandHandler(message)
          break
        case 'pause-resume-bot':
          await this.updateBotStatusHandler.pauseResumeBot(message)
          break
        case 'upgrade':
          this.upgradePlanCommand.upgradePlanButtonHandler(message)
          break
        case 'upgrade_hobby':
          await this.upgradePlanHandler.upgradePlan(message, 'HOBBY')
          break
        case 'upgrade_pro':
          await this.upgradePlanHandler.upgradePlan(message, 'PRO')
          break
        case 'upgrade_whale':
          await this.upgradePlanHandler.upgradePlan(message, 'WHALE')
          break
        case 'donate':
          await this.donateCommand.donateCommandHandler(message)
          break
        case 'groups':
          await this.groupsCommand.groupsButtonHandler(message)
          break
        case 'delete_group':
          await this.groupsCommand.deleteGroupButtonHandler(message)
          break
        case 'help':
          this.helpCommand.helpButtonHandler(message)
          break
        case 'my_wallet':
          this.myWalletCommand.myWalletCommandHandler(message)
          break
        case 'show_private_key':
          this.myWalletCommand.showPrivateKeyHandler(message)
          break
        case 'buy_promotion':
          this.promotionHandler.buyPromotion(message, GET_50_WALLETS_PROMOTION.price, GET_50_WALLETS_PROMOTION.type)
          break
        case 'back_to_main_menu':
          const user = await this.userRepository.getById(userId)
          const messageText = GeneralMessages.startMessage(user)

          // reset any flags
          userExpectingWalletAddress[chatId] = false
          userExpectingDonation[chatId] = false
          userExpectingGroupId[chatId] = false

          this.bot.editMessageText(messageText, {
            chat_id: chatId,
            message_id: message.message_id,
            reply_markup: START_MENU,
            parse_mode: 'HTML',
          })
          break
        default:
          responseText = 'Неизвестная команда.'
      }
  }
}
