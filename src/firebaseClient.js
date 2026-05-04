import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBIsDe-tG7BuuBB7enCZrUlAKD48oY_8as",
  authDomain: "math-app-c2b84.firebaseapp.com",
  projectId: "math-app-c2b84",
  storageBucket: "math-app-c2b84.firebasestorage.app",
  messagingSenderId: "568947054198",
  appId: "1:568947054198:web:2c183e0f7818838025b157",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const firebaseEnabled = true;

function cleanId(value = "") {
  return String(value).trim().replaceAll("/", "-") || "unknown";
}

export async function registerRealAccount(email, password, profile = {}) {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  await saveUserProfile(result.user.uid, {
    email,
    role: profile.role || "student",
    displayName: profile.displayName || profile.studentName || "Student",
    classCode: profile.classCode || "901",
    studentName: profile.studentName || profile.displayName || "Student",
    createdAt: new Date().toISOString(),
  });
  return result.user;
}

export async function signInRealAccount(email, password) {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
}

export async function loginRealAccount(email, password) {
  return signInRealAccount(email, password);
}

export async function logoutRealAccount() {
  await signOut(auth);
}

export const signOutRealAccount = logoutRealAccount;

export async function loadUserProfile(userId) {
  const ref = doc(db, "users", userId);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(userId, data) {
  const ref = doc(db, "users", userId);
  await setDoc(
    ref,
    {
      ...data,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function loadCloudStudentProgress(userId, studentName = "student") {
  const ref = doc(db, "studentProgress", `${cleanId(userId)}_${cleanId(studentName)}`);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

export async function saveCloudStudentProgress(userId, studentName = "student", data = {}, profile = {}) {
  const safeStudentName = profile.studentName || studentName || data.currentStudent || "Student";
  const safeClassCode = profile.classCode || data.selectedClass || "901";
  const now = new Date().toISOString();

  const progressRecord = {
    ...data,
    userId,
    studentName: safeStudentName,
    classCode: safeClassCode,
    updatedAt: now,
  };

  await setDoc(doc(db, "studentProgress", `${cleanId(userId)}_${cleanId(safeStudentName)}`), progressRecord, { merge: true });
  await setDoc(doc(db, "classes", cleanId(safeClassCode), "students", cleanId(safeStudentName)), progressRecord, { merge: true });
}

export async function loadClassStudentProgress(classCode = "901") {
  const snap = await getDocs(collection(db, "classes", cleanId(classCode), "students"));
  const rows = {};
  snap.forEach((docSnap) => {
    const data = docSnap.data();
    if (data?.studentName) rows[data.studentName] = data;
  });
  return rows;
}

export async function loadClassAccounts(classCode = "901") {
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("classCode", "==", classCode));
  const snap = await getDocs(q);
  return snap.docs.map((docSnap) => ({ uid: docSnap.id, ...docSnap.data() }));
}

export async function loadClassStudents(classCode) {
  const q = query(
    collection(db, "users"),
    where("classCode", "==", classCode),
    where("role", "==", "student")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));
}