import { searchMercadoLibre, trackMLProduct } from '../scrapers/mercadolibre';
import prisma from '../db';

/**
 * Popular search terms for automatic product discovery
 * These will be searched automatically to find potential deals
 */
export const POPULAR_SEARCH_TERMS = [
  // Electronics
  'iphone',
  'samsung galaxy',
  'airpods',
  'apple watch',
  'ps5',
  'xbox series',
  'nintendo switch',
  'laptop',
  'macbook',
  'ipad',
  'tablet',
  'auriculares',
  'audifonos bluetooth',
  'smart tv',
  'monitor',

  // Home & Kitchen
  'air fryer',
  'licuadora',
  'cafetera',
  'horno',
  'aspiradora',
  'ventilador',
  'colchon',

  // Sports & Outdoors
  'bicicleta',
  'tenis nike',
  'tenis adidas',
  'pesas',
  'proteina',

  // Fashion
  'reloj',
  'lentes de sol',
  'perfume',
  'mochila',

  // Toys & Games
  'lego',
  'hot wheels',
  'barbie',
  'funko pop',

  // Home Improvement
  'taladro',
  'herramientas',
  'compresor',
];

/**
 * Categories to focus on for better deals
 */
export const POPULAR_CATEGORIES = [
  'MLM1000', // Electronics
  'MLM1051', // Phones & Tablets
  'MLM1144', // Video Games
  'MLM1574', // Home & Garden
  'MLM1276', // Sports
  'MLM1430', // Fashion
];

/**
 * Auto-discover products from Mercado Libre
 */
export async function autoDiscoverProducts(maxPerSearch: number = 5) {
  console.log('\n🔍 Starting automatic product discovery...\n');

  let totalDiscovered = 0;
  let totalTracked = 0;

  for (const searchTerm of POPULAR_SEARCH_TERMS) {
    try {
      console.log(`Searching for: "${searchTerm}"...`);

      const results = await searchMercadoLibre(searchTerm, 'MLM', 20);

      if (!results || results.length === 0) {
        console.log(`  No results found for "${searchTerm}"`);
        continue;
      }

      // Filter for products with good prices and free shipping
      const goodDeals = results
        .filter((item: any) => {
          // Must have free shipping
          if (!item.shipping?.free_shipping) return false;

          // Must have a decent price (not too cheap, might be fake)
          if (item.price < 100) return false;

          // Must be in stock
          if (item.available_quantity === 0) return false;

          // Must have good reputation
          if (item.seller_reputation?.power_seller_status !== 'platinum' &&
              item.seller_reputation?.power_seller_status !== 'gold') {
            return false;
          }

          return true;
        })
        .slice(0, maxPerSearch);

      console.log(`  Found ${goodDeals.length} potential deals`);
      totalDiscovered += goodDeals.length;

      // Track these products
      for (const deal of goodDeals) {
        try {
          const url = deal.permalink;

          // Check if already tracking
          const existing = await prisma.product.findUnique({
            where: { url },
          });

          if (existing) {
            console.log(`  ⏭️  Already tracking: ${deal.title.substring(0, 50)}...`);
            continue;
          }

          // Add to tracking
          await trackMLProduct(url);
          totalTracked++;
          console.log(`  ✅ Now tracking: ${deal.title.substring(0, 50)}...`);

          // Small delay to avoid rate limiting
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error: any) {
          console.log(`  ❌ Error tracking product: ${error.message}`);
        }
      }

      // Delay between searches to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 3000));
    } catch (error: any) {
      console.error(`Error searching for "${searchTerm}":`, error.message);
    }
  }

  console.log(`\n✅ Auto-discovery complete!`);
  console.log(`   Discovered: ${totalDiscovered} products`);
  console.log(`   New tracked: ${totalTracked} products\n`);

  return { totalDiscovered, totalTracked };
}

/**
 * Discover products from specific categories
 */
export async function autoDiscoverByCategory(categoryId: string, limit: number = 10) {
  console.log(`\n🔍 Discovering products in category: ${categoryId}...\n`);

  try {
    const results = await searchMercadoLibre('', 'MLM', limit, categoryId);

    if (!results || results.length === 0) {
      console.log('No results found');
      return { totalDiscovered: 0, totalTracked: 0 };
    }

    let totalTracked = 0;

    for (const item of results) {
      try {
        const url = item.permalink;

        // Check if already tracking
        const existing = await prisma.product.findUnique({
          where: { url },
        });

        if (existing) continue;

        // Track new product
        await trackMLProduct(url);
        totalTracked++;
        console.log(`  ✅ Now tracking: ${item.title.substring(0, 50)}...`);

        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }

    console.log(`\n✅ Category discovery complete!`);
    console.log(`   New tracked: ${totalTracked} products\n`);

    return { totalDiscovered: results.length, totalTracked };
  } catch (error: any) {
    console.error('Error in category discovery:', error.message);
    return { totalDiscovered: 0, totalTracked: 0 };
  }
}

/**
 * Clean up old products that haven't been updated in a while
 */
export async function cleanupOldProducts(daysOld: number = 30) {
  console.log('\n🧹 Cleaning up old products...\n');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const oldProducts = await prisma.product.findMany({
    where: {
      lastChecked: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`Found ${oldProducts.length} old products to remove`);

  for (const product of oldProducts) {
    await prisma.product.delete({
      where: { id: product.id },
    });
    console.log(`  🗑️  Removed: ${product.title.substring(0, 50)}...`);
  }

  console.log(`\n✅ Cleanup complete!\n`);
  return oldProducts.length;
}

/**
 * Get discovery statistics
 */
export async function getDiscoveryStats() {
  const [totalProducts, recentlyAdded, activeOffers] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
        },
      },
    }),
    prisma.offer.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
        },
      },
    }),
  ]);

  return {
    totalProducts,
    recentlyAdded,
    activeOffers,
  };
}
