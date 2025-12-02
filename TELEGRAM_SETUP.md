# 📱 Configuración de Telegram - Guía Paso a Paso

## ¿Por qué Telegram?

✅ **Notificaciones instantáneas** Push a tu celular
✅ **Gratis** - Sin límites de mensajes
✅ **API sencilla** - Fácil de usar
✅ **Canales públicos/privados** - Monetizable
✅ **Bots interactivos** - Responde comandos

---

## Opción 1: Notificaciones Personales (Rápido - 3 minutos)

### Paso 1: Crear el Bot

1. **Abre Telegram** en tu celular o https://web.telegram.org

2. **Busca** `@BotFather` en el buscador

3. **Inicia chat** con BotFather (click en START)

4. **Envía** el comando:
   ```
   /newbot
   ```

5. **Responde** las preguntas:
   - **Nombre del bot:** `Mis Ofertas Bot` (o el que quieras)
   - **Username:** `mis_ofertas_bot` (debe terminar en "bot")

6. **Copia el TOKEN** que te da. Se ve así:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
   ```

### Paso 2: Obtener tu Chat ID

**Método A - Usando un Bot (Más Fácil):**

1. **Busca** `@userinfobot` en Telegram

2. **Envía** `/start`

3. **Copia** el número que te da (tu Chat ID)
   ```
   Id: 987654321
   ```

**Método B - Usando la API:**

1. **Envía** un mensaje a tu bot (búscalo por el username que creaste)

2. **Abre** en tu navegador (reemplaza `TU_TOKEN`):
   ```
   https://api.telegram.org/botTU_TOKEN_AQUI/getUpdates
   ```

3. **Busca** en el JSON:
   ```json
   "chat": {
     "id": 987654321
   }
   ```

### Paso 3: Configurar en la App

1. **Abre** `.env` en el proyecto

2. **Pega** tu configuración:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz-1234567
   TELEGRAM_CHAT_ID=987654321
   ```

3. **Guarda** el archivo

### Paso 4: Probar

```bash
npm run dev
```

Si todo está bien, verás:
```
✅ Telegram bot initialized
✅ API server running on http://localhost:3001
```

---

## Opción 2: Canal Público (Para compartir ofertas)

### Paso 1: Crear Canal

1. **En Telegram** → Nueva → Nuevo Canal

2. **Nombre:** `Ofertas Tech MX` (tu elección)

3. **Descripción:**
   ```
   🔥 Ofertas y errores de precio en tiempo real
   📱 Electrónica, gadgets y más
   💰 Ahorra hasta 70% OFF
   ```

4. **Tipo:** Canal **PÚBLICO**

5. **Username:** `@ofertas_tech_mx` (tu elección, debe ser único)

### Paso 2: Agregar el Bot como Administrador

1. **Abre** el canal que creaste

2. **Click** en el nombre del canal (arriba)

3. **Administradores** → Agregar Administrador

4. **Busca** tu bot (por username)

5. **Dale permisos:**
   - ✅ Publicar mensajes
   - ❌ Lo demás no es necesario

### Paso 3: Obtener Chat ID del Canal

**El Chat ID es:** `@tu_username_del_canal`

Ejemplo:
```env
TELEGRAM_CHAT_ID=@ofertas_tech_mx
```

**O obtén el ID numérico:**

1. **Envía** un mensaje al canal desde el bot (puedes hacerlo desde código)

2. **Abre:**
   ```
   https://api.telegram.org/botTU_TOKEN/getUpdates
   ```

3. **Busca** el `chat.id` (será negativo, ej: `-1001234567890`)

4. **Usa ese ID:**
   ```env
   TELEGRAM_CHAT_ID=-1001234567890
   ```

---

## Opción 3: Canal Privado (Para monetizar)

### Paso 1: Crear Canal Privado

1. **Nueva** → Nuevo Canal

2. **Nombre:** `Ofertas VIP`

3. **Tipo:** **PRIVADO**

4. **NO** le pongas username

### Paso 2: Agregar Bot

1. **Administradores** → Agregar

2. **Busca** tu bot

3. **Dale permisos** de publicar mensajes

### Paso 3: Obtener Chat ID

**Para canales privados, DEBES usar el ID numérico:**

1. **Envía** un mensaje de prueba al canal manualmente

2. **O** ejecuta este código temporal:

   Crea `test-telegram.ts`:
   ```typescript
   import TelegramBot from 'node-telegram-bot-api';

   const bot = new TelegramBot('TU_TOKEN_AQUI', { polling: true });

   bot.on('channel_post', (msg) => {
     console.log('Chat ID del canal:', msg.chat.id);
     process.exit(0);
   });

   console.log('Esperando mensaje en el canal...');
   ```

   ```bash
   tsx test-telegram.ts
   ```

3. **Envía** un mensaje cualquiera al canal

4. **Copia** el ID que aparece (será negativo)

5. **Usa ese ID:**
   ```env
   TELEGRAM_CHAT_ID=-1001234567890
   ```

---

## Verificar que Funciona

### Prueba Rápida:

```bash
npm run dev
```

Agrega un producto:
```bash
npm run scrape track "https://www.mercadolibre.com.mx/producto-cualquiera"
```

Espera 1-2 minutos. Si el sistema detecta un cambio de precio (o si es la primera vez), debería enviarte una notificación a Telegram!

---

## Troubleshooting

### ❌ "Telegram not configured, skipping notification"

**Problema:** Token o Chat ID vacíos

**Solución:**
- Verifica que `.env` tenga ambos valores
- Asegúrate de no tener espacios extra
- Reinicia el servidor (`npm run dev`)

### ❌ "Failed to send Telegram message: 400 Bad Request"

**Problema:** Chat ID incorrecto

**Solución:**
- Verifica el Chat ID
- Para canales, debe ser negativo `-100...`
- Para usuarios, positivo `123...`

### ❌ "Failed to send Telegram message: 403 Forbidden"

**Problema:** El bot no tiene permisos

**Solución:**
- Si es canal: agrega el bot como administrador
- Si es chat personal: envía `/start` a tu bot primero

### ❌ No recibo notificaciones

**Problema:** El sistema no está corriendo o no hay ofertas

**Solución:**
```bash
# Verifica que el sistema esté corriendo
npm run dev

# Verifica ofertas detectadas
npm run scrape offers

# Si no hay ofertas, agrega más productos
npm run scrape track "URL_AQUI"
```

---

## Personalizar Mensajes

Edita `src/services/telegram.ts`:

```typescript
const message = `
🚨 OFERTA DETECTADA!

📦 ${product.title}

💵 Antes: $${offer.oldPrice}
🔥 Ahora: $${offer.newPrice}
💰 Ahorras: $${(offer.oldPrice - offer.newPrice).toFixed(2)} (${offer.discountPercent.toFixed(0)}%)

🏪 Tienda: ${product.store.toUpperCase()}

🛒 Comprar: ${affiliateLink}

⚡ ¡Aprovecha antes de que se acabe!
`.trim();
```

---

## Comandos del Bot (Opcional)

Puedes hacer que tu bot responda comandos:

```typescript
// En telegram.ts
bot.onText(/\/stats/, async (msg) => {
  const stats = await getStats();
  bot.sendMessage(msg.chat.id, `
📊 Estadísticas:
- Productos: ${stats.totalProducts}
- Ofertas: ${stats.totalOffers}
- Errores: ${stats.errorPrices}
  `);
});
```

Configura en BotFather:
```
/setcommands

stats - Ver estadísticas
ofertas - Ver últimas ofertas
ayuda - Ayuda
```

---

## Monetización con Telegram

### 1. Canal Gratis + Afiliados
- Comparte ofertas públicamente
- Ganas por comisiones de afiliado
- Crece audiencia orgánicamente

### 2. Canal Premium
- Gratis: Ofertas con 1 hora delay
- Premium ($10/mes): Alertas instantáneas + errores de precio
- Usa bots como `@SphinxBot` para gestionar pagos

### 3. Grupo VIP
- Crea grupo privado
- Cobra entrada única ($50)
- Acceso de por vida a errores de precio

---

## FAQ

**¿Puedo usar el mismo bot para varios canales?**
Sí, pero tendrás que modificar el código para enviar a múltiples chat IDs.

**¿Cuántos mensajes puedo enviar?**
Telegram tiene límite de ~30 mensajes/segundo. Para uso normal, nunca lo alcanzarás.

**¿Puedo agregar imágenes?**
Sí! Usa `bot.sendPhoto()` en lugar de `sendMessage()`.

**¿El bot puede responder mensajes de usuarios?**
Sí, con `bot.on('message', ...)` puedes hacer bots interactivos.

---

## Siguiente Paso

Una vez configurado, ve a `PRODUCTOS_INTERESANTES.md` para saber qué productos trackear! 🎯
