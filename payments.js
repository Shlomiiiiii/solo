/** Stripe Checkout — falls back to mock-paid mode when no STRIPE_SECRET_KEY. */
import Stripe from 'stripe';
import { store } from './store.js';

const apiKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = apiKey ? new Stripe(apiKey) : null;

export async function createCheckoutSession({ propertyId, clientEmail, origin }) {
  const property = await store.getProperty(propertyId);
  if (!property) throw new Error('Property not found');

  const successUrl = `${origin}/gallery/${property.shareSlug}?unlocked=1`;
  const cancelUrl = `${origin}/gallery/${property.shareSlug}`;

  if (!stripe) {
    // Mock paid mode.
    const session = await store.createPurchase({
      propertyId: property.id,
      clientId: property.clientId,
      clientEmail,
      stripeSessionId: `mock_${Date.now()}`,
      amount: property.price,
      status: 'paid',
      unlockedAt: new Date().toISOString(),
      downloadStatus: 'not-downloaded',
    });
    await store.updateProperty(property.id, { isLocked: false });
    const client = await store.getClient(property.clientId);
    if (client) {
      await store.updateClient(client.id, { totalSpent: (client.totalSpent || 0) + property.price });
    }
    return { sessionId: session.id, url: successUrl };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(property.price * 100),
          product_data: {
            name: `Gallery: ${property.address}`,
            description: `${property.city}, ${property.state} ${property.zip}`,
            images: [property.coverImage],
          },
        },
        quantity: 1,
      },
    ],
    customer_email: clientEmail,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { propertyId: property.id, clientId: property.clientId },
  });

  await store.createPurchase({
    propertyId: property.id,
    clientId: property.clientId,
    clientEmail,
    stripeSessionId: session.id,
    amount: property.price,
    status: 'pending',
    downloadStatus: 'not-downloaded',
  });

  return { sessionId: session.id, url: session.url };
}

export async function handleWebhook(rawBody, signature) {
  if (!stripe || !webhookSecret) return { ok: false };
  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    throw new Error(`Invalid webhook signature: ${err.message}`);
  }
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const propertyId = session.metadata?.propertyId;
    if (propertyId) {
      const purchases = await store.listPurchases();
      const purchase = purchases.find((p) => p.stripeSessionId === session.id);
      if (purchase) {
        await store.updatePurchase(purchase.id, {
          status: 'paid',
          unlockedAt: new Date().toISOString(),
        });
      }
      await store.updateProperty(propertyId, { isLocked: false });
      const property = await store.getProperty(propertyId);
      if (property) {
        const client = await store.getClient(property.clientId);
        if (client) {
          await store.updateClient(client.id, {
            totalSpent: (client.totalSpent || 0) + property.price,
          });
        }
      }
    }
  }
  return { ok: true };
}
