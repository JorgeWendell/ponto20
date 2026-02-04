#!/bin/bash

# Script para configurar e iniciar o serviço de reconhecimento facial
# Execute este script no servidor de produção

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICE_DIR="/var/www/face-recognition-service"
SERVICE_PORT="8000"  # Porta que o ponto20 espera
REPO_URL="https://github.com/JorgeWendell/face-recognition-service.git"

echo -e "${GREEN}=== Configuração do Serviço de Reconhecimento Facial ===${NC}\n"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

# Verificar se o serviço já está instalado
if [ -d "$SERVICE_DIR" ]; then
    echo -e "${GREEN}Serviço encontrado em ${SERVICE_DIR}${NC}"
    cd "$SERVICE_DIR"
    
    # Verificar se está rodando com PM2
    if command -v pm2 >/dev/null 2>&1; then
        PM2_STATUS=$(pm2 list | grep -i "face-recognition" || echo "")
        if [ -n "$PM2_STATUS" ]; then
            echo -e "${YELLOW}Serviço encontrado no PM2${NC}"
            pm2 list | grep -i "face-recognition"
            echo -e "\n${YELLOW}Para reiniciar: pm2 restart face-recognition-service${NC}"
            echo -e "${YELLOW}Para ver logs: pm2 logs face-recognition-service${NC}"
            exit 0
        fi
    fi
    
    # Verificar se está rodando como systemd
    if systemctl is-active --quiet face-recognition.service 2>/dev/null; then
        echo -e "${GREEN}Serviço está rodando como systemd${NC}"
        systemctl status face-recognition.service
        exit 0
    fi
    
    echo -e "${YELLOW}Serviço instalado mas não está rodando${NC}"
else
    echo -e "${YELLOW}Serviço não encontrado. Instalando...${NC}"
    
    # Criar diretório
    mkdir -p "$SERVICE_DIR"
    cd "$SERVICE_DIR"
    
    # Clonar repositório
    if [ -d ".git" ]; then
        git pull origin main || git pull origin master
    else
        git clone "$REPO_URL" .
    fi
fi

# Verificar Python
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${YELLOW}Instalando Python 3...${NC}"
    apt-get update -qq
    apt-get install -y python3 python3-pip python3-venv
fi

# Verificar e instalar python3-venv específico da versão se necessário
PYTHON_VERSION=$(python3 --version | grep -oP '\d+\.\d+' | head -1)
if ! dpkg -l | grep -q "python${PYTHON_VERSION}-venv"; then
    echo -e "${YELLOW}Instalando python${PYTHON_VERSION}-venv...${NC}"
    apt-get update -qq
    apt-get install -y "python${PYTHON_VERSION}-venv" || apt-get install -y python3-venv
fi

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Criando ambiente virtual Python...${NC}"
    python3 -m venv venv
fi

# Ativar ambiente virtual e instalar dependências
echo -e "${YELLOW}Instalando dependências Python...${NC}"
source venv/bin/activate

# Tentar instalar dependências simples primeiro (OpenCV)
if [ -f "requirements-simple.txt" ]; then
    pip install --upgrade pip
    pip install -r requirements-simple.txt
    echo -e "${GREEN}Dependências instaladas (versão OpenCV)${NC}"
else
    echo -e "${YELLOW}Instalando dependências padrão...${NC}"
    pip install --upgrade pip
    pip install fastapi uvicorn python-dotenv pillow requests opencv-python numpy
fi

# Configurar .env se não existir
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Criando arquivo .env...${NC}"
    cat > .env << EOF
# Configurações do Nextcloud
NEXTCLOUD_WEBDAV_URL=http://192.168.15.10/remote.php/dav/files/Ponto
NEXTCLOUD_USER=
NEXTCLOUD_PASSWORD=

# Configurações do Serviço
API_HOST=0.0.0.0
API_PORT=${SERVICE_PORT}

# Threshold de similaridade facial (0.0 a 1.0)
FACE_MATCH_THRESHOLD=0.6
EOF
    echo -e "${YELLOW}IMPORTANTE: Edite o arquivo .env com suas credenciais do Nextcloud${NC}"
    echo -e "${YELLOW}Arquivo: ${SERVICE_DIR}/.env${NC}"
fi

# Verificar qual arquivo usar (app.py ou app_opencv.py)
APP_FILE="app.py"
if [ -f "app_opencv.py" ] && ! python3 -c "import face_recognition" 2>/dev/null; then
    echo -e "${YELLOW}Usando app_opencv.py (sem face_recognition)${NC}"
    APP_FILE="app_opencv.py"
fi

# Instalar PM2 se não estiver instalado
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}Instalando PM2...${NC}"
    npm install -g pm2
fi

# Criar diretório de logs
mkdir -p logs

# Criar/atualizar ecosystem.config.js
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'face-recognition-service',
      script: 'venv/bin/uvicorn',
      args: '${APP_FILE}:app --host 0.0.0.0 --port ${SERVICE_PORT}',
      cwd: '${SERVICE_DIR}',
      interpreter: 'none',
      env: {
        API_HOST: '0.0.0.0',
        API_PORT: '${SERVICE_PORT}',
        FACE_MATCH_THRESHOLD: '0.6',
      },
      env_file: '.env',
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      instances: 1,
      exec_mode: 'fork',
    },
  ],
};
EOF

# Parar instância anterior se existir
pm2 delete face-recognition-service 2>/dev/null || true

# Iniciar serviço com PM2
echo -e "${YELLOW}Iniciando serviço com PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# Aguardar alguns segundos
sleep 3

# Verificar se está rodando
if curl -s http://localhost:${SERVICE_PORT}/docs > /dev/null 2>&1 || curl -s http://localhost:${SERVICE_PORT}/ > /dev/null 2>&1; then
    echo -e "\n${GREEN}=== Serviço iniciado com sucesso! ===${NC}\n"
    echo -e "${GREEN}Serviço rodando em: http://localhost:${SERVICE_PORT}${NC}"
    echo -e "${GREEN}Documentação da API: http://localhost:${SERVICE_PORT}/docs${NC}"
else
    echo -e "\n${YELLOW}=== Serviço iniciado, mas ainda não está respondendo ===${NC}\n"
    echo -e "${YELLOW}Aguarde alguns segundos e verifique os logs:${NC}"
    echo -e "  pm2 logs face-recognition-service"
fi

echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "  - Ver status: pm2 status"
echo -e "  - Ver logs: pm2 logs face-recognition-service"
echo -e "  - Reiniciar: pm2 restart face-recognition-service"
echo -e "  - Parar: pm2 stop face-recognition-service"
echo -e "\n${YELLOW}Testar serviço:${NC}"
echo -e "  curl http://localhost:${SERVICE_PORT}/docs"
