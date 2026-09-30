// src/hooks/useSellerNewOrders.js
// Live count of pending orders the seller hasn't opened yet.
// Use it on every seller page that has the sidebar (Dashboard, Products, ...):
//
//   const newOrdersCount = useSellerNewOrders();
//   { label: "Orders", icon: FiShoppingBag, path: "/seller/orders", badge: newOrdersCount }
//
// Only reads the seller's *pending* orders, so it stays cheap.

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../context/firebase";
import { useAuth } from "../context/AuthContext";

export default function useSellerNewOrders() {
  const { firebaseUser } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!firebaseUser?.uid) {
      setCount(0);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("sellerId", "==", firebaseUser.uid),
      where("status", "==", "pending")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setCount(snap.docs.filter((d) => d.data().sellerSeen !== true).length);
      },
      (err) => {
        console.error("New orders badge error:", err);
        setCount(0);
      }
    );

    return () => unsub();
  }, [firebaseUser?.uid]);

  return count;
}