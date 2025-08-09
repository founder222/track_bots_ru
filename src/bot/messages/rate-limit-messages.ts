export class RateLimitMessages {
  constructor() {}

  static walletWasPaused(walletAddress: string): string {
    const messageText = `
Ваш кошелек <code>${walletAddress}</code> отправляет слишком много транзакций в секунду, он будет приостановлен на 2 часа
`

    return messageText
  }

  static walletWasResumed(walletAddress: string): string {
    const messageText = `
Ваш кошелек <code>${walletAddress}</code> был возобновлён после 2 часов паузы!
        `

    return messageText
  }

  static walletWasBanned(walletAddress: string): string {
    const messageText = `
Ваш кошелек <code>${walletAddress}</code> был заблокирован и больше не отслеживается из-за частого спама транзакциями
`

    return messageText
  }
}
