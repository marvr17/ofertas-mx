import axios from 'axios';
import * as cheerio from 'cheerio';
import prisma from '../db';

export interface AmazonProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  listPrice?: number;
  url: string;
  imageUrl?: string;
  inStock: boolean;
}

/**
 * Scrape Amazon product by URL
 * Note: Amazon is aggressive with bot detection. Consider using:
 * - Proxies
 * - Product Advertising API (requires approval)
 * - Third-party services like ScraperAPI
 */
export async function scrapeAmazonProduct(url: string): Promise<AmazonProduct | null> {
  try {
    const productId = extractAmazonASIN(url);
    if (!productId) {
      console.error('Invalid Amazon URL:', url);
      return null;
    }

    // Make request with headers to avoid detection
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(response.data);

    // Extract title
    const title =
      $('#productTitle').text().trim() ||
      $('h1.product-title').text().trim() ||
      $('span[id="productTitle"]').text().trim();

    // Extract price (Amazon has multiple price selectors)
    let priceText =
      $('.a-price .a-offscreen').first().text().trim() ||
      $('#priceblock_ourprice').text().trim() ||
      $('#priceblock_dealprice').text().trim() ||
      $('.a-price-whole').first().text().trim();

    // Clean price
    const price = parsePrice(priceText);

    // Extract list price (original price)
    const listPriceText =
      $('.a-price.a-text-price .a-offscreen').first().text().trim() ||
      $('#priceblock_saleprice').text().trim();

    const listPrice = listPriceText ? parsePrice(listPriceText) : undefined;

    // Extract currency
    const currency = extractCurrency(priceText) || 'USD';

    // Check stock
    const availability = $('#availability').text().toLowerCase();
    const inStock = !availability.includes('unavailable') && !availability.includes('out of stock');

    // Extract image
    const imageUrl =
      $('#landingImage').attr('src') || $('.a-dynamic-image').first().attr('src') || undefined;

    if (!title || !price) {
      console.error('Could not extract required Amazon product data');
      return null;
    }

    return {
      id: productId,
      title,
      price,
      currency,
      listPrice,
      url,
      imageUrl,
      inStock,
    };
  } catch (error: any) {
    if (error.response?.status === 503) {
      console.error('Amazon blocked request (503). Consider using proxies or Product API.');
    } else {
      console.error('Error scraping Amazon:', error.message);
    }
    return null;
  }
}

/**
 * Extract ASIN from Amazon URL
 */
function extractAmazonASIN(url: string): string | null {
  // Amazon URLs contain ASIN: https://www.amazon.com/dp/B08N5WRWNW/
  // or https://www.amazon.com/product-name/dp/B08N5WRWNW/
  const match = url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
  return match ? match[1] : null;
}

/**
 * Parse price from text
 */
function parsePrice(priceText: string): number {
  const cleaned = priceText.replace(/[^0-9.,]/g, '');
  const normalized = cleaned.replace(',', '.');
  return parseFloat(normalized) || 0;
}

/**
 * Extract currency from price text
 */
function extractCurrency(priceText: string): string | null {
  if (priceText.includes('$')) return 'USD';
  if (priceText.includes('€')) return 'EUR';
  if (priceText.includes('£')) return 'GBP';
  if (priceText.includes('MXN')) return 'MXN';
  return null;
}

/**
 * Track an Amazon product in database
 */
export async function trackAmazonProduct(url: string) {
  const productData = await scrapeAmazonProduct(url);
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

  if (!product) {
    // Create new product
    product = await prisma.product.create({
      data: {
        url,
        title: productData.title,
        store: 'amazon',
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

    console.log(`[Amazon] New product tracked: ${productData.title}`);
  } else {
    // Update existing product
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
      `[Amazon] Product updated: ${productData.title} - ${productData.currency} ${productData.price}`
    );

    // Detect price change
    if (lastPrice && lastPrice !== productData.price) {
      const discountPercent = ((lastPrice - productData.price) / lastPrice) * 100;
      console.log(
        `[Amazon] Price changed: ${lastPrice} → ${productData.price} (${discountPercent.toFixed(2)}%)`
      );

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

        console.log(
          `[Amazon] ${isError ? '🚨 PRICE ERROR' : '💰 OFFER'} detected: ${discountPercent.toFixed(2)}% off`
        );
      }
    }
  }

  return product;
}

/**
 * Search Amazon Mexico for products
 */
export async function searchAmazon(
  query: string,
  limit: number = 20
): Promise<AmazonProduct[]> {
  try {
    const searchUrl = `https://www.amazon.com.mx/s?k=${encodeURIComponent(query)}`;

    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-MX,es;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      timeout: 15000,
    });

    const $ = cheerio.load(response.data);
    const products: AmazonProduct[] = [];

    // Amazon search results are in divs with data-asin attribute
    $('div[data-asin]').each((i, elem) => {
      if (products.length >= limit) return false;

      const asin = $(elem).attr('data-asin');
      if (!asin || asin === '') return;

      // Extract title
      const titleElem = $(elem).find('h2 a span');
      const title = titleElem.text().trim();
      if (!title) return;

      // Extract price
      const priceWhole = $(elem).find('.a-price-whole').first().text().trim();
      const priceFraction = $(elem).find('.a-price-fraction').first().text().trim();
      const priceText = priceWhole + (priceFraction || '');
      const price = parsePrice(priceText);
      if (!price || price === 0) return;

      // Extract URL
      const linkElem = $(elem).find('h2 a');
      const relativeUrl = linkElem.attr('href');
      if (!relativeUrl) return;
      const url = relativeUrl.startsWith('http')
        ? relativeUrl
        : `https://www.amazon.com.mx${relativeUrl}`;

      // Extract image
      const imageUrl = $(elem).find('img.s-image').first().attr('src');

      // Extract original price if on sale
      const listPriceText = $(elem).find('.a-price.a-text-price .a-offscreen').first().text().trim();
      const listPrice = listPriceText ? parsePrice(listPriceText) : undefined;

      products.push({
        id: asin,
        title,
        price,
        currency: 'MXN',
        listPrice,
        url,
        imageUrl,
        inStock: true, // Assume in stock if showing in search
      });
    });

    console.log(`[Amazon Search] Found ${products.length} products for "${query}"`);
    return products;
  } catch (error: any) {
    console.error('Error searching Amazon:', error.message);
    return [];
  }
}
