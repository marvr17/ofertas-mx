import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../db';

export interface WalmartProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  originalPrice?: number;
  url: string;
  imageUrl?: string;
  inStock: boolean;
}

/**
 * Scrape Walmart product by URL
 */
export async function scrapeWalmartProduct(url: string): Promise<WalmartProduct | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-MX,es;q=0.9',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);

    // Walmart a veces renderiza con JS, buscar datos en script tags
    let productData: any = null;

    // Buscar JSON-LD
    $('script[type="application/ld+json"]').each((i, elem) => {
      try {
        const data = JSON.parse($(elem).html() || '');
        if (data['@type'] === 'Product') {
          productData = data;
        }
      } catch (e) {}
    });

    let title = '';
    let price = 0;
    let originalPrice = undefined;
    let imageUrl = undefined;
    let inStock = true;

    if (productData) {
      // Use structured data
      title = productData.name;
      price = parseFloat(productData.offers?.price || 0);
      imageUrl = productData.image;
      inStock = productData.offers?.availability === 'http://schema.org/InStock';
    } else {
      // Fallback to scraping
      title =
        $('h1[itemprop="name"]').text().trim() ||
        $('h1.product-title').text().trim() ||
        $('.prod-ProductTitle').text().trim();

      const priceText =
        $('[itemprop="price"]').attr('content') ||
        $('.price-current').text().trim() ||
        $('[data-automation-id="product-price"]').text().trim();

      price = parsePrice(priceText);

      imageUrl =
        $('img[itemprop="image"]').attr('src') ||
        $('meta[property="og:image"]').attr('content');

      const stockText = $('[itemprop="availability"]').attr('content') || '';
      inStock = stockText.toLowerCase().includes('instock');
    }

    const productId = extractWalmartId(url);

    if (!title || !price) {
      console.error('Could not extract required Walmart product data');
      return null;
    }

    return {
      id: productId || generateId(url),
      title,
      price,
      currency: 'MXN',
      originalPrice,
      url,
      imageUrl,
      inStock,
    };
  } catch (error: any) {
    console.error('Error scraping Walmart:', error.message);
    return null;
  }
}

function extractWalmartId(url: string): string | null {
  // Walmart URLs: https://www.walmart.com.mx/producto/12345678
  const match = url.match(/\/(\d{8,})/);
  return match ? match[1] : null;
}

function parsePrice(priceText: string): number {
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(',', '');
  return parseFloat(normalized) || 0;
}

function generateId(url: string): string {
  return Buffer.from(url).toString('base64').substring(0, 16);
}

export async function trackWalmartProduct(url: string) {
  const productData = await scrapeWalmartProduct(url);
  if (!productData) {
    throw new Error('Could not fetch product data');
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
        store: 'walmart',
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

    console.log(`[Walmart] New product tracked: ${productData.title}`);
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
      `[Walmart] Product updated: ${productData.title} - ${productData.currency} ${productData.price}`
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
          `[Walmart] ${isError ? '🚨 PRICE ERROR' : '💰 OFFER'} detected: ${discountPercent.toFixed(2)}% off`
        );
      }
    }
  }

  return product;
}
