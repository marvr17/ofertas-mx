# 📚 Ejemplos de Uso

## 🛒 Ejemplo 1: Rastrear productos de Mercado Libre

### Buscar productos por keyword:

```bash
# Buscar iPhones en México
npm run scrape search "iphone 15 pro" MLM

# Buscar en Argentina
npm run scrape search "playstation 5" MLA

# Buscar en Brasil
npm run scrape search "macbook" MLB
```

### Rastrear un producto específico:

```bash
npm run scrape track "https://www.mercadolibre.com.mx/apple-iphone-15-pro-max-256-gb-titanio-azul/p/MLM1028262343"
```

**Qué pasa después:**
1. El producto se guarda en la base de datos
2. Cada 5 minutos se revisa el precio
3. Si baja, se crea una oferta
4. Recibes notificación en Telegram

---

## 🛍️ Ejemplo 2: Rastrear productos de Amazon

```bash
npm run scrape track "https://www.amazon.com.mx/dp/B0CHJX4KD7"
```

**Nota:** Amazon es más restrictivo. Si te bloquean:
1. Aumenta el intervalo en `.env`: `SCRAPE_INTERVAL_AMAZON=15`
2. Considera usar proxies
3. O usa Product Advertising API

---

## 💰 Ejemplo 3: Monetización con Afiliados

### Setup Amazon Associates:

1. Regístrate en https://affiliate-program.amazon.com.mx/
2. Obtén tu tag (ej: `misdesuentos-20`)
3. Agrégalo en `.env`:
```env
AMAZON_AFFILIATE_TAG=misdesuentos-20
```

### Setup Mercado Libre:

1. Regístrate en https://www.mercadolibre.com.mx/afiliados
2. Obtén tu ID
3. Agrégalo en `.env`:
```env
ML_AFFILIATE_ID=tu_id_aqui
```

**Automático:** Todos los enlaces en Telegram ya tendrán tu código de afiliado.

---

## 🚨 Ejemplo 4: Cazar Errores de Precio

### Configuración agresiva:

En `.env`:
```env
# Detecta CUALQUIER caída de precio
MIN_DISCOUNT_PERCENT=0
PRICE_DROP_THRESHOLD=0

# Revisa cada 3 minutos (más rápido = más chances)
SCRAPE_INTERVAL_ML=3
SCRAPE_INTERVAL_AMAZON=5
```

### Qué productos rastrear:

**Alto potencial de errores:**
- Electrónica (TVs, laptops, consolas)
- Artículos caros (>$500 USD)
- Productos recién lanzados
- Black Friday / Cyber Monday

**Ejemplo:**
```bash
# Rastrear TVs de alta gama
npm run scrape search "samsung qled 65" MLM
# Luego trackea los top 3 más caros
npm run scrape track "URL_1"
npm run scrape track "URL_2"
npm run scrape track "URL_3"
```

---

## 📊 Ejemplo 5: Usar la API

### Ver estadísticas:

```bash
curl http://localhost:3000/api/stats
```

**Respuesta:**
```json
{
  "totalProducts": 15,
  "totalOffers": 8,
  "errorPrices": 2,
  "trackedStores": [
    {"store": "mercadolibre", "count": 10},
    {"store": "amazon", "count": 5}
  ]
}
```

### Rastrear producto vía API:

```bash
curl -X POST http://localhost:3000/api/products/track \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.mercadolibre.com.mx/..."}'
```

### Ver todas las ofertas:

```bash
curl http://localhost:3000/api/offers?limit=20
```

### Ver solo errores de precio:

```bash
curl http://localhost:3000/api/offers?onlyErrors=true
```

---

## 🤖 Ejemplo 6: Integración con otros bots

### Enviar a Discord con webhook:

Modifica `src/services/telegram.ts` para también enviar a Discord:

```typescript
import axios from 'axios';

export async function sendDiscordNotification(offer: any, webhookUrl: string) {
  await axios.post(webhookUrl, {
    content: `🚨 Nueva oferta: ${offer.product.title}`,
    embeds: [{
      title: offer.product.title,
      description: `${offer.discountPercent}% OFF`,
      color: offer.isError ? 0xff4757 : 0x2ed573,
      fields: [
        { name: 'Precio anterior', value: `$${offer.oldPrice}`, inline: true },
        { name: 'Precio actual', value: `$${offer.newPrice}`, inline: true },
      ],
      url: offer.affiliateLink,
    }],
  });
}
```

---

## 🎯 Ejemplo 7: Canal de Telegram Premium

### Setup:

1. **Crear canal privado en Telegram:**
   - Abre Telegram
   - Nueva → Nuevo Canal
   - Nombre: "Ofertas VIP"
   - Tipo: Privado

2. **Agregar el bot:**
   - Ajustes del canal → Administradores
   - Agregar tu bot
   - Dale permisos de "Publicar mensajes"

3. **Obtener Chat ID del canal:**
```bash
# Envía un mensaje de prueba desde el bot al canal
# Luego visita:
https://api.telegram.org/bot<TU_TOKEN>/getUpdates

# Busca "chat":{"id":-100xxxxxxxxx}
```

4. **Actualizar .env:**
```env
TELEGRAM_CHAT_ID=-100xxxxxxxxx
```

### Monetización:

- Cobra $5-10 USD/mes por acceso
- Promesa: "Acceso a errores de precio antes que nadie"
- 100 suscriptores = $500-1000/mes pasivo

---

## ⚡ Ejemplo 8: Automatización Total

### Rastrear top 100 productos automáticamente:

Crea `scripts/auto-track.ts`:

```typescript
import { searchMercadoLibre } from '../src/scrapers/mercadolibre';
import { trackMLProduct } from '../src/scrapers/mercadolibre';

async function autoTrack() {
  const keywords = [
    'iphone',
    'macbook',
    'playstation',
    'xbox',
    'nintendo switch',
    'airpods',
    'samsung galaxy',
  ];

  for (const keyword of keywords) {
    const products = await searchMercadoLibre(keyword, 'MLM', 10);

    for (const product of products) {
      try {
        await trackMLProduct(product.permalink);
        console.log(`✅ Tracked: ${product.title}`);
        await delay(3000); // 3 segundos entre requests
      } catch (error) {
        console.error(`❌ Failed: ${product.title}`);
      }
    }
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

autoTrack();
```

Ejecuta:
```bash
tsx scripts/auto-track.ts
```

---

## 📈 Ejemplo 9: Análisis de tendencias

### Ver histórico de un producto:

```bash
curl http://localhost:3000/api/products/PRODUCT_ID
```

**Te muestra:**
- Precio actual
- Todos los precios históricos
- Todas las ofertas detectadas
- Patrón de precios

**Usa esto para:**
- Identificar cuándo suelen bajar precios
- Detectar ciclos (ej: baja cada viernes)
- Predecir futuras ofertas

---

## 🔥 Caso de Uso Real

**Escenario:** Revendedor de electrónica

```bash
# 1. Trackear 50 productos de electrónica
npm run scrape search "macbook air m2" MLM
npm run scrape search "ipad pro" MLM
# ... trackear los top productos

# 2. El sistema detecta: MacBook bajó de $25,000 a $12,500 🚨
# Notificación en Telegram: "PRECIO ERROR"

# 3. Compras 3 unidades = $37,500

# 4. Amazon corrige el precio en 2 horas

# 5. Vendes en Marketplace por $23,000 c/u = $69,000

# 💰 Ganancia: $31,500 en un día
```

**Esto pasa más seguido de lo que crees:**
- Black Friday
- Errores de sistema
- Actualizaciones de inventario
- Conversiones de moneda mal configuradas

---

## 💡 Pro Tips

1. **Trackea muchos productos:** Más productos = más chances de error
2. **Actúa rápido:** Los errores se corrigen en 1-4 horas
3. **Verifica stock:** A veces el error es solo display
4. **Usa múltiples tarjetas:** Para límites de compra
5. **Automatiza todo:** Mientras duermes, el bot trabaja

---

¿Más ideas? El límite es tu creatividad 🚀
