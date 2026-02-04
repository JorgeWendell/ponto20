# Scripts de Deploy - Ponto20

Scripts para fazer deploy da aplicação Ponto20 em servidor Ubuntu Server 24.04.

## Pré-requisitos

- Ubuntu Server 24.04
- Acesso root ou sudo
- Conexão com internet
- (Opcional) Git instalado (será instalado automaticamente se não estiver)

## Scripts Disponíveis

### 1. deploy.sh

Script principal de deploy que:

- **Instala e configura PostgreSQL:**
  - Instala PostgreSQL e extensões
  - Configura senha do usuário `postgres`
  - Cria banco de dados `ponto20`
  - Configura acesso local (pg_hba.conf)
- **Instala Node.js e dependências:**
  - Instala Node.js 20 via NodeSource
  - Instala PM2 para gerenciamento de processos
- **Configura aplicação:**
  - Clona o repositório do GitHub
  - Instala dependências npm
  - Cria arquivo `.env` com configurações (DATABASE_URL apontando para localhost)
  - Executa migrações do banco de dados (drizzle-kit push)
  - Executa build da aplicação
  - Configura PM2 para gerenciar o processo
- **Configura Nginx como proxy reverso:**
  - Instala Nginx (se necessário)
  - Cria configuração de proxy reverso
  - Configura logs e timeouts
  - Habilita site e recarrega Nginx

**Uso:**

```bash
chmod +x scripts/deploy.sh
sudo ./scripts/deploy.sh
```

### 2. setup-nginx.sh

**NOTA:** Este script foi integrado ao `deploy.sh`. A configuração do Nginx agora é feita automaticamente durante o deploy.

Se você precisar reconfigurar o Nginx manualmente, ainda pode usar este script:

```bash
chmod +x scripts/setup-nginx.sh
sudo ./scripts/setup-nginx.sh
```

**IMPORTANTE:** Antes de executar, edite o script e altere a variável `DOMAIN` para seu domínio ou IP.

### 3. setup-https.sh

Script para configurar HTTPS com Let's Encrypt (Certbot):

- Instala Certbot e plugin do Nginx
- Obtém certificado SSL gratuito do Let's Encrypt
- Configura Nginx para usar HTTPS
- Configura redirecionamento automático de HTTP para HTTPS
- Configura renovação automática do certificado

**Pré-requisitos:**

- O script `deploy.sh` deve ter sido executado com sucesso
- O domínio deve estar apontando para o IP do servidor (DNS configurado)
- A porta 80 deve estar aberta no firewall
- O Nginx deve estar rodando e respondendo

**Uso:**

```bash
chmod +x scripts/setup-https.sh
sudo ./scripts/setup-https.sh
```

**Nota:** O script usa o email `jorge.wendell@outlook.com` para notificações do Let's Encrypt. Para alterar, edite a variável `EMAIL` no início do script.

### 4. setup-face-recognition.sh

Script para instalar e configurar o serviço de reconhecimento facial:

- Instala Python 3 e dependências
- Clona o repositório do serviço de reconhecimento facial
- Cria ambiente virtual Python
- Instala dependências (OpenCV ou face_recognition)
- Configura PM2 para gerenciar o serviço
- Inicia o serviço na porta 8000 (porta esperada pelo ponto20)

**Uso:**

```bash
chmod +x scripts/setup-face-recognition.sh
sudo ./scripts/setup-face-recognition.sh
```

**Nota:** Após executar, edite o arquivo `.env` do serviço (`/var/www/face-recognition-service/.env`) com suas credenciais do Nextcloud e reinicie: `pm2 restart face-recognition-service`

## Configuração do .env

O script `deploy.sh` cria automaticamente o arquivo `.env` com as seguintes configurações:

```env
DATABASE_URL="postgresql://postgres:adel1234@localhost:5432/ponto20"
FACE_RECOGNITION_API_URL=http://localhost:8000
BETTER_AUTH_SECRET="3L8AKwGUZa+VMTQc472p2FqT0UTyfNG8aBgAH+LfSMw="
BETTER_AUTH_URL=http://localhost:3000
RESEND_API_KEY=re_6TnyNasZ_Lo7uLBM4q3M3nqredToRUFSK
RESEND_FROM_EMAIL=info@adelbr.tech
SUPPORT_EMAIL=info@adelbr.tech
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

**Nota:** O `DATABASE_URL` é alterado de `192.168.15.47` para `localhost` conforme solicitado.

## Passos Após o Deploy

O script `deploy.sh` já executa automaticamente:

- ✅ Instalação e configuração do PostgreSQL
- ✅ Criação do banco de dados `ponto20`
- ✅ Execução das migrações do banco de dados
- ✅ Instalação e configuração do Nginx como proxy reverso

**Ações manuais necessárias:**

1. **Configurar Serviço de Reconhecimento Facial:**

   **Opção A: Script automatizado (recomendado)**

   ```bash
   chmod +x scripts/setup-face-recognition.sh
   sudo ./scripts/setup-face-recognition.sh
   ```

   **Opção B: Manual**
   - Certifique-se de que o serviço está rodando na porta 8000
   - Se o serviço estiver no mesmo servidor, use `http://localhost:8000`
   - Se o serviço estiver em outro servidor, use a URL completa (ex: `http://192.168.15.47:8000`)
   - Ajuste `FACE_RECOGNITION_API_URL` no `.env` conforme necessário
   - Reinicie a aplicação após alterar: `pm2 restart ponto20`

   **Verificar se o serviço está rodando:**

   ```bash
   # Verificar porta 8000
   curl http://localhost:8000/docs

   # Verificar PM2
   pm2 list | grep face-recognition

   # Ver logs
   pm2 logs face-recognition-service
   ```

2. **Ajustar Variáveis de Ambiente (se necessário):**
   - Edite `/var/www/ponto20/.env` conforme necessário
   - Reinicie a aplicação: `pm2 restart ponto20`

3. **Verificar Status dos Serviços:**

   ```bash
   # PostgreSQL
   sudo systemctl status postgresql

   # Nginx
   sudo systemctl status nginx

   # Aplicação
   pm2 status
   ```

4. **Configurar HTTPS (recomendado para produção):**

   ```bash
   chmod +x scripts/setup-https.sh
   sudo ./scripts/setup-https.sh
   ```

   **Importante:** Após configurar HTTPS, atualize as variáveis no `.env`:

   ```bash
   cd /var/www/ponto20
   nano .env
   # Altere:
   # BETTER_AUTH_URL=https://ponto.adelbr.tech
   # NEXT_PUBLIC_BASE_URL=https://ponto.adelbr.tech
   pm2 restart ponto20
   ```

5. **Verificar Status dos Serviços:**

   ```bash
   # PostgreSQL
   sudo systemctl status postgresql

   # Nginx
   sudo systemctl status nginx

   # Aplicação
   pm2 status

   # Certbot (renovação automática)
   sudo systemctl status certbot.timer
   ```

6. **Configurar Domínio (se necessário):**
   - O script usa `ponto.adelbr.tech` por padrão
   - Para alterar, edite a variável `DOMAIN` no início dos scripts
   - Ou edite manualmente: `/etc/nginx/sites-available/ponto20`

## Gerenciamento com PM2

```bash
# Ver logs
pm2 logs ponto20

# Reiniciar aplicação
pm2 restart ponto20

# Parar aplicação
pm2 stop ponto20

# Ver status
pm2 status

# Ver informações detalhadas
pm2 info ponto20
```

## Atualização da Aplicação

Para atualizar a aplicação após mudanças no repositório:

```bash
cd /var/www/ponto20
git pull origin main  # ou master
npm ci --production=false
npm run build
pm2 restart ponto20
```

## Troubleshooting

### Aplicação não inicia

- Verifique os logs: `pm2 logs ponto20`
- Verifique se o PostgreSQL está rodando: `sudo systemctl status postgresql`
- Verifique se a porta 3000 está livre: `sudo netstat -tulpn | grep 3000`

### Erro de conexão com banco de dados

- Verifique se o PostgreSQL está rodando: `sudo systemctl status postgresql`
- Verifique as credenciais no `.env`
- Teste conexão manual: `psql -U postgres -d ponto20 -h localhost`
- Verifique o arquivo `pg_hba.conf`: `/etc/postgresql/*/main/pg_hba.conf`
- Verifique logs do PostgreSQL: `sudo tail -f /var/log/postgresql/postgresql-*-main.log`

### Erro de build

- Verifique se todas as dependências estão instaladas: `npm ci`
- Verifique os logs de build para mais detalhes

### Erro ao configurar HTTPS

- Verifique se o DNS está configurado corretamente: `nslookup ponto.adelbr.tech`
- Verifique se a porta 80 está aberta: `sudo ufw status` ou `sudo iptables -L`
- Verifique se o Nginx está rodando: `sudo systemctl status nginx`
- Verifique os logs do Certbot: `sudo journalctl -u certbot.service`
- Teste acesso HTTP manualmente: `curl -I http://ponto.adelbr.tech`
- Se o certificado expirar, renove manualmente: `sudo certbot renew`

### Certificado SSL expirado

- Renovar manualmente: `sudo certbot renew`
- Verificar status: `sudo certbot certificates`
- Verificar timer de renovação: `sudo systemctl status certbot.timer`

## Estrutura de Diretórios

Após o deploy, a aplicação estará em:

- `/var/www/ponto20` - Diretório da aplicação
- `/etc/nginx/sites-available/ponto20` - Configuração do Nginx (se configurado)
- `/var/log/nginx/ponto20-*.log` - Logs do Nginx
- `/etc/letsencrypt/live/ponto.adelbr.tech/` - Certificados SSL (se HTTPS configurado)

## Gerenciamento de Certificados SSL

```bash
# Ver certificados instalados
sudo certbot certificates

# Renovar certificado manualmente
sudo certbot renew

# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Ver logs do Certbot
sudo journalctl -u certbot.service
sudo journalctl -u certbot.timer

# Verificar status do timer de renovação
sudo systemctl status certbot.timer
```
