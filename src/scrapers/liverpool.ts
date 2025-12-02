import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../db';

export interface LiverpoolProduct {
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
 * Scrape Liverpool product by URL
 */
export async function scrapeLiverpoolProduct(url: string): Promise<LiverpoolProduct | null> {
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

    // Extract product ID from URL
    const productId = extractLiverpoolId(url);

    // Extract title
    const title =
      $('h1.product-name').text().trim() ||
      $('h1[itemprop="name"]').text().trim() ||
      $('.product-title').text().trim();

    // Extract price (Liverpool usa selectores específicos)
    let priceText =
      $('.price-section .price-final').text().trim() ||
      $('[data-price-type="finalPrice"]').attr('data-price-amount') ||
      $('.a-price .a-offscreen').first().text().trim();

    const price = parsePrice(priceText);

    // Extract original price if on sale
    const originalPriceText =
      $('.price-section .price-original').text().trim() ||
      $('[data-price-type="oldPrice"]').attr('data-price-amount');

    const originalPrice = originalPriceText ? parsePrice(originalPriceText) : undefined;

    // Extract image
    const imageUrl =
      $('img.product-image').attr('src') ||
      $('meta[property="og:image"]').attr('content') ||
      undefined;

    // Check stock
    const stockText = $('.stock-status').text().toLowerCase();
    const addToCartButton = $('button.add-to-cart, button[data-action="add-to-cart"]').length;
    const inStock = !stockText.includes('agotado') && addToCartButton > 0;

    if (!title || !price) {
      console.error('Could not extract required Liverpool product data');
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
    console.error('Error scraping Liverpool:', error.message);
    return null;
  }
}

/**
 * Extract product ID from Liverpool URL
 */
function extractLiverpoolId(url: string): string | null {
  // Liverpool URLs: https://www.liverpool.com.mx/tienda/pdp/producto-nombre/12345678
  const match = url.match(/\/(\d{8,})/);
  return match ? match[1] : null;
}

/**
 * Parse price from text
 */
function parsePrice(priceText: string): number {
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(',', '');
  return parseFloat(normalized) || 0;
}

/**
 * Generate ID from URL
 */
function generateId(url: string): string {
  return Buffer.from(url).toString('base64').substring(0, 16);
}

/**
 * Track a Liverpool product in database
 */
export async function trackLiverpoolProduct(url: string) {
  const productData = await scrapeLiverpoolProduct(url);
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
        store: 'liverpool',
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

    console.log(`[Liverpool] New product tracked: ${productData.title}`);
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
      `[Liverpool] Product updated: ${productData.title} - ${productData.currency} ${productData.price}`
    );

    if (lastPrice && lastPrice !== productData.price) {
      const discountPercent = ((lastPrice - productData.price) / lastPrice) * 100;
      console.log(
        `[Liverpool] Price changed: ${lastPrice} → ${productData.price} (${discountPercent.toFixed(2)}%)`
      );

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
          `[Liverpool] ${isError ? '🚨 PRICE ERROR' : '💰 OFFER'} detected: ${discountPercent.toFixed(2)}% off`
        );
      }
    }
  }

  return product;
}
