/** Gemini AI proxy with smart canned fallbacks. */
import { GoogleGenerativeAI } from '@google/generative-ai';
import { store } from './store.js';

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
const client = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_PROMPT = `You are the SoloPhotography assistant — a luxury real estate media business run by a single admin photographer.
You help write listing descriptions, social captions, SEO descriptions, marketing copy, and summarize business data.
Be concise, elegant, and confident. Use sensory language for property writing. Use plain language for business answers.
You have access to live business data (clients, properties, payments) — use it when answering business questions.`;

async function buildContext() {
  const [clients, properties, purchases] = await Promise.all([
    store.listClients(),
    store.listProperties(),
    store.listPurchases(),
  ]);
  const totalRevenue = purchases.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const unpaid = purchases.filter((p) => p.status === 'unpaid' || p.status === 'pending');
  const topClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);
  return [
    `Total revenue: $${totalRevenue.toLocaleString()}`,
    `Clients: ${clients.length}`,
    `Properties: ${properties.length} (${properties.filter((p) => !p.isLocked).length} unlocked)`,
    `Unpaid/pending: ${unpaid
      .map((u) => {
        const prop = properties.find((p) => p.id === u.propertyId);
        const cli = clients.find((c) => c.id === u.clientId);
        return `${prop?.address} (${cli?.fullName}, $${u.amount}, ${u.status})`;
      })
      .join('; ')}`,
    `Top clients: ${topClients.map((c) => `${c.fullName} ($${c.totalSpent.toLocaleString()})`).join(', ')}`,
  ].join('\n');
}

export async function ask(prompt, history = []) {
  if (!client) return mockReply(prompt);
  try {
    const context = await buildContext();
    const model = client.getGenerativeModel({
      model: MODEL,
      systemInstruction: `${SYSTEM_PROMPT}\n\nCurrent business context:\n${context}`,
    });
    const chat = model.startChat({
      history: history.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    });
    const result = await chat.sendMessage(prompt);
    return result.response.text() || (await mockReply(prompt));
  } catch (err) {
    console.error('[ai] Gemini error', err.message);
    return mockReply(prompt);
  }
}

export async function generateListing(propertyId) {
  const prop = await store.getProperty(propertyId);
  if (!prop) throw new Error('Property not found');
  return ask(`Write a luxury listing description for: ${prop.address}, ${prop.city}, ${prop.state}. ${prop.bedrooms} bed, ${prop.bathrooms} bath, ${prop.squareFeet?.toLocaleString()} sq ft. Property type: ${prop.propertyType}. Existing notes: ${prop.description}. 2-3 cinematic paragraphs.`);
}

export async function generateCaption(propertyId) {
  const prop = await store.getProperty(propertyId);
  if (!prop) throw new Error('Property not found');
  return ask(`Write a short Instagram caption (max 280 chars) for ${prop.address}, ${prop.city}. ${prop.propertyType}. Include 3-5 relevant hashtags. Voice: refined, evocative.`);
}

async function mockReply(text) {
  const t = text.toLowerCase();
  const [properties, clients, purchases] = await Promise.all([
    store.listProperties(),
    store.listClients(),
    store.listPurchases(),
  ]);

  if (t.includes('listing') || t.includes('description')) {
    return 'A masterfully appointed residence where architectural elegance meets sun-drenched serenity. Soaring ceilings, handcrafted finishes, and seamless indoor-outdoor flow define every corner. Each room is composed with intention — natural materials, refined proportions, and views that frame the very best of its setting. An offering as rare as it is extraordinary.';
  }
  if (t.includes('instagram') || t.includes('caption')) {
    return '✨ Step into stillness. A home where every window frames a story and every room invites pause. #LuxuryRealEstate #SoloPhotography #ArchitecturalPhotography #LuxuryHomes #DreamHomes';
  }
  if (t.includes('top') && t.includes('client')) {
    const top = [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);
    return `Top paying clients: ${top.map((c) => `${c.fullName} ($${c.totalSpent.toLocaleString()})`).join(', ')}.`;
  }
  if (t.includes('revenue') || t.includes('month') || t.includes('finances')) {
    const totalPaid = purchases.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
    const paidCount = purchases.filter((p) => p.status === 'paid').length;
    const avg = paidCount ? totalPaid / paidCount : 0;
    return `Total revenue: $${totalPaid.toLocaleString()} across ${paidCount} paid galleries. Avg sale: $${Math.round(avg).toLocaleString()}.`;
  }
  if (t.includes('unpaid') || t.includes('pending')) {
    const unpaid = purchases.filter((p) => p.status === 'unpaid' || p.status === 'pending');
    if (!unpaid.length) return 'No unpaid or pending galleries — you are all caught up.';
    return `${unpaid.length} unpaid/pending: ${unpaid.map((u) => {
      const prop = properties.find((p) => p.id === u.propertyId);
      const cli = clients.find((c) => c.id === u.clientId);
      return `${prop?.address} (${cli?.fullName}, $${u.amount}, ${u.status})`;
    }).join('; ')}.`;
  }
  return 'I can help with luxury listings, social captions, SEO, marketing copy, and business summaries (top clients, revenue, unpaid galleries). Set GEMINI_API_KEY in Render to enable full Gemini responses.';
}
