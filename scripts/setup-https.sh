#!/bin/bash

# Script para configurar HTTPS com Let's Encrypt (Certbot) para Ponto20
# Execute este script após o deploy.sh ter sido executado com sucesso

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis de configuração
APP_NAME="ponto20"
DOMAIN="ponto.adelbr.tech"
EMAIL="jorge.wendell@outlook.com"
PORT="3000"

echo -e "${GREEN}=== Configuração de HTTPS para Ponto20 ===${NC}\n"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

# Verificar se o Nginx está instalado
if ! command -v nginx >/dev/null 2>&1; then
    echo -e "${RED}Nginx não está instalado. Execute o deploy.sh primeiro.${NC}"
    exit 1
fi

# Verificar se o domínio está configurado no Nginx
if [ ! -f "/etc/nginx/sites-available/${APP_NAME}" ]; then
    echo -e "${RED}Configuração do Nginx não encontrada. Execute o deploy.sh primeiro.${NC}"
    exit 1
fi

# Atualizar sistema
echo -e "${YELLOW}[1/6] Atualizando sistema...${NC}"
apt-get update -qq

# Instalar Certbot e plugin do Nginx
echo -e "${YELLOW}[2/6] Instalando Certbot e plugin do Nginx...${NC}"
apt-get install -y certbot python3-certbot-nginx

# Verificar se o Certbot foi instalado
if ! command -v certbot >/dev/null 2>&1; then
    echo -e "${RED}Erro ao instalar Certbot${NC}"
    exit 1
fi

echo -e "${GREEN}Certbot instalado com sucesso${NC}"

# Verificar se o domínio está acessível
echo -e "${YELLOW}[3/6] Verificando acesso ao domínio ${DOMAIN}...${NC}"
if ! curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}" | grep -q "200\|301\|302"; then
    echo -e "${YELLOW}AVISO: O domínio ${DOMAIN} pode não estar acessível publicamente${NC}"
    echo -e "${YELLOW}Certifique-se de que:${NC}"
    echo -e "  1. O DNS está configurado corretamente"
    echo -e "  2. A porta 80 está aberta no firewall"
    echo -e "  3. O Nginx está rodando e respondendo"
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

# Obter certificado SSL
echo -e "${YELLOW}[4/6] Obtendo certificado SSL do Let's Encrypt...${NC}"
echo -e "${YELLOW}Isso pode levar alguns minutos...${NC}"

# Executar Certbot em modo não-interativo
certbot --nginx \
    --non-interactive \
    --agree-tos \
    --email "${EMAIL}" \
    --domains "${DOMAIN}" \
    --redirect \
    || {
    echo -e "${RED}Erro ao obter certificado SSL${NC}"
    echo -e "${YELLOW}Tentando modo interativo...${NC}"
    certbot --nginx --email "${EMAIL}" --domains "${DOMAIN}" --redirect
}

# Verificar se o certificado foi obtido
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo -e "${GREEN}Certificado SSL obtido com sucesso!${NC}"
else
    echo -e "${RED}Erro: Certificado SSL não foi obtido${NC}"
    exit 1
fi

# Atualizar configuração do Nginx para usar HTTPS
echo -e "${YELLOW}[5/6] Atualizando configuração do Nginx...${NC}"

# Verificar se o Certbot já atualizou a configuração
if grep -q "ssl_certificate" "/etc/nginx/sites-available/${APP_NAME}"; then
    echo -e "${GREEN}Configuração SSL já aplicada pelo Certbot${NC}"
else
    echo -e "${YELLOW}Certbot não atualizou automaticamente. Atualizando manualmente...${NC}"
    
    # Criar backup da configuração atual
    cp "/etc/nginx/sites-available/${APP_NAME}" "/etc/nginx/sites-available/${APP_NAME}.backup"
    
    # Criar nova configuração com HTTPS
    cat > "/etc/nginx/sites-available/${APP_NAME}" << EOF
# Redirecionar HTTP para HTTPS
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

# Servidor HTTPS
server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # Certificados SSL
    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    
    # Configurações SSL recomendadas
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

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
fi

# Testar configuração do Nginx
echo -e "${YELLOW}Testando configuração do Nginx...${NC}"
nginx -t

# Recarregar Nginx
echo -e "${YELLOW}Recarregando Nginx...${NC}"
systemctl reload nginx

# Configurar renovação automática
echo -e "${YELLOW}[6/6] Configurando renovação automática do certificado...${NC}"

# Verificar se o timer do Certbot está ativo
if systemctl is-active --quiet certbot.timer; then
    echo -e "${GREEN}Timer de renovação automática já está ativo${NC}"
else
    systemctl enable certbot.timer
    systemctl start certbot.timer
    echo -e "${GREEN}Timer de renovação automática configurado${NC}"
fi

# Testar renovação (dry-run)
echo -e "${YELLOW}Testando renovação automática (dry-run)...${NC}"
certbot renew --dry-run

echo -e "\n${GREEN}=== HTTPS configurado com sucesso! ===${NC}\n"
echo -e "${GREEN}Aplicação acessível em: https://${DOMAIN}${NC}"
echo -e "${GREEN}HTTP será redirecionado automaticamente para HTTPS${NC}"
echo -e "\n${YELLOW}Informações importantes:${NC}"
echo -e "  - Certificado SSL válido por 90 dias"
echo -e "  - Renovação automática configurada"
echo -e "  - Email de notificação: ${EMAIL}"
echo -e "  - Certificado em: /etc/letsencrypt/live/${DOMAIN}/"
echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "  - Ver status do certificado: certbot certificates"
echo -e "  - Renovar manualmente: certbot renew"
echo -e "  - Testar renovação: certbot renew --dry-run"
echo -e "  - Ver logs do Certbot: journalctl -u certbot.timer"
echo -e "\n${YELLOW}Próximos passos:${NC}"
echo -e "  1. Atualize as variáveis de ambiente no .env:"
echo -e "     - BETTER_AUTH_URL=https://${DOMAIN}"
echo -e "     - NEXT_PUBLIC_BASE_URL=https://${DOMAIN}"
echo -e "  2. Reinicie a aplicação: pm2 restart ${APP_NAME}"
