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

export const seedClients = [
  { id: 'c1', fullName: 'Alessandra Moreau', email: 'a.moreau@parkavenuegroup.com', phone: '+1 (212) 555-0117', propertyIds: ['p5'], totalSpent: 1750, galleries: 1, createdAt: '2025-01-12' },
  { id: 'c2', fullName: 'Brennan Holt', email: 'brennan@holtrealty.com', phone: '+1 (646) 555-0184', propertyIds: ['p6'], totalSpent: 0, galleries: 1, createdAt: '2025-02-03' },
  { id: 'c3', fullName: 'Camille Whitfield', email: 'camille@whitfield-estates.com', phone: '+1 (917) 555-0246', propertyIds: ['p1'], totalSpent: 2400, galleries: 1, createdAt: '2024-11-08' },
  { id: 'c4', fullName: 'Dario Ventimiglia', email: 'dario@vmilano.com', phone: '+1 (305) 555-0312', propertyIds: ['p2'], totalSpent: 0, galleries: 1, createdAt: '2025-03-21' },
  { id: 'c5', fullName: 'Evangeline Park', email: 'evie@parkmodernhomes.com', phone: '+1 (415) 555-0489', propertyIds: ['p3'], totalSpent: 2150, galleries: 1, createdAt: '2024-12-18' },
  { id: 'c6', fullName: 'Felix Andersen', email: 'felix@andersenluxury.com', phone: '+1 (310) 555-0567', propertyIds: ['p4'], totalSpent: 0, galleries: 1, createdAt: '2025-01-29' },
];

export const seedProperties = [
  { id: 'p1', address: '128 Greenwich St', city: 'New York', state: 'NY', zip: '10006', description: 'Sky-line penthouse with floor-to-ceiling glass and private terrace.', price: 2400, clientId: 'c3', bedrooms: 4, bathrooms: 4, squareFeet: 3120, lotSize: 0, yearBuilt: 2019, estimatedValue: 4250000, propertyType: 'Penthouse', coverImage: hero1, images: galleryImgs, videos: [], shareSlug: 'greenwich-penthouse', isLocked: false, published: true, createdAt: '2025-03-14' },
  { id: 'p2', address: '47 Ocean Drive', city: 'Miami Beach', state: 'FL', zip: '33139', description: 'Beachfront villa with infinity pool and 360° ocean views.', price: 1850, clientId: 'c4', bedrooms: 5, bathrooms: 5, squareFeet: 4280, lotSize: 8500, yearBuilt: 2021, estimatedValue: 3120000, propertyType: 'Villa', coverImage: hero2, images: galleryImgs, videos: [], shareSlug: 'ocean-drive-villa', isLocked: true, published: true, createdAt: '2025-03-09' },
  { id: 'p3', address: '901 Pacific Heights Ave', city: 'San Francisco', state: 'CA', zip: '94109', description: 'Victorian estate masterfully restored with city and bay vistas.', price: 2150, clientId: 'c5', bedrooms: 6, bathrooms: 5, squareFeet: 5120, lotSize: 6200, yearBuilt: 2017, estimatedValue: 5780000, propertyType: 'Estate', coverImage: hero3, images: galleryImgs, videos: [], shareSlug: 'pacific-heights-estate', isLocked: false, published: true, createdAt: '2025-02-28' },
  { id: 'p4', address: '24 Beverly Crest Dr', city: 'Beverly Hills', state: 'CA', zip: '90210', description: 'Contemporary mansion with home cinema, gym, and motor court.', price: 3200, clientId: 'c6', bedrooms: 7, bathrooms: 8, squareFeet: 7800, lotSize: 18000, yearBuilt: 2022, estimatedValue: 8900000, propertyType: 'Mansion', coverImage: hero4, images: galleryImgs, videos: [], shareSlug: 'beverly-crest-mansion', isLocked: true, published: false, createdAt: '2025-03-19' },
  { id: 'p5', address: '12 Aspen Ridge', city: 'Aspen', state: 'CO', zip: '81611', description: 'Mountain chalet with ski-in/ski-out access and stone fireplaces.', price: 1750, clientId: 'c1', bedrooms: 5, bathrooms: 4, squareFeet: 3680, lotSize: 15000, yearBuilt: 2018, estimatedValue: 4100000, propertyType: 'Chalet', coverImage: hero5, images: galleryImgs, videos: [], shareSlug: 'aspen-ridge-chalet', isLocked: false, published: true, createdAt: '2025-01-22' },
  { id: 'p6', address: '88 Tribeca Loft', city: 'New York', state: 'NY', zip: '10013', description: 'Industrial-chic loft with exposed brick and 14-ft ceilings.', price: 1450, clientId: 'c2', bedrooms: 3, bathrooms: 3, squareFeet: 2410, lotSize: 0, yearBuilt: 2015, estimatedValue: 2680000, propertyType: 'Loft', coverImage: hero6, images: galleryImgs, videos: [], shareSlug: 'tribeca-loft', isLocked: true, published: true, createdAt: '2025-03-02' },
];

export const seedPurchases = [
  { id: 'pay1', propertyId: 'p1', clientId: 'c3', clientEmail: 'camille@whitfield-estates.com', stripeSessionId: 'seed_sess_1', amount: 2400, status: 'paid', unlockedAt: '2025-03-15', downloadStatus: 'downloaded', createdAt: '2025-03-15' },
  { id: 'pay2', propertyId: 'p2', clientId: 'c4', clientEmail: 'dario@vmilano.com', stripeSessionId: 'seed_sess_2', amount: 1850, status: 'pending', downloadStatus: 'not-downloaded', createdAt: '2025-03-10' },
  { id: 'pay3', propertyId: 'p3', clientId: 'c5', clientEmail: 'evie@parkmodernhomes.com', stripeSessionId: 'seed_sess_3', amount: 2150, status: 'paid', unlockedAt: '2025-03-01', downloadStatus: 'downloaded', createdAt: '2025-03-01' },
  { id: 'pay4', propertyId: 'p5', clientId: 'c1', clientEmail: 'a.moreau@parkavenuegroup.com', stripeSessionId: 'seed_sess_4', amount: 1750, status: 'paid', unlockedAt: '2025-01-25', downloadStatus: 'downloaded', createdAt: '2025-01-25' },
  { id: 'pay5', propertyId: 'p6', clientId: 'c2', clientEmail: 'brennan@holtrealty.com', stripeSessionId: 'seed_sess_5', amount: 1450, status: 'unpaid', downloadStatus: 'not-downloaded', createdAt: '2025-03-04' },
  { id: 'pay6', propertyId: 'p4', clientId: 'c6', clientEmail: 'felix@andersenluxury.com', stripeSessionId: 'seed_sess_6', amount: 3200, status: 'pending', downloadStatus: 'not-downloaded', createdAt: '2025-03-20' },
];

let nextId = 1000;
export const newId = (prefix) => `${prefix}_${++nextId}`;

export function makeSlug(address) {
  const base = address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base}-${Math.random().toString(36).slice(2, 6)}`;
}
