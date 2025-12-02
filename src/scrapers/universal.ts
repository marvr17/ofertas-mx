import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../db';

/**
 * SCRAPER UNIVERSAL
 * Funciona con CUALQUIER tienda online usando técnicas genéricas
 * Soporta: Apple, Samsung, HP, Xiaomi, Sony, Best Buy, Coppel, y más
 */

export interface UniversalProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl?: string;
  inStock: boolean;
  store: string;
}

/**
 * Detectar tienda por URL
 */
export function detectStore(url: string): string {
  const domain = new URL(url).hostname.toLowerCase();

  const storeMap: { [key: string]: string } = {
    'apple.com': 'apple',
    'samsung.com': 'samsung',
    'hp.com': 'hp',
    'mi.com': 'xiaomi',
    'xiaomi.com': 'xiaomi',
    'sony.com': 'sony',
    'bestbuy.com.mx': 'bestbuy',
    'bestbuy.com': 'bestbuy',
    'coppel.com': 'coppel',
    'liverpool.com.mx': 'liverpool',
    'walmart.com.mx': 'walmart',
    'costco.com.mx': 'costco',
    'sams.com.mx': 'sams',
    'elektra.com.mx': 'elektra',
    'sanborns.com.mx': 'sanborns',
    'office-depot.com.mx': 'officedepot',
  };

  for (const [key, value] of Object.entries(storeMap)) {
    if (domain.includes(key)) {
      return value;
    }
  }

  return 'unknown';
}

/**
 * Scraper Universal - Intenta múltiples estrategias
 */
export async function scrapeUniversalProduct(url: string): Promise<UniversalProduct | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      timeout: 20000,
    });

    const $ = cheerio.load(response.data);
    const store = detectStore(url);

    // ESTRATEGIA 1: JSON-LD (más confiable)
    let productData = extractFromJsonLD($);

    // ESTRATEGIA 2: Open Graph meta tags
    if (!productData.title || !productData.price) {
      const ogData = extractFromOpenGraph($);
      productData = { ...productData, ...ogData };
    }

    // ESTRATEGIA 3: Microdata
    if (!productData.title || !productData.price) {
      const microData = extractFromMicrodata($);
      productData = { ...productData, ...microData };
    }

    // ESTRATEGIA 4: Selectores comunes genéricos
    if (!productData.title || !productData.price) {
      const genericData = extractFromCommonSelectors($);
      productData = { ...productData, ...genericData };
    }

    if (!productData.title || !productData.price) {
      console.error('Could not extract product data from:', url);
      return null;
    }

    return {
      id: generateId(url),
      title: productData.title,
      price: productData.price,
      currency: productData.currency || 'MXN',
      url,
      imageUrl: productData.imageUrl,
      inStock: productData.inStock !== false,
      store,
    };
  } catch (error: any) {
    console.error(`Error scraping ${url}:`, error.message);
    return null;
  }
}

/**
 * ESTRATEGIA 1: Extraer de JSON-LD
 */
function extractFromJsonLD($: cheerio.CheerioAPI): any {
  let result: any = {};

  $('script[type="application/ld+json"]').each((i, elem) => {
    try {
      const data = JSON.parse($(elem).html() || '');

      if (data['@type'] === 'Product' || data['@graph']?.some((item: any) => item['@type'] === 'Product')) {
        const product = data['@type'] === 'Product' ? data : data['@graph'].find((item: any) => item['@type'] === 'Product');

        result.title = product.name;
        result.price = parseFloat(product.offers?.price || product.offers?.[0]?.price || 0);
        result.currency = product.offers?.priceCurrency || product.offers?.[0]?.priceCurrency;
        result.imageUrl = product.image || product.image?.[0];
        result.inStock = product.offers?.availability?.includes('InStock');
      }
    } catch (e) {}
  });

  return result;
}

/**
 * ESTRATEGIA 2: Extraer de Open Graph
 */
function extractFromOpenGraph($: cheerio.CheerioAPI): any {
  return {
    title: $('meta[property="og:title"]').attr('content'),
    imageUrl: $('meta[property="og:image"]').attr('content'),
    price: parseFloat($('meta[property="product:price:amount"]').attr('content') || '0'),
    currency: $('meta[property="product:price:currency"]').attr('content'),
  };
}

/**
 * ESTRATEGIA 3: Extraer de Microdata
 */
function extractFromMicrodata($: cheerio.CheerioAPI): any {
  return {
    title: $('[itemprop="name"]').first().text().trim(),
    price: parseFloat($('[itemprop="price"]').attr('content') || $('[itemprop="price"]').text().trim() || '0'),
    currency: $('[itemprop="priceCurrency"]').attr('content'),
    imageUrl: $('[itemprop="image"]').attr('src') || $('[itemprop="image"]').attr('content'),
    inStock: $('[itemprop="availability"]').attr('content')?.includes('InStock'),
  };
}

/**
 * ESTRATEGIA 4: Selectores comunes genéricos
 */
function extractFromCommonSelectors($: cheerio.CheerioAPI): any {
  // Títulos comunes
  const title =
    $('h1').first().text().trim() ||
    $('.product-title').text().trim() ||
    $('.product-name').text().trim() ||
    $('[data-testid="product-title"]').text().trim();

  // Precios comunes
  const priceSelectors = [
    '.price',
    '.product-price',
    '[data-testid="price"]',
    '.price-current',
    '.sale-price',
    '.current-price',
    '.final-price',
    '[data-price]',
  ];

  let priceText = '';
  for (const selector of priceSelectors) {
    const text = $(selector).first().text().trim() || $(selector).first().attr('data-price');
    if (text && parsePrice(text) > 0) {
      priceText = text;
      break;
    }
  }

  // Imágenes comunes
  const imageUrl =
    $('img.product-image').attr('src') ||
    $('.main-image img').attr('src') ||
    $('[data-testid="product-image"]').attr('src');

  return {
    title,
    price: parsePrice(priceText),
    imageUrl,
  };
}

function parsePrice(priceText: string): number {
  if (!priceText) return 0;
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(',', '');
  return parseFloat(normalized) || 0;
}

function generateId(url: string): string {
  return Buffer.from(url).toString('base64').substring(0, 20);
}

/**
 * Track any product from any store
 */
export async function trackUniversalProduct(url: string) {
  const productData = await scrapeUniversalProduct(url);
  if (!productData) {
    throw new Error('Could not fetch product data from this store');
  }

  let product = await prisma.product.findUnique({
    where: { url },
    include: {
      prices: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  if (!product) {
    product = await prisma.product.create({
      data: {
        url,
        title: productData.title,
        store: productData.store,
        externalId: productData.id,
        currentPrice: productData.price,
        currency: productData.currency,
        imageUrl: productData.imageUrl,
        inStock: productData.inStock,
        prices: {
          create: {
            price: productData.price,
            inStock: productData.inStock,
          },
        },
      },
      include: {
        prices: true,
      },
    });

    console.log(`[${productData.store.toUpperCase()}] New product tracked: ${productData.title}`);
  } else {
    const lastPrice = product.prices[0]?.price;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        currentPrice: productData.price,
        inStock: productData.inStock,
        lastChecked: new Date(),
        prices: {
          create: {
            price: productData.price,
            inStock: productData.inStock,
          },
        },
      },
    });

    console.log(
      `[${productData.store.toUpperCase()}] Updated: ${productData.title} - ${productData.currency} ${productData.price}`
    );

    if (lastPrice && lastPrice !== productData.price) {
      const discountPercent = ((lastPrice - productData.price) / lastPrice) * 100;

      if (discountPercent > 0) {
        const isError = discountPercent > 50;

        await prisma.offer.create({
          data: {
            productId: product.id,
            oldPrice: lastPrice,
            newPrice: productData.price,
            discountPercent,
            isError,
          },
        });

        console.log(
          `[${productData.store.toUpperCase()}] ${isError ? '🚨 ERROR' : '💰 OFFER'}: ${discountPercent.toFixed(2)}% off`
        );
      }
    }
  }

  return product;
}
