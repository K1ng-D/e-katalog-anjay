// lib/types.ts

// ======= User & Auth =======
export type UserRole = "user" | "admin";
export type UserStatus = "active" | "disabled";

export type Preferences = {
  productCategories: string[];
  foodCategories: string[];
  likedKeywords: string[];
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;

  role: UserRole;
  status: UserStatus;

  // tambahan untuk survey & rekomendasi
  preferences?: Preferences;
  surveyCompleted?: boolean;

  createdAt: number;
  updatedAt: number;
};

// (opsional) tipe khusus untuk halaman manajemen user (CRUD by admin)
export type UserProfileManagement = {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: number;
  updatedAt: number;
};

// ======= Katalog =======
export type LinkTargets = {
  whatsapp?: string;
  shopee?: string;
  tokopedia?: string;
  website?: string;
};

// NEW: representasi satu gambar (mendukung delete di Cloudinary)
export type ImageItem = {
  url: string;
  publicId?: string; // diperlukan untuk hapus permanen di Cloudinary
};

export type ProductCategory =
  | "pakaian"
  | "aksesoris"
  | "elektronik"
  | "kecantikan"
  | "rumah tangga"
  | "lainnya";

export type ProductStatus = "ready" | "habis";
export type Size = "S" | "M" | "L" | "XL" | "XXL";

export type Product = {
  id?: string;
  name: string;
  category: ProductCategory;
  description?: string;
  price: number;
  images: ImageItem[]; // DULU string[] → SEKARANG [{ url, publicId? }]
  links?: LinkTargets;
  stock?: number;
  status?: ProductStatus;
  createdAt: number; // ms epoch
  updatedAt: number; // ms epoch

  // === NEW FIELDS ===
  sizes?: Size[]; // daftar ukuran tersedia
  preorder?: 0 | 3 | 7 | 10;
};

export type FoodCategory =
  | "makanan ringan"
  | "makanan berat"
  | "minuman"
  | "dessert"
  | "lainnya";

export type FoodStatus = "available" | "soldout" | "draft";

export type Food = {
  id?: string;
  name: string;
  foodCategory: FoodCategory;
  description?: string;
  price: number;
  weightGrams?: number;
  images: ImageItem[]; // DULU string[] → SEKARANG [{ url, publicId? }]
  links?: LinkTargets;
  status?: FoodStatus;
  createdAt: number; // ms epoch
  updatedAt: number; // ms epoch

  /** NEW */
  preorder?: 0 | 3 | 7 | 10; // 0 = Non-PO, lainnya estimasi hari PO
};

// ======= Util kecil yang sering dipakai =======
// Tipe dokumen Firestore yang sudah dilengkapi id
export type WithId<T> = T & { id: string };

// Form kadang tidak lengkap → gunakan Partial saat state form, lalu normalisasi sebelum write
export type PartialProductForm = Partial<Omit<Product, "id">> & { id?: string };
export type PartialFoodForm = Partial<Omit<Food, "id">> & { id?: string };
