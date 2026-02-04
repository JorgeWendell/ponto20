#!/bin/bash

# Script de Deploy para Ponto20 - Ubuntu Server 24.04
# Este script configura e faz o deploy da aplicação Ponto20

set -e  # Para o script se houver erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis de configuração
APP_NAME="ponto20"
APP_DIR="/var/www/ponto20"
REPO_URL="https://github.com/JorgeWendell/ponto20.git"
NODE_VERSION="20"  # Versão do Node.js recomendada
PORT="3000"
DB_NAME="ponto20"
DB_USER="postgres"
DB_PASSWORD="adel1234"
# DOMAIN pode ser um IP ou domínio. Se vazio, será detectado automaticamente
DOMAIN="ponto.adelbr.tech"  # Domínio da aplicação

echo -e "${GREEN}=== Script de Deploy Ponto20 ===${NC}\n"

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

# Atualizar sistema
echo -e "${YELLOW}[1/17] Atualizando sistema...${NC}"
apt-get update -qq

# Instalar dependências básicas
echo -e "${YELLOW}[2/17] Instalando dependências básicas...${NC}"
apt-get install -y curl wget git build-essential

# Instalar PostgreSQL (se não estiver instalado)
if ! command_exists psql; then
    echo -e "${YELLOW}[3/17] Instalando PostgreSQL...${NC}"
    apt-get install -y postgresql postgresql-contrib
    
    # Iniciar e habilitar PostgreSQL
    systemctl start postgresql
    systemctl enable postgresql
    
    echo -e "${GREEN}PostgreSQL instalado e iniciado${NC}"
else
    echo -e "${GREEN}[3/17] PostgreSQL já está instalado${NC}"
    systemctl start postgresql || true
fi

# Configurar senha do usuário postgres
echo -e "${YELLOW}[4/17] Configurando PostgreSQL...${NC}"
sudo -u postgres psql -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASSWORD}';" 2>/dev/null || true

# Criar banco de dados se não existir
echo -e "${YELLOW}[5/17] Criando banco de dados ${DB_NAME}...${NC}"
DB_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "")
if [ "$DB_EXISTS" != "1" ]; then
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null
    echo -e "${GREEN}Banco de dados ${DB_NAME} criado${NC}"
else
    echo -e "${GREEN}Banco de dados ${DB_NAME} já existe${NC}"
fi

# Configurar pg_hba.conf para aceitar conexões locais com senha
echo -e "${YELLOW}[6/17] Configurando acesso ao PostgreSQL...${NC}"
PG_VERSION=$(ls /etc/postgresql/ 2>/dev/null | head -n 1)
if [ -n "$PG_VERSION" ]; then
    PG_HBA="/etc/postgresql/${PG_VERSION}/main/pg_hba.conf"
    PG_CONF="/etc/postgresql/${PG_VERSION}/main/postgresql.conf"
    
    if [ -f "$PG_HBA" ]; then
        # Backup do arquivo original
        cp "$PG_HBA" "${PG_HBA}.backup"
        
        # Garantir que conexões IPv4 locais usem md5
        if ! grep -q "^host.*all.*all.*127.0.0.1/32.*md5" "$PG_HBA"; then
            # Substituir ou adicionar linha para IPv4 local
            sed -i 's/^host.*all.*all.*127.0.0.1\/32.*/host    all             all             127.0.0.1\/32            md5/' "$PG_HBA"
            if ! grep -q "^host.*all.*all.*127.0.0.1/32.*md5" "$PG_HBA"; then
                echo "host    all             all             127.0.0.1/32            md5" >> "$PG_HBA"
            fi
        fi
        
        # Garantir que conexões locais via socket usem md5
        if ! grep -q "^local.*all.*postgres.*md5" "$PG_HBA"; then
            sed -i 's/^local.*all.*postgres.*/local   all             postgres                                md5/' "$PG_HBA"
            if ! grep -q "^local.*all.*postgres.*md5" "$PG_HBA"; then
                echo "local   all             postgres                                md5" >> "$PG_HBA"
            fi
        fi
        
        # Garantir que listen_addresses está configurado
        if [ -f "$PG_CONF" ]; then
            sed -i "s/^#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" "$PG_CONF"
            if ! grep -q "^listen_addresses = 'localhost'" "$PG_CONF"; then
                echo "listen_addresses = 'localhost'" >> "$PG_CONF"
            fi
        fi
        
        systemctl reload postgresql
        echo -e "${GREEN}Configuração de acesso atualizada${NC}"
    fi
else
    echo -e "${YELLOW}AVISO: Não foi possível encontrar configuração do PostgreSQL${NC}"
fi

# Instalar Node.js via NodeSource (se não estiver instalado)
if ! command_exists node; then
    echo -e "${YELLOW}[7/17] Instalando Node.js ${NODE_VERSION}...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
else
    echo -e "${GREEN}[7/17] Node.js já está instalado: $(node --version)${NC}"
fi

# Verificar versões instaladas
echo -e "${GREEN}Node.js: $(node --version)${NC}"
echo -e "${GREEN}npm: $(npm --version)${NC}"

# Atualizar npm para a última versão
echo -e "${YELLOW}[8/17] Atualizando npm para a última versão...${NC}"
npm install -g npm@latest
echo -e "${GREEN}npm atualizado: $(npm --version)${NC}"

# Instalar PM2 globalmente (se não estiver instalado)
if ! command_exists pm2; then
    echo -e "${YELLOW}[9/17] Instalando PM2...${NC}"
    npm install -g pm2
else
    echo -e "${GREEN}[9/17] PM2 já está instalado${NC}"
fi

# Criar diretório da aplicação
echo -e "${YELLOW}[10/17] Criando diretório da aplicação...${NC}"
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clonar ou atualizar repositório
if [ -d ".git" ]; then
    echo -e "${YELLOW}[11/17] Atualizando repositório...${NC}"
    git pull origin main || git pull origin master
else
    echo -e "${YELLOW}[11/17] Clonando repositório...${NC}"
    git clone "$REPO_URL" .
fi

# Instalar dependências
echo -e "${YELLOW}[12/17] Instalando dependências npm...${NC}"
npm ci --production=false

# Criar arquivo .env
echo -e "${YELLOW}[13/17] Configurando arquivo .env...${NC}"

# Determinar URL base (usar DOMAIN se não for localhost ou IP, senão usar localhost:3000)
if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ] && ! echo "$DOMAIN" | grep -qE '^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$'; then
    BASE_URL="http://${DOMAIN}"
else
    BASE_URL="http://localhost:3000"
fi

cat > .env << EOF
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}"

FACE_RECOGNITION_API_URL=http://localhost:8000

BETTER_AUTH_SECRET="3L8AKwGUZa+VMTQc472p2FqT0UTyfNG8aBgAH+LfSMw="

BETTER_AUTH_URL=${BASE_URL}


RESEND_API_KEY=re_6TnyNasZ_Lo7uLBM4q3M3nqredToRUFSK
RESEND_FROM_EMAIL=info@adelbr.tech
SUPPORT_EMAIL=info@adelbr.tech
NEXT_PUBLIC_BASE_URL=${BASE_URL}
EOF

echo -e "${GREEN}Arquivo .env criado com sucesso${NC}"
echo -e "${YELLOW}IMPORTANTE: Verifique e ajuste as variáveis de ambiente conforme necessário${NC}"

# Executar migrações do banco de dados
echo -e "${YELLOW}[14/17] Executando migrações do banco de dados...${NC}"
npx drizzle-kit push || echo -e "${YELLOW}AVISO: Migrações podem ter falhado. Verifique manualmente.${NC}"

# Executar build
echo -e "${YELLOW}[15/17] Executando build da aplicação...${NC}"
npm run build

# Configurar PM2
echo -e "${YELLOW}[16/17] Configurando PM2...${NC}"

# Parar instância anterior se existir
pm2 delete "$APP_NAME" 2>/dev/null || true

# Iniciar aplicação com PM2
pm2 start npm --name "$APP_NAME" -- start
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup systemd -u root --hp /root

# Configurar Nginx como proxy reverso
echo -e "${YELLOW}[17/17] Configurando Nginx como proxy reverso...${NC}"

# Detectar IP do servidor se DOMAIN não estiver definido
if [ -z "$DOMAIN" ]; then
    DOMAIN=$(hostname -I | awk '{print $1}')
    if [ -z "$DOMAIN" ]; then
        DOMAIN="localhost"
    fi
fi

# Instalar Nginx (se não estiver instalado)
if ! command_exists nginx; then
    echo -e "${YELLOW}Instalando Nginx...${NC}"
    apt-get install -y nginx
    systemctl enable nginx
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
echo -e "${YELLOW}Habilitando site no Nginx...${NC}"
ln -sf /etc/nginx/sites-available/${APP_NAME} /etc/nginx/sites-enabled/

# Remover configuração padrão se existir
rm -f /etc/nginx/sites-enabled/default

# Testar configuração
echo -e "${YELLOW}Testando configuração do Nginx...${NC}"
nginx -t

# Recarregar Nginx
echo -e "${YELLOW}Recarregando Nginx...${NC}"
systemctl reload nginx || systemctl restart nginx

echo -e "${GREEN}Nginx configurado com sucesso${NC}"

echo -e "\n${GREEN}=== Deploy concluído com sucesso! ===${NC}\n"
echo -e "${GREEN}Aplicação rodando em: http://localhost:${PORT}${NC}"
echo -e "${GREEN}Aplicação acessível via Nginx em: http://${DOMAIN}${NC}"
echo -e "${GREEN}Banco de dados: ${DB_NAME} configurado e migrado${NC}"
echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "  - Ver logs: pm2 logs ${APP_NAME}"
echo -e "  - Reiniciar: pm2 restart ${APP_NAME}"
echo -e "  - Parar: pm2 stop ${APP_NAME}"
echo -e "  - Status: pm2 status"
echo -e "  - Status PostgreSQL: systemctl status postgresql"
echo -e "  - Status Nginx: systemctl status nginx"
echo -e "\n${YELLOW}Informações do Banco de Dados:${NC}"
echo -e "  - Banco: ${DB_NAME}"
echo -e "  - Usuário: ${DB_USER}"
echo -e "  - Host: localhost:5432"
echo -e "\n${YELLOW}Informações do Nginx:${NC}"
echo -e "  - Configuração: /etc/nginx/sites-available/${APP_NAME}"
echo -e "  - Logs de acesso: /var/log/nginx/${APP_NAME}-access.log"
echo -e "  - Logs de erro: /var/log/nginx/${APP_NAME}-error.log"
echo -e "\n${YELLOW}Próximos passos (opcionais):${NC}"
echo -e "  1. Configure o serviço de reconhecimento facial na porta 8000"
echo -e "  2. Ajuste as variáveis de ambiente no arquivo .env se necessário"
echo -e "  3. Para usar HTTPS, configure certificado SSL com Let's Encrypt"
if [ "$DOMAIN" != "localhost" ] && [ "$DOMAIN" != "127.0.0.1" ]; then
    echo -e "  4. Se necessário, altere o server_name no arquivo /etc/nginx/sites-available/${APP_NAME}"
fi
