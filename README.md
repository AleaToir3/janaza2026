# 🕌 Janaza Tracker

Application web professionnelle de suivi des prières funéraires (Janazas) avec carte interactive, développée avec Next.js, Firebase Firestore, et Tailwind CSS + DaisyUI.

## ✨ Fonctionnalités

- **Carte Interactive** : Visualisation géographique de toutes les janazas avec marqueurs cliquables
- **Liste Élégante** : Affichage des janazas sous forme de cartes triées par date
- **Authentification Firebase** : Système de connexion/inscription sécurisé
- **Ajout de Janaza** : Formulaire complet avec géolocalisation automatique
- **Itinéraire Google Maps** : Bouton direct vers Google Maps pour chaque janaza
- **Design Airbnb** : Interface minimaliste et épurée
- **Temps Réel** : Mises à jour automatiques via Firestore

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- Un compte Firebase (gratuit)

### Étapes d'installation

1. **Cloner ou naviguer vers le projet**
   ```bash
   cd /mnt/DATA_DISK/codage/aibJanazapp/janaza-tracker
   ```

2. **Installer les dépendances** (déjà fait)
   ```bash
   npm install
   ```

3. **Configurer Firebase**

   a. Créez un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
   
   b. Activez l'authentification Email/Password :
      - Dans la console Firebase, allez dans **Authentication** > **Sign-in method**
      - Activez **Email/Password**
   
   c. Créez une base de données Firestore :
      - Allez dans **Firestore Database** > **Create database**
      - Choisissez le mode **Production**
      - Sélectionnez une région proche de vous
   
   d. Copiez vos identifiants Firebase :
      - Allez dans **Project Settings** (⚙️) > **General**
      - Sous "Your apps", cliquez sur l'icône Web (</>)
      - Copiez les valeurs de configuration

4. **Configurer les variables d'environnement**

   Ouvrez le fichier `.env.local` et remplacez les valeurs par celles de votre projet Firebase :

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=votre_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=votre_project_id.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=votre_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=votre_project_id.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=votre_app_id
   ```

5. **Configurer les règles de sécurité Firestore**

   **IMPORTANT** : Cette étape est cruciale pour la sécurité de votre application.

   a. Dans la console Firebase, allez dans **Firestore Database** > **Rules**
   
   b. Copiez le contenu du fichier `firestore.rules` :
   
   ```
   rules_version = '2';

   service cloud.firestore {
     match /databases/{database}/documents {
       
       // Collection janazas
       match /janazas/{janazaId} {
         // Lecture publique : tout le monde peut lire les janazas
         allow read: if true;
         
         // Création : uniquement pour les utilisateurs authentifiés
         allow create: if request.auth != null 
                       && request.resource.data.created_by == request.auth.uid
                       && request.resource.data.created_at == request.time;
         
         // Mise à jour et suppression : uniquement le créateur du document
         allow update, delete: if request.auth != null 
                               && request.auth.uid == resource.data.created_by;
       }
     }
   }
   ```
   
   c. Collez ces règles dans l'éditeur de règles Firebase
   
   d. Cliquez sur **Publish** (Publier)

6. **Lancer l'application**
   ```bash
   npm run dev
   ```

   L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📱 Utilisation

### Pour les visiteurs (non connectés)

- ✅ Voir toutes les janazas sur la carte
- ✅ Consulter la liste des janazas
- ✅ Obtenir un itinéraire vers une mosquée
- ❌ Ajouter une janaza (connexion requise)

### Pour les utilisateurs connectés

- ✅ Toutes les fonctionnalités des visiteurs
- ✅ Ajouter une nouvelle janaza
- ✅ Modifier/Supprimer leurs propres janazas

### Ajouter une Janaza

1. Cliquez sur **"Connexion"** et créez un compte
2. Cliquez sur **"Ajouter une Janaza"**
3. Remplissez le formulaire :
   - Nom du défunt
   - Heure de la prière
   - Nom de la mosquée
   - Adresse de la mosquée
4. Cliquez sur **"Géolocaliser"** pour obtenir automatiquement les coordonnées
5. Vérifiez les coordonnées (latitude/longitude)
6. Cliquez sur **"Ajouter"**

La janaza apparaîtra immédiatement sur la carte et dans la liste !

## 🏗️ Structure du Projet

```
janaza-tracker/
├── app/
│   ├── globals.css          # Styles globaux (Tailwind + DaisyUI)
│   ├── layout.tsx            # Layout principal avec métadonnées
│   └── page.tsx              # Page d'accueil avec carte et liste
├── components/
│   ├── AddJanazaModal.tsx    # Modal d'ajout de janaza
│   ├── AuthModal.tsx         # Modal d'authentification
│   ├── JanazaCard.tsx        # Carte d'affichage d'une janaza
│   └── MapComponent.tsx      # Composant de carte interactive
├── lib/
│   └── firebaseConfig.ts     # Configuration Firebase
├── types/
│   └── janaza.ts             # Types TypeScript
├── .env.local                # Variables d'environnement
├── firestore.rules           # Règles de sécurité Firestore
└── package.json              # Dépendances du projet
```

## 🎨 Design

L'application utilise un design inspiré d'Airbnb :

- **Couleurs** : Palette minimaliste avec accent rouge (#FF385C)
- **Typographie** : Police système (San Francisco, Segoe UI, Roboto)
- **Espacement** : Généreux pour une meilleure lisibilité
- **Ombres** : Légères et subtiles
- **Animations** : Micro-interactions fluides

## 🔒 Sécurité

- **Lecture publique** : Tout le monde peut voir les janazas
- **Écriture protégée** : Seuls les utilisateurs connectés peuvent ajouter des janazas
- **Propriété** : Les utilisateurs ne peuvent modifier/supprimer que leurs propres janazas
- **Validation** : Les données sont validées côté client et serveur

## 🛠️ Technologies

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Firebase** (Auth + Firestore)
- **Tailwind CSS v4**
- **DaisyUI**
- **Leaflet** (Carte interactive)
- **OpenStreetMap** (Géolocalisation)

## 📝 Structure des Données

Chaque janaza dans Firestore contient :

```typescript
{
  nom_defunt: string;           // Nom du défunt
  heure_priere: Timestamp;      // Date et heure de la prière
  nom_mosquee: string;          // Nom de la mosquée
  adresse_mosquee: string;      // Adresse complète
  coordonnees: {
    lat: number;                // Latitude
    lng: number;                // Longitude
  };
  created_by: string;           // UID de l'utilisateur créateur
  created_at: Timestamp;        // Date de création
}
```

## 🚀 Déploiement

Pour déployer en production :

1. **Build de production**
   ```bash
   npm run build
   ```

2. **Déployer sur Vercel** (recommandé pour Next.js)
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Configurer les variables d'environnement** sur Vercel
   - Ajoutez toutes les variables `NEXT_PUBLIC_FIREBASE_*`

## 🐛 Dépannage

### La carte ne s'affiche pas
- Vérifiez que vous avez bien installé `leaflet` et `react-leaflet`
- Vérifiez la console pour les erreurs JavaScript

### Erreur d'authentification
- Vérifiez que l'authentification Email/Password est activée dans Firebase
- Vérifiez vos variables d'environnement dans `.env.local`

### Impossible d'ajouter une janaza
- Vérifiez que vous êtes bien connecté
- Vérifiez que les règles Firestore sont correctement configurées
- Vérifiez la console Firebase pour les erreurs

### La géolocalisation ne fonctionne pas
- L'API OpenStreetMap Nominatim a des limites de taux
- Vous pouvez entrer manuellement les coordonnées (utilisez Google Maps pour les trouver)

## 📄 Licence

Ce projet est open source et disponible sous licence MIT.

## 👨‍💻 Développement

Pour contribuer au projet :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

**Développé avec ❤️ pour la communauté musulmane**
