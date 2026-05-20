/** Seed data — luxury mock clients, properties, purchases. */

const hero1 = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
const hero2 = 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1600&q=80';
const hero3 = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';
const hero4 = 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=80';
const hero5 = 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80';
const hero6 = 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80';

const galleryImgs = [
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600573472556-e636c2acda88?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600585152915-d208bec867a1?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1600566753086-00f18fe6ba66?auto=format&fit=crop&w=1200&q=80',
];

export const DEFAULT_COVER = hero1;
export const GALLERY_IMAGES = galleryImgs;

export const seedClients = [];
export const seedProperties = [];
export const seedPurchases = [];

let nextId = 1000;
export const newId = (prefix) => `${prefix}_${++nextId}`;

export function makeSlug(address) {
  const base = address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
