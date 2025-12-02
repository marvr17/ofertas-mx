import prisma from '../db';
import { config } from '../config';
import { sendTelegramNotification } from './telegram';
import { generateAffiliateLink } from '../utils/affiliate';

/**
 * Check for new offers that haven't been notified yet
 */
export async function detectAndNotifyOffers() {
  const offers = await prisma.offer.findMany({
    where: {
      notified: false,
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Found ${offers.length} unnotified offers`);

  for (const offer of offers) {
    try {
      // Generate affiliate link
      const affiliateLink = generateAffiliateLink(offer.product.url, offer.product.store);

      // Update offer with affiliate link
      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          affiliateLink,
        },
      });

      // Send notification
      await sendTelegramNotification(offer, affiliateLink);

      // Mark as notified
      await prisma.offer.update({
        where: { id: offer.id },
        data: {
          notified: true,
        },
      });

      console.log(`✅ Notification sent for: ${offer.product.title}`);
    } catch (error: any) {
      console.error(`❌ Failed to notify offer ${offer.id}:`, error.message);
    }
  }
}

/**
 * Get all active offers
 */
export async function getActiveOffers(limit: number = 50) {
  return await prisma.offer.findMany({
    where: {
      // You could add expiration logic here
    },
    include: {
      product: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  });
}

/**
 * Get statistics
 */
export async function getStats() {
  const [totalProducts, totalOffers, errorPrices, trackedStores] = await Promise.all([
    prisma.product.count(),
    prisma.offer.count(),
    prisma.offer.count({
      where: { isError: true },
    }),
    prisma.product.groupBy({
      by: ['store'],
      _count: true,
    }),
  ]);

  return {
    totalProducts,
    totalOffers,
    errorPrices,
    trackedStores: trackedStores.map((s) => ({
      store: s.store,
      count: s._count,
    })),
  };
}
