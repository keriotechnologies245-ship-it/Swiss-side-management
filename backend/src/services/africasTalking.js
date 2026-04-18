import africastalking from 'africastalking';
import dotenv from 'dotenv';

dotenv.config();

const atCredentials = {
  apiKey: process.env.AT_API_KEY || 'sandbox_key',
  username: process.env.AT_USERNAME || 'sandbox'
};

let atClient;
try {
  atClient = africastalking(atCredentials);
} catch (error) {
  console.error('[AT Service] Initialization Error:', error.message);
}

const sms = atClient ? atClient.SMS : null;

/**
 * Sends a WhatsApp/SMS receipt.
 * @param {string} phone - Phone number in E.164 format (e.g. +254712345678)
 * @param {string} message - The receipt text
 */
export const sendReceipt = async (phone, message) => {
  if (!sms) {
    console.warn(`[AT Service] SMS service not initialized. Mocking send to ${phone}:\n${message}`);
    return { status: 'mock' };
  }

  // PRD notes fallback SMS if WhatsApp fails. We will use SMS primarily for the MVP to ensure delivery,
  // or Africa's Talking WhatsApp channel if configured. 
  // Let's implement standard SMS for now to test.
  
  try {
    const result = await sms.send({
      to: [phone],
      message: message,
      // enqueue: true // optionally async
    });
    console.log('[AT Service] Message sent successfully:', result);
    return { status: 'success', data: result };
  } catch (error) {
    console.error('[AT Service] Error sending message:', error.message);
    throw new Error('Failed to send receipt.');
  }
};
