import { config } from '../config';

/**
 * Generate affiliate link based on store
 */
export function generateAffiliateLink(url: string, store: string): string {
  switch (store.toLowerCase()) {
    case 'amazon':
      return generateAmazonAffiliateLink(url);
    case 'mercadolibre':
      return generateMLAffiliateLink(url);
    default:
      return url;
  }
}

/**
 * Generate Amazon affiliate link
 */
function generateAmazonAffiliateLink(url: string): string {
  if (!config.affiliates.amazonTag) {
    return url;
  }

  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('tag', config.affiliates.amazonTag);
    return urlObj.toString();
  } catch {
    return url;
  }
}

/**
 * Generate Mercado Libre affiliate link
 * Note: ML uses a different system. You need to apply for their affiliate program.
 * This is a placeholder - check ML's actual affiliate link format.
 */
function generateMLAffiliateLink(url: string): string {
  if (!config.affiliates.mlAffiliateId) {
    return url;
  }

  // Mercado Libre affiliate format varies by country
  // Example for some regions: add ?utm_source=your_id
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set('utm_source', config.affiliates.mlAffiliateId);
    urlObj.searchParams.set('utm_medium', 'affiliate');
    return urlObj.toString();
  } catch {
    return url;
  }
}
