# Dockerfile (dans le dossier /front)

FROM node:20

# Crée le dossier d'app
WORKDIR /app

# Copie les fichiers de dépendances en premier
COPY package*.json ./

# Installe les dépendances
RUN npm install

# Copie le reste du projet
COPY . .

# Expose le port Nuxt
EXPOSE 3000

# Commande de démarrage par défaut
CMD ["npm", "run", "dev"]
