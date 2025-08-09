import dotenv from 'dotenv'
import express, { Express } from 'express'
import { createServer } from 'http'
import { createBot } from './providers/telegram'
import { DatabaseProvider } from './providers/database'
import { StartCommand } from './bot/commands/start-command'
import { AddCommand } from './bot/commands/add-command'
import { CallbackQueryHandler } from './bot/handlers/callback-query-handler'
import { DeleteCommand } from './bot/commands/delete-command'
import { GroupsCommand } from './bot/commands/groups-command'
import { HelpCommand } from './bot/commands/help-command'
import { ManageCommand } from './bot/commands/manage-command'
import { UpgradePlanCommand } from './bot/commands/upgrade-plan-command'
import TelegramBot from 'node-telegram-bot-api'

// Optional: keep cron/watchers but guard to run once
import { CronJobs } from './lib/cron-jobs'
import { TrackWallets } from './lib/track-wallets'
import { ASCII_TEXT } from './constants/handi-cat'
import gradient from 'gradient-string'

dotenv.config()

const PORT = Number(process.env.PORT || 3001)
const APP_URL_BASE = process.env.APP_URL_BASE || ''
const BOT_TOKENS = (process.env.BOT_TOKENS || '').split(',').map((s) => s.trim()).filter(Boolean)

if (!APP_URL_BASE) {
  console.error('APP_URL_BASE is not set. Please set APP_URL_BASE to your public base URL (e.g., https://yourdomain)')
}
if (BOT_TOKENS.length === 0) {
  console.error('BOT_TOKENS is empty. Provide a comma-separated list of tokens in BOT_TOKENS')
}

// Build bots registry
type BotRegistryItem = {
  id: string // short id used in webhook path
  token: string
  bot: TelegramBot
  handlers: {
    callbackQueryHandler: CallbackQueryHandler
    startCommand: StartCommand
    addCommand: AddCommand
    deleteCommand: DeleteCommand
    groupsCommand: GroupsCommand
    helpCommand: HelpCommand
    manageCommand: ManageCommand
    upgradePlanCommand: UpgradePlanCommand
  }
}

const botsRegistry = new Map<string, BotRegistryItem>()

function botIdFromToken(token: string): string {
  // Use part before ':' as stable id
  const idx = token.indexOf(':')
  return idx > 0 ? token.slice(0, idx) : token.slice(0, 10)
}

async function createAndRegisterBot(token: string) {
  const botId = botIdFromToken(token)
  const bot = createBot(token)

  // Choose connection method: webhook or polling
  const USE_POLLING = process.env.USE_POLLING === 'true'

  if (USE_POLLING) {
    // Use polling for debugging
    console.log(`[bot ${botId}] starting polling mode`)
    bot.startPolling({ restart: true })
    console.log(`[bot ${botId}] polling started`)
  } else if (APP_URL_BASE) {
    // Use webhook for production
    const url = `${APP_URL_BASE.replace(/\/$/, '')}/webhook/${botId}`
    await bot.setWebHook(url)
    console.log(`[bot ${botId}] webhook set to ${url}`)
  } else {
    console.warn(`[bot ${botId}] no APP_URL_BASE set, bot will not receive updates`)
  }

  // Attach answerCallbackQuery early for responsiveness via a thin wrapper in handler
  const callbackQueryHandler = new CallbackQueryHandler(bot)
  const startCommand = new StartCommand(bot)
  const addCommand = new AddCommand(bot)
  const deleteCommand = new DeleteCommand(bot)
  const groupsCommand = new GroupsCommand(bot)
  const helpCommand = new HelpCommand(bot)
  const manageCommand = new ManageCommand(bot)
  const upgradePlanCommand = new UpgradePlanCommand(bot)

  // Wire handlers
  callbackQueryHandler.call()
  startCommand.start()
  addCommand.addCommandHandler()
  deleteCommand.deleteCommandHandler()
  groupsCommand.activateGroupCommandHandler()
  manageCommand.manageCommandHandler()
  upgradePlanCommand.upgradePlanCommandHandler()
  helpCommand.groupHelpCommandHandler()
  helpCommand.notifyHelpCommandHander()

  const item: BotRegistryItem = {
    id: botId,
    token,
    bot,
    handlers: {
      callbackQueryHandler,
      startCommand,
      addCommand,
      deleteCommand,
      groupsCommand,
      helpCommand,
      manageCommand,
      upgradePlanCommand,
    },
  }
  botsRegistry.set(botId, item)
}

async function initBots() {
  for (const token of BOT_TOKENS) {
    try {
      await createAndRegisterBot(token)
    } catch (e) {
      console.error('Failed to init bot for token prefix:', botIdFromToken(token), e)
    }
  }
}

// Single server handling all webhooks
const app: Express = express()
app.use(express.json())

// GET endpoint for webhook diagnostics
app.get('/webhook/:botId', (req, res) => {
  const { botId } = req.params
  const item = botsRegistry.get(botId)

  if (!item) {
    return res.status(404).json({
      error: 'Unknown bot id',
      botId,
      availableBots: Array.from(botsRegistry.keys())
    })
  }

  res.json({
    status: 'Webhook endpoint active',
    botId,
    method: 'GET',
    note: 'POST to this endpoint to send updates'
  })
})

app.post('/webhook/:botId', async (req, res) => {
  const { botId } = req.params
  const item = botsRegistry.get(botId)

  console.log(`[webhook] Received update for bot ${botId}:`, JSON.stringify(req.body, null, 2))

  if (!item) {
    console.error(`[webhook] Unknown bot id: ${botId}`)
    return res.status(404).send('Unknown bot id')
  }

  // Быстро отвечаем Telegram
  res.sendStatus(200)

  // Обрабатываем update асинхронно с timeout
  try {
    await Promise.race([
      new Promise<void>((resolve) => {
        console.log(`[webhook] Processing update for bot ${botId}`)
        item.bot.processUpdate(req.body)
        resolve()
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Webhook processing timeout')), 8000)
      )
    ])
    console.log(`[webhook] Successfully processed update for bot ${botId}`)
  } catch (err) {
    console.error(`[bot ${botId}] failed to process update:`, err)
    // НЕ возвращаем 500, так как уже ответили Telegram
  }
})

// Health check endpoints
app.get('/', (_req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    bots: botsRegistry.size,
    uptime: process.uptime()
  })
})

app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    bots: botsRegistry.size,
    uptime: process.uptime()
  })
})

// Test endpoint for debugging
app.get('/test-webhook/:botId', (req, res) => {
  const { botId } = req.params
  const item = botsRegistry.get(botId)

  if (!item) {
    return res.status(404).json({ error: 'Bot not found', botId })
  }

  // Simulate a /start command for testing
  const testUpdate = {
    update_id: 999999,
    message: {
      message_id: 1,
      from: {
        id: 12345,
        is_bot: false,
        first_name: "Test",
        username: "testuser"
      },
      chat: {
        id: 12345,
        first_name: "Test",
        username: "testuser",
        type: "private"
      },
      date: Math.floor(Date.now() / 1000),
      text: "/start"
    }
  }

  try {
    item.bot.processUpdate(testUpdate)
    res.json({ success: true, message: 'Test update processed', botId })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, botId })
  }
})

async function initOnceServices() {
  // Run cron and watchers once per app (not per bot)
  const gradientText = gradient.retro
  console.log(gradientText(ASCII_TEXT))

  const cronJobs = new CronJobs()
  const trackWallets = new TrackWallets()

  await cronJobs.monthlySubscriptionFee()
  await cronJobs.updateSolPrice()
  await trackWallets.setupWalletWatcher({ event: 'initial' })
}

async function bootstrap() {
  try {
    console.log('🚀 Starting application bootstrap...')
    console.log(`Environment: ${process.env.NODE_ENV}`)
    console.log(`Port: ${PORT}`)
    console.log(`App URL Base: ${APP_URL_BASE}`)
    console.log(`Bot tokens count: ${BOT_TOKENS.length}`)

    // Сначала подключаемся к БД
    console.log('📋 Connecting to database...')
    await DatabaseProvider.connect()
    console.log('✅ Database connected successfully')

    // Затем инициализируем ботов
    console.log('🤖 Initializing bots...')
    await initBots()
    console.log(`✅ Initialized ${botsRegistry.size} bot(s)`)

    // И запускаем сервисы
    console.log('⚙️ Starting services...')
    await initOnceServices()
    console.log('✅ Services started')

    const server = app.listen(PORT, () => {
      console.log(`🌐 Server listening on :${PORT}`)
      console.log(`📊 Registered ${botsRegistry.size} bot(s)`)
      console.log('✅ Application fully started!')
    })

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('⚠️ SIGTERM received, shutting down gracefully...')
      server.close(() => {
        DatabaseProvider.disconnect()
        process.exit(0)
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error)
      process.exit(1)
    })

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
      process.exit(1)
    })

  } catch (error) {
    console.error('💥 Failed to bootstrap application:', error)
    process.exit(1)
  }
}

bootstrap()
