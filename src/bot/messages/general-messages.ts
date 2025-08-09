import { SubscriptionPlan } from '@prisma/client'
import {
  MAX_FREE_WALLETS,
  MAX_HOBBY_WALLETS,
  MAX_PRO_WALLETS,
  MAX_USER_GROUPS,
  MAX_WHALE_WALLETS,
} from '../../constants/pricing'
import { UserPlan } from '../../lib/user-plan'
import { UserPrisma } from '../../types/prisma-types'
import { UserGroup } from '../../types/general-interfaces'

export class GeneralMessages {
  constructor() {}

  static startMessage(user: UserPrisma): string {
    const plan = user?.userSubscription?.plan || 'FREE'

    const planWallets: { [key: string]: number } = {
      FREE: MAX_FREE_WALLETS,
      HOBBY: MAX_HOBBY_WALLETS,
      PRO: MAX_PRO_WALLETS,
      WHALE: MAX_WHALE_WALLETS,
    }

    const promText = `
🎉 <b>ПРЕДЛОЖЕНИЕ НА ОГРАНИЧЕННОЕ ВРЕМЯ (24ч)</b>🎉
За <b>одноразовый</b> платеж всего <b>0.1 SOL</b> отслеживайте до <b>**50 кошельков ПОЖИЗНЕННО**</b>

Не упустите шанс прокачать отслеживание кошельков без ежемесячных подписок!
`
    const messageText = `
Bot | Отслеживание кошельков

Получайте уведомления в реальном времени по любому кошельку, который вы добавите!

Сейчас вы отслеживаете ${user?._count.userWallets || 0} / ${planWallets[plan]} кошельков

Нажмите кнопку Обновить план, чтобы открыть больше слотов и сохранить отслеживаемые кошельки!

Примечание для бесплатного плана:
Чтобы обеспечить стабильную работу для всех, бесплатные кошельки могут периодически очищаться. Рекомендуем обновить план, чтобы сохранить все отслеживаемые кошельки!`

    return messageText
  }

  static startMessageGroup = `
🐱 Bot | Отслеживание кошельков

Получайте уведомления в реальном времени по любому добавленному кошельку!

Чтобы использовать этого бота в группе, нужна подписка <b>PRO</b> или <b>WHALE</b>

<b>Доступные команды:</b>
- /add Добавить новый кошелек
- /delete Удалить кошелек
- /manage Просмотреть все кошельки
`

  static planUpgradedMessage(plan: SubscriptionPlan, subscriptionEnd: string): string {
    const planWallets: { [key: string]: number } = {
      HOBBY: MAX_HOBBY_WALLETS,
      PRO: MAX_PRO_WALLETS,
      WHALE: MAX_WHALE_WALLETS,
    }

    const planWallet = planWallets[plan]

    const messageText = `
😸 Успех! Ваш план обновлён до <b>${plan}</b>.
Подписка продлится до ${subscriptionEnd}

Теперь вы можете отслеживать до <b>${planWallet}</b> кошельков одновременно!
`

    return messageText
  }

  static insufficientBalanceMessage: string = `
😿 Упс, похоже, недостаточно средств для выполнения этой транзакции.

Попробуйте пополнить <b>SOL</b> на личный кошелек бота 😺
`

  static userAlreadyPaidMessage(action: 'CODE' | 'PLAN'): string {
    const messageText = `
🤝 Вы уже приобрели этот ${action.toLowerCase()}
`

    return messageText
  }

  static walletLimitMessageError(walletName: string | undefined, walletAddress: string, planWallets: number): string {
    const messageText = `
😾 Не удалось добавить кошелек: <code>${walletName ? walletName : walletAddress}</code>,

Достигнут лимит кошельков: <b>${planWallets}</b>

Вы можете обновить <b>план</b>, чтобы добавить больше кошельков 💎
`

    return messageText
  }

  static generalMessageError: string = `
😿 Упс! Похоже, произошла ошибка при обработке транзакции.

Возможно, на кошельке недостаточно средств или не хватает на комиссию.

Попробуйте пополнить <b>SOL</b> на личный кошелек бота 😺
`

  static botWalletError: string = `
😿 Упс! Похоже, этот кошелек отправляет слишком много транзакций. Введите другой кошелек или попробуйте позже.
`

  static groupsMessage(userGroups: UserGroup[]) {
    const groupsContent =
      userGroups.length === 0
        ? `
<i>У вас пока нет групп.</i>
`
        : userGroups
            .map(
              (group, i) => `
✅ Название группы: <b>${group.name}</b>
🔗 ID группы: <code>${group.id}</code>

`,
            )
            .join('\n\n')

    const messageText = `
Теперь вы можете использовать <b>Bot</b> в любых групповых чатах!

Ваши группы: (${userGroups.length} / ${MAX_USER_GROUPS})
${groupsContent}
Узнайте, как добавить <b>Bot</b> в групповой чат в разделе <b>Помощь</b>
`
    return messageText
  }

  static groupChatNotStarted = `
🚫 Нельзя менять настройки бота в этой группе

Бот не инициализирован. Отправьте /start
`

  static groupChatNotActivated = `
🚫 Нельзя менять настройки бота в этой группе

Бот не активирован. Отправьте /activate
`

  static userNotAuthorizedInGroup = `
🚫 Нельзя менять настройки бота в этой группе

у вас нет прав для выполнения этого действия.
`

  static deleteGroupMessage = `
Чтобы <b>удалить</b> группу из вашего списка, просто отправьте <u>ID группы</u>, которую хотите удалить.
`

  static groupDeletedMessage = `
Эта группа удалена из вашего списка!
`
  static failedToDeleteGroupMessage = `
Не удалось удалить группу, убедитесь, что вы указали корректный <b>ID группы</b>
`
}
