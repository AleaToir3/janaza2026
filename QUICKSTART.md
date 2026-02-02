# 🚀 Démarrage Rapide - Janaza Tracker

## ⚡ En 5 Minutes

### Étape 1 : Vérifier que le serveur tourne
```bash
# Le serveur devrait déjà être lancé
# Si ce n'est pas le cas :
cd /mnt/DATA_DISK/codage/aibJanazapp/janaza-tracker
npm run dev
```

✅ **L'application est accessible sur** : http://localhost:3000

---

### Étape 2 : Configurer Firebase

**IMPORTANT** : L'application ne fonctionnera pas complètement sans Firebase.

1. **Suivez le guide complet** : Ouvrez `FIREBASE_SETUP.md`
2. **Ou suivez ces étapes rapides** :

#### A. Créer un projet Firebase
- Allez sur https://console.firebase.google.com
- Cliquez sur "Ajouter un projet"
- Nommez-le `janaza-tracker`

#### B. Activer l'authentification
- Menu **Authentication** → **Get started**
- Onglet **Sign-in method**
- Activez **Email/Password**

#### C. Créer Firestore
- Menu **Firestore Database** → **Create database**
- Mode **Production**
- Choisissez une région proche

#### D. Configurer les règles
- Onglet **Rules**
- Copiez le contenu de `firestore.rules`
- Cliquez sur **Publish**

#### E. Obtenir les identifiants
- **⚙️** → **Project settings**
- Cliquez sur **</>** (Web)
- Copiez les valeurs dans `.env.local`

---

### Étape 3 : Tester l'application

1. **Créer un compte**
   - Cliquez sur "Connexion"
   - "Pas encore de compte ? S'inscrire"
   - Entrez email + mot de passe (6+ caractères)

2. **Ajouter une janaza**
   - Cliquez sur "Ajouter une Janaza"
   - Remplissez le formulaire
   - Cliquez sur "Géolocaliser" pour obtenir les coordonnées
   - Cliquez sur "Ajouter"

3. **Voir le résultat**
   - La janaza apparaît sur la carte
   - La janaza apparaît dans la liste
   - Cliquez sur "Itinéraire" pour ouvrir Google Maps

---

## 📖 Documentation Complète

- **README.md** : Documentation détaillée
- **FIREBASE_SETUP.md** : Guide Firebase pas à pas
- **SUMMARY.md** : Résumé du projet

---

## 🎯 Ce qui fonctionne MAINTENANT

✅ Interface utilisateur complète
✅ Carte interactive
✅ Layout responsive
✅ Design Airbnb

## 🔧 Ce qui nécessite Firebase

⏳ Authentification (connexion/inscription)
⏳ Ajout de janazas
⏳ Stockage des données
⏳ Temps réel

---

## 🆘 Aide Rapide

### Problème : La carte ne s'affiche pas
**Solution** : Rechargez la page (F5)

### Problème : Erreur Firebase
**Solution** : Vérifiez `.env.local` et redémarrez le serveur

### Problème : Géolocalisation ne fonctionne pas
**Solution** : Entrez manuellement lat/lng (trouvez sur Google Maps)

---

## 🎉 Prêt à utiliser !

Une fois Firebase configuré, votre application sera **100% fonctionnelle** !

**Bon développement ! 🚀**
