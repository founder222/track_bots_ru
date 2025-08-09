import { User } from '@prisma/client'
import { UserBalances } from '../../lib/user-balances'

export class WalletMessages {
  private userBalances: UserBalances
  constructor() {
    this.userBalances = new UserBalances()
  }

  static addWalletMessage: string = `
🐱 Ок, просто отправьте адрес кошелька для отслеживания:

Также вы можете дать кошельку имя, указав его после адреса, или добавить несколько кошельков сразу, отправив каждый на новой строке, например:

walletAddress1 walletName1
walletAddress2 walletName2
`

  static deleteWalletMessage: string = `
Отправьте адрес кошелька, который хотите удалить 🗑️

Вы также можете удалить несколько кошельков сразу, если отправите каждый на новой строке, например:

walletAddress1
walletAddress2
`

  public async sendMyWalletMessage(
    wallet: Pick<User, 'personalWalletPrivKey' | 'personalWalletPubKey'>,
  ): Promise<string> {
    const solBalance = await this.userBalances.userPersonalSolBalance(wallet.personalWalletPubKey)

    const responseText = `
<b>Адрес вашего кошелька:</b>
<code>${wallet && wallet.personalWalletPubKey}</code>

<b>SOL:</b> ${solBalance ? solBalance / 1e9 : 0}

`

    return responseText
  }
}
