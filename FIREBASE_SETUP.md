# 🔥 Guide de Configuration Firebase - Étape par Étape

Ce guide vous accompagne dans la configuration complète de Firebase pour l'application Janaza Tracker.

## 📋 Prérequis

- Un compte Google
- 10 minutes de votre temps

---

## 1️⃣ Créer un Projet Firebase

1. **Accédez à la console Firebase**
   - Ouvrez votre navigateur et allez sur : https://console.firebase.google.com
   - Connectez-vous avec votre compte Google

2. **Créer un nouveau projet**
   - Cliquez sur **"Ajouter un projet"** (ou "Add project")
   - Entrez un nom pour votre projet : `janaza-tracker` (ou le nom de votre choix)
   - Cliquez sur **"Continuer"**

3. **Google Analytics** (optionnel)
   - Vous pouvez désactiver Google Analytics si vous ne souhaitez pas de statistiques
   - Cliquez sur **"Créer le projet"**
   - Attendez quelques secondes que le projet soit créé

---

## 2️⃣ Activer l'Authentification

1. **Accéder à Authentication**
   - Dans le menu de gauche, cliquez sur **"Authentication"**
   - Cliquez sur **"Get started"** (Commencer)

2. **Activer Email/Password**
   - Cliquez sur l'onglet **"Sign-in method"** (Méthode de connexion)
   - Dans la liste des fournisseurs, trouvez **"Email/Password"**
   - Cliquez dessus
   - Activez le premier bouton **"Email/Password"** (PAS le "Email link")
   - Cliquez sur **"Save"** (Enregistrer)

✅ L'authentification est maintenant configurée !

---

## 3️⃣ Créer la Base de Données Firestore

1. **Accéder à Firestore**
   - Dans le menu de gauche, cliquez sur **"Firestore Database"**
   - Cliquez sur **"Create database"** (Créer une base de données)

2. **Choisir le mode**
   - Sélectionnez **"Start in production mode"** (Démarrer en mode production)
   - Cliquez sur **"Next"** (Suivant)

3. **Choisir la région**
   - Sélectionnez une région proche de vous :
     - Pour la France : `europe-west1` (Belgique) ou `europe-west3` (Francfort)
     - Pour le Canada : `northamerica-northeast1` (Montréal)
     - Pour les USA : `us-east1` (Caroline du Sud)
   - Cliquez sur **"Enable"** (Activer)
   - Attendez quelques secondes que la base soit créée

✅ Firestore est maintenant créé !

---

## 4️⃣ Configurer les Règles de Sécurité Firestore

**⚠️ ÉTAPE CRITIQUE - NE PAS SAUTER**

1. **Accéder aux règles**
   - Vous devriez être dans Firestore Database
   - Cliquez sur l'onglet **"Rules"** (Règles) en haut

2. **Remplacer les règles**
   - Vous verrez un éditeur de code avec des règles par défaut
   - **SUPPRIMEZ TOUT** le contenu actuel
   - **COPIEZ-COLLEZ** exactement le code suivant :

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

3. **Publier les règles**
   - Cliquez sur **"Publish"** (Publier)
   - Confirmez si nécessaire

✅ Les règles de sécurité sont configurées !

**Ce que font ces règles :**
- ✅ Tout le monde peut VOIR les janazas (même sans compte)
- ✅ Seuls les utilisateurs connectés peuvent AJOUTER des janazas
- ✅ Seul le créateur peut MODIFIER ou SUPPRIMER sa janaza
- ❌ Personne ne peut modifier les janazas des autres

---

## 5️⃣ Obtenir les Identifiants Firebase

1. **Accéder aux paramètres**
   - Cliquez sur l'icône **⚙️ (engrenage)** à côté de "Project Overview" en haut à gauche
   - Cliquez sur **"Project settings"** (Paramètres du projet)

2. **Créer une application Web**
   - Descendez jusqu'à la section **"Your apps"** (Vos applications)
   - Cliquez sur l'icône **</>** (Web)
   - Entrez un surnom pour l'app : `Janaza Tracker Web`
   - **NE COCHEZ PAS** "Also set up Firebase Hosting"
   - Cliquez sur **"Register app"** (Enregistrer l'application)

3. **Copier la configuration**
   - Vous verrez un bloc de code JavaScript
   - Copiez UNIQUEMENT les valeurs entre guillemets :

```javascript
const firebaseConfig = {
  apiKey: "AIza....",              // ← Copiez cette valeur
  authDomain: "xxx.firebaseapp.com", // ← Copiez cette valeur
  projectId: "xxx",                  // ← Copiez cette valeur
  storageBucket: "xxx.appspot.com",  // ← Copiez cette valeur
  messagingSenderId: "123456",       // ← Copiez cette valeur
  appId: "1:123:web:abc"            // ← Copiez cette valeur
};
```

4. **Remplir le fichier .env.local**
   - Ouvrez le fichier `.env.local` dans votre projet
   - Remplacez les valeurs par celles que vous venez de copier :

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIza....
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456
NEXT_PUBLIC_FIREBASE_APP_ID=1:123:web:abc
```

5. **Enregistrer le fichier**
   - Sauvegardez `.env.local`
   - **IMPORTANT** : Si le serveur de développement tourne, redémarrez-le :
     ```bash
     # Appuyez sur Ctrl+C pour arrêter
     # Puis relancez :
     npm run dev
     ```

✅ La configuration est terminée !

---

## 6️⃣ Vérifier que Tout Fonctionne

1. **Lancer l'application**
   ```bash
   npm run dev
   ```

2. **Ouvrir dans le navigateur**
   - Allez sur http://localhost:3000

3. **Tester l'inscription**
   - Cliquez sur **"Connexion"**
   - Cliquez sur **"Pas encore de compte ? S'inscrire"**
   - Entrez un email et un mot de passe (minimum 6 caractères)
   - Cliquez sur **"S'inscrire"**

4. **Vérifier dans Firebase**
   - Retournez dans la console Firebase
   - Allez dans **Authentication** > **Users**
   - Vous devriez voir votre utilisateur !

5. **Tester l'ajout d'une janaza**
   - Dans l'application, cliquez sur **"Ajouter une Janaza"**
   - Remplissez le formulaire
   - Cliquez sur **"Ajouter"**

6. **Vérifier dans Firestore**
   - Retournez dans la console Firebase
   - Allez dans **Firestore Database** > **Data**
   - Vous devriez voir une collection **"janazas"** avec votre document !

---

## 🎉 Félicitations !

Votre application Janaza Tracker est maintenant complètement configurée et fonctionnelle !

---

## 🔧 Dépannage

### Erreur : "Firebase: Error (auth/invalid-api-key)"
- Vérifiez que vous avez bien copié `apiKey` dans `.env.local`
- Vérifiez qu'il n'y a pas d'espaces avant ou après la valeur
- Redémarrez le serveur de développement

### Erreur : "Missing or insufficient permissions"
- Vérifiez que vous avez bien publié les règles Firestore
- Vérifiez que les règles sont exactement comme dans ce guide
- Attendez 1-2 minutes que les règles se propagent

### L'inscription ne fonctionne pas
- Vérifiez que Email/Password est bien activé dans Authentication
- Vérifiez que le mot de passe fait au moins 6 caractères
- Vérifiez la console du navigateur (F12) pour les erreurs

### Je ne vois pas mes janazas
- Vérifiez que vous êtes bien connecté
- Vérifiez dans Firestore Database > Data que les documents existent
- Actualisez la page (F5)

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez la console du navigateur (F12) pour les erreurs
2. Vérifiez les logs Firebase dans la console Firebase
3. Relisez attentivement ce guide
4. Vérifiez que toutes les étapes ont été suivies

---

**Bon développement ! 🚀**
