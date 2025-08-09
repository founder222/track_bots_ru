import { MAX_FREE_WALLETS } from '../../constants/pricing'
import { WalletDetails } from '../../lib/wallet-details'
import { UserWallet } from '../../types/prisma-types'

export class ManageMessages {
  static manageMessage(userWallets: UserWallet[], walletsAmt: number) {
    const messageText = `
<b>Ваши кошельки: ${userWallets.length} / ${walletsAmt}</b>

✅ - Кошелек активен
⏳ - Кошелек отправлял слишком много транзакций и приостановлен
🛑 - Кошелек заблокирован

${userWallets
  .map((wallet, i) => {
    const icon =
      wallet.status === 'ACTIVE'
        ? '✅'
        : wallet.status === 'USER_PAUSED'
          ? '⏸️'
          : wallet.status === 'SPAM_PAUSED'
            ? '⏳'
            : wallet.status === 'BANNED'
              ? '🛑'
              : ''
    return `${icon} ${i + 1}. <code>${wallet.wallet.address}</code> ${wallet.name ? `(${wallet.name})` : ''}`
  })
  .join('\n\n')}
`

    return messageText
  }
}
