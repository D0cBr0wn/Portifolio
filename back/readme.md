Projet Odyssey of One
Ce projet est une application full-stack composée d'un frontend en Vue.js et d'un backend en Node.js avec une base de données PostgreSQL. Le projet utilise Docker pour gérer l'environnement du backend et de la base de données, tout en faisant tourner le frontend localement pour profiter du hot reload.

Architecture du projet
Frontend : Le frontend est une application Vue.js, qui tourne localement sur le port 5173.

Backend : Le backend est une API Node.js qui tourne dans un conteneur Docker et écoute sur le port 3000.

Base de données : PostgreSQL tourne également dans un conteneur Docker et est accessible via le conteneur backend.

Prérequis
Avant de commencer, assurez-vous d'avoir Docker et Docker Compose installés sur votre machine. Vous pouvez les installer depuis les liens ci-dessous :

Installer Docker

Installer Docker Compose

Installation et Lancement

1. Cloner le projet
   Clonez ce projet depuis le repository :

git clone <URL_du_repository>
cd Odyssey_of_One 2. Lancer les services avec Docker
Le projet utilise Docker Compose pour simplifier la gestion des services backend et base de données.

2.1. Backend et Base de données
Les services API (Node.js) et PostgreSQL sont définis dans le fichier docker-compose.yml. Pour démarrer les services backend et la base de données avec Docker, utilisez la commande suivante :

docker-compose up --build
Cette commande fait plusieurs choses :

Construire et démarrer le backend Node.js dans un conteneur.

Construire et démarrer une instance PostgreSQL dans un conteneur.

Exposer le backend sur le port 3000 et la base de données PostgreSQL sur le port 5432.

2.2. Frontend
Le frontend ne tourne pas dans Docker mais doit être lancé localement sur votre machine.

Naviguez dans le dossier du frontend (en supposant qu'il se trouve dans ../front/ooo à partir du dossier backend) :

cd ../front/ooo
Installez les dépendances du frontend :

npm install
Lancez le serveur de développement Vite.js (sur le port 5173) :

npm run dev
Le frontend sera accessible à l'adresse suivante dans votre navigateur :

arduino
Copier
Modifier
http://localhost:5173 3. Variables d'environnement
Le backend utilise les variables suivantes pour se connecter à la base de données :

DATABASE_URL : URL de connexion à la base de données PostgreSQL. Par défaut, elle est configurée pour se connecter au service postgres qui tourne dans Docker.

Exemple de configuration dans le fichier .env :

env
Copier
Modifier
DATABASE_URL=postgres://ooodbuser:password@postgres:5432/ooo_db 4. Développement
4.1. Hot Reload (Frontend)
Les modifications que vous apportez au frontend seront automatiquement prises en compte grâce à Vite.js, qui offre un hot reload.

Vous devez toujours faire tourner le frontend localement pour bénéficier du hot reload.

4.2. Backend
Les modifications côté backend (Node.js) seront prises en compte automatiquement grâce à Nodemon, qui surveille les fichiers de votre projet et redémarre le serveur à chaque modification.

Prisma se charge de la gestion des migrations de la base de données.

4.3. Lancer les migrations avec Prisma
Si vous avez effectué des modifications dans votre schéma Prisma, vous pouvez exécuter les migrations suivantes :

docker-compose exec api npx prisma migrate dev
Cela appliquera les migrations sur la base de données PostgreSQL.

Docker Compose
Structure du fichier docker-compose.yml
Voici la structure du fichier docker-compose.yml qui définit les services backend et base de données :

yaml
Copier
Modifier
version: '3'
services:
api:
build: .
ports: - '3000:3000'
volumes: - .:/app - /app/node_modules
depends_on: - postgres
environment:
DATABASE_URL: postgres://ooodbuser:password@postgres:5432/ooo_db
networks: - prisma-network
command: npm run dev
postgres:
image: postgres:15
restart: always
environment: - POSTGRES_DB=ooo_db - POSTGRES_USER=ooodbuser - POSTGRES_PASSWORD=password
ports: - '5432:5432'
networks: - prisma-network
healthcheck:
test: ['CMD-SHELL', 'pg_isready -U ooodbuser -d ooo_db']
interval: 5s
timeout: 2s
retries: 20
volumes: - postgres_data:/var/lib/postgresql/data
command: postgres -c listen_addresses='\*'
frontend:
build:
context: ../front/ooo
ports: - '5173:5173'
volumes: - ../front/ooo:/app - /app/node_modules
working_dir: /app
command: npm run dev -- --host

networks:
prisma-network:
volumes:
postgres_data:
Conclusion
Avec cette configuration, vous bénéficiez d'un environnement de développement où :

Le backend tourne dans un conteneur Docker.

La base de données PostgreSQL tourne dans un conteneur Docker.

Le frontend est développé localement et profite du hot reload de Vite.js.

Cette architecture permet de développer et tester l'ensemble du projet de manière isolée et reproductible, tout en gardant un flux de développement fluide pour le frontend.
