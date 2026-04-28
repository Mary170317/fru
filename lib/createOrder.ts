import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export const createOrder = async (order: any) => {
  const docRef = await addDoc(collection(db, "orders"), {
    ...order,
    status: "new",
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};