le back est sous docker desktop. demarrer avec
docker-compose --build

en cas de shitstorm :
docker-compose down --volumes --remove-orphans

le front est en local.
demarrer avec npm run dev

Mise à jour de la BDD
en trackant l'historique :
npx prisma migrate dev --name nom_de_la_migration

ou sans tracker l'historique :
npx prisma db push

puis mise à jour du client prisma :
npx prisma generate

reset la bdd :
Supprimer la migration qui merde dans le fichier puis :
npx prisma migrate reset
