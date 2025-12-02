# 🎯 Mejores Prácticas y Consejos Pro

## ⚡ Optimización de Scraping

### 1. Rate Limiting - No Ser Bloqueado

**Problema:** Amazon/ML te bloquean si haces demasiadas requests.

**Solución:**

```typescript
// En worker.ts, ya implementado:
await delay(2000); // 2 segundos entre requests
```

**Recomendaciones:**
- Mercado Libre: 2-3 segundos entre requests (max ~20 req/min)
- Amazon: 5-10 segundos (son más estrictos)
- Nunca >100 productos al mismo tiempo

### 2. Usar Proxies (Avanzado)

**Para Amazon:**

```bash
npm install axios-proxy-fix
```

```typescript
// En amazon.ts:
const response = await axios.get(url, {
  proxy: {
    host: 'proxy.example.com',
    port: 8080,
    auth: {
      username: 'user',
      password: 'pass'
    }
  }
});
```

**Servicios de proxies:**
- Bright Data (caro pero confiable)
- SmartProxy
- Oxylabs
- ProxyScrape (gratis, menos confiable)

### 3. Rotar User Agents

```typescript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36',
  // ... más UAs
];

const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];
```

---

## 💰 Monetización Efectiva

### Estrategia 1: Afiliados (Bajo Riesgo)

**Comisiones típicas:**
- Amazon: 1-10% dependiendo categoría
- Mercado Libre: 2-8%

**Cálculo:**
- 1000 clicks/mes × 3% conversión = 30 ventas
- Ticket promedio $500 × 5% comisión = $25/venta
- **Ingreso mensual: $750**

**Para escalar:**
- Canal de Telegram con 5k+ seguidores
- Nicho específico (tech, gaming, moda)
- Contenido de valor (no solo spam de ofertas)

### Estrategia 2: Reventa de Errores (Alto Riesgo, Alta Recompensa)

**Requisitos:**
- Capital inicial: $5,000-10,000 USD
- Tarjetas con alto límite
- Cuenta de revendedor

**Proceso:**
1. Detecta error >50%
2. Compra máximo permitido (rápido!)
3. Espera confirmación de envío
4. Publica en Marketplace
5. Vende con 20-40% descuento vs precio real

**Riesgos:**
- Amazon puede cancelar orden
- Producto defectuoso
- Demora en venta
- Inversión bloqueada

**Mitigación:**
- Diversifica (varios productos)
- Vende rápido (no acumules)
- Verifica reviews antes de comprar

### Estrategia 3: Suscripción Premium

**Modelo:**
- Básico gratis: ofertas con 1 hora de delay
- Premium $10/mes: alertas instantáneas
- VIP $50/mes: errores de precio + análisis

**Cómo implementar:**
```typescript
// Dos canales de Telegram:
const FREE_CHAT_ID = '@ofertas_basico';
const PREMIUM_CHAT_ID = '-100xxxxxxxxx'; // privado

// En offerDetector.ts:
if (offer.isError) {
  await sendToChannel(PREMIUM_CHAT_ID, offer); // inmediato
  setTimeout(() => {
    sendToChannel(FREE_CHAT_ID, offer); // 1 hora después
  }, 3600000);
}
```

**Marketing:**
- Mostrar casos de éxito
- "Este mes encontramos $50k en errores"
- Garantía de devolución 7 días

---

## 🎯 Qué Productos Rastrear

### Alto Potencial (Errores Frecuentes):

1. **Electrónica de Alta Gama**
   - Macbooks, iPads, iPhones
   - Consolas (PS5, Xbox, Switch)
   - TVs >55"
   - Cámaras profesionales

2. **Productos Nuevos**
   - Primeras 48h del lanzamiento
   - Vendedores ajustando precios
   - Errores de conversión de moneda

3. **Fechas Clave**
   - Black Friday (más errores)
   - Cyber Monday
   - El Buen Fin (México)
   - Prime Day

4. **Productos Importados**
   - Precio cambia con tipo de cambio
   - A veces olvidan actualizar

### Bajo Potencial (Evitar):

- Productos <$50 (margen bajo)
- Ropa (tallas, devoluciones)
- Comida/perecederos
- Libros digitales

---

## 🚀 Escalando el Sistema

### De 10 a 1000 Productos

**Problema 1: Base de datos lenta**

```bash
# Migra a PostgreSQL
npm install pg

# En prisma.config.ts:
datasource: {
  url: "postgresql://user:pass@localhost/ofertas"
}
```

**Problema 2: Scraping tarda mucho**

```typescript
// Paralelizar scraping:
const chunks = chunkArray(products, 10); // 10 a la vez

for (const chunk of chunks) {
  await Promise.all(
    chunk.map(p => trackProduct(p.url))
  );
  await delay(5000); // pausa entre chunks
}
```

**Problema 3: Muchas notificaciones**

```typescript
// Filtrar ofertas por calidad:
if (offer.discountPercent < 20) return; // solo >20%
if (offer.newPrice > 10000) return; // solo productos caros
if (!isReliableSeller(offer.product)) return; // solo vendedores top
```

### Infraestructura Profesional

**Para 10k+ productos:**

```
┌─────────────┐
│   Cloudflare │ → CDN para dashboard
└─────────────┘
       │
┌─────────────┐
│  VPS/Cloud  │ → App principal
│  (AWS/DO)   │
└─────────────┘
       │
┌─────────────┐
│  PostgreSQL │ → Base de datos
│   + Redis   │ → Cache
└─────────────┘
       │
┌─────────────┐
│ ScraperAPI  │ → Proxies rotatorios
└─────────────┘
```

**Costos mensuales:**
- VPS: $20-50
- PostgreSQL: $15-30
- ScraperAPI: $50-200
- **Total: ~$100-300/mes**

---

## 🔒 Seguridad

### 1. No Commitear Secretos

```bash
# Ya está en .gitignore:
.env
*.db
```

**Verifica antes de push:**
```bash
git diff # revisa cambios
grep -r "TELEGRAM_BOT_TOKEN" . # busca tokens expuestos
```

### 2. Validar Entrada de Usuario

```typescript
// En api/server.ts:
app.post('/api/products/track', async (req, res) => {
  const { url } = req.body;

  // Validar URL
  if (!isValidUrl(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Sanitizar
  const cleanUrl = sanitizeUrl(url);
});
```

### 3. Rate Limiting en API

```bash
npm install express-rate-limit
```

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 requests
});

app.use('/api/', limiter);
```

---

## 📊 Monitoreo

### Logs Estructurados

```typescript
// Crea src/utils/logger.ts:
export function log(level: string, message: string, data?: any) {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    message,
    ...data
  }));
}

// Uso:
log('info', 'Product tracked', { productId: 123, price: 999 });
log('error', 'Scraping failed', { url, error: err.message });
```

### Alertas de Sistema

```typescript
// Notifica si algo falla:
async function checkSystemHealth() {
  const lastScrape = await prisma.product.findFirst({
    orderBy: { lastChecked: 'desc' }
  });

  const minutesSinceLastScrape =
    (Date.now() - lastScrape.lastChecked.getTime()) / 60000;

  if (minutesSinceLastScrape > 30) {
    await sendCustomMessage('⚠️ Sistema no está scrapeando! Revisar.');
  }
}

// Ejecutar cada hora
cron.schedule('0 * * * *', checkSystemHealth);
```

---

## ⚖️ Legal

### Términos de Servicio

**Amazon:**
- ❌ Web scraping prohibido en ToS
- ✅ Alternativa: Product Advertising API
- ⚠️ Riesgo: Bloqueo de IP/cuenta

**Mercado Libre:**
- ✅ API pública disponible (USALA)
- ✅ Scraping tolerado si no abusas
- ⚠️ Rate limits estrictos

### Programa de Afiliados

**Requisitos:**
- ✅ Declarar enlaces de afiliado
- ✅ No ocultar que ganas comisión
- ❌ No hacer click fraud

**Mejores prácticas:**
- Agrega "Enlace de afiliado" en descripciones
- No manipules precios/reviews
- Sé transparente con tu audiencia

### Reventa

**México:**
- ✅ Legal revender productos nuevos
- ✅ Debes emitir factura si es negocio
- ⚠️ Verifica garantías (algunas no aplican)

**Tip:** Consulta contador para obligaciones fiscales.

---

## 🎓 Recursos

### APIs Oficiales

- [Amazon Product API](https://affiliate-program.amazon.com/help/operating/api)
- [Mercado Libre API](https://developers.mercadolibre.com/)

### Herramientas

- [Keepa](https://keepa.com) - Histórico de precios Amazon
- [CamelCamelCamel](https://camelcamelcamel.com) - Tracker Amazon
- [ScraperAPI](https://scraperapi.com) - Proxies para scraping

### Comunidades

- r/beermoney - Ideas de monetización
- r/flipping - Reventa
- r/entrepreneur - Negocios online

---

## 🔥 Checklist de Éxito

- [ ] Sistema corriendo 24/7 (VPS o PC siempre prendida)
- [ ] Mínimo 50 productos trackeados
- [ ] Notificaciones de Telegram funcionando
- [ ] Enlaces de afiliado configurados
- [ ] Backup de base de datos diario
- [ ] Monitoreo de errores
- [ ] Plan de monetización claro
- [ ] Audiencia (canal/grupo/blog)

---

**Última recomendación:**

El éxito en esto es **velocidad + volumen**:
- Trackea MUCHOS productos
- Actúa RÁPIDO en errores
- Comparte/vende ofertas RÁPIDO

El primero en llegar se lleva la ganancia 🏆
