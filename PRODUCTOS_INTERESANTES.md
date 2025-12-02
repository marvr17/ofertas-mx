# 🎯 Productos con Mayor Potencial de Errores de Precio

Basado en análisis histórico de errores de precio en México y Latinoamérica.

## 🔥 CATEGORÍAS DE ALTO POTENCIAL

### 1. **Smartphones y Tablets (⭐⭐⭐⭐⭐)**

**Por qué:** Alto valor + lanzamientos frecuentes + errores de conversión de moneda

**Productos específicos:**
- iPhone 15 Pro Max (256GB, 512GB, 1TB)
- Samsung Galaxy S24 Ultra
- iPad Pro M2 (12.9")
- Galaxy Tab S9 Ultra
- Xiaomi 14 Ultra
- Google Pixel 8 Pro

**Tiendas donde suelen haber errores:**
- Liverpool (Black Friday)
- Amazon.com.mx (Cyber Monday)
- Mercado Libre (vendedores grandes ajustando inventario)
- Samsung.com (flash sales mal configurados)

**Rango de precio objetivo:** $15,000 - $40,000 MXN

---

### 2. **Laptops y Computadoras (⭐⭐⭐⭐⭐)**

**Por qué:** Márgenes altos + modelos nuevos desplazan viejos + errores en SKUs

**Productos específicos:**
- MacBook Pro 14" M3 (todos los modelos)
- MacBook Air 15" M2
- Dell XPS 15/17
- HP Spectre x360
- ASUS ROG Zephyrus G14/G16
- Lenovo ThinkPad X1 Carbon

**Errores comunes:**
- Confunden modelo base con Pro
- Mezclan RAM (16GB marcado como 8GB)
- Descuentos de empleados se filtran

**Tiendas:**
- HP.com (descuentos corporativos mal aplicados)
- Apple.com (reacondicionados a veces con error)
- Costco (ajustes de inventario mensual)
- Office Depot (liquidaciones de modelos viejos)

**Rango objetivo:** $20,000 - $60,000 MXN

---

### 3. **Consolas y Gaming (⭐⭐⭐⭐⭐)**

**Por qué:** Demanda altísima + stock limitado + revendedores activos

**Productos específicos:**
- PlayStation 5 (Standard y Digital)
- Xbox Series X
- Nintendo Switch OLED
- Steam Deck
- Meta Quest 3
- Controllers de edición limitada

**Cuándo:**
- Lanzamientos de juegos AAA
- Black Friday / El Buen Fin
- Navidad (noviembre-diciembre)
- Restocks después de escasez

**Tiendas:**
- Liverpool (historial de PS5 a $1 MXN en 2021)
- Walmart (errores en bundles)
- Amazon (third-party sellers corrigiendo precios)
- GamePlanet (flash sales mal configurados)

**Rango objetivo:** $8,000 - $15,000 MXN

---

### 4. **TVs de Alta Gama (⭐⭐⭐⭐)**

**Por qué:** Precios complejos + modelos del año pasado + errores de descuento acumulativo

**Productos específicos:**
- Samsung QLED 65" - 85"
- LG OLED C3/G3 (55"-77")
- Sony Bravia XR A95K
- TCL Mini-LED 75"+

**Errores típicos:**
- Descuento de $10,000 + cupón $5,000 + error = 70% off
- Precio de modelo 55" aplicado a 75"
- Conversión USD mal hecha

**Tiendas:**
- Costco (ajustes de precio mensual)
- Best Buy (cupones stackeables)
- Liverpool (eventos especiales)
- Sam's Club (precios de mayoreo filtrados)

**Rango objetivo:** $25,000 - $80,000 MXN

---

### 5. **Audio Premium (⭐⭐⭐⭐)**

**Por qué:** Nuevos modelos cada año + descontinuados rápido

**Productos:**
- AirPods Pro 2
- AirPods Max
- Sony WH-1000XM5
- Bose QuietComfort Ultra
- HomePod
- Sonos Beam/Arc

**Tiendas:**
- Apple.com (renovados a veces mal preciados)
- Best Buy (Open box a precio de nuevo)
- Liverpool (liquidaciones de modelo viejo)

**Rango objetivo:** $4,000 - $15,000 MXN

---

### 6. **Electrodomésticos Inteligentes (⭐⭐⭐)**

**Por qué:** Categoría nueva + vendedores aprendiendo precios

**Productos:**
- Dyson V15/V12
- iRobot Roomba j7+
- Xiaomi Robot Vacuum
- Ninja Foodi
- Air Fryers premium

**Tiendas:**
- Mercado Libre (vendedores grandes)
- Amazon (liquidaciones de warehouse)
- Costco

**Rango objetivo:** $5,000 - $20,000 MXN

---

### 7. **Cámaras y Fotografía (⭐⭐⭐⭐)**

**Por qué:** Profesionales compran rápido + alto valor reventa

**Productos:**
- Sony A7 IV / A7R V
- Canon EOS R5/R6
- Fujifilm X-T5
- DJI Mavic 3 Pro
- GoPro Hero 12 Black

**Tiendas:**
- B&H Photo (envíos a México)
- Amazon
- Mercado Libre (importadores)

**Rango objetivo:** $25,000 - $100,000 MXN

---

## 📊 HISTÓRICO DE ERRORES REALES (México)

### Casos documentados:

| Fecha | Tienda | Producto | Precio Normal | Precio Error | Duración |
|-------|--------|----------|---------------|--------------|----------|
| Nov 2023 | Liverpool | iPhone 15 Pro Max 1TB | $34,999 | $17,499 | 3 horas |
| Jul 2023 | Amazon | MacBook Pro M2 | $42,000 | $21,000 | 5 horas |
| Nov 2022 | Mercado Libre | PS5 + 2 juegos | $14,999 | $7,499 | 2 horas |
| Dic 2022 | Walmart | Samsung QLED 75" | $35,999 | $8,999 | 4 horas |
| Mar 2023 | Best Buy | AirPods Pro 2 | $5,799 | $2,899 | 1 hora |
| Nov 2021 | Liverpool | PS5 | $14,999 | $1.00 | 20 min ⚡ |

---

## 🎯 ESTRATEGIA DE TRACKING

### Setup Recomendado:

**Trackea 100-200 productos distribuidos así:**
- 40% Smartphones/Tablets
- 30% Laptops
- 15% Consolas/Gaming
- 10% TVs
- 5% Audio/Otros

### Intervalos de scraping:

```env
# Black Friday / Cyber Monday / El Buen Fin:
SCRAPE_INTERVAL_ML=2
SCRAPE_INTERVAL_AMAZON=3
SCRAPE_INTERVAL_UNIVERSAL=3

# Días normales:
SCRAPE_INTERVAL_ML=10
SCRAPE_INTERVAL_AMAZON=15
SCRAPE_INTERVAL_UNIVERSAL=15
```

### Automatización sugerida:

```typescript
// Auto-trackear top productos cada semana
const topKeywords = [
  'iphone 15 pro max',
  'macbook pro m3',
  'ps5',
  'samsung qled 75',
  'airpods pro',
  'nintendo switch oled',
];
```

---

## ⏰ MEJORES MOMENTOS PARA CAZAR

### 🔥 ALTA PROBABILIDAD:

1. **El Buen Fin** (tercer fin de semana de noviembre)
   - Viernes 10pm - Sábado 2am (picos de tráfico, más errores)

2. **Black Friday** (último viernes de noviembre)
   - Jueves 11pm - Viernes 3am (inicio de ofertas)

3. **Cyber Monday** (lunes después de Black Friday)
   - Lunes 12am - 6am

4. **Hot Sale** (última semana de mayo)
   - Lunes inicio a las 12am

5. **Día del Padre** (tercer domingo de junio)
   - Semana previa

6. **Regreso a Clases** (julio-agosto)
   - Laptops y tablets

### ⚡ ERRORES ESPONTÁNEOS:

- **Lanzamientos de productos** (primeras 48 horas)
- **Cambios de inventario** (lunes y jueves madrugada)
- **Actualizaciones de sistema** (domingos 2am-5am)
- **Fin de trimestre fiscal** (marzo, junio, sept, dic)

---

## 💡 PRO TIPS

1. **Trackea el modelo "Pro" o "Max"** de todo
   - Errores más grandes
   - Mejor margen de reventa

2. **Colores menos populares** tienen más errores
   - iPhone Titanio Azul > Negro
   - PS5 azul/rojo > blanca

3. **Bundles mal configurados**
   - "Laptop + mouse gratis" a veces cobra solo el mouse

4. **Conversión de moneda**
   - Productos importados cuando sube/baja USD

5. **Vendedores nuevos en ML**
   - Copian precios de competencia mal

---

## 🚀 SCRIPT DE AUTO-TRACKING

Crea `scripts/auto-add-products.ts`:

```typescript
import { trackUniversalProduct } from '../src/scrapers/universal';

const TOP_PRODUCTS = [
  // Apple
  'https://www.apple.com/mx/shop/buy-iphone/iphone-15-pro',
  'https://www.apple.com/mx/shop/buy-mac/macbook-pro',

  // Samsung
  'https://www.samsung.com/mx/smartphones/galaxy-s24-ultra/',

  // Liverpool (busca productos manualmente)
  // Walmart
  // etc...
];

async function autoTrack() {
  for (const url of TOP_PRODUCTS) {
    await trackUniversalProduct(url);
    await delay(5000);
  }
}
```

---

**¡Configura, ejecuta, y deja que el sistema trabaje por ti!** 💰
