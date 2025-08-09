import { exec } from 'child_process';
import dotenv from 'dotenv'

dotenv.config()

// Получаем список токенов ботов из .env
const botTokens = process.env.BOT_TOKENS?.split(',');

if (!botTokens || botTokens.length === 0) {
  console.error('Не указаны токены ботов в .env');
  process.exit(1);
}

// Функция для запуска бота с конкретным токеном
const startBot = (token: string) => {
  const command = `tsc && node ./dist/src/main.js ${token}`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Ошибка при запуске бота с токеном ${token}:`, error);
      return;
    }
    if (stderr) {
      console.error(`Ошибка в процессе выполнения: ${stderr}`);
      return;
    }
    console.log(`Бот с токеном ${token} запущен. Вывод:\n`, stdout);
  });
};

// Параллельно запускаем всех ботов
botTokens.forEach(token => startBot(token));
