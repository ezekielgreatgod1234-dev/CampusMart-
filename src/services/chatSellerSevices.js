import {
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  getDoc,
} from "firebase/firestore";

import { db } from "../firebase";


// =====================================================
// CREATE / GET CONVERSATION
// =====================================================

export const createConversation = async ({
  buyerId,
  sellerId,
  productId = null,
  productName = "",
}) => {
  if (!buyerId || !sellerId) {
    throw new Error("Buyer ID and Seller ID are required.");
  }

  // Always generate the same ID for the same buyer/seller/product
  const conversationId = productId
    ? `${buyerId}_${sellerId}_${productId}`
    : `${buyerId}_${sellerId}`;

  const conversationRef = doc(
    db,
    "conversations",
    conversationId
  );

  const conversationSnap = await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    await setDoc(conversationRef, {
      buyerId,
      sellerId,
      productId,
      productName,
      lastMessage: "",
      lastSenderId: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  return conversationId;
};


// =====================================================
// SEND MESSAGE
// =====================================================

export const sendMessage = async ({
  conversationId,
  senderId,
  receiverId,
  text,
}) => {
  const cleanText = String(text || "").trim();

  if (!cleanText) {
    return;
  }

  if (!conversationId || !senderId || !receiverId) {
    throw new Error("Missing chat information.");
  }

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  await addDoc(messagesRef, {
    senderId,
    receiverId,
    text: cleanText,
    read: false,
    createdAt: serverTimestamp(),
  });

  // Update conversation preview
  await updateDoc(
    doc(db, "conversations", conversationId),
    {
      lastMessage: cleanText,
      lastSenderId: senderId,
      updatedAt: serverTimestamp(),
    }
  );
};


// =====================================================
// LISTEN TO MESSAGES IN REAL TIME
// =====================================================

export const listenToMessages = (
  conversationId,
  callback
) => {
  if (!conversationId) {
    return () => {};
  }

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const messagesQuery = query(
    messagesRef,
    orderBy("createdAt", "asc")
  );

  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map((messageDoc) => ({
      id: messageDoc.id,
      ...messageDoc.data(),
    }));

    callback(messages);
  });
};