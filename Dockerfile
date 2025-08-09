# Используем официальный Node.js образ
FROM node:22.13.0

# Устанавливаем pnpm
RUN npm install -g pnpm

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package.json, pnpm-lock.yaml и папку prisma перед установкой зависимостей
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

RUN pnpm -v

# Выполняем установку зависимостей
RUN pnpm install

# Копируем оставшиеся файлы проекта
COPY . .

# Открываем порт 3001
EXPOSE 3001

# Запускаем приложение
CMD ["pnpm", "start"]
