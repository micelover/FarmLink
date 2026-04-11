import { useState, useEffect } from "react";
import {
  collection, query, where, onSnapshot,
  addDoc, updateDoc, deleteDoc, doc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FarmerProduct, FarmerProductDraft } from "@/types/farmerProduct";

export function useFarmerProducts(farmerId: string, farmName: string) {
  const [products, setProducts] = useState<FarmerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmerId) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const q = query(collection(db, "products"), where("farmerId", "==", farmerId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FarmerProduct, "id">),
        }));
        docs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setProducts(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [farmerId]);

  const addProduct = async (draft: FarmerProductDraft): Promise<void> => {
    await addDoc(collection(db, "products"), {
      ...draft,
      price: Number(draft.price),
      farmerId,
      farmName,
      createdAt: new Date().toISOString(),
    });
  };

  const updateProduct = async (id: string, draft: FarmerProductDraft): Promise<void> => {
    await updateDoc(doc(db, "products", id), {
      ...draft,
      price: Number(draft.price),
    });
  };

  const deleteProduct = async (id: string): Promise<void> => {
    await deleteDoc(doc(db, "products", id));
  };

  return { products, loading, error, addProduct, updateProduct, deleteProduct };
}
