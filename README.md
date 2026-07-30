# Carnet de Voyage

Checklist de préparation à l'arrivée de bébé, avec un itinéraire visuel façon carnet de voyage. Synchronisée entre ton ordinateur, ton iPhone et celui de ta femme via Firebase.

## 1. Déployer sur GitHub Pages

1. Crée un nouveau dépôt GitHub (ex : `carnet-de-voyage`).
2. Ajoute tous les fichiers de ce dossier à la racine du dépôt.
3. Dans **Settings → Pages**, choisis la branche `main` et le dossier `/ (root)`.
4. L'appli sera accessible à `https://moroni-max.github.io/carnet-de-voyage/`.

Tant que l'étape 2 (Firebase) n'est pas faite, l'appli fonctionne déjà — mais chaque appareil garde ses propres données, sans synchronisation.

## 2. Configurer Firebase (pour la synchronisation entre appareils)

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et connecte-toi avec un compte Google.
2. Clique sur **Ajouter un projet**, donne-lui un nom (ex : `carnet-de-voyage`), et termine la création (tu peux désactiver Google Analytics, pas nécessaire ici).
3. Dans le menu de gauche, va dans **Compilation → Firestore Database**, clique sur **Créer une base de données**.
   - Choisis **Mode production**.
   - Choisis une région proche (ex : `eur3 (europe-west)`).
4. Une fois la base créée, va dans l'onglet **Règles** et remplace le contenu par :

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /carnets-voyage/{docId} {
         allow read, write: if true;
       }
     }
   }
   ```

   > Ces règles ouvrent l'accès à quiconque connaît l'identifiant exact du document (ton "code du voyage"). C'est suffisant pour un usage privé à deux, tant que le code choisi n'est pas trivial à deviner (évite `test` ou `bebe`, préfère quelque chose comme `dupont-mars-2027`).

5. Retourne à la page d'accueil du projet, clique sur l'icône **`</>`** (Web) pour ajouter une application web.
6. Donne-lui un nom, ne coche pas "Firebase Hosting" (on utilise GitHub Pages).
7. Firebase affiche un objet `firebaseConfig` — copie les valeurs (`apiKey`, `authDomain`, `projectId`, etc.) dans le fichier **`firebase-config.js`** de ce projet, à la place des `"REMPLACE_MOI"`.
8. Redéploie (ou pousse le commit) sur GitHub Pages. La synchronisation est active.

## 3. Utilisation à deux

- Au premier lancement, chacun renseigne **la même date de terme** et **le même code du voyage** (ex : `dupont-mars-2027`).
- Une fois les deux appareils connectés au même code, toute case cochée par l'un apparaît immédiatement chez l'autre.
- Le code peut être changé à tout moment via "Utiliser un autre code" en bas de page (utile si vous voulez repartir d'un carnet vierge).

## 4. Installer comme une app (PWA)

- **iPhone (Safari)** : ouvrir le lien → bouton Partager → "Sur l'écran d'accueil".
- **Android (Chrome)** : ouvrir le lien → menu ⋮ → "Ajouter à l'écran d'accueil".

L'appli s'ouvre alors en plein écran, avec son icône, sans passer par l'App Store.

## Fichiers du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Structure de la page |
| `style.css` | Direction artistique (carnet de voyage) |
| `data.js` | Contenu de la checklist par trimestre — modifiable librement |
| `firebase-config.js` | Clés de connexion à ta base Firebase |
| `app.js` | Logique : calcul de semaine, itinéraire, sync |
| `manifest.json` / `sw.js` | Support PWA (installation, mode hors-ligne) |
