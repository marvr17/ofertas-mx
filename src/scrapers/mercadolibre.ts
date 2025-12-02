import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../db';

export interface MLProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  originalPrice?: number;
  permalink: string;
  thumbnail: string;
  available_quantity: number;
}

/**
 * Scrape Mercado Libre product by URL
 */
export async function scrapeMercadoLibreProduct(url: string): Promise<MLProduct | null> {
  try {
    // Extract product ID from URL
    const productId = extractMLProductId(url);
    if (!productId) {
      console.error('Invalid Mercado Libre URL:', url);
      return null;
    }

    // Use Mercado Libre API (much better than scraping HTML)
    const apiUrl = `https://api.mercadolibre.com/items/${productId}`;
    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const data = response.data;

    return {
      id: data.id,
      title: data.title,
      price: data.price,
      currency: data.currency_id,
      originalPrice: data.original_price,
      permalink: data.permalink,
      thumbnail: data.thumbnail,
      available_quantity: data.available_quantity,
    };
  } catch (error: any) {
    console.error('Error scraping Mercado Libre:', error.message);
    return null;
  }
}

/**
 * Extract product ID from Mercado Libre URL
 */
function extractMLProductId(url: string): string | null {
  // ML URLs: https://www.mercadolibre.com.mx/product-name/p/MLM123456789
  // or https://articulo.mercadolibre.com.mx/MLM-123456789-product-name
  const match = url.match(/ML[A-Z]-?\d+/i);
  return match ? match[0].replace('-', '') : null;
}

/**
 * Search Mercado Libre by keyword
 */
export async function searchMercadoLibre(
  query: string,
  site: string = 'MLM', // MLM = Mexico, MLA = Argentina, MLB = Brasil
  limit: number = 50,
  category?: string
): Promise<MLProduct[]> {
  try {
    const apiUrl = `https://api.mercadolibre.com/sites/${site}/search`;
    const params: any = {
      limit,
    };

    if (query) {
      params.q = query;
    }

    if (category) {
      params.category = category;
    }

    const response = await axios.get(apiUrl, {
      params,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const results = response.data.results;
    return results.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      currency: item.currency_id,
      originalPrice: item.original_price,
      permalink: item.permalink,
      thumbnail: item.thumbnail,
      available_quantity: item.available_quantity,
    }));
  } catch (error: any) {
    console.error('Error searching Mercado Libre:', error.message);
    return [];
  }
}

/**
 * Track a Mercado Libre product in database
 */
export async function trackMLProduct(url: string) {
  const productData = await scrapeMercadoLibreProduct(url);
  if (!productData) {
    throw new Error('Could not fetch product data');
  }

  // Check if product already exists
  let product = await prisma.product.findUnique({
    where: { url },
    include: {
      prices: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
  });

  const inStock = productData.available_quantity > 0;

  if (!product) {
    // Create new product
    product = await prisma.product.create({
      data: {
        url,
        title: productData.title,
        store: 'mercadolibre',
        externalId: productData.id,
        currentPrice: productData.price,
        currency: productData.currency,
        imageUrl: productData.thumbnail,
        inStock,
        prices: {
          create: {
            price: productData.price,
            inStock,
          },
        },
      },
      include: {
        prices: true,
      },
    });

    console.log(`[ML] New product tracked: ${productData.title}`);
  } else {
    // Update existing product
    const lastPrice = product.prices[0]?.price;

    await prisma.product.update({
      where: { id: product.id },
      data: {
        currentPrice: productData.price,
        inStock,
        lastChecked: new Date(),
        prices: {
          create: {
            price: productData.price,
            inStock,
          },
        },
      },
    });

    console.log(`[ML] Product updated: ${productData.title} - ${productData.currency} ${productData.price}`);

    // Detect price change
    if (lastPrice && lastPrice !== productData.price) {
      const discountPercent = ((lastPrice - productData.price) / lastPrice) * 100;
      console.log(`[ML] Price changed: ${lastPrice} → ${productData.price} (${discountPercent.toFixed(2)}%)`);

      // Create offer if price dropped
      if (discountPercent > 0) {
        const isError = discountPercent > 50; // Likely error if >50% drop

        await prisma.offer.create({
          data: {
            productId: product.id,
            oldPrice: lastPrice,
            newPrice: productData.price,
            discountPercent,
            isError,
          },
        });

        console.log(`[ML] ${isError ? '🚨 PRICE ERROR' : '💰 OFFER'} detected: ${discountPercent.toFixed(2)}% off`);
      }
    }
  }

  return product;
}
