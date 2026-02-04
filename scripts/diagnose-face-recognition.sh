#!/bin/bash

# Script de diagnóstico para o serviço de reconhecimento facial
# Execute este script para verificar se tudo está configurado corretamente

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

SERVICE_DIR="/var/www/face-recognition-service"
PONTO20_DIR="/var/www/ponto20"
SERVICE_PORT="8000"

echo -e "${GREEN}=== Diagnóstico do Serviço de Reconhecimento Facial ===${NC}\n"

# Verificar PM2
echo -e "${YELLOW}[1] Verificando PM2...${NC}"
if command -v pm2 >/dev/null 2>&1; then
    echo -e "${GREEN}PM2 instalado${NC}"
    pm2 list | grep -E "face-recognition|ponto20" || echo -e "${YELLOW}Nenhum serviço relacionado encontrado no PM2${NC}"
else
    echo -e "${RED}PM2 não está instalado${NC}"
fi

# Verificar porta do serviço
echo -e "\n${YELLOW}[2] Verificando porta ${SERVICE_PORT}...${NC}"
if lsof -i :${SERVICE_PORT} 2>/dev/null || netstat -tulpn 2>/dev/null | grep :${SERVICE_PORT}; then
    echo -e "${GREEN}Porta ${SERVICE_PORT} está em uso${NC}"
    lsof -i :${SERVICE_PORT} 2>/dev/null || netstat -tulpn 2>/dev/null | grep :${SERVICE_PORT}
else
    echo -e "${RED}Porta ${SERVICE_PORT} não está em uso${NC}"
    echo -e "${YELLOW}Verificando outras portas comuns...${NC}"
    for port in 9090 8000 3000; do
        if lsof -i :${port} 2>/dev/null | grep -q uvicorn || netstat -tulpn 2>/dev/null | grep :${port} | grep -q uvicorn; then
            echo -e "${YELLOW}Serviço encontrado na porta ${port}${NC}"
        fi
    done
fi

# Verificar se o serviço está respondendo
echo -e "\n${YELLOW}[3] Testando acesso ao serviço...${NC}"
if curl -s http://localhost:${SERVICE_PORT}/docs > /dev/null 2>&1; then
    echo -e "${GREEN}Serviço respondendo em http://localhost:${SERVICE_PORT}${NC}"
elif curl -s http://localhost:${SERVICE_PORT}/ > /dev/null 2>&1; then
    echo -e "${GREEN}Serviço respondendo em http://localhost:${SERVICE_PORT}${NC}"
else
    echo -e "${RED}Serviço não está respondendo em http://localhost:${SERVICE_PORT}${NC}"
    echo -e "${YELLOW}Testando porta 9090...${NC}"
    if curl -s http://localhost:9090/docs > /dev/null 2>&1; then
        echo -e "${YELLOW}Serviço encontrado na porta 9090!${NC}"
        echo -e "${YELLOW}ATENÇÃO: O serviço está na porta 9090, mas o ponto20 espera a porta 8000${NC}"
    fi
fi

# Verificar .env do serviço
echo -e "\n${YELLOW}[4] Verificando .env do serviço...${NC}"
if [ -f "${SERVICE_DIR}/.env" ]; then
    echo -e "${GREEN}Arquivo .env encontrado${NC}"
    API_PORT=$(grep "^API_PORT=" "${SERVICE_DIR}/.env" 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")
    if [ -n "$API_PORT" ]; then
        echo -e "  API_PORT=${API_PORT}"
        if [ "$API_PORT" != "$SERVICE_PORT" ]; then
            echo -e "${YELLOW}ATENÇÃO: API_PORT está configurado como ${API_PORT}, mas o ponto20 espera ${SERVICE_PORT}${NC}"
        fi
    else
        echo -e "${YELLOW}API_PORT não encontrado no .env${NC}"
    fi
else
    echo -e "${RED}Arquivo .env não encontrado em ${SERVICE_DIR}${NC}"
fi

# Verificar .env do ponto20
echo -e "\n${YELLOW}[5] Verificando .env do ponto20...${NC}"
if [ -f "${PONTO20_DIR}/.env" ]; then
    echo -e "${GREEN}Arquivo .env encontrado${NC}"
    FACE_URL=$(grep "^FACE_RECOGNITION_API_URL=" "${PONTO20_DIR}/.env" 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")
    if [ -n "$FACE_URL" ]; then
        echo -e "  FACE_RECOGNITION_API_URL=${FACE_URL}"
        if [[ "$FACE_URL" != *":${SERVICE_PORT}"* ]]; then
            echo -e "${YELLOW}ATENÇÃO: URL configurada como ${FACE_URL}, mas o serviço pode estar na porta ${SERVICE_PORT}${NC}"
        fi
    else
        echo -e "${RED}FACE_RECOGNITION_API_URL não encontrado no .env${NC}"
    fi
else
    echo -e "${RED}Arquivo .env não encontrado em ${PONTO20_DIR}${NC}"
fi

# Verificar ecosystem.config.js
echo -e "\n${YELLOW}[6] Verificando configuração do PM2...${NC}"
if [ -f "${SERVICE_DIR}/ecosystem.config.js" ]; then
    echo -e "${GREEN}ecosystem.config.js encontrado${NC}"
    CONFIG_PORT=$(grep -oP "port \K\d+" "${SERVICE_DIR}/ecosystem.config.js" | head -1 || echo "")
    if [ -n "$CONFIG_PORT" ]; then
        echo -e "  Porta configurada: ${CONFIG_PORT}"
        if [ "$CONFIG_PORT" != "$SERVICE_PORT" ]; then
            echo -e "${YELLOW}ATENÇÃO: PM2 está configurado para porta ${CONFIG_PORT}, mas o ponto20 espera ${SERVICE_PORT}${NC}"
        fi
    fi
else
    echo -e "${RED}ecosystem.config.js não encontrado${NC}"
fi

# Verificar logs do PM2
echo -e "\n${YELLOW}[7] Últimas linhas dos logs do serviço...${NC}"
if pm2 list | grep -q "face-recognition"; then
    echo -e "${GREEN}Últimas 10 linhas dos logs:${NC}"
    pm2 logs face-recognition-service --lines 10 --nostream 2>/dev/null || echo -e "${YELLOW}Não foi possível ler os logs${NC}"
else
    echo -e "${YELLOW}Serviço não encontrado no PM2${NC}"
fi

# Resumo e recomendações
echo -e "\n${GREEN}=== Resumo e Recomendações ===${NC}\n"

# Verificar se tudo está correto
ISSUES=0

if ! curl -s http://localhost:${SERVICE_PORT}/docs > /dev/null 2>&1 && ! curl -s http://localhost:${SERVICE_PORT}/ > /dev/null 2>&1; then
    echo -e "${RED}❌ Serviço não está respondendo na porta ${SERVICE_PORT}${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ Serviço está respondendo${NC}"
fi

if [ ! -f "${PONTO20_DIR}/.env" ]; then
    echo -e "${RED}❌ Arquivo .env do ponto20 não encontrado${NC}"
    ISSUES=$((ISSUES + 1))
else
    FACE_URL=$(grep "^FACE_RECOGNITION_API_URL=" "${PONTO20_DIR}/.env" 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")
    if [[ "$FACE_URL" != *"localhost:${SERVICE_PORT}"* ]] && [[ "$FACE_URL" != *"127.0.0.1:${SERVICE_PORT}"* ]]; then
        echo -e "${YELLOW}⚠️  FACE_RECOGNITION_API_URL pode estar incorreto: ${FACE_URL}${NC}"
        ISSUES=$((ISSUES + 1))
    else
        echo -e "${GREEN}✅ FACE_RECOGNITION_API_URL está configurado corretamente${NC}"
    fi
fi

if [ $ISSUES -eq 0 ]; then
    echo -e "\n${GREEN}Tudo parece estar configurado corretamente!${NC}"
    echo -e "${YELLOW}Se ainda houver erro, verifique:${NC}"
    echo -e "  1. Logs do ponto20: pm2 logs ponto20"
    echo -e "  2. Logs do serviço: pm2 logs face-recognition-service"
    echo -e "  3. Reinicie ambos: pm2 restart all"
else
    echo -e "\n${YELLOW}Foram encontrados ${ISSUES} problema(s).${NC}"
    echo -e "\n${YELLOW}Próximos passos:${NC}"
    echo -e "  1. Verifique a porta do serviço: pm2 list"
    echo -e "  2. Verifique o .env do serviço: cat ${SERVICE_DIR}/.env | grep API_PORT"
    echo -e "  3. Verifique o .env do ponto20: cat ${PONTO20_DIR}/.env | grep FACE_RECOGNITION"
    echo -e "  4. Se a porta estiver errada, edite:"
    echo -e "     - ${SERVICE_DIR}/.env (API_PORT=8000)"
    echo -e "     - ${SERVICE_DIR}/ecosystem.config.js (porta no args)"
    echo -e "     - Reinicie: pm2 restart face-recognition-service"
fi
