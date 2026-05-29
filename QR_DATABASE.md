# 🔒 Système de Base de Données QR Code

## 🎯 **Problème Résolu**

**Avant** : Même si on mettait `qrCode = null` dans localStorage, le **QR code dans l'email** existait toujours et pouvait être scanné !

**Maintenant** : Une **vraie base de données** côté serveur stocke tous les billets valides et les **supprime** lors de l'annulation !

---

## 🗄️ **Architecture**

### **Fichier `tickets-db.json`**

```json
{
  "tickets": {
    "#TRIP-2026-ABC123": {
      "email": "user@example.com",
      "activity": "Parachute",
      "date": "20 Mars 2026",
      "ticketId": "#TRIP-2026-ABC123",
      "qrCode": "data:image/png;base64,...",
      "createdAt": "2026-02-11T00:00:00Z",
      "status": "valid"
    }
  },
  "cancelledTickets": ["#TRIP-2026-XYZ789"]
}
```

---

## ⚙️ **Fonctions Serveur**

### **1. `addTicket(ticketId, ticketData)`**

- Ajoute un billet à la base de données
- **Appelé** : Lors de l'envoi d'email de confirmation
- **Effet** : Le billet devient VALIDE

### **2. `cancelTicket(ticketId)`**

- Supprime le billet de `tickets`
- Ajoute l'ID à `cancelledTickets`
- **Appelé** : Lors de l'annulation d'une réservation
- **Effet** : Le QR code devient INVALIDE

### **3. `isTicketValid(ticketId)`**

- Vérifie si un billet est valide ou annulé
- **Appelé** : Lors du scan/validation d'un QR code
- **Retourne** :
  - `{ valid: true, ticket: {...} }` si valide
  - `{ valid: false, reason: "..." }` si invalide

---

## 🔄 **Flux Complet**

### **Scénario 1 : Création de Réservation**

```
1. Utilisateur réserve une activité
2. Backend génère un QR code
3. Email envoyé avec le QR code
4. ✅ addTicket(ticketId, {...}) → Billet ajouté à la DB
5. Le billet est maintenant VALIDE
```

**Base de données :**

```json
{
  "tickets": {
    "#TRIP-2026-ABC123": { ... }
  },
  "cancelledTickets": []
}
```

---

### **Scénario 2 : Annulation de Réservation**

```
1. Utilisateur annule sa réservation
2. Frontend appelle /api/cancel-ticket
3. ❌ cancelTicket(ticketId) est exécuté :
   - Supprime de "tickets"
   - Ajoute à "cancelledTickets"
4. Le QR code est maintenant INVALIDE
```

**Base de données :**

```json
{
  "tickets": {},
  "cancelledTickets": ["#TRIP-2026-ABC123"]
}
```

---

### **Scénario 3 : Validation d'un QR Code Valide**

```
1. Staff/Client scanne le QR code
2. Frontend appelle /api/validate-ticket
3. ✅ isTicketValid(ticketId) vérifie :
   - Pas dans "cancelledTickets" ?
   - Existe dans "tickets" ?
4. Résultat : { valid: true, ticket: {...} }
5. Affichage VERT avec détails
```

---

### **Scénario 4 : Validation d'un QR Code Annulé**

```
1. Client tente de scanner un ancien QR code
2. Frontend appelle /api/validate-ticket
3. ❌ isTicketValid(ticketId) détecte :
   - ticketId EST dans "cancelledTickets"
4. Résultat : { valid: false, reason: "Ce billet a été annulé" }
5. Affichage ROUGE "Billet Invalide"
```

---

### **Scénario 5 : Validation d'un Faux QR Code**

```
1. Quelqu'un crée un faux QR code
2. Frontend appelle /api/validate-ticket
3. ❌ isTicketValid(ticketId) détecte :
   - Pas dans "tickets"
   - Pas dans "cancelledTickets"
4. Résultat : { valid: false, reason: "Ce billet n'existe pas" }
5. Affichage ROUGE "Billet Invalide"
```

---

## 📊 **Logs Serveur**

### **Lors d'une Réservation :**

```
✅ Email envoyé avec succès !
✅ Billet ajouté à la DB: #TRIP-2026-ABC123
💾 Billet enregistré dans la base de données
```

### **Lors d'une Annulation :**

```
🗑️ Billet supprimé de la DB: #TRIP-2026-ABC123
🚫 Billet ajouté à la liste d'annulation: #TRIP-2026-ABC123
📋 Total billets annulés: 1
```

### **Lors d'une Validation (Valide) :**

```
✅ Billet valide: #TRIP-2026-ABC123
```

### **Lors d'une Validation (Annulé) :**

```
❌ Billet invalide: #TRIP-2026-ABC123 - Ce billet a été annulé
```

---

## 🔐 **Sécurité**

✅ **Impossible de contrefaire** : Les QR codes non enregistrés sont rejetés  
✅ **Impossible de réutiliser** : Les QR codes annulés sont blacklistés  
✅ **Traçabilité complète** : Tous les billets sont enregistrés avec timestamps  
✅ **Persistance** : La base de données survit aux redémarrages du serveur

---

## 🎮 **Pour Tester**

### **Test 1 : Créer un Billet Valide**

```
1. Faites une réservation
2. Vérifiez tickets-db.json
3. Le billet doit apparaître dans "tickets"
```

### **Test 2 : Annuler et Scanner**

```
1. Annulez la réservation
2. Vérifiez tickets-db.json
3. Le billet doit être :
   - ❌ Supprimé de "tickets"
   - ✅ Ajouté à "cancelledTickets"
4. Sur validate-ticket.html, entrez l'ID
5. Résultat : ROUGE "Billet annulé"
```

### **Test 3 : Scanner un Faux Billet**

```
1. Sur validate-ticket.html
2. Entrez: #TRIP-2026-FAUX
3. Résultat : ROUGE "Billet n'existe pas"
```

---

## 📁 **Fichiers Modifiés**

✅ **`server.js`**

- Fonctions `readDB()`, `writeDB()`, `addTicket()`, `cancelTicket()`, `isTicketValid()`
- Endpoint `/api/send-ticket` → Enregistre le billet
- Endpoint `/api/validate-ticket` → Utilise `isTicketValid()`
- Endpoint `/api/cancel-ticket` → Utilise `cancelTicket()`

✅ **`tickets-db.json`**

- Base de données persistante
- Structure : `tickets` + `cancelledTickets`

---

## 🚀 **Avantages**

✅ **Sécurité maximale** : Le QR code est vraiment invalidé  
✅ **Screenshot impossible** : Même en photo, un QR annulé ne marche pas  
✅ **Traçabilité** : On sait exactement quels billets sont valides  
✅ **Scalable** : Facile de migrer vers MongoDB/PostgreSQL plus tard

---

**Date** : 2026-02-11  
**Version** : 1.0  
**Système** : Xtreme Adventures
