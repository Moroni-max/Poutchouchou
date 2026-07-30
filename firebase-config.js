// ============================================================
// CONFIGURATION FIREBASE
// ============================================================
// Remplace les valeurs ci-dessous par celles de TON projet Firebase.
// Marche à suivre complète dans README.md (section "Configurer Firebase").
//
// Tant que ces valeurs sont laissées telles quelles (placeholders),
// l'application fonctionne quand même, mais UNIQUEMENT en local sur
// chaque appareil (pas de synchronisation entre ton téléphone et
// celui de ta femme).
// ============================================================

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAkPXaSFpu_OesPhjGfVmiryBshGHcLvEM",
  authDomain: "carnet-de-voyage-f7f5d.firebaseapp.com",
  projectId: "carnet-de-voyage-f7f5d",
  storageBucket: "carnet-de-voyage-f7f5d.firebasestorage.app",
  messagingSenderId: "988440844442",
  appId: "1:988440844442:web:b321b935f847bb993f2723"
};

// Ne pas modifier : indique à app.js si la config a été remplie.
const FIREBASE_CONFIGURED = !Object.values(FIREBASE_CONFIG).some(
  (v) => typeof v === "string" && v.includes("REMPLACE_MOI")
);
