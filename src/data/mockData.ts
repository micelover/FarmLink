export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  farmName: string;
  farmerId: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
}

export interface Farmer {
  id: number;
  name: string;
  farmName: string;
  location: string;
  bio: string;
  image: string;
  productsCount: number;
  rating: number;
}

export const products: Product[] = [
  {
    id: 1,
    name: "Organic Heirloom Tomatoes",
    price: 4.99,
    unit: "lb",
    farmName: "Green Valley Farm",
    farmerId: 1,
    image: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&h=400&fit=crop",
    category: "Vegetables",
    rating: 4.8,
    reviews: 124,
  },
  {
    id: 2,
    name: "Fresh Strawberries",
    price: 6.50,
    unit: "pint",
    farmName: "Sunrise Berry Farm",
    farmerId: 2,
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=400&h=400&fit=crop",
    category: "Fruits",
    rating: 4.9,
    reviews: 89,
  },
  {
    id: 3,
    name: "Mixed Salad Greens",
    price: 3.75,
    unit: "bag",
    farmName: "Meadow Greens",
    farmerId: 3,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&h=400&fit=crop",
    category: "Vegetables",
    rating: 4.7,
    reviews: 56,
  },
  {
    id: 4,
    name: "Raw Wildflower Honey",
    price: 12.00,
    unit: "jar",
    farmName: "Honeybee Hollow",
    farmerId: 1,
    image: "https://images.unsplash.com/photo-1587049352851-8d4e89133924?w=400&h=400&fit=crop",
    category: "Pantry",
    rating: 5.0,
    reviews: 213,
  },
  {
    id: 5,
    name: "Free-Range Eggs",
    price: 7.00,
    unit: "dozen",
    farmName: "Green Valley Farm",
    farmerId: 1,
    image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&h=400&fit=crop",
    category: "Dairy & Eggs",
    rating: 4.9,
    reviews: 178,
  },
  {
    id: 6,
    name: "Sweet Corn",
    price: 5.50,
    unit: "6-pack",
    farmName: "Sunrise Berry Farm",
    farmerId: 2,
    image: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=400&h=400&fit=crop",
    category: "Vegetables",
    rating: 4.6,
    reviews: 42,
  },
];

export const farmers: Farmer[] = [
  {
    id: 1,
    name: "James Harrington",
    farmName: "Green Valley Farm",
    location: "Sonoma County, CA",
    bio: "Third-generation farmer growing organic vegetables and keeping bees for over 20 years. We believe in sustainable practices that respect the land.",
    image: "https://images.unsplash.com/photo-1589923188651-268a9765e432?w=400&h=400&fit=crop",
    productsCount: 14,
    rating: 4.9,
  },
  {
    id: 2,
    name: "Maria Santos",
    farmName: "Sunrise Berry Farm",
    location: "Watsonville, CA",
    bio: "Specializing in seasonal fruits and sweet corn, our family farm has been supplying local communities with fresh produce for 15 years.",
    image: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=400&h=400&fit=crop",
    productsCount: 8,
    rating: 4.8,
  },
  {
    id: 3,
    name: "Tom Ellison",
    farmName: "Meadow Greens",
    location: "Salinas Valley, CA",
    bio: "We grow over 30 varieties of lettuce and leafy greens using water-efficient farming methods. Fresh cuts available every week.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop",
    productsCount: 11,
    rating: 4.7,
  },
];
