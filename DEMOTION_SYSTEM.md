# 📉 Système de Relégation (Demotion)

## 🎯 **Concept**

Si un utilisateur **perd trop d'XP** et descend **en dessous du minimum** de son rang actuel, il est **relégué** au rang inférieur.

**Exception** : Au rang **Novice 3** (le plus bas), l'utilisateur ne peut pas descendre plus bas.

---

## 📊 **Exemples Pratiques**

### **Exemple 1 : Relégation Simple**

**Situation initiale :**

- Rang : **Silver 1** (12,188 - 15,000 XP)
- XP Actuel : **12,200 XP**
- Niveau : 8

**Action :**

- Annulation d'une réservation
- Perte : **-45 XP** (15 × 3.0)

**Résultat :**

```
12,200 - 45 = 12,155 XP
12,155 < 12,188 (minimum Silver 1)
→ Relégation à Silver 2 (9,375 - 12,188)
```

**Notification :**

```
📉 Vous avez été relégué de Silver 1 à Silver 2 !
```

---

### **Exemple 2 : Pas de Relégation**

**Situation initiale :**

- Rang : **Gold 3** (15,000 - 20,000 XP)
- XP Actuel : **18,000 XP**
- Niveau : 9

**Action :**

- Annulation d'une réservation
- Perte : **-49 XP** (15 × 3.25)

**Résultat :**

```
18,000 - 49 = 17,951 XP
17,951 > 15,000 (minimum Gold 3)
→ Reste Gold 3
```

**Aucune relégation !**

---

### **Exemple 3 : Rang Minimum (Novice 3)**

**Situation initiale :**

- Rang : **Novice 3** (0 - 750 XP)
- XP Actuel : **50 XP**
- Niveau : 0

**Action :**

- Annulation de 4 réservations
- Perte : **-60 XP** (4 × 15)

**Résultat :**

```
50 - 60 = -10 XP
-10 < 0 → Arrondi à 0 XP
→ Reste Novice 3 (0 XP)
```

**Protection** : On ne peut pas avoir d'XP négatifs ni descendre sous Novice 3 !

---

## 🔧 **Fonctionnement Technique**

### **Fonction `handleDemotion(newXP)`**

1. Vérifie si `newXP < 0` → Arrondit à 0
2. Trouve le rang correspondant aux nouveaux XP
3. Vérifie si descente sous le minimum du rang
4. Si oui et pas au rang minimum → Relégation
5. Si au rang minimum (Novice 3) → Garde les XP (min 0)

### **Fonction `applyXPLoss(currentXP, xpLoss)`**

1. Calcule `newXP = currentXP - xpLoss`
2. Appelle `handleDemotion(newXP)`
3. Compare ancien et nouveau rang
4. Si différents → Affiche notification de relégation
5. Retourne les XP ajustés

---

## 📈 **Tableau des Seuils de Relégation**

| Rang Actuel  | Minimum XP | Si < Minimum | Relégation Vers |
| ------------ | ---------- | ------------ | --------------- |
| Novice 2     | 750        | < 750        | Novice 3        |
| Novice 1     | 1,500      | < 1,500      | Novice 2        |
| Bronze 3     | 2,250      | < 2,250      | Novice 1        |
| Bronze 2     | 3,375      | < 3,375      | Bronze 3        |
| Bronze 1     | 5,063      | < 5,063      | Bronze 2        |
| Silver 3     | 6,750      | < 6,750      | Bronze 1        |
| Silver 2     | 9,375      | < 9,375      | Silver 3        |
| Silver 1     | 12,188     | < 12,188     | Silver 2        |
| Gold 3       | 15,000     | < 15,000     | Silver 1        |
| Gold 2       | 20,000     | < 20,000     | Gold 3          |
| Gold 1       | 25,000     | < 25,000     | Gold 2          |
| Platinum 3   | 30,000     | < 30,000     | Gold 1          |
| Platinum 2   | 38,750     | < 38,750     | Platinum 3      |
| Platinum 1   | 46,875     | < 46,875     | Platinum 2      |
| Diamond 3    | 55,000     | < 55,000     | Platinum 1      |
| Diamond 2    | 70,000     | < 70,000     | Diamond 3       |
| Diamond 1    | 85,000     | < 85,000     | Diamond 2       |
| **Novice 3** | **0**      | **< 0**      | **AUCUNE** ⚠️   |

---

## 🎮 **Scénarios de Jeu**

### **Scénario 1 : Joueur Prudent**

- Fait beaucoup de réservations
- Monte jusqu'à Gold 2 (22,000 XP)
- N'annule jamais
- ✅ **Pas de risque de relégation**

### **Scénario 2 : Joueur Imprudent**

- Monte jusqu'à Silver 1 (12,200 XP)
- Annule 2 réservations (-90 XP)
- 12,200 - 90 = 12,110 XP
- ❌ **Relégué à Silver 2**

### **Scénario 3 : Débutant**

- Commence à Novice 3 (0 XP)
- Fait 1 réservation (+30 XP)
- Annule cette réservation (-15 XP)
- 30 - 15 = 15 XP
- ✅ **Reste Novice 3** (15 XP)

---

## 🚨 **Notifications**

### **En Console :**

```javascript
📉 Relégation: Silver 1 → Silver 2
```

### **À l'Écran :**

```
⚠️ Vous avez été relégué de Silver 1 à Silver 2 !
```

---

## 💡 **Conseils**

✅ **Pour éviter la relégation :**

- Gardez une marge de sécurité d'XP
- N'annulez que si nécessaire
- Planifiez vos réservations

❌ **Risque élevé si :**

- XP proche du minimum du rang
- Niveau élevé (perte XP élevée)
- Annulations multiples

---

**Date de création** : 2026-02-11  
**Version** : 1.0  
**Système** : Xtreme Adventures
