import cron from 'node-cron';
import prisma from '../db';
import { trackMLProduct } from '../scrapers/mercadolibre';
import { trackAmazonProduct } from '../scrapers/amazon';
import { trackLiverpoolProduct } from '../scrapers/liverpool';
import { trackWalmartProduct } from '../scrapers/walmart';
import { trackSamsProduct } from '../scrapers/sams';
import { trackSorianaProduct } from '../scrapers/soriana';
import { trackCoppelProduct } from '../scrapers/coppel';
import { trackSearsProduct } from '../scrapers/sears';
import { detectAndNotifyOffers } from './offerDetector';
import { autoDiscoverProducts, cleanupOldProducts } from './autoDiscovery';
import { config } from '../config';

/**
 * Start all cron jobs
 */
export function startWorkers() {
  console.log('🚀 Starting workers...');

  // Check for offers every minute
  cron.schedule('* * * * *', async () => {
    console.log('[Worker] Checking for new offers...');
    try {
      await detectAndNotifyOffers();
    } catch (error: any) {
      console.error('[Worker] Error detecting offers:', error.message);
    }
  });

  // Scrape all tracked products - Mercado Libre
  const mlInterval = config.scraping.intervalML;
  cron.schedule(`*/${mlInterval} * * * *`, async () => {
    console.log('[Worker] Scraping Mercado Libre products...');
    try {
      await scrapeAllProducts('mercadolibre');
    } catch (error: any) {
      console.error('[Worker] Error scraping ML:', error.message);
    }
  });

  // Scrape all tracked products - Amazon
  const amazonInterval = config.scraping.intervalAmazon;
  cron.schedule(`*/${amazonInterval} * * * *`, async () => {
    console.log('[Worker] Scraping Amazon products...');
    try {
      await scrapeAllProducts('amazon');
    } catch (error: any) {
      console.error('[Worker] Error scraping Amazon:', error.message);
    }
  });

  // Scrape all other stores
  cron.schedule(`*/${mlInterval} * * * *`, async () => {
    console.log('[Worker] Scraping other stores...');
    try {
      await scrapeAllProducts('liverpool');
      await scrapeAllProducts('walmart');
      await scrapeAllProducts('sams');
      await scrapeAllProducts('soriana');
      await scrapeAllProducts('coppel');
      await scrapeAllProducts('sears');
    } catch (error: any) {
      console.error('[Worker] Error scraping other stores:', error.message);
    }
  });

  // Auto-discover new products every 2 hours
  cron.schedule('0 */2 * * *', async () => {
    console.log('[Worker] Running auto-discovery...');
    try {
      await autoDiscoverProducts(3); // Max 3 products per search term
    } catch (error: any) {
      console.error('[Worker] Error in auto-discovery:', error.message);
    }
  });

  // Clean up old products once per day at 3 AM
  cron.schedule('0 3 * * *', async () => {
    console.log('[Worker] Cleaning up old products...');
    try {
      await cleanupOldProducts(30); // Remove products older than 30 days
    } catch (error: any) {
      console.error('[Worker] Error cleaning up:', error.message);
    }
  });

  console.log('✅ Workers started');
  console.log(`  - Offer detector: every 1 minute`);
  console.log(`  - Mercado Libre scraper: every ${mlInterval} minutes`);
  console.log(`  - Amazon scraper: every ${amazonInterval} minutes`);
  console.log(`  - Auto-discovery: every 2 hours`);
  console.log(`  - Cleanup: daily at 3 AM`);
}

/**
 * Scrape all products from a specific store
 */
async function scrapeAllProducts(store: string) {
  const products = await prisma.product.findMany({
    where: { store },
    select: { url: true, id: true, title: true },
  });

  if (products.length === 0) {
    return;
  }

  console.log(`Found ${products.length} ${store} products to scrape`);

  for (const product of products) {
    try {
      if (store === 'mercadolibre') {
        await trackMLProduct(product.url);
      } else if (store === 'amazon') {
        await trackAmazonProduct(product.url);
      } else if (store === 'liverpool') {
        await trackLiverpoolProduct(product.url);
      } else if (store === 'walmart') {
        await trackWalmartProduct(product.url);
      } else if (store === 'sams') {
        await trackSamsProduct(product.url);
      } else if (store === 'soriana') {
        await trackSorianaProduct(product.url);
      } else if (store === 'coppel') {
        await trackCoppelProduct(product.url);
      } else if (store === 'sears') {
        await trackSearsProduct(product.url);
      }

      // Add delay to avoid rate limiting
      await delay(2000); // 2 seconds between requests
    } catch (error: any) {
      console.error(`Error scraping ${product.title}:`, error.message);
    }
  }

  console.log(`Finished scraping ${store} products`);
}

/**
 * Helper: delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
