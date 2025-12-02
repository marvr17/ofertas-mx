# 🚀 Guía de Deployment - Ofertas MX

Este documento describe cómo deployar la aplicación Ofertas MX en diferentes plataformas en la nube.

## 📋 Requisitos Previos

- Cuenta en la plataforma de deployment elegida
- Variables de entorno configuradas
- (Opcional) Bot de Telegram configurado

## 🔧 Variables de Entorno Requeridas

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3000

# Telegram Bot (opcional)
TELEGRAM_BOT_TOKEN=tu_token_aqui
TELEGRAM_CHAT_ID=tu_chat_id_aqui

# Amazon Affiliate (opcional)
AMAZON_AFFILIATE_TAG=tu_tag_aqui

# Mercado Libre Affiliate (opcional)
ML_AFFILIATE_ID=tu_id_aqui

# Scraping intervals (minutes)
SCRAPE_INTERVAL_ML=5
SCRAPE_INTERVAL_AMAZON=10

# Alert thresholds
MIN_DISCOUNT_PERCENT=0
PRICE_DROP_THRESHOLD=0
```

## 🌐 Deployment en Railway

Railway es la opción más sencilla y recomendada para este proyecto.

### Paso 1: Crear Proyecto

1. Ve a [railway.app](https://railway.app)
2. Haz clic en "New Project"
3. Selecciona "Deploy from GitHub repo"
4. Selecciona tu repositorio

### Paso 2: Configurar Variables

1. Ve a la pestaña "Variables"
2. Agrega todas las variables de entorno necesarias
3. Asegúrate de configurar `DATABASE_URL=file:./dev.db`

### Paso 3: Deploy

Railway detectará automáticamente el `railway.json` y:
- Instalará dependencias
- Generará el cliente de Prisma
- Compilará TypeScript
- Iniciará la aplicación

### Dominio

Railway te asignará un dominio automático: `tu-proyecto.up.railway.app`

### Costo

- Plan Free: Suficiente para empezar ($5 de crédito mensual)
- Plan Pro: $20/mes con más recursos

---

## 🎨 Deployment en Render

Render es otra excelente opción con plan gratuito.

### Paso 1: Crear Web Service

1. Ve a [render.com](https://render.com)
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub

### Paso 2: Configuración

Render detectará el `render.yaml` automáticamente, pero también puedes configurar manualmente:

- **Name**: ofertas-mx
- **Environment**: Node
- **Build Command**: `npm ci && npx prisma generate && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free

### Paso 3: Variables de Entorno

Agrega las variables de entorno en el dashboard de Render.

### Limitaciones del Plan Free

- El servicio se duerme después de 15 minutos de inactividad
- 750 horas gratis al mes
- Se reinicia al recibir una petición

---

## 🐳 Deployment con Docker

### Opción 1: Docker Hub + Cualquier Proveedor

```bash
# Build la imagen
docker build -t ofertas-mx .

# Tag para Docker Hub
docker tag ofertas-mx tu-usuario/ofertas-mx:latest

# Push a Docker Hub
docker push tu-usuario/ofertas-mx:latest

# En el servidor
docker pull tu-usuario/ofertas-mx:latest
docker run -d -p 3000:3000 --env-file .env tu-usuario/ofertas-mx:latest
```

### Opción 2: Deploy Directo

```bash
# Build y run localmente
docker build -t ofertas-mx .
docker run -d -p 3000:3000 \
  -e DATABASE_URL="file:./dev.db" \
  -e PORT=3000 \
  -v $(pwd)/prisma:/app/prisma \
  ofertas-mx
```

---

## ☁️ Deployment en VPS (Digital Ocean, AWS EC2, etc.)

### Requisitos

- VPS con Ubuntu/Debian
- Node.js 20+
- PM2 para gestión de procesos

### Paso 1: Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Git
sudo apt install git -y
```

### Paso 2: Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/ofertas-mx.git
cd ofertas-mx

# Instalar dependencias
npm ci

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con tus valores

# Generar Prisma Client
npx prisma generate

# Compilar TypeScript
npm run build
```

### Paso 3: Iniciar con PM2

```bash
# Iniciar aplicación
pm2 start dist/index.js --name ofertas-mx

# Configurar para iniciar en boot
pm2 startup
pm2 save

# Ver logs
pm2 logs ofertas-mx

# Monitoreo
pm2 monit
```

### Paso 4: Configurar Nginx (Opcional)

```bash
# Instalar Nginx
sudo apt install nginx -y

# Configurar reverse proxy
sudo nano /etc/nginx/sites-available/ofertas-mx
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar configuración
sudo ln -s /etc/nginx/sites-available/ofertas-mx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Paso 5: SSL con Certbot (Opcional)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d tu-dominio.com
```

---

## 🔄 Actualización de la Aplicación

### Railway/Render
Simplemente haz push a tu repositorio de GitHub. El deployment es automático.

### Docker
```bash
docker pull tu-usuario/ofertas-mx:latest
docker stop ofertas-mx-container
docker rm ofertas-mx-container
docker run -d --name ofertas-mx-container -p 3000:3000 --env-file .env tu-usuario/ofertas-mx:latest
```

### VPS con PM2
```bash
cd ofertas-mx
git pull
npm ci
npx prisma generate
npm run build
pm2 restart ofertas-mx
```

---

## 📊 Monitoreo

### Railway
- Dashboard integrado con métricas de CPU, memoria y red
- Logs en tiempo real

### Render
- Métricas básicas en el dashboard
- Logs en tiempo real

### VPS
```bash
# PM2 Monitoring
pm2 monit

# Ver logs
pm2 logs ofertas-mx --lines 100

# Estadísticas
pm2 show ofertas-mx
```

---

## 🗄️ Base de Datos

### SQLite (Actual)
- Perfecto para empezar
- Sin costos adicionales
- Limitado a un solo servidor

### PostgreSQL (Recomendado para Producción)

Si necesitas escalar, considera migrar a PostgreSQL:

1. **Railway**: Incluye PostgreSQL gratuito
2. **Render**: PostgreSQL gratuito (90 días, luego $7/mes)
3. **Supabase**: PostgreSQL gratuito con límites generosos

Para migrar:
```bash
# Cambiar DATABASE_URL
DATABASE_URL="postgresql://user:password@host:5432/db"

# Actualizar schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

# Migrar
npx prisma migrate deploy
```

---

## 🎯 Recomendaciones

### Para Empezar
✅ **Railway** - Más fácil, deployment automático, buen plan free

### Para Producción
✅ **VPS (Digital Ocean)** - Más control, mejor performance
✅ **Railway Pro** - Fácil de gestionar, buen soporte

### Para Desarrollo
✅ **Local** - Desarrollo rápido con `npm run dev`
✅ **Docker** - Consistencia entre entornos

---

## ⚠️ Consideraciones Importantes

1. **Rate Limiting**: Los scrapers pueden ser bloqueados si hacen muchas peticiones
2. **Rotación de IPs**: Considera usar proxies para producción
3. **Cron Jobs**: Asegúrate de que funcionen en tu plataforma
4. **Almacenamiento**: SQLite necesita volumen persistente
5. **Backups**: Configura backups automáticos de la base de datos

---

## 🆘 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs ofertas-mx` o en el dashboard de tu plataforma
2. Verifica las variables de entorno
3. Asegúrate de que el puerto esté correctamente configurado
4. Revisa el health check endpoint: `/health`

---

## 📝 Checklist de Deployment

- [ ] Variables de entorno configuradas
- [ ] Base de datos lista
- [ ] Build exitoso
- [ ] Health check funciona
- [ ] Cron jobs activos
- [ ] Logs sin errores
- [ ] Interfaz web accesible
- [ ] (Opcional) Telegram bot configurado
- [ ] (Opcional) Dominio personalizado
- [ ] (Opcional) SSL configurado
