import TelegramBot from 'node-telegram-bot-api'
import { SUB_MENU, UPGRADE_PLAN_SUB_MENU } from '../../config/bot-menus'
import { PublicKey } from '@solana/web3.js'
import { PrismaWalletRepository } from '../../repositories/prisma/wallet'
import { userExpectingWalletAddress } from '../../constants/flags'
import { TrackWallets } from '../../lib/track-wallets'
import { RateLimit } from '../../lib/rate-limit'
import { MAX_5_MIN_TXS_ALLOWED } from '../../constants/handi-cat'
import { WalletMessages } from '../messages/wallet-messages'
import { UserPlan } from '../../lib/user-plan'
import { PrismaUserRepository } from '../../repositories/prisma/user'
import { GeneralMessages } from '../messages/general-messages'
import { BANNED_WALLETS } from '../../constants/banned-wallets'
import { BotMiddleware } from '../../config/bot-middleware'
import { SubscriptionMessages } from '../messages/subscription-messages'

export class AddCommand {
  private prismaWalletRepository: PrismaWalletRepository
  private trackWallets: TrackWallets
  private userPlan: UserPlan
  constructor(private bot: TelegramBot) {
    this.bot = bot

    this.prismaWalletRepository = new PrismaWalletRepository()

    this.trackWallets = new TrackWallets(this.bot)
    this.userPlan = new UserPlan()
  }

  public addCommandHandler() {
    this.bot.onText(/\/add/, async (msg) => {
      const chatId = msg.chat.id
      const userId = String(msg.from?.id)

      // check for group chats
      const groupValidationResult = await BotMiddleware.checkGroupChatRequirements(chatId, userId)

      if (!groupValidationResult.isValid) {
        return this.bot.sendMessage(chatId, groupValidationResult.message, {
          parse_mode: 'HTML',
        })
      }

      this.add({ message: msg, isButton: false })
    })
  }

  public addButtonHandler(msg: TelegramBot.Message) {
    this.add({ message: msg, isButton: true })
  }

  private add({ message, isButton }: { message: TelegramBot.Message; isButton: boolean }) {
    try {
      const userId = message.chat.id.toString()

      const addMessage = WalletMessages.addWalletMessage
      if (isButton) {
        this.bot.editMessageText(addMessage, {
          chat_id: message.chat.id,
          message_id: message.message_id,
          reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
          parse_mode: 'HTML',
        })
      } else if (!isButton) {
        this.bot.sendMessage(message.chat.id, addMessage, {
          reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
          parse_mode: 'HTML',
        })
      }

      userExpectingWalletAddress[Number(userId)] = true
      const listener = async (responseMsg: TelegramBot.Message) => {
        // Check if the user is expected to enter a wallet address
        if (!userExpectingWalletAddress[Number(userId)]) return

        const text = responseMsg.text

        if (text?.startsWith('/')) {
          return
        }

        const walletEntries = text
          ?.split('\n')
          .map((entry) => entry.trim())
          .filter(Boolean) // Split input by new lines, trim, and remove empty lines

        if (!walletEntries || walletEntries.length === 0) {
          this.bot.sendMessage(message.chat.id, 'No wallet addresses provided.')
          return
        }

        const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

        for (const entry of walletEntries) {
          const [walletAddress, walletName] = entry.split(' ')

          // check for bot wallets
          if (BANNED_WALLETS.has(walletAddress)) {
            return this.bot.sendMessage(message.chat.id, GeneralMessages.botWalletError, {
              parse_mode: 'HTML',
              reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
            })
          }

          if (walletAddress.includes('orc') || walletAddress.includes('pump')) {
            return this.bot.sendMessage(message.chat.id, GeneralMessages.botWalletError, {
              parse_mode: 'HTML',
              reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
            })
          }

          // check if user can add a wallet inside their plan limits
          const planWallets = await this.userPlan.getUserPlanWallets(userId)
          const userWallets = await this.prismaWalletRepository.getUserWallets(userId)

          if (userWallets && userWallets.length >= planWallets) {
            return this.bot.sendMessage(
              message.chat.id,
              GeneralMessages.walletLimitMessageError(walletName, walletAddress, planWallets),
              {
                reply_markup: UPGRADE_PLAN_SUB_MENU,
                parse_mode: 'HTML',
              },
            )
          }

          if (walletAddress && !base58Regex.test(walletAddress)) {
            return this.bot.sendMessage(message.chat.id, 'Address provided is not a valid Solana wallet')
          }

          if (!walletAddress || !walletName) {
            return this.bot.sendMessage(message.chat.id, 'Please provide a wallet address and a name')
          }

          try {
            new PublicKey(walletAddress)
          } catch (error) {
            return this.bot.sendMessage(message.chat.id, 'Address provided is not a valid Solana wallet')
          }

          const createResponse = await this.prismaWalletRepository.create(userId, walletAddress, walletName)

          if (!createResponse) {
            return this.bot.sendMessage(message.chat.id, 'Failed to create wallet')
          }

          this.bot.sendMessage(
            message.chat.id,
            `Wallet ${walletAddress} has been added as "${walletName}"`,
            {
              parse_mode: 'HTML',
              reply_markup: BotMiddleware.isGroup(message.chat.id) ? undefined : SUB_MENU,
            },
          )
          this.bot.removeListener('message', listener)

          // If repository returns link or new wallet, adapt to both
          const walletId = (createResponse as any).walletId || (createResponse as any).id
          if (walletId) {
            this.trackWallets.setupWalletWatcher({ event: 'create', walletId })
          }
        }
      }

      // Ensure previous listener is removed
      this.bot.removeListener('message', listener)
      this.bot.addListener('message', listener)
    } catch (error) {
      console.log('error in add', error)
      this.bot.sendMessage(message.chat.id, 'Something went wrong, please try again later.')
    }
  }
}
