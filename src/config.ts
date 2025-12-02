import dotenv from 'dotenv';

dotenv.config();

export const config = {
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    chatId: process.env.TELEGRAM_CHAT_ID || '',
  },
  affiliates: {
    amazonTag: process.env.AMAZON_AFFILIATE_TAG || '',
    mlAffiliateId: process.env.ML_AFFILIATE_ID || '',
  },
  scraping: {
    intervalML: parseInt(process.env.SCRAPE_INTERVAL_ML || '5'),
    intervalAmazon: parseInt(process.env.SCRAPE_INTERVAL_AMAZON || '10'),
  },
  alerts: {
    minDiscountPercent: parseFloat(process.env.MIN_DISCOUNT_PERCENT || '0'),
    priceDropThreshold: parseFloat(process.env.PRICE_DROP_THRESHOLD || '0'),
  },
};
