# chmod +x docker-clean.sh
# ./docker-clean.sh
# # puis se déconnecter/reconnecter
# Ce qu'il fait :

# Désinstalle Docker Desktop
# Supprime docker-compose v1
# Installe Docker Engine + Compose v2
# Ajoute ton user au groupe docker
# Nettoie le credsStore: desktop dans ~/.docker/config.json


#!/bin/bash
set -e

echo "=== Migration Docker Desktop → Docker Engine ==="

# 1. Désinstaller Docker Desktop
echo "[1/5] Désinstallation de Docker Desktop..."
sudo apt remove -y docker-desktop 2>/dev/null || echo "  Docker Desktop non installé, skip."

# 2. Désinstaller docker-compose v1 (Python)
echo "[2/5] Suppression de docker-compose v1..."
sudo apt remove -y docker-compose 2>/dev/null || echo "  docker-compose v1 non installé, skip."

# 3. Installer Docker Engine + Compose v2
echo "[3/5] Installation de Docker Engine..."
sudo apt update -q
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Ajouter l'utilisateur au groupe docker
echo "[4/5] Ajout de $USER au groupe docker..."
sudo usermod -aG docker "$USER"

# 5. Nettoyer ~/.docker/config.json (supprimer credsStore: desktop)
echo "[5/5] Nettoyage de ~/.docker/config.json..."
CONFIG="$HOME/.docker/config.json"
if [ -f "$CONFIG" ] && grep -q '"credsStore"' "$CONFIG"; then
    python3 -c "
import json, sys
with open('$CONFIG') as f:
    cfg = json.load(f)
cfg.pop('credsStore', None)
with open('$CONFIG', 'w') as f:
    json.dump(cfg, f, indent=2)
print('  credsStore supprimé.')
"
else
    echo "  Rien à nettoyer."
fi

echo ""
echo "=== Done ==="
echo "Déconnecte-toi et reconnecte-toi (ou redémarre) pour que le groupe docker soit actif."
echo "Utilise ensuite : docker compose up --build  (espace, pas tiret)"
