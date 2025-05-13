FROM node:20

WORKDIR /app

# Copier uniquement package.json et package-lock.json pour installer les dépendances
COPY package*.json ./

RUN npm install

# Copier tous les fichiers du projet
COPY . .

# Exécuter la build TypeScript
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]
