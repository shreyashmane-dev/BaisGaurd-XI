import { addDoc, collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "../config/firebase";

export const createCase = async (data) => {
  const ref = await addDoc(collection(db, "cases"), {
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return ref.id;
};

export const updateCase = async (caseId, data) => {
  await updateDoc(doc(db, "cases", caseId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
};

export const deleteCase = async (caseId) => deleteDoc(doc(db, "cases", caseId));

export const subscribeToCase = (caseId, onUpdate, onError) =>
  onSnapshot(doc(db, "cases", caseId), (snapshot) => onUpdate(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null), onError);

export const subscribeToCases = (userId, onUpdate, onError) => {
  const q = query(collection(db, "cases"), where("userId", "==", userId));
  return onSnapshot(
    q, 
    (snapshot) => {
      const docs = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      // Robust in-memory sort to avoid composite index requirement
      docs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      onUpdate(docs);
    }, 
    onError
  );
};

export const subscribeToUserProfile = (userId, onUpdate, onError) =>
  onSnapshot(doc(db, "users", userId), (snapshot) => onUpdate(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null), onError);

export const saveUserProfile = async (userId, data) => {
  await setDoc(doc(db, "users", userId), { ...data, updatedAt: new Date().toISOString() }, { merge: true });
};

export const subscribeToLogs = (userId, onUpdate, onError) => {
  const q = query(collection(db, "logs"), where("userId", "==", userId));
  return onSnapshot(
    q, 
    (snapshot) => {
      const docs = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
      docs.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      onUpdate(docs);
    }, 
    onError
  );
};

export const fetchUsageStats = async (userId) => {
  const snapshot = await getDocs(query(collection(db, "cases"), where("userId", "==", userId)));
  const cases = snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() }));
  const totalCases = cases.length;
  const proModeCount = cases.filter((entry) => entry.mode === "pro").length;
  const averageBias = totalCases
    ? Math.round(
        cases.reduce((sum, entry) => sum + Number(entry.finalResult?.bias_score ?? entry.finalResult?.biasScore ?? 0), 0) /
          totalCases,
      )
    : 0;
  const domainBreakdown = cases.reduce((acc, entry) => {
    const domain = entry.domain || "unknown";
    acc[domain] = (acc[domain] || 0) + 1;
    return acc;
  }, {});

  return {
    totalCases,
    proModeCount,
    averageBias,
    domainBreakdown,
    lastActivity: cases[0]?.createdAt || null,
  };
};

export const saveOfflineCaseCache = async (caseData) => {
  try {
    localStorage.setItem("offlineCaseCache", JSON.stringify(caseData));
  } catch (error) {
    console.error("Error saving offline case cache", error);
  }
};

export const getOfflineCaseCache = () => {
  try {
    const data = localStorage.getItem("offlineCaseCache");
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Error reading offline case cache", error);
    return null;
  }
};
