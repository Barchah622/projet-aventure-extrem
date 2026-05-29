# projet-aventure-extrem
# 🚀 Aventure Xtreme - Plateforme Web

Bienvenue dans le code source de **Aventure Xtreme**, la plateforme de réservation pour club privé d'aventure.
Ce projet est conçu pour être **ultra-performant**, **responsive** et **immédiatement déployable**.

## 🌟 Fonctionnalités Clés

- **Système de Réservation Complet** : De la vitrine au paiement final.
- **Espace Membre Dynamique** : Gestion de session, profils, et badges.
- **Sécurité Intégrée** : Verrouillage des réservations si non connecté.
- **Design Premium** : Interface sombre/dorée, animations fluides, mode "Glassmorphism".
- **Billet Numérique** : Génération automatique de QR Code.

---

## 📂 Structure du Projet

Voici les fichiers essentiels pour vous repérer :

| Fichier         | Description                                               |
| :-------------- | :-------------------------------------------------------- |
| `index.html`    | **Page d'Accueil (Vitrine)** - Carousel 3D, présentation. |
| `offre.html`    | **Page Produit** - Détails, sélection siège bus, panier.  |
| `reserver.html` | **Tunnel d'Achat** - Formulaire sécurisé, upload ID.      |
| `success.html`  | **Billet** - Confirmation et QR Code à télécharger.       |
| `login.html`    | **Connexion** - Portail d'accès membre.                   |
| `profil.html`   | **Tableau de Bord** - Badges, historique, parrainage.     |

---

## 🚀 Comment Déployer (Mise en Ligne)

Ce site est **100% Statique** (HTML/CSS/JS), ce qui le rend **gratuit** et **très facile** à héberger. Voici deux méthodes :

### 🥇 Méthode 1 : Netlify Drop (Le plus rapide - 30 secondes)

1. Prenez le **dossier complet** contenant tous les fichiers.
2. Allez sur **[app.netlify.com/drop](https://app.netlify.com/drop)**.
3. **Glissez-déposez** le dossier dans la zone indiquée.
4. **C'est fini !** Votre site est en ligne avec une URL sécurisée (`https://...netlify.app`).

### 🥈 Méthode 2 : GitHub Pages (Pour les développeurs)

1. Créez un nouveau dépôt sur [GitHub](https://github.com/new).
2. Uploadez tous les fichiers du dossier.
3. Allez dans **Settings** > **Pages**.
4. Dans "Branch", sélectionnez `main` (ou `master`) et cliquez sur **Save**.
5. Votre site sera accessible via `https://votre-nom.github.io/projet-aventure`.

---

## 🛠️ Personnalisation Rapide

- **Changer les Images** : Remplacez les liens `src` dans `index.html` ou `offre.html` (actuellement Unsplash).
- **Modifier les Prix/Dates** : Ouvrez `offre.html` et modifiez l'objet `data` (lignes ~120) dans le script en bas de page.
- **Couleurs** : Le thème utilise TailwindCSS. Recherchez `text-[#FFD700]` pour changer le doré.

---

_Créé par l'IA Antigravity pour Aventure Xtreme - 2026_
