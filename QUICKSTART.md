# 🚀 Inicio Rápido - 5 Minutos

## Paso 1: Instalar (1 min)

```bash
npm install
```

## Paso 2: Configurar Telegram (2 min)

1. Abre Telegram y busca **@BotFather**
2. Envía `/newbot` y sigue las instrucciones
3. Copia el **token** que te da (ej: `123456:ABC-DEF...`)
4. Busca **@userinfobot** y copia tu **ID** (ej: `987654321`)

## Paso 3: Configurar .env (1 min)

Crea archivo `.env`:

```env
TELEGRAM_BOT_TOKEN=pega_tu_token_aquí
TELEGRAM_CHAT_ID=pega_tu_id_aquí

AMAZON_AFFILIATE_TAG=
ML_AFFILIATE_ID=

DATABASE_URL="file:./dev.db"

SCRAPE_INTERVAL_ML=5
SCRAPE_INTERVAL_AMAZON=10

MIN_DISCOUNT_PERCENT=0
PRICE_DROP_THRESHOLD=0
```

## Paso 4: Iniciar (1 min)

```bash
npm run dev
```

**¡Listo!** El sistema está corriendo en:
- 🌐 Dashboard: http://localhost:3000
- 📱 Telegram: recibirás notificaciones automáticas

## Paso 5: Agregar productos

**Opción A - Desde el Dashboard:**
1. Abre http://localhost:3000
2. Pega una URL de Amazon o Mercado Libre
3. Click en "Rastrear"

**Opción B - Desde terminal:**
```bash
npm run scrape track "https://www.mercadolibre.com.mx/..."
```

## ✅ Verificar que funciona

1. Agrega un producto
2. Espera 5 minutos
3. El sistema detectará el precio y lo guardará
4. Si el precio baja, recibirás notificación en Telegram 🔥

## 💡 Tips

- **Errores de precio:** Se marcan automáticamente cuando hay >50% descuento
- **Cualquier caída:** Con `MIN_DISCOUNT_PERCENT=0` detecta TODO cambio de precio
- **Dashboard:** Actualiza cada 30 segundos automáticamente
- **API:** Usa `curl http://localhost:3000/api/stats` para ver estadísticas

## 🎯 Siguiente paso: Monetizar

### Opción 1: Afiliados
1. Regístrate en Amazon Associates
2. Pega tu tag en `.env` → `AMAZON_AFFILIATE_TAG=tu-tag-20`
3. Comparte las ofertas con tu link

### Opción 2: Revender errores
1. Cuando veas 🚨 en Telegram = PRECIO ERROR
2. Compra rápido antes de que corrijan
3. Revende en marketplace

### Opción 3: Canal Premium
1. Crea canal de Telegram privado
2. Cobra suscripción mensual
3. Comparte ofertas exclusivas

---

**¿Problemas?** Lee el README.md completo
