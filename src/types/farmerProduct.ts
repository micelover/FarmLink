export type ProductUnit = "lb" | "bunch" | "pint" | "jar" | "each" | "dozen" | "bag";
export type ProductCategory =
  | "Vegetables"
  | "Fruits"
  | "Dairy & Eggs"
  | "Meat"
  | "Pantry"
  | "Other";

export interface FarmerProduct {
  id: string;
  name: string;
  price: number;
  unit: ProductUnit;
  category: ProductCategory;
  description: string;
  imageUrl: string;
  farmerId: string;
  farmName: string;
  createdAt: string;
}

export type FarmerProductDraft = Omit<FarmerProduct, "id" | "farmerId" | "farmName" | "createdAt">;
