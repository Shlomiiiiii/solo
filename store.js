/**
 * Data store — Firestore when enabled, in-memory otherwise.
 * Same async API regardless of backend.
 */
import { isFirebaseEnabled, getFirestoreDb } from './firebase.js';
import {
  seedClients,
  seedProperties,
  seedPurchases,
  newId,
  makeSlug,
  DEFAULT_COVER,
} from './seed.js';

class MemoryStore {
  kind = 'memory';
  clients = new Map();
  properties = new Map();
  purchases = new Map();
  conversations = new Map();

  constructor() {
    seedClients.forEach((c) => this.clients.set(c.id, { ...c }));
    seedProperties.forEach((p) => this.properties.set(p.id, { ...p }));
    seedPurchases.forEach((p) => this.purchases.set(p.id, { ...p }));
  }

  async listClients() {
    return [...this.clients.values()].sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
  async getClient(id) {
    return this.clients.get(id);
  }
  async createClient(input) {
    const c = {
      id: newId('c'),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone || '',
      propertyIds: [],
      totalSpent: 0,
      galleries: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.clients.set(c.id, c);
    return c;
  }
  async updateClient(id, patch) {
    const existing = this.clients.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.clients.set(id, updated);
    return updated;
  }
  async deleteClient(id) {
    return this.clients.delete(id);
  }

  async listProperties() {
    return [...this.properties.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  async getProperty(id) {
    return this.properties.get(id);
  }
  async getPropertyBySlug(slug) {
    return [...this.properties.values()].find((p) => p.shareSlug === slug);
  }
  async createProperty(input) {
    const p = {
      id: newId('p'),
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      description: input.description || '',
      price: Number(input.price) || 0,
      clientId: input.clientId,
      bedrooms: Number(input.bedrooms) || 0,
      bathrooms: Number(input.bathrooms) || 0,
      squareFeet: Number(input.squareFeet) || 0,
      lotSize: Number(input.lotSize) || 0,
      yearBuilt: Number(input.yearBuilt) || 0,
      estimatedValue: Number(input.estimatedValue) || 0,
      propertyType: input.propertyType || 'Residential',
      externalListingUrl: input.externalListingUrl,
      coverImage: DEFAULT_COVER,
      images: [],
      videos: [],
      shareSlug: makeSlug(input.address),
      isLocked: true,
      published: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    this.properties.set(p.id, p);
    const client = this.clients.get(input.clientId);
    if (client) {
      client.propertyIds = [...(client.propertyIds || []), p.id];
      client.galleries = (client.galleries || 0) + 1;
    }
    return p;
  }
  async updateProperty(id, patch) {
    const existing = this.properties.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.properties.set(id, updated);
    return updated;
  }
  async deleteProperty(id) {
    return this.properties.delete(id);
  }
  async addPropertyMedia(id, url, kind) {
    const existing = this.properties.get(id);
    if (!existing) return undefined;
    if (kind === 'image') {
      existing.images = [...(existing.images || []), url];
      if (!existing.coverImage || existing.coverImage === DEFAULT_COVER) existing.coverImage = url;
    } else {
      existing.videos = [...(existing.videos || []), url];
    }
    this.properties.set(id, existing);
    return existing;
  }

  async listPurchases() {
    return [...this.purchases.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
  async createPurchase(p) {
    const created = { ...p, id: newId('pay'), createdAt: new Date().toISOString().split('T')[0] };
    this.purchases.set(created.id, created);
    return created;
  }
  async updatePurchase(id, patch) {
    const existing = this.purchases.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.purchases.set(id, updated);
    return updated;
  }
}

class FirestoreStore {
  kind = 'firestore';
  constructor(db) {
    this.db = db;
    void this.seedIfEmpty();
  }
  col(name) {
    return this.db.collection(name);
  }
  async seedIfEmpty() {
    try {
      const snap = await this.col('clients').limit(1).get();
      if (!snap.empty) return;
      console.log('[firestore] empty — seeding mock data');
      const batch = this.db.batch();
      seedClients.forEach((c) => batch.set(this.col('clients').doc(c.id), c));
      seedProperties.forEach((p) => batch.set(this.col('properties').doc(p.id), p));
      seedPurchases.forEach((p) => batch.set(this.col('purchases').doc(p.id), p));
      await batch.commit();
      console.log('[firestore] seeded');
    } catch (err) {
      console.error('[firestore] seed failed', err);
    }
  }

  async listClients() {
    const snap = await this.col('clients').get();
    return snap.docs
      .map((d) => ({ ...d.data(), id: d.id }))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }
  async getClient(id) {
    const doc = await this.col('clients').doc(id).get();
    return doc.exists ? { ...doc.data(), id: doc.id } : undefined;
  }
  async createClient(input) {
    const c = {
      id: newId('c'),
      fullName: input.fullName,
      email: input.email,
      phone: input.phone || '',
      propertyIds: [],
      totalSpent: 0,
      galleries: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await this.col('clients').doc(c.id).set(c);
    return c;
  }
  async updateClient(id, patch) {
    const ref = this.col('clients').doc(id);
    const existing = await ref.get();
    if (!existing.exists) return undefined;
    const merged = { ...existing.data(), ...patch, id };
    await ref.set(merged);
    return merged;
  }
  async deleteClient(id) {
    await this.col('clients').doc(id).delete();
    return true;
  }

  async listProperties() {
    const snap = await this.col('properties').get();
    return snap.docs
      .map((d) => ({ ...d.data(), id: d.id }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async getProperty(id) {
    const doc = await this.col('properties').doc(id).get();
    return doc.exists ? { ...doc.data(), id: doc.id } : undefined;
  }
  async getPropertyBySlug(slug) {
    const snap = await this.col('properties').where('shareSlug', '==', slug).limit(1).get();
    if (snap.empty) return undefined;
    const doc = snap.docs[0];
    return { ...doc.data(), id: doc.id };
  }
  async createProperty(input) {
    const p = {
      id: newId('p'),
      address: input.address,
      city: input.city,
      state: input.state,
      zip: input.zip,
      description: input.description || '',
      price: Number(input.price) || 0,
      clientId: input.clientId,
      bedrooms: Number(input.bedrooms) || 0,
      bathrooms: Number(input.bathrooms) || 0,
      squareFeet: Number(input.squareFeet) || 0,
      lotSize: Number(input.lotSize) || 0,
      yearBuilt: Number(input.yearBuilt) || 0,
      estimatedValue: Number(input.estimatedValue) || 0,
      propertyType: input.propertyType || 'Residential',
      externalListingUrl: input.externalListingUrl || null,
      coverImage: DEFAULT_COVER,
      images: [],
      videos: [],
      shareSlug: makeSlug(input.address),
      isLocked: true,
      published: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await this.col('properties').doc(p.id).set(p);
    const clientRef = this.col('clients').doc(input.clientId);
    const clientDoc = await clientRef.get();
    if (clientDoc.exists) {
      const c = clientDoc.data();
      await clientRef.set({
        ...c,
        propertyIds: [...(c.propertyIds || []), p.id],
        galleries: (c.galleries || 0) + 1,
      });
    }
    return p;
  }
  async updateProperty(id, patch) {
    const ref = this.col('properties').doc(id);
    const existing = await ref.get();
    if (!existing.exists) return undefined;
    const merged = { ...existing.data(), ...patch, id };
    await ref.set(merged);
    return merged;
  }
  async deleteProperty(id) {
    await this.col('properties').doc(id).delete();
    return true;
  }
  async addPropertyMedia(id, url, kind) {
    const ref = this.col('properties').doc(id);
    const existing = await ref.get();
    if (!existing.exists) return undefined;
    const p = existing.data();
    if (kind === 'image') {
      p.images = [...(p.images || []), url];
      if (!p.coverImage || p.coverImage === DEFAULT_COVER) p.coverImage = url;
    } else {
      p.videos = [...(p.videos || []), url];
    }
    await ref.set(p);
    return p;
  }

  async listPurchases() {
    const snap = await this.col('purchases').get();
    return snap.docs
      .map((d) => ({ ...d.data(), id: d.id }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  async createPurchase(p) {
    const created = { ...p, id: newId('pay'), createdAt: new Date().toISOString().split('T')[0] };
    await this.col('purchases').doc(created.id).set(created);
    return created;
  }
  async updatePurchase(id, patch) {
    const ref = this.col('purchases').doc(id);
    const existing = await ref.get();
    if (!existing.exists) return undefined;
    const merged = { ...existing.data(), ...patch, id };
    await ref.set(merged);
    return merged;
  }
}

function createStore() {
  if (isFirebaseEnabled()) {
    console.log('[store] using Firestore');
    return new FirestoreStore(getFirestoreDb());
  }
  console.log('[store] using in-memory backend');
  return new MemoryStore();
}

export const store = createStore();
