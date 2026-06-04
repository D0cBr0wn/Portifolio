FROM node:20

WORKDIR /app

# 1. Installer les dépendances (layer caché tant que package.json ne change pas)
COPY package*.json ./
RUN npm install --ignore-scripts

# 2. Copier le schéma Prisma et générer le client
COPY prisma/ ./prisma/
RUN npx prisma generate

# 3. Copier uniquement les sources et la config TS
COPY src/ ./src/
COPY tsconfig.json ./

# 4. Compiler TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
