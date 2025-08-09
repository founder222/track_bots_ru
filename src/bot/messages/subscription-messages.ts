import { format, formatDistanceToNow } from 'date-fns'
import { BOT_USERNAME } from '../../constants/handi-cat'
import {
  HOBBY_PLAN_FEE,
  MAX_HOBBY_WALLETS,
  MAX_PRO_WALLETS,
  MAX_USER_GROUPS,
  MAX_WHALE_WALLETS,
  PRO_PLAN_FEE,
  WHALE_PLAN_FEE,
} from '../../constants/pricing'
import { UserWithSubscriptionPlan } from '../../types/prisma-types'

export class SubscriptionMessages {
  constructor() {}

  static upgradeProMessage(user: UserWithSubscriptionPlan | null): string {
    const subscriptionExists = user?.userSubscription ? true : false

    const subscriptionPlan = subscriptionExists ? user?.userSubscription?.plan : 'FREE'

    const subscriptionEnd = user?.userSubscription?.subscriptionCurrentPeriodEnd
    const formattedDate = subscriptionEnd
      ? `${formatDistanceToNow(subscriptionEnd, { addSuffix: true })} (${format(subscriptionEnd, 'MMM d, yyyy')})`
      : 'N/A'

    const messageText = `
Текущий план: ${subscriptionPlan === 'FREE' ? `😿 <b>${subscriptionPlan}</b>` : `😺 <b>${subscriptionPlan}</b>`}
${subscriptionPlan !== 'FREE' ? `<b>Ваша подписка продлится <u>${formattedDate}</u></b>\n` : ''}
<b>Обновив план, вы сможете:</b>
✅ Отслеживать больше кошельков и расширить возможности мониторинга.
✅ Избежать очистки кошельков.
✅ Получить доступ к <b>ПРЕМИУМ</b> функциям.

<b>Выберите план:</b>
<b>HOBBY</b>: ${MAX_HOBBY_WALLETS} кошельков - ${HOBBY_PLAN_FEE / 1e9} <b>SOL</b> / месяц
<b>PRO</b>: ${MAX_PRO_WALLETS} кошельков - ${PRO_PLAN_FEE / 1e9} <b>SOL</b> / месяц
<b>WHALE</b>: ${MAX_WHALE_WALLETS} кошельков - ${WHALE_PLAN_FEE / 1e9} <b>SOL</b> / месяц

<b>Как обновить план?</b>
1. Переведите необходимое количество <b>SOL</b> на ваш кошелек <b>Bot</b>: <code>${user?.personalWalletPubKey}</code>
2. Затем выберите один из планов ниже!
`

    return messageText
  }

  static groupChatNotPro = `
🚫 Добавить Bot в группу можно только при наличии подписки <b>PRO</b> или <b>WHALE</b>.

Вы можете обновить план напрямую через нашего официального бота:

@${BOT_USERNAME}
`

  static userUpgradeGroups = `
Чтобы добавить <b>Bot</b> в группы, нужна подписка <b>PRO</b> или <b>WHALE</b>

<b>Нажмите кнопку ниже, чтобы обновить подписку и получить доступ к эксклюзивным функциям!</b>
`

  static userGroupsLimit = `
Вы достигли максимального количества групп, которые можете добавить <b>(${MAX_USER_GROUPS}).</b>
Чтобы добавить новую группу, удалите одну из существующих.
`
}
