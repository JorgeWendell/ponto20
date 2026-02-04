#!/bin/bash

# Script para corrigir problemas com o serviço de reconhecimento facial
# Execute este script se o serviço não estiver iniciando

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICE_DIR="/var/www/face-recognition-service"
SERVICE_PORT="8000"

echo -e "${GREEN}=== Corrigindo Serviço de Reconhecimento Facial ===${NC}\n"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Por favor, execute como root ou com sudo${NC}"
    exit 1
fi

if [ ! -d "$SERVICE_DIR" ]; then
    echo -e "${RED}Diretório do serviço não encontrado: ${SERVICE_DIR}${NC}"
    echo -e "${YELLOW}Execute primeiro: sudo ./scripts/setup-face-recognition.sh${NC}"
    exit 1
fi

cd "$SERVICE_DIR"

# Parar serviço se estiver rodando
echo -e "${YELLOW}[1/6] Parando serviço se estiver rodando...${NC}"
pm2 delete face-recognition-service 2>/dev/null || true
systemctl stop face-recognition.service 2>/dev/null || true

# Verificar Python
if ! command -v python3 >/dev/null 2>&1; then
    echo -e "${YELLOW}[2/6] Instalando Python 3...${NC}"
    apt-get update -qq
    apt-get install -y python3 python3-pip python3-venv
else
    echo -e "${GREEN}[2/6] Python 3 já está instalado: $(python3 --version)${NC}"
fi

# Verificar e instalar python3-venv se necessário
PYTHON_VERSION=$(python3 --version | grep -oP '\d+\.\d+' | head -1)
if ! dpkg -l | grep -q "python${PYTHON_VERSION}-venv"; then
    echo -e "${YELLOW}Instalando python${PYTHON_VERSION}-venv...${NC}"
    apt-get update -qq
    apt-get install -y "python${PYTHON_VERSION}-venv" || apt-get install -y python3-venv
fi

# Remover ambiente virtual antigo se existir e estiver corrompido
if [ -d "venv" ] && [ ! -f "venv/bin/uvicorn" ]; then
    echo -e "${YELLOW}[3/6] Removendo ambiente virtual corrompido...${NC}"
    rm -rf venv
fi

# Criar ambiente virtual se não existir
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}[3/6] Criando ambiente virtual Python...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}Ambiente virtual criado${NC}"
else
    echo -e "${GREEN}[3/6] Ambiente virtual já existe${NC}"
fi

# Ativar ambiente virtual e atualizar pip
echo -e "${YELLOW}[4/6] Instalando/atualizando dependências Python...${NC}"
source venv/bin/activate

# Atualizar pip primeiro
pip install --upgrade pip setuptools wheel

# Verificar qual arquivo usar
APP_FILE="app.py"
USE_OPENCV=false

# Tentar importar face_recognition
if python3 -c "import face_recognition" 2>/dev/null; then
    echo -e "${GREEN}face_recognition disponível, usando app.py${NC}"
    APP_FILE="app.py"
else
    echo -e "${YELLOW}face_recognition não disponível, usando app_opencv.py${NC}"
    APP_FILE="app_opencv.py"
    USE_OPENCV=true
fi

# Instalar dependências básicas primeiro
echo -e "${YELLOW}Instalando dependências básicas...${NC}"
pip install fastapi uvicorn[standard] python-dotenv pillow requests numpy

# Tentar instalar dependências específicas
if [ "$USE_OPENCV" = true ]; then
    echo -e "${YELLOW}Instalando OpenCV...${NC}"
    pip install opencv-python-headless
    if [ -f "requirements-simple.txt" ]; then
        pip install -r requirements-simple.txt
    fi
else
    echo -e "${YELLOW}Instalando face_recognition...${NC}"
    # Tentar instalar dlib primeiro (pode falhar, mas vamos tentar)
    pip install dlib || echo -e "${YELLOW}AVISO: dlib pode não instalar, usando OpenCV${NC}"
    pip install face_recognition || {
        echo -e "${YELLOW}face_recognition falhou, mudando para OpenCV${NC}"
        APP_FILE="app_opencv.py"
        pip install opencv-python-headless
    }
fi

# Verificar se uvicorn está instalado
if [ ! -f "venv/bin/uvicorn" ]; then
    echo -e "${RED}ERRO: uvicorn não foi instalado corretamente${NC}"
    echo -e "${YELLOW}Tentando instalar novamente...${NC}"
    pip install --force-reinstall uvicorn[standard]
fi

# Verificar se o arquivo da aplicação existe
if [ ! -f "$APP_FILE" ]; then
    echo -e "${RED}ERRO: Arquivo ${APP_FILE} não encontrado${NC}"
    echo -e "${YELLOW}Verificando arquivos disponíveis...${NC}"
    ls -la *.py
    exit 1
fi

# Configurar .env se não existir
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}[5/6] Criando arquivo .env...${NC}"
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
else
    echo -e "${GREEN}[5/6] Arquivo .env já existe${NC}"
    # Garantir que a porta está correta
    if ! grep -q "^API_PORT=${SERVICE_PORT}" .env; then
        echo -e "${YELLOW}Atualizando API_PORT no .env para ${SERVICE_PORT}...${NC}"
        sed -i "s/^API_PORT=.*/API_PORT=${SERVICE_PORT}/" .env || echo "API_PORT=${SERVICE_PORT}" >> .env
    fi
fi

# Criar diretório de logs
mkdir -p logs

# Criar/atualizar ecosystem.config.js
echo -e "${YELLOW}[6/6] Configurando PM2...${NC}"
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

# Verificar se PM2 está instalado
if ! command -v pm2 >/dev/null 2>&1; then
    echo -e "${YELLOW}Instalando PM2...${NC}"
    npm install -g pm2
fi

# Testar se uvicorn funciona antes de iniciar com PM2
echo -e "${YELLOW}Testando uvicorn...${NC}"
if [ -f "venv/bin/uvicorn" ]; then
    echo -e "${GREEN}uvicorn encontrado: $(venv/bin/uvicorn --version)${NC}"
else
    echo -e "${RED}ERRO: uvicorn ainda não está disponível${NC}"
    echo -e "${YELLOW}Tentando instalar diretamente...${NC}"
    venv/bin/pip install --force-reinstall uvicorn[standard]
fi

# Iniciar serviço com PM2
echo -e "${YELLOW}Iniciando serviço com PM2...${NC}"
pm2 start ecosystem.config.js
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# Aguardar alguns segundos
sleep 5

# Verificar status
echo -e "\n${YELLOW}Verificando status do serviço...${NC}"
pm2 status

# Verificar se está respondendo
if curl -s http://localhost:${SERVICE_PORT}/docs > /dev/null 2>&1 || curl -s http://localhost:${SERVICE_PORT}/ > /dev/null 2>&1; then
    echo -e "\n${GREEN}=== Serviço iniciado com sucesso! ===${NC}\n"
    echo -e "${GREEN}Serviço rodando em: http://localhost:${SERVICE_PORT}${NC}"
    echo -e "${GREEN}Documentação da API: http://localhost:${SERVICE_PORT}/docs${NC}"
else
    echo -e "\n${YELLOW}=== Serviço iniciado, mas ainda não está respondendo ===${NC}\n"
    echo -e "${YELLOW}Verifique os logs para mais informações:${NC}"
    echo -e "  pm2 logs face-recognition-service"
    echo -e "\n${YELLOW}Ou teste manualmente:${NC}"
    echo -e "  cd ${SERVICE_DIR}"
    echo -e "  source venv/bin/activate"
    echo -e "  uvicorn ${APP_FILE}:app --host 0.0.0.0 --port ${SERVICE_PORT}"
fi

echo -e "\n${YELLOW}Comandos úteis:${NC}"
echo -e "  - Ver status: pm2 status"
echo -e "  - Ver logs: pm2 logs face-recognition-service"
echo -e "  - Reiniciar: pm2 restart face-recognition-service"
echo -e "  - Parar: pm2 stop face-recognition-service"
echo -e "\n${YELLOW}Testar serviço:${NC}"
echo -e "  curl http://localhost:${SERVICE_PORT}/docs"
