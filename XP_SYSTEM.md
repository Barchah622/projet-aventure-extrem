# 🎮 Système XP Progressif - Xtreme Adventures

## 📊 **Fonctionnement**

### **Gains et Pertes XP**

Le système XP est **progressif** : plus vous montez de niveau, plus vous gagnez (ou perdez) d'XP !

#### **Formule**

```
XP = XP_BASE × (1 + 0.25 × NIVEAU)
```

#### **Valeurs de Base**

- 🎉 **Réservation** : +30 XP
- ❌ **Annulation** : -15 XP

---

## 📈 **Tableau des XP par Niveau**

| Niveau | Rang       | Réservation | Annulation |
| ------ | ---------- | ----------- | ---------- |
| 0      | Novice 3   | +30 XP      | -15 XP     |
| 1      | Novice 2   | +38 XP      | -19 XP     |
| 2      | Novice 1   | +45 XP      | -23 XP     |
| 3      | Bronze 3   | +53 XP      | -26 XP     |
| 4      | Bronze 2   | +60 XP      | -30 XP     |
| 5      | Bronze 1   | +68 XP      | -34 XP     |
| 6      | Silver 3   | +75 XP      | -38 XP     |
| 7      | Silver 2   | +83 XP      | -41 XP     |
| 8      | Silver 1   | +90 XP      | -45 XP     |
| 9      | Gold 3     | +98 XP      | -49 XP     |
| 10     | Gold 2     | +105 XP     | -53 XP     |
| 11     | Gold 1     | +113 XP     | -56 XP     |
| 12     | Platinum 3 | +120 XP     | -60 XP     |
| 13     | Platinum 2 | +128 XP     | -64 XP     |
| 14     | Platinum 1 | +135 XP     | -68 XP     |
| 15     | Diamond 3  | +143 XP     | -71 XP     |
| 16     | Diamond 2  | +150 XP     | -75 XP     |
| 17     | Diamond 1  | +158 XP     | -79 XP     |

---

## 🎯 **Seuils de Rangs**

| Rang          | XP Min  | XP Max |
| ------------- | ------- | ------ |
| Novice 3 🟤   | 0       | 750    |
| Novice 2 🟤   | 750     | 1,500  |
| Novice 1 🟤   | 1,500   | 2,250  |
| Bronze 3 🟫   | 2,250   | 3,375  |
| Bronze 2 🟫   | 3,375   | 5,063  |
| Bronze 1 🟫   | 5,063   | 6,750  |
| Silver 3 ⚪   | 6,750   | 9,375  |
| Silver 2 ⚪   | 9,375   | 12,188 |
| Silver 1 ⚪   | 12,188  | 15,000 |
| Gold 3 🟡     | 15,000  | 20,000 |
| Gold 2 🟡     | 20,000  | 25,000 |
| Gold 1 🟡     | 25,000  | 30,000 |
| Platinum 3 🔵 | 30,000  | 38,750 |
| Platinum 2 🔵 | 38,750  | 46,875 |
| Platinum 1 🔵 | 46,875  | 55,000 |
| Diamond 3 💎  | 55,000  | 70,000 |
| Diamond 2 💎  | 70,000  | 85,000 |
| Diamond 1 💎  | 85,000+ | ∞      |

---

## ⚙️ **Implémentation**

### **Fichiers Modifiés**

✅ **`profil.html`**

- Fonctions `getReservationXP()` et `getCancellationXP()`
- Calcul dynamique selon le niveau actuel

✅ **`reserver.html`**

- Fonction `calculateReservationXP()`
- Attribution XP lors de la réservation

✅ **`server.js`**

- Email d'annulation personnalisé
- Affichage du XP perdu dynamiquement

---

## 🎮 **Exemples**

### **Exemple 1 : Novice**

- Utilisateur : **0 XP** (Novice 3, niveau 0)
- Réservation : **+30 XP**
- Nouveau total : **30 XP**

### **Exemple 2 : Progression**

- Utilisateur : **15,000 XP** (Gold 3, niveau 9)
- Réservation : **+98 XP** (30 × 3.25)
- Annulation : **-49 XP** (15 × 3.25)

### **Exemple 3 : Diamond**

- Utilisateur : **85,000 XP** (Diamond 1, niveau 17)
- Réservation : **+158 XP** (30 × 5.25)
- Annulation : **-79 XP** (15 × 5.25)

---

## 🚀 **Avantages**

✅ **Motivation** : Plus vous montez, plus vous gagnez !
✅ **Équilibré** : Les pénalités augmentent aussi
✅ **Progression** : Encourage l'engagement à long terme
✅ **Dynamique** : Le jeu reste intéressant à tous niveaux

---

## 📧 **Email d'Annulation**

L'email envoyé affiche :

- ❌ Statut de la réservation annulée
- 💰 Remboursement prévu (5-7 jours)
- ⚠️ **Perte XP calculée selon le niveau**
- ❌ QR Code INVALIDÉ

---

**Créé le** : 2026-02-10
**Version** : 1.0
**Auteur** : Système Xtreme Adventures
