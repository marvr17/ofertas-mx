import TelegramBot from 'node-telegram-bot-api';
import { config } from '../config';

let bot: TelegramBot | null = null;

/**
 * Initialize Telegram bot
 */
export function initTelegramBot() {
  if (!config.telegram.botToken) {
    console.warn('⚠️  Telegram bot token not configured. Notifications disabled.');
    return null;
  }

  try {
    bot = new TelegramBot(config.telegram.botToken, { polling: false });
    console.log('✅ Telegram bot initialized');
    return bot;
  } catch (error: any) {
    console.error('❌ Failed to initialize Telegram bot:', error.message);
    return null;
  }
}

/**
 * Send notification about an offer
 */
export async function sendTelegramNotification(offer: any, affiliateLink: string) {
  if (!bot || !config.telegram.chatId) {
    console.warn('Telegram not configured, skipping notification');
    return;
  }

  const product = offer.product;
  const emoji = offer.isError ? '🚨' : '💰';
  const tag = offer.isError ? '#PriceError' : '#Oferta';

  const message = `
${emoji} ${tag} - ${offer.discountPercent.toFixed(1)}% OFF

📦 **${product.title}**

💵 Precio anterior: ${product.currency} ${offer.oldPrice.toFixed(2)}
🔥 Precio actual: ${product.currency} ${offer.newPrice.toFixed(2)}
💎 Ahorras: ${product.currency} ${(offer.oldPrice - offer.newPrice).toFixed(2)}

🏪 Tienda: ${product.store.toUpperCase()}
${product.inStock ? '✅ En stock' : '❌ Sin stock'}

🔗 [Comprar aquí](${affiliateLink})

${offer.isError ? '⚡ ¡Posible error de precio! Actúa rápido antes de que lo corrijan.' : ''}
  `.trim();

  try {
    await bot.sendMessage(config.telegram.chatId, message, {
      parse_mode: 'Markdown',
      disable_web_page_preview: false,
    });
  } catch (error: any) {
    console.error('Failed to send Telegram message:', error.message);
    throw error;
  }
}

/**
 * Send a custom message
 */
export async function sendCustomMessage(message: string) {
  if (!bot || !config.telegram.chatId) {
    console.warn('Telegram not configured, skipping message');
    return;
  }

  try {
    await bot.sendMessage(config.telegram.chatId, message, {
      parse_mode: 'Markdown',
    });
  } catch (error: any) {
    console.error('Failed to send Telegram message:', error.message);
    throw error;
  }
}

export { bot };
