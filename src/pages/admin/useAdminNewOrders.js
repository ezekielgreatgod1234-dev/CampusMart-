// src/hooks/useAdminNewOrders.js
// Counts orders placed since the admin last opened the Orders page.
// Use it in EVERY admin page that has the sidebar so the red badge shows everywhere:
//
//   const { newCount: newOrdersCount } = useAdminNewOrders(allowed);
//   { label: "Orders", icon: FiShoppingBag, path: "/admin/orders", badge: newOrdersCount }
//
// "Last seen" is stored in this browser's localStorage, so it needs no
// Firestore writes or extra security rules. The query only reads orders newer
// than the last-seen time, so it stays cheap.

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "../context/firebase";

const KEY = "cm_admin_orders_seen_at";

// First visit: start counting from "now" so old orders don't all show as new.
export const readAdminSeenAt = () => {
  try {
    const saved = Number(localStorage.getItem(KEY));
    if (saved > 0) return saved;
    const now = Date.now();
    localStorage.setItem(KEY, String(now));
    return now;
  } catch {
    return Date.now();
  }
};

export default function useAdminNewOrders(enabled = true) {
  const [seenAt, setSeenAt] = useState(readAdminSeenAt);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setNewCount(0);
      return;
    }

    const q = query(
      collection(db, "orders"),
      where("createdAt", ">", Timestamp.fromMillis(seenAt))
    );

    const unsub = onSnapshot(
      q,
      (snap) => setNewCount(snap.size),
      (error) => {
        console.error("Admin new orders badge error:", error);
        setNewCount(0);
      }
    );

    return () => unsub();
  }, [enabled, seenAt]);

  const markSeen = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(KEY, String(now));
    } catch {
      /* ignore */
    }
    setSeenAt(now);
  }, []);

  return { newCount, seenAt, markSeen };
}