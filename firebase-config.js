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
  apiKey: "REMPLACE_MOI",
  authDomain: "REMPLACE_MOI.firebaseapp.com",
  projectId: "REMPLACE_MOI",
  storageBucket: "REMPLACE_MOI.appspot.com",
  messagingSenderId: "REMPLACE_MOI",
  appId: "REMPLACE_MOI"
};

// Ne pas modifier : indique à app.js si la config a été remplie.
const FIREBASE_CONFIGURED = !Object.values(FIREBASE_CONFIG).some(
  (v) => typeof v === "string" && v.includes("REMPLACE_MOI")
);
