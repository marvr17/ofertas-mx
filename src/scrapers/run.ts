/**
 * Manual scraper runner - AUTO-DETECT STORE
 * Soporta: Mercado Libre, Amazon, Liverpool, Walmart, Apple, Samsung, y más
 */

import { trackMLProduct, searchMercadoLibre } from './mercadolibre';
import { trackAmazonProduct } from './amazon';
import { trackLiverpoolProduct } from './liverpool';
import { trackWalmartProduct } from './walmart';
import { trackUniversalProduct, detectStore } from './universal';
import prisma from '../db';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'track':
      await trackProduct(args[1]);
      break;

    case 'search':
      await searchProducts(args[1], args[2]);
      break;

    case 'list':
      await listProducts();
      break;

    case 'offers':
      await listOffers();
      break;

    case 'stores':
      await listStores();
      break;

    default:
      console.log(`
🎯 Ofertas - Price Tracker CLI

Usage:
  npm run scrape track <url>              - Track a product from ANY store
  npm run scrape search <keyword> [site]  - Search Mercado Libre
  npm run scrape list                     - List all tracked products
  npm run scrape offers                   - List all offers detected
  npm run scrape stores                   - List supported stores

Supported Stores:
  ✅ Mercado Libre (MLM, MLA, MLB)
  ✅ Amazon (US, MX)
  ✅ Liverpool
  ✅ Walmart
  ✅ Apple Store
  ✅ Samsung
  ✅ Best Buy
  ✅ Coppel
  ✅ HP, Xiaomi, Sony
  ✅ Costco, Sam's Club
  ✅ Y cualquier otra tienda online!

Examples:
  npm run scrape track "https://www.apple.com/mx/shop/buy-iphone/iphone-15-pro"
  npm run scrape track "https://www.mercadolibre.com.mx/..."
  npm run scrape track "https://www.liverpool.com.mx/..."
  npm run scrape search "iphone 15 pro" MLM
  npm run scrape offers
      `);
  }

  await prisma.$disconnect();
}

async function trackProduct(url: string) {
  if (!url) {
    console.error('❌ Error: URL is required');
    return;
  }

  console.log(`\n🔍 Analyzing URL: ${url}\n`);

  try {
    // Auto-detect store
    const store = detectStore(url);
    console.log(`🏪 Store detected: ${store.toUpperCase()}\n`);

    let product;

    // Use specific scraper if available
    if (url.includes('mercadolibre') || url.includes('mercadolivre')) {
      console.log('Using Mercado Libre API...');
      product = await trackMLProduct(url);
    } else if (url.includes('amazon.')) {
      console.log('Using Amazon scraper...');
      product = await trackAmazonProduct(url);
    } else if (url.includes('liverpool.com')) {
      console.log('Using Liverpool scraper...');
      product = await trackLiverpoolProduct(url);
    } else if (url.includes('walmart.com')) {
      console.log('Using Walmart scraper...');
      product = await trackWalmartProduct(url);
    } else {
      // Use universal scraper
      console.log('Using Universal scraper (works with any store)...');
      product = await trackUniversalProduct(url);
    }

    console.log('\n✅ Product tracked successfully!\n');
    console.log('Product Details:');
    console.log('─'.repeat(50));
    console.log(`Title: ${product.title}`);
    console.log(`Price: ${product.currency} ${product.currentPrice}`);
    console.log(`Store: ${product.store.toUpperCase()}`);
    console.log(`Stock: ${product.inStock ? '✅ Available' : '❌ Out of Stock'}`);
    console.log(`URL: ${product.url}`);
    console.log('─'.repeat(50));
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Tip: Some stores may block automated requests.');
    console.log('   Try again or use a VPN/proxy.\n');
  }
}

async function searchProducts(query: string, site: string = 'MLM') {
  if (!query) {
    console.error('Error: Search query is required');
    return;
  }

  console.log(`\n🔍 Searching Mercado Libre (${site}): "${query}"\n`);

  try {
    const results = await searchMercadoLibre(query, site, 20);
    console.log(`Found ${results.length} results:\n`);

    results.forEach((product, i) => {
      console.log(`${i + 1}. ${product.title}`);
      console.log(`   💰 Price: ${product.currency} ${product.price.toLocaleString()}`);
      if (product.originalPrice && product.originalPrice > product.price) {
        const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
        console.log(`   🔥 Discount: ${discount.toFixed(0)}% OFF`);
      }
      console.log(`   🔗 ${product.permalink}`);
      console.log('');
    });

    console.log(`\n💡 To track any product, run:`);
    console.log(`   npm run scrape track "URL_HERE"\n`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

async function listProducts() {
  const products = await prisma.product.findMany({
    include: {
      prices: {
        orderBy: { timestamp: 'desc' },
        take: 1,
      },
    },
    orderBy: { lastChecked: 'desc' },
  });

  console.log(`\n📦 Tracked Products (${products.length}):\n`);

  // Group by store
  const byStore = products.reduce((acc: any, p) => {
    acc[p.store] = (acc[p.store] || 0) + 1;
    return acc;
  }, {});

  console.log('By Store:');
  Object.entries(byStore).forEach(([store, count]) => {
    console.log(`  ${store.toUpperCase()}: ${count} products`);
  });
  console.log('');

  products.forEach((product, i) => {
    console.log(`${i + 1}. [${product.store.toUpperCase()}] ${product.title}`);
    console.log(`   💰 Current: ${product.currency} ${product.currentPrice?.toLocaleString()}`);
    console.log(`   📅 Last checked: ${product.lastChecked.toLocaleString()}`);
    console.log(`   ${product.inStock ? '✅ In Stock' : '❌ Out of Stock'}`);
    console.log('');
  });
}

async function listOffers() {
  const offers = await prisma.offer.findMany({
    include: {
      product: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  console.log(`\n🔥 Offers Detected (${offers.length}):\n`);

  const errorCount = offers.filter((o) => o.isError).length;
  const regularCount = offers.length - errorCount;

  console.log(`Stats:`);
  console.log(`  🚨 Price Errors: ${errorCount}`);
  console.log(`  💰 Regular Offers: ${regularCount}\n`);

  offers.forEach((offer, i) => {
    const emoji = offer.isError ? '🚨' : '💰';
    const tag = offer.isError ? 'PRICE ERROR' : 'OFFER';

    console.log(`${i + 1}. ${emoji} [${tag}] ${offer.product.title}`);
    console.log(`   🏪 ${offer.product.store.toUpperCase()}`);
    console.log(
      `   💵 ${offer.product.currency} ${offer.oldPrice.toLocaleString()} → ${offer.newPrice.toLocaleString()}`
    );
    console.log(`   📉 Discount: ${offer.discountPercent.toFixed(2)}% OFF`);
    console.log(`   📅 ${offer.createdAt.toLocaleString()}`);
    console.log(`   ${offer.notified ? '✅ Notified' : '⏳ Pending notification'}`);
    console.log('');
  });
}

async function listStores() {
  console.log(`\n🏪 Supported Stores:\n`);

  const stores = [
    { name: 'Mercado Libre', country: 'MX/AR/BR', api: '✅', reliability: '⭐⭐⭐⭐⭐' },
    { name: 'Amazon', country: 'Global', api: '⚠️', reliability: '⭐⭐⭐⭐' },
    { name: 'Liverpool', country: 'MX', api: '❌', reliability: '⭐⭐⭐⭐' },
    { name: 'Walmart', country: 'MX/US', api: '❌', reliability: '⭐⭐⭐⭐' },
    { name: 'Apple Store', country: 'Global', api: '❌', reliability: '⭐⭐⭐⭐⭐' },
    { name: 'Samsung', country: 'Global', api: '❌', reliability: '⭐⭐⭐⭐' },
    { name: 'Best Buy', country: 'MX/US', api: '❌', reliability: '⭐⭐⭐' },
    { name: 'Coppel', country: 'MX', api: '❌', reliability: '⭐⭐⭐' },
    { name: 'Costco', country: 'MX/US', api: '❌', reliability: '⭐⭐⭐⭐' },
    { name: "Sam's Club", country: 'MX/US', api: '❌', reliability: '⭐⭐⭐' },
    { name: 'HP', country: 'Global', api: '❌', reliability: '⭐⭐⭐⭐' },
    { name: 'Xiaomi', country: 'Global', api: '❌', reliability: '⭐⭐⭐' },
    { name: 'Sony', country: 'Global', api: '❌', reliability: '⭐⭐⭐' },
  ];

  console.log('Store                Country      API      Reliability');
  console.log('─'.repeat(60));

  stores.forEach((store) => {
    const name = store.name.padEnd(20);
    const country = store.country.padEnd(12);
    const api = store.api.padEnd(8);
    console.log(`${name} ${country} ${api} ${store.reliability}`);
  });

  console.log('\n✅ Official API available');
  console.log('⚠️  Scraping (may be blocked)');
  console.log('❌ Scraping only\n');

  console.log('💡 Tip: The universal scraper works with ANY online store!\n');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
