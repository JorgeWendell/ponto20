#!/bin/bash

# Script para configurar Nginx como proxy reverso para Ponto20
# Execute este script após o deploy.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

APP_NAME="ponto20"
DOMAIN="seu-dominio.com"  # Altere para seu domínio ou IP
PORT="3000"

echo -e "${GREEN}=== Configuração do Nginx para Ponto20 ===${NC}\n"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

# Instalar Nginx (se não estiver instalado)
if ! command -v nginx >/dev/null 2>&1; then
    echo -e "${YELLOW}Instalando Nginx...${NC}"
    apt-get update -qq
    apt-get install -y nginx
else
    echo -e "${GREEN}Nginx já está instalado${NC}"
fi

# Criar configuração do Nginx
echo -e "${YELLOW}Criando configuração do Nginx...${NC}"
cat > /etc/nginx/sites-available/${APP_NAME} << EOF
server {
    listen 80;
    server_name ${DOMAIN};

    # Tamanho máximo de upload (para imagens faciais)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:${PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Logs
    access_log /var/log/nginx/${APP_NAME}-access.log;
    error_log /var/log/nginx/${APP_NAME}-error.log;
}
EOF

# Habilitar site
echo -e "${YELLOW}Habilitando site...${NC}"
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

# Remover configuração padrão se existir
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
echo -e "${YELLOW}Testando configuração do Nginx...${NC}"
nginx -t

# Recarregar Nginx
echo -e "${YELLOW}Recarregando Nginx...${NC}"
systemctl reload nginx

echo -e "\n${GREEN}=== Nginx configurado com sucesso! ===${NC}\n"
echo -e "${GREEN}Aplicação acessível em: http://${DOMAIN}${NC}"
echo -e "\n${YELLOW}IMPORTANTE:${NC}"
echo -e "  1. Altere '${DOMAIN}' no arquivo /etc/nginx/sites-available/${APP_NAME}"
echo -e "  2. Para usar HTTPS, configure certificado SSL com Let's Encrypt"
echo -e "  3. Reinicie o Nginx após alterações: systemctl restart nginx"
