import fs from 'fs';
import path from 'path';
import bcryptjs from 'bcryptjs';

let appInstance = null;
let dbInstance = null;
let isInitialized = false;

// In-memory cache synced with Firestore
const listingsMap = new Map();
const usersMap = new Map();

// Helper to load Firebase configuration
export const getFirebaseConfig = () => {
  const rootPath = path.resolve();
  const configPath = path.join(rootPath, 'firebase-applet-config.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
      console.warn('Could not parse firebase-applet-config.json:', e.message);
    }
  }

  // Also support user-specified chento100 project credentials if overridden via env
  return {
    projectId: process.env.FIREBASE_PROJECT_ID || config.projectId || 'chento100-1acd8',
    appId: process.env.FIREBASE_APP_ID || config.appId || '1:167037834066:web:chento100web',
    apiKey: process.env.FIREBASE_API_KEY || config.apiKey || 'AIzaSyAeph9WGg-WqflnFWuhHcWGPY6a7B2XSx4',
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || config.authDomain || 'chento100-1acd8.firebaseapp.com',
    firestoreDatabaseId: process.env.FIRESTORE_DATABASE_ID || config.firestoreDatabaseId || '(default)',
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || config.storageBucket || 'chento100-1acd8.firebasestorage.app',
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || config.messagingSenderId || '167037834066',
  };
};

// Seed initial users
const seedUsers = [
  {
    _id: 'user_sahand_001',
    username: 'chento_fleet',
    email: 'admin@chento100.com',
    password: bcryptjs.hashSync('password123', 10),
    role: 'admin',
    isAdmin: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    _id: 'user_joss_001',
    username: 'jossvision',
    email: 'jossvision11@gmail.com',
    password: bcryptjs.hashSync('password123', 10),
    role: 'admin',
    isAdmin: true,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
];

// Seed initial guest houses and chauffeured cars
const seedListings = [
  {
    _id: 'listing_001',
    title: 'Modern Downtown Studio Apartment Airbnb',
    name: 'Modern Downtown Studio Apartment Airbnb',
    description: 'Bright and stylish modern studio apartment guest house in the city center. Features an open-concept living space with plush sofa, dedicated work desk, high-speed Wi-Fi, fully equipped kitchen with espresso machine, rainfall shower, and self check-in smart lock.',
    location: '450 Pine St, Downtown City Center',
    address: '450 Pine St, Downtown City Center',
    price: 120,
    regularPrice: 120,
    discountPrice: 95,
    discountedPrice: 95,
    category: 'guesthouse',
    bathrooms: 1,
    bedrooms: 1,
    maxGuests: 2,
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Workspace'],
    furnished: true,
    parking: true,
    type: 'rent',
    offer: true,
    isApproved: true,
    status: 'approved',
    active: true,
    isActive: true,
    imageUrls: [
      '/images/airbnb_apartment_living.jpg',
      '/images/airbnb_apartment_bed.jpg',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    imageURLs: [
      '/images/airbnb_apartment_living.jpg',
      '/images/airbnb_apartment_bed.jpg',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    userRef: 'user_sahand_001',
    createdAt: new Date('2024-02-15').toISOString(),
    updatedAt: new Date('2024-02-15').toISOString(),
  },
  {
    _id: 'listing_002',
    title: 'Toyota Corolla Modern City Sedan with Private Driver',
    name: 'Toyota Corolla Modern City Sedan with Private Driver',
    description: 'Comfortable and dependable modern Toyota Corolla sedan with a courteous, experienced city driver. Perfect for downtown business commutes, airport pickups, shopping trips, and point-to-point urban travel. Clean air-conditioned interior, phone charging ports, and smooth ride.',
    location: 'City Center & Metro Area Route',
    address: 'City Center & Metro Area Route',
    price: 75,
    regularPrice: 75,
    discountPrice: 65,
    discountedPrice: 65,
    category: 'car_service',
    make: 'Toyota',
    model: 'Corolla Sedan',
    year: 2023,
    transmission: 'automatic',
    seats: 4,
    driverIncluded: true,
    driverName: 'Marcus Vance',
    driverContact: '+1 305-555-0199',
    bathrooms: 0,
    bedrooms: 0,
    furnished: false,
    parking: true,
    type: 'sale',
    offer: true,
    isApproved: true,
    status: 'approved',
    active: true,
    isActive: true,
    imageUrls: [
      '/images/city_regular_sedan.jpg',
      '/images/city_driver_car.jpg',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
    ],
    imageURLs: [
      '/images/city_regular_sedan.jpg',
      '/images/city_driver_car.jpg',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80',
    ],
    userRef: 'user_sahand_001',
    createdAt: new Date('2024-03-01').toISOString(),
    updatedAt: new Date('2024-03-01').toISOString(),
  },
  {
    _id: 'listing_003',
    title: 'Sunny 2-Bedroom Scandinavian Apartment Guest House',
    name: 'Sunny 2-Bedroom Scandinavian Apartment Guest House',
    description: 'Serene Scandinavian-designed 2-bedroom Airbnb with natural wood tones, large floor-to-ceiling windows, and private dining balcony. Features king-sized plush beds, high-speed fiber internet, washer/dryer, and secure underground garage parking.',
    location: '720 Market Blvd, Midtown Arts Quarter',
    address: '720 Market Blvd, Midtown Arts Quarter',
    price: 185,
    regularPrice: 185,
    discountPrice: 155,
    discountedPrice: 155,
    category: 'guesthouse',
    bathrooms: 2,
    bedrooms: 2,
    maxGuests: 4,
    amenities: ['WiFi', 'Kitchen', 'Air Conditioning', 'Balcony', 'Smart TV'],
    furnished: true,
    parking: true,
    type: 'rent',
    offer: true,
    isApproved: true,
    status: 'approved',
    active: true,
    isActive: true,
    imageUrls: [
      '/images/airbnb_apartment_living.jpg',
      '/images/airbnb_apartment_bed.jpg',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    imageURLs: [
      '/images/airbnb_apartment_living.jpg',
      '/images/airbnb_apartment_bed.jpg',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    ],
    userRef: 'user_sahand_001',
    createdAt: new Date('2024-03-10').toISOString(),
    updatedAt: new Date('2024-03-10').toISOString(),
  },
  {
    _id: 'listing_004',
    title: 'Honda CR-V Spacious City SUV with Chauffeur',
    name: 'Honda CR-V Spacious City SUV with Chauffeur',
    description: 'Pristine Honda CR-V crossover SUV offering generous legroom, elevated road visibility, and ample luggage space for 4 passengers. Driven by an English and Spanish speaking certified chauffeur.',
    location: 'Metro Area, Airport Corridors & Suburbs',
    address: 'Metro Area, Airport Corridors & Suburbs',
    price: 95,
    regularPrice: 95,
    discountPrice: 85,
    discountedPrice: 85,
    category: 'car_service',
    make: 'Honda',
    model: 'CR-V SUV',
    year: 2022,
    transmission: 'automatic',
    seats: 5,
    driverIncluded: true,
    driverName: 'Elena Rostova',
    driverContact: '+1 305-555-0244',
    bathrooms: 0,
    bedrooms: 0,
    furnished: false,
    parking: true,
    type: 'sale',
    offer: true,
    isApproved: true,
    status: 'approved',
    active: true,
    isActive: true,
    imageUrls: [
      '/images/city_driver_car.jpg',
      '/images/city_regular_sedan.jpg',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    ],
    imageURLs: [
      '/images/city_driver_car.jpg',
      '/images/city_regular_sedan.jpg',
      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    ],
    userRef: 'user_sahand_001',
    createdAt: new Date('2024-03-15').toISOString(),
    updatedAt: new Date('2024-03-15').toISOString(),
  },
  {
    _id: 'listing_005',
    title: 'Cozy Bohemian Studio with Terrace',
    name: 'Cozy Bohemian Studio with Terrace',
    description: 'Charming sunlit studio apartment with lush indoor greenery, custom bohemian wood furnishings, kitchenette, and a private outdoor breakfast terrace overlooking the courtyard.',
    location: '124 Garden Lane, Historic Quarter',
    address: '124 Garden Lane, Historic Quarter',
    price: 110,
    regularPrice: 110,
    discountPrice: 90,
    discountedPrice: 90,
    category: 'guesthouse',
    bathrooms: 1,
    bedrooms: 1,
    maxGuests: 2,
    amenities: ['WiFi', 'Kitchen', 'Balcony', 'Workspace'],
    furnished: true,
    parking: false,
    type: 'rent',
    offer: true,
    isApproved: true,
    status: 'approved',
    active: true,
    isActive: true,
    imageUrls: [
      '/images/airbnb_apartment_living.jpg',
      '/images/airbnb_apartment_bed.jpg',
    ],
    imageURLs: [
      '/images/airbnb_apartment_living.jpg',
      '/images/airbnb_apartment_bed.jpg',
    ],
    userRef: 'user_sahand_001',
    createdAt: new Date('2024-03-20').toISOString(),
    updatedAt: new Date('2024-03-20').toISOString(),
  },
  {
    _id: 'listing_006',
    title: 'Toyota Camry Executive City Sedan with Chauffeur',
    name: 'Toyota Camry Executive City Sedan with Chauffeur',
    description: 'Spacious and quiet Toyota Camry sedan with private chauffeur service. Ideal for visiting professionals, city tours, and seamless transit between hotels and business centers.',
    location: 'Financial District & Coastal Highway Routes',
    address: 'Financial District & Coastal Highway Routes',
    price: 85,
    regularPrice: 85,
    discountPrice: 75,
    discountedPrice: 75,
    category: 'car_service',
    make: 'Toyota',
    model: 'Camry Hybrid',
    year: 2023,
    transmission: 'automatic',
    seats: 4,
    driverIncluded: true,
    driverName: 'David Chen',
    driverContact: '+1 305-555-0388',
    bathrooms: 0,
    bedrooms: 0,
    furnished: false,
    parking: true,
    type: 'sale',
    offer: true,
    isApproved: true,
    status: 'approved',
    active: true,
    isActive: true,
    imageUrls: [
      '/images/city_regular_sedan.jpg',
      '/images/city_driver_car.jpg',
    ],
    imageURLs: [
      '/images/city_regular_sedan.jpg',
      '/images/city_driver_car.jpg',
    ],
    userRef: 'user_sahand_001',
    createdAt: new Date('2024-03-25').toISOString(),
    updatedAt: new Date('2024-03-25').toISOString(),
  },
];

// Helper to normalize listings with full schema compatibility
const normalizeListing = (data, id) => {
  const _id = id || data._id || `listing_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const title = data.title || data.name || 'Untitled Listing';
  const name = data.name || title;
  const address = data.address || data.location || 'City Center';
  const location = data.location || address;
  const description = data.description || '';
  const regularPrice = data.regularPrice !== undefined ? Number(data.regularPrice) : Number(data.price || 0);
  const price = data.price !== undefined ? Number(data.price) : regularPrice;
  const discountPrice = Number(data.discountPrice || data.discountedPrice || 0);
  const discountedPrice = discountPrice;
  const offer = Boolean(data.offer || (discountPrice > 0 && discountPrice < regularPrice));

  let category = data.category || (data.type === 'sale' ? 'car_service' : 'guesthouse');
  if (category === 'car') category = 'car_service';

  const type = category === 'car_service' ? 'sale' : 'rent';
  const isApproved = data.isApproved !== undefined ? Boolean(data.isApproved) : data.status === 'approved';
  const status = data.status || (isApproved ? 'approved' : 'pending');
  const active = data.active !== undefined ? Boolean(data.active) : data.isActive !== undefined ? Boolean(data.isActive) : true;
  const isActive = active;

  let imageUrls = data.imageUrls || data.imageURLs || [];
  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    imageUrls = category === 'car_service'
      ? ['/images/city_regular_sedan.jpg', '/images/city_driver_car.jpg']
      : ['/images/airbnb_apartment_living.jpg', '/images/airbnb_apartment_bed.jpg'];
  }

  return {
    ...data,
    _id,
    id: _id,
    title,
    name,
    address,
    location,
    description,
    regularPrice,
    price,
    discountPrice,
    discountedPrice,
    offer,
    category,
    type,
    isApproved,
    status,
    active,
    isActive,
    imageUrls,
    imageURLs: imageUrls,
    userRef: data.userRef || 'admin_master',
    bedrooms: Number(data.bedrooms || 0),
    bathrooms: Number(data.bathrooms || 0),
    maxGuests: Number(data.maxGuests || 1),
    furnished: Boolean(data.furnished),
    parking: Boolean(data.parking),
    amenities: Array.isArray(data.amenities) ? data.amenities : [],
    make: data.make || '',
    model: data.model || data.carModel || '',
    carModel: data.carModel || data.model || '',
    year: Number(data.year || 2023),
    transmission: data.transmission || 'automatic',
    seats: Number(data.seats || data.seatingCapacity || 4),
    seatingCapacity: Number(data.seatingCapacity || data.seats || 4),
    driverIncluded: data.driverIncluded !== undefined ? Boolean(data.driverIncluded) : true,
    driverName: data.driverName || '',
    driverContact: data.driverContact || '',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

let firestoreOps = null;
const deletedListingIds = new Set();

async function syncListingToFirestore(listing) {
  if (!dbInstance || !firestoreOps) return;
  if (deletedListingIds.has(listing._id)) return;
  try {
    const docRef = firestoreOps.doc(dbInstance, 'listings', listing._id);
    await Promise.race([
      firestoreOps.setDoc(docRef, listing, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000)),
    ]);
  } catch (err) {
    console.warn('[Firebase Store] Firestore listing sync notice:', err.message);
  }
}

async function removeListingFromFirestore(id) {
  deletedListingIds.add(id);
  if (!dbInstance || !firestoreOps) return;
  try {
    const docRef = firestoreOps.doc(dbInstance, 'listings', id);
    const tombstoneRef = firestoreOps.doc(dbInstance, 'deleted_listings', id);
    await Promise.race([
      Promise.allSettled([
        firestoreOps.deleteDoc(docRef),
        firestoreOps.setDoc(tombstoneRef, {
          _id: id,
          deletedAt: new Date().toISOString(),
          deletedBy: 'admin',
        }, { merge: true }),
      ]),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000)),
    ]);
    console.log(`[Firebase Store] Listing ${id} permanently removed from Firestore and tombstoned.`);
  } catch (err) {
    console.warn('[Firebase Store] Firestore listing delete notice:', err.message);
  }
}

async function syncUserToFirestore(user) {
  if (!dbInstance || !firestoreOps) return;
  try {
    const docRef = firestoreOps.doc(dbInstance, 'users', user._id);
    await Promise.race([
      firestoreOps.setDoc(docRef, user, { merge: true }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000)),
    ]);
  } catch (err) {
    console.warn('[Firebase Store] Firestore user sync notice:', err.message);
  }
}

async function removeUserFromFirestore(id) {
  if (!dbInstance || !firestoreOps) return;
  try {
    const docRef = firestoreOps.doc(dbInstance, 'users', id);
    await Promise.race([
      firestoreOps.deleteDoc(docRef),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 4000)),
    ]);
  } catch (err) {
    console.warn('[Firebase Store] Firestore user delete notice:', err.message);
  }
}

export const initFirebaseStore = async () => {
  if (isInitialized) return;

  // Initialize in-memory cache with seeds only if not tombstoned
  seedUsers.forEach((u) => usersMap.set(u._id, u));
  seedListings.forEach((l) => {
    if (!deletedListingIds.has(l._id)) {
      listingsMap.set(l._id, normalizeListing(l, l._id));
    }
  });

  const config = getFirebaseConfig();
  console.log(`[Firebase Store] Initializing for Project: ${config.projectId} (${config.firestoreDatabaseId})`);

  try {
    const { initializeApp, getApps } = await import('firebase/app');
    const { getFirestore, doc, setDoc, deleteDoc, getDocs, collection } = await import('firebase/firestore');

    appInstance = getApps().length === 0 ? initializeApp(config) : getApps()[0];
    dbInstance = getFirestore(appInstance, config.firestoreDatabaseId);
    firestoreOps = { doc, setDoc, deleteDoc, getDocs, collection };

    console.log(`[Firebase Store] Connected to Firebase Firestore for project: ${config.projectId}`);

    // 1. Fetch permanent deletion tombstones first
    try {
      const tombstonesCol = collection(dbInstance, 'deleted_listings');
      const tombstonesSnap = await getDocs(tombstonesCol);
      tombstonesSnap.forEach((docSnap) => {
        deletedListingIds.add(docSnap.id);
        listingsMap.delete(docSnap.id);
      });
      if (deletedListingIds.size > 0) {
        console.log(`[Firebase Store] Enforced ${deletedListingIds.size} permanently deleted listing tombstones`);
      }
    } catch (tombErr) {
      console.warn('[Firebase Store] Tombstones fetch notice:', tombErr.message);
    }

    // 2. Hydrate existing data or sync seeds asynchronously
    try {
      const listingsCol = collection(dbInstance, 'listings');
      const listingsSnapshot = await getDocs(listingsCol);
      if (!listingsSnapshot.empty) {
        listingsMap.clear();
        listingsSnapshot.forEach((docSnap) => {
          if (!deletedListingIds.has(docSnap.id)) {
            const data = docSnap.data();
            const norm = normalizeListing(data, docSnap.id);
            listingsMap.set(norm._id, norm);
          }
        });
        console.log(`[Firebase Store] Hydrated ${listingsMap.size} active listings from Firestore`);
      } else {
        // Write initial seed listings to Firestore collection
        for (const l of seedListings) {
          if (!deletedListingIds.has(l._id)) {
            const norm = normalizeListing(l, l._id);
            listingsMap.set(norm._id, norm);
            syncListingToFirestore(norm);
          }
        }
      }

      const usersCol = collection(dbInstance, 'users');
      const usersSnapshot = await getDocs(usersCol);
      if (!usersSnapshot.empty) {
        usersSnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          usersMap.set(docSnap.id, { ...data, _id: docSnap.id, id: docSnap.id });
        });
        console.log(`[Firebase Store] Hydrated ${usersSnapshot.size} users from Firestore`);
      } else {
        // Write initial seed users to Firestore collection
        for (const u of seedUsers) {
          syncUserToFirestore(u);
        }
      }
    } catch (hydrateErr) {
      console.warn('[Firebase Store] Firestore hydration notice (using cached store):', hydrateErr.message);
    }
  } catch (err) {
    console.warn('[Firebase Store] Client SDK initialization notice:', err.message);
  }

  isInitialized = true;
};

// Auto initialize on module import
initFirebaseStore().catch((err) => console.error('[Firebase Store] Init error:', err));

export const firebaseStore = {
  // Listings
  getListings: (query = {}) => {
    let list = Array.from(listingsMap.values()).filter((l) => !deletedListingIds.has(l._id));

    // Filter by approval & active unless explicitly asking for unapproved or admin
    if (query.status) {
      if (query.status !== 'all') {
        list = list.filter((l) => l.status === query.status);
      }
    } else if (query.isAdmin !== 'true' && query.all !== 'true') {
      list = list.filter((l) => l.isApproved && l.active);
    }

    if (query.active !== undefined && query.active !== 'all') {
      const wantActive = query.active === 'true';
      list = list.filter((l) => Boolean(l.active) === wantActive);
    }

    // Search term
    if (query.searchTerm) {
      const term = query.searchTerm.toLowerCase().trim();
      list = list.filter((l) =>
        (l.title && l.title.toLowerCase().includes(term)) ||
        (l.name && l.name.toLowerCase().includes(term)) ||
        (l.description && l.description.toLowerCase().includes(term)) ||
        (l.address && l.address.toLowerCase().includes(term)) ||
        (l.location && l.location.toLowerCase().includes(term)) ||
        (l.make && l.make.toLowerCase().includes(term)) ||
        (l.model && l.model.toLowerCase().includes(term))
      );
    }

    // Category filter
    let cat = query.category;
    if (!cat && query.type) {
      if (query.type === 'rent') cat = 'guesthouse';
      else if (query.type === 'sale') cat = 'car_service';
    }
    if (cat === 'car') cat = 'car_service';
    if (cat && cat !== 'all') {
      list = list.filter((l) => l.category === cat);
    }

    // Specific filters
    if (query.bedrooms && parseInt(query.bedrooms) > 0) {
      list = list.filter((l) => l.bedrooms >= parseInt(query.bedrooms));
    }
    if (query.bathrooms && parseInt(query.bathrooms) > 0) {
      list = list.filter((l) => l.bathrooms >= parseInt(query.bathrooms));
    }
    if (query.maxGuests && parseInt(query.maxGuests) > 0) {
      list = list.filter((l) => l.maxGuests >= parseInt(query.maxGuests));
    }
    if (query.offer === 'true') {
      list = list.filter((l) => l.offer === true);
    }
    if (query.furnished === 'true') {
      list = list.filter((l) => l.furnished === true);
    }
    if (query.parking === 'true') {
      list = list.filter((l) => l.parking === true);
    }
    if (query.driverIncluded === 'true') {
      list = list.filter((l) => l.driverIncluded === true);
    }
    if (query.transmission && query.transmission !== 'all') {
      list = list.filter((l) => l.transmission === query.transmission);
    }
    if (query.seats && parseInt(query.seats) > 0) {
      list = list.filter((l) => l.seats >= parseInt(query.seats));
    }

    // Sort
    const sortField = query.sort || 'createdAt';
    const sortOrder = query.order === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const valA = a[sortField] !== undefined ? a[sortField] : '';
      const valB = b[sortField] !== undefined ? b[sortField] : '';
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * sortOrder;
      }
      return String(valA).localeCompare(String(valB)) * sortOrder;
    });

    // Pagination
    const startIndex = parseInt(query.startIndex) || 0;
    const limit = parseInt(query.limit) || 50;
    return list.slice(startIndex, startIndex + limit);
  },

  getListing: (id) => {
    if (deletedListingIds.has(id)) return null;
    return listingsMap.get(id) || null;
  },

  createListing: (data) => {
    const listing = normalizeListing(data);
    deletedListingIds.delete(listing._id);
    listingsMap.set(listing._id, listing);
    syncListingToFirestore(listing);
    return listing;
  },

  updateListing: (id, updates) => {
    if (deletedListingIds.has(id)) return null;
    const existing = listingsMap.get(id);
    if (!existing) return null;
    const updated = normalizeListing({ ...existing, ...updates }, id);
    listingsMap.set(id, updated);
    syncListingToFirestore(updated);
    return updated;
  },

  deleteListing: async (id) => {
    deletedListingIds.add(id);
    const res = listingsMap.delete(id);
    await removeListingFromFirestore(id);
    return res;
  },

  // Users
  getUser: (id) => {
    return usersMap.get(id) || null;
  },

  getUserByEmail: (email) => {
    if (!email) return null;
    const cleanEmail = email.toLowerCase().trim();
    for (const user of usersMap.values()) {
      if (user.email && user.email.toLowerCase().trim() === cleanEmail) {
        return user;
      }
    }
    return null;
  },

  getUserByUsername: (username) => {
    if (!username) return null;
    const clean = username.toLowerCase().trim();
    for (const user of usersMap.values()) {
      if (user.username && user.username.toLowerCase().trim() === clean) {
        return user;
      }
    }
    return null;
  },

  createUser: (data) => {
    const _id = data._id || `user_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const isAdmin = Boolean(
      data.isAdmin ||
      data.role === 'admin' ||
      (data.email &&
        (data.email.toLowerCase() === 'jossvision11@gmail.com' ||
          data.email.toLowerCase() === 'admin@chento100.com'))
    );
    const role = isAdmin ? 'admin' : (data.role || 'user');
    const user = {
      _id,
      id: _id,
      username: data.username || data.name || `user_${_id.slice(-4)}`,
      email: data.email,
      password: data.password || '',
      avatar:
        data.avatar ||
        data.photo ||
        'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png',
      isAdmin,
      role,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    usersMap.set(_id, user);
    syncUserToFirestore(user);
    return user;
  },

  updateUser: (id, updates) => {
    const existing = usersMap.get(id);
    if (!existing) return null;
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    usersMap.set(id, updated);
    syncUserToFirestore(updated);
    return updated;
  },

  deleteUser: (id) => {
    const res = usersMap.delete(id);
    removeUserFromFirestore(id);
    return res;
  },

  getAllUsers: () => {
    return Array.from(usersMap.values()).map((u) => {
      const { password, ...rest } = u;
      return rest;
    });
  },
};
