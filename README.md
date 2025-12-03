# 💰 Ofertas - Price Tracker & Deal Hunter

Sistema completo para cazar ofertas y errores de precios en Amazon y Mercado Libre. Detecta cualquier caída de precio, incluso errores temporales, y notifica al instante por Telegram.

## 🎯 Características

- ✅ **Scraping automático** de Amazon y Mercado Libre
- ✅ **Detección inmediata** de cualquier caída de precio (sin mínimos)
- ✅ **Identificación de errores de precio** (caídas >50%)
- ✅ **Notificaciones por Telegram** en tiempo real
- ✅ **Enlaces de afiliados** automáticos (Amazon, Mercado Libre)
- ✅ **API REST** completa
- ✅ **Dashboard web** para visualizar ofertas
- ✅ **Base de datos** con histórico de precios
- ✅ **Workers automáticos** con cron jobs

## 🚀 Instalación

1. **Clonar e instalar dependencias:**
```bash
npm install
```

2. **Configurar variables de entorno:**

Copia `.env.example` a `.env` y configura:

```env
# Telegram Bot (REQUERIDO para notificaciones)
TELEGRAM_BOT_TOKEN=tu_token_de_bot
TELEGRAM_CHAT_ID=tu_chat_id

# Códigos de afiliado (OPCIONAL para monetizar)
AMAZON_AFFILIATE_TAG=tu-tag-20
ML_AFFILIATE_ID=tu_id

# Intervalos de scraping (minutos)
SCRAPE_INTERVAL_ML=5
SCRAPE_INTERVAL_AMAZON=10

# Umbrales (0 = detecta CUALQUIER caída)
MIN_DISCOUNT_PERCENT=0
PRICE_DROP_THRESHOLD=0
```

### 📱 Cómo obtener credenciales de Telegram:

1. **Crear un bot:**
   - Habla con [@BotFather](https://t.me/botfather)
   - Usa `/newbot`
   - Copia el token que te da

2. **Obtener tu Chat ID:**
   - Habla con [@userinfobot](https://t.me/userinfobot)
   - Te dará tu ID personal

   **O para un canal:**
   - Crea un canal público
   - Agrega tu bot como administrador
   - El Chat ID será `@nombre_canal` o `-100xxxxxxxxx`

3. **Inicializar base de datos:**
```bash
npm run prisma:generate
```

## 📖 Uso

### Iniciar el sistema completo:

```bash
npm run dev
```

Esto iniciará:
- ✅ API REST en `http://localhost:3000`
- ✅ Dashboard web en `http://localhost:3000`
- ✅ Workers automáticos (scrapers cada X minutos)
- ✅ Detector de ofertas (cada minuto)
- ✅ Bot de Telegram (notificaciones instantáneas)

### Comandos CLI:

**Rastrear un producto:**
```bash
npm run scrape track "https://www.mercadolibre.com.mx/..."
npm run scrape track "https://www.amazon.com.mx/dp/..."
```

**Buscar productos en Mercado Libre:**
```bash
npm run scrape search "iphone 15" MLM
# Sites: MLM=México, MLA=Argentina, MLB=Brasil
```

**Listar productos rastreados:**
```bash
npm run scrape list
```

**Ver ofertas detectadas:**
```bash
npm run scrape offers
```

## 🌐 API REST

### Endpoints disponibles:

**Estadísticas:**
```bash
GET /api/stats
```

**Listar productos:**
```bash
GET /api/products?limit=50&store=mercadolibre
```

**Rastrear nuevo producto:**
```bash
POST /api/products/track
Content-Type: application/json

{
  "url": "https://www.mercadolibre.com.mx/..."
}
```

**Ver ofertas:**
```bash
GET /api/offers?limit=50&onlyErrors=true
```

**Buscar en Mercado Libre:**
```bash
GET /api/search/mercadolibre?q=iphone&site=MLM&limit=10
```

**Eliminar producto:**
```bash
DELETE /api/products/:id
```

## 💡 Cómo Funciona

### 1. Rastreo de Precios

El sistema verifica los precios periódicamente:
- **Mercado Libre:** cada 5 minutos (configurable)
- **Amazon:** cada 10 minutos (configurable)

### 2. Detección de Ofertas

Cualquier caída de precio genera una oferta:
- **Oferta normal:** descuento < 50%
- **Error de precio:** descuento >= 50% 🚨

### 3. Notificaciones

Cuando se detecta una oferta:
1. Se genera un enlace de afiliado
2. Se envía notificación a Telegram
3. Se marca como notificada en la base de datos

### 4. Monetización

**Estrategias:**

1. **Afiliados:** Comparte ofertas con tu código
2. **Reventa de errores:** Compra cuando hay error de precio y revende
3. **Premium:** Vende acceso a notificaciones instantáneas

## 🏪 Tiendas Soportadas

### Mercado Libre
- ✅ API oficial (más estable)
- ✅ México (MLM), Argentina (MLA), Brasil (MLB)
- ✅ Búsqueda de productos
- ✅ Tracking de precios
- ⚠️ Programa de afiliados separado por país

### Amazon
- ✅ Scraping con Cheerio
- ⚠️ Amazon puede bloquear bots (considera usar proxies)
- ✅ Afiliados con Amazon Associates
- 💡 Mejora: usa Product Advertising API (requiere aprobación)

## ⚙️ Configuración Avanzada

### Cambiar intervalos de scraping:

En `.env`:
```env
SCRAPE_INTERVAL_ML=3      # cada 3 minutos
SCRAPE_INTERVAL_AMAZON=15 # cada 15 minutos
```

### Detectar solo errores grandes:

```env
MIN_DISCOUNT_PERCENT=30   # solo descuentos >30%
```

### Usar proxies para Amazon:

Edita `src/scrapers/amazon.ts` y agrega:
```typescript
const response = await axios.get(url, {
  proxy: {
    host: 'proxy.example.com',
    port: 8080
  },
  // ... resto de config
});
```

## 📊 Base de Datos

El sistema usa SQLite (fácil de empezar). Para producción, cambia a PostgreSQL:

1. Instala PostgreSQL
2. Actualiza `prisma.config.ts`:
```typescript
datasource: {
  url: "postgresql://user:pass@localhost:5432/ofertas"
}
```
3. En `schema.prisma` cambia:
```prisma
datasource db {
  provider = "postgresql"
}
```
4. Ejecuta `npm run prisma:migrate`

## 🔧 Estructura del Proyecto

```
Ofertas/
├── src/
│   ├── scrapers/          # Scrapers de tiendas
│   │   ├── mercadolibre.ts
│   │   ├── amazon.ts
│   │   └── run.ts         # CLI para scraping manual
│   ├── services/          # Servicios principales
│   │   ├── telegram.ts    # Bot de Telegram
│   │   ├── worker.ts      # Cron jobs
│   │   └── offerDetector.ts
│   ├── api/               # API REST
│   │   └── server.ts
│   ├── utils/             # Utilidades
│   │   └── affiliate.ts   # Generador de enlaces
│   ├── config.ts          # Configuración
│   ├── db.ts              # Cliente Prisma
│   └── index.ts           # Punto de entrada
├── public/                # Dashboard web
│   └── index.html
├── prisma/
│   └── schema.prisma      # Schema de base de datos
└── .env                   # Configuración
```

## 🚨 Consideraciones Legales

- ✅ **Mercado Libre:** Usa API oficial (permitido)
- ⚠️ **Amazon:** Scraping puede violar ToS
  - Considera usar Product Advertising API
  - Usa con moderación y proxies
  - Para uso personal/educativo

- 📋 **Afiliados:** Declara tus enlaces según regulaciones locales
- 💰 **Reventa:** Verifica leyes de arbitraje/reventa en tu país

## 🎓 Mejoras Futuras

- [ ] Integrar más tiendas (eBay, Walmart, etc.)
- [ ] Proxy rotation automático
- [ ] WhatsApp notifications
- [ ] Machine learning para predecir errores
- [ ] Comparador de precios entre tiendas
- [ ] Alertas por categorías/palabras clave
- [ ] Dashboard con gráficas de histórico

## 🐛 Troubleshooting

**Problema:** Amazon bloquea las peticiones
- **Solución:** Usa proxies rotativos o Product Advertising API

**Problema:** Telegram no envía mensajes
- **Solución:** Verifica que el bot tenga permisos en el canal

**Problema:** Los precios no se actualizan
- **Solución:** Revisa que los workers estén corriendo (`npm run dev`)

## 📝 Licencia

Uso libre para fines educativos y personales.

---

**¿Dudas?** Abre un issue en GitHub.

**¡Buena caza de ofertas!** 💰🎯

