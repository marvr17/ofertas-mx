import express, { Request, Response } from 'express';
import path from 'path';
import prisma from '../db';
import { trackMLProduct, searchMercadoLibre } from '../scrapers/mercadolibre';
import { trackAmazonProduct } from '../scrapers/amazon';
import { trackLiverpoolProduct } from '../scrapers/liverpool';
import { trackWalmartProduct } from '../scrapers/walmart';
import { trackSamsProduct } from '../scrapers/sams';
import { trackSorianaProduct } from '../scrapers/soriana';
import { trackCoppelProduct } from '../scrapers/coppel';
import { trackSearsProduct } from '../scrapers/sears';
import { trackUniversalProduct } from '../scrapers/universal';
import { getActiveOffers, getStats } from '../services/offerDetector';
import { autoDiscoverProducts } from '../services/autoDiscovery';

const app = express();
app.use(express.json());

// Serve static files from public directory
const publicPath = path.join(process.cwd(), 'public');
console.log('📁 Serving static files from:', publicPath);
app.use(express.static(publicPath));

/**
 * Health check
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Get statistics
 */
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all tracked products
 */
app.get('/api/products', async (req: Request, res: Response) => {
  try {
    const { store, limit = 50 } = req.query;
    const products = await prisma.product.findMany({
      where: store ? { store: store as string } : undefined,
      include: {
        prices: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
        offers: {
          orderBy: { createdAt: 'desc' },
          take: 3,
        },
      },
      orderBy: { lastChecked: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get a single product
 */
app.get('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        prices: {
          orderBy: { timestamp: 'desc' },
        },
        offers: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Track a new product from ANY store
 */
app.post('/api/products/track', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    let product;

    // Auto-detect store and use appropriate scraper
    if (url.includes('mercadolibre') || url.includes('mercadolivre')) {
      product = await trackMLProduct(url);
    } else if (url.includes('amazon.')) {
      product = await trackAmazonProduct(url);
    } else if (url.includes('liverpool.com')) {
      product = await trackLiverpoolProduct(url);
    } else if (url.includes('walmart.com')) {
      product = await trackWalmartProduct(url);
    } else if (url.includes('sams.com')) {
      product = await trackSamsProduct(url);
    } else if (url.includes('soriana.com')) {
      product = await trackSorianaProduct(url);
    } else if (url.includes('coppel.com')) {
      product = await trackCoppelProduct(url);
    } else if (url.includes('sears.com')) {
      product = await trackSearsProduct(url);
    } else {
      // Use universal scraper for any other store
      product = await trackUniversalProduct(url);
    }

    res.json({ success: true, product });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get all offers
 */
app.get('/api/offers', async (req: Request, res: Response) => {
  try {
    const { limit = 50, onlyErrors = false } = req.query;
    const offers = await prisma.offer.findMany({
      where: onlyErrors === 'true' ? { isError: true } : undefined,
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });
    res.json(offers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search Mercado Libre
 */
app.get('/api/search/mercadolibre', async (req: Request, res: Response) => {
  try {
    const { q, site = 'MLM', limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const results = await searchMercadoLibre(
      q as string,
      site as string,
      parseInt(limit as string)
    );
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Search and track products by name (searches in Mercado Libre and auto-tracks best results)
 */
app.post('/api/products/search', async (req: Request, res: Response) => {
  try {
    const { query, autoTrack = true } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Searching for: "${query}"...`);

    // Search in Mercado Libre
    const results = await searchMercadoLibre(query, 'MLM', 10);

    if (!results || results.length === 0) {
      return res.json({ message: 'No products found', results: [] });
    }

    let trackedProducts = [];

    if (autoTrack) {
      // Auto-track top 3 results
      const topResults = results.slice(0, 3);

      for (const result of topResults) {
        try {
          const url = result.permalink;

          // Check if already tracking
          const existing = await prisma.product.findUnique({
            where: { url },
          });

          if (!existing) {
            const product = await trackMLProduct(url);
            trackedProducts.push(product);
            console.log(`✅ Now tracking: ${result.title.substring(0, 50)}...`);
          } else {
            trackedProducts.push(existing);
            console.log(`⏭️  Already tracking: ${result.title.substring(0, 50)}...`);
          }
        } catch (error: any) {
          console.error(`Error tracking product: ${error.message}`);
        }
      }
    }

    res.json({
      success: true,
      query,
      resultsFound: results.length,
      tracked: trackedProducts.length,
      results,
      trackedProducts,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Trigger auto-discovery manually
 */
app.post('/api/discovery/run', async (req: Request, res: Response) => {
  try {
    const { maxPerSearch = 3 } = req.body;

    console.log('🔍 Starting manual auto-discovery...');
    const result = await autoDiscoverProducts(maxPerSearch);

    res.json({
      success: true,
      message: 'Auto-discovery completed',
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete a product (stop tracking)
 */
app.delete('/api/products/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({
      where: { id },
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Serve index.html for root path
 */
app.get('/', (req: Request, res: Response) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

/**
 * Start server
 */
export function startServer(port: number = 3000) {
  app.listen(port, () => {
    console.log(`✅ API server running on http://localhost:${port}`);
    console.log(`   - GET  /health`);
    console.log(`   - GET  /api/stats`);
    console.log(`   - GET  /api/products`);
    console.log(`   - POST /api/products/track`);
    console.log(`   - POST /api/products/search`);
    console.log(`   - GET  /api/offers`);
    console.log(`   - GET  /api/search/mercadolibre`);
    console.log(`   - POST /api/discovery/run`);
  });

  return app;
}

export default app;
