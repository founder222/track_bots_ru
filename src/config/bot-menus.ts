import { InlineKeyboardMarkup } from 'node-telegram-bot-api'
import { HOBBY_PLAN_FEE, PRO_PLAN_FEE, WHALE_PLAN_FEE } from '../constants/pricing'
import { HandiCatStatus } from '@prisma/client'
import { text } from 'stream/consumers'

export const START_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    // [{ text: '🌟 Buy Limited-Time Offer', callback_data: 'buy_promotion' }],
    [
      { text: 'Добавить', callback_data: 'add' },
      { text: 'Управлять', callback_data: 'manage' },
    ],
    [
      { text: 'Мой кошелек', callback_data: 'my_wallet' },
      { text: 'Донат', callback_data: 'donate' },
      { text: 'Настройки', callback_data: 'settings' },
    ],
    [
      { text: 'Группы', callback_data: 'groups' },
      { text: 'Помощь', callback_data: 'help' },
    ],
    [{ text: 'Обновить план', callback_data: 'upgrade' }],
  ],
}

export const SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [[{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }]],
}

export const createTxSubMenu = (tokenSymbol: string, tokenMint: string) => {
  const txSubMenu: InlineKeyboardMarkup = {
    inline_keyboard: [
      [
        {
          text: `🐴 Купить на Trojan: ${tokenSymbol}`,
          url: `https://t.me/solana_trojanbot?start=r-handicatbt-${tokenMint}`,
        },
      ],
      [
        { text: `🐶 BonkBot: ${tokenSymbol}`, url: `https://t.me/bonkbot_bot?start=ref_3au54_ca_${tokenMint}` },
        {
          text: `🐸 PepeBoost: ${tokenSymbol}`,
          url: `https://t.me/pepeboost_sol_bot?start=ref_03pbvu_ca_${tokenMint}`,
        },
      ],
      [
        {
          text: `🦖 GMGN: ${tokenSymbol}`,
          url: `https://t.me/GMGN_sol_bot?start=i_kxPdcLKf_c_${tokenMint}`,
        },
      ],
    ],
  }

  return txSubMenu
}

export const MANAGE_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      { text: 'Добавить', callback_data: 'add' },
      { text: '🗑️ Удалить', callback_data: 'delete' },
    ],

    [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
  ],
}

export const UPGRADE_PLAN_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: `КУПИТЬ HOBBY ${HOBBY_PLAN_FEE / 1e9} SOL/мес`,
        callback_data: 'upgrade_hobby',
      },
    ],
    [
      {
        text: `КУПИТЬ PRO ${PRO_PLAN_FEE / 1e9} SOL/мес`,
        callback_data: 'upgrade_pro',
      },
    ],
    [
      {
        text: `КУПИТЬ WHALE ${WHALE_PLAN_FEE / 1e9} SOL/мес`,
        callback_data: 'upgrade_whale',
      },
    ],

    [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
  ],
}

export const DONATE_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: `❤️ ${0.1} SOL`, callback_data: 'donate_action_0.1' }],
    [{ text: `✨ ${0.5} SOL`, callback_data: 'donate_action_0.5' }],
    [{ text: `💪 ${1.0} SOL`, callback_data: 'donate_action_1.0' }],
    [{ text: `🗿 ${5.0} SOL`, callback_data: 'donate_action_5.0' }],
    [{ text: `🔥 ${10.0} SOL`, callback_data: 'donate_action_10.0' }],
    [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
  ],
}

export const SUGGEST_UPGRADE_SUBMENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: 'Обновить план', callback_data: 'upgrade' }],
    [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
  ],
}

export const INSUFFICIENT_BALANCE_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [{ text: '😺 Кошелек бота', callback_data: 'my_wallet' }],
    [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
  ],
}

export const USER_SETTINGS_MENU = (botStatus: HandiCatStatus): InlineKeyboardMarkup => {
  return {
    inline_keyboard: [
      [
        {
          text: `${botStatus === 'ACTIVE' ? '⏸️ Пауза бота' : '▶️ Возобновить бота'}`,
          callback_data: 'pause-resume-bot',
        },
      ],
      [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
    ],
  }
}

export const USER_WALLET_SUB_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: '🔑 Показать приватный ключ',
        callback_data: 'show_private_key',
      },
    ],
    [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
  ],
}

export const GROUPS_MENU: InlineKeyboardMarkup = {
  inline_keyboard: [
    [
      {
        text: '🗑️ Удалить группу',
        callback_data: 'delete_group',
      },
    ],
    [{ text: '🔙 Назад', callback_data: 'back_to_main_menu' }],
  ],
}
