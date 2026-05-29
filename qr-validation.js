// Système de validation et d'annulation de billets

/**
 * Annule une réservation et invalide le QR code
 */
async function cancelReservationWithQR(ticketId, userEmail, userName) {
    // Calculer la perte XP
    const user = JSON.parse(localStorage.getItem('xtreme_user'));
    if (!user) {
        console.error('Utilisateur non connecté');
        return false;
    }

    const xpLoss = getCancellationXP(user.xp || 0);
    
    if (!confirm(`⚠️ Êtes-vous sûr de vouloir annuler cette réservation ?\n\n❌ Pénalité : -${xpLoss} XP\n🚫 Le QR Code sera INVALIDÉ`)) {
        return false;
    }

    const index = user.reservations.findIndex(r => r.id === ticketId);
    if (index === -1) {
        console.error('Réservation non trouvée');
        return false;
    }

    const reservation = user.reservations[index];

    try {
        // 1. Marquer le billet comme annulé côté serveur (invalider QR code)
        const cancelTicketResponse = await fetch('http://localhost:3000/api/cancel-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId: reservation.id })
        });

        const cancelResult = await cancelTicketResponse.json();
        
        if (!cancelResult.success) {
            throw new Error('Échec de l\'invalidation du QR code');
        }

        console.log('✅ QR Code invalidé côté serveur');

        // 2. Déduire XP avec gestion de relégation
        if (typeof window.applyXPLoss === 'function') {
            user.xp = window.applyXPLoss(user.xp, xpLoss);
        } else {
            // Fallback si la fonction n'existe pas
            user.xp = Math.max(0, user.xp - xpLoss);
            console.warn('⚠️ Fonction applyXPLoss non disponible, relégation désactivée');
        }

        // 3. Marquer le QR code comme null localement
        reservation.qrCode = null;
        reservation.status = 'Annulé';

        // 4. Retirer la réservation
        user.reservations.splice(index, 1);
        localStorage.setItem('xtreme_user', JSON.stringify(user));

        // 5. Envoyer email d'annulation
        try {
            const emailResponse = await fetch('http://localhost:3000/api/cancel-reservation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    reservation: reservation,
                    userName: userName,
                    xpLoss: xpLoss
                })
            });

            const emailResult = await emailResponse.json();
            
            if (emailResult.success) {
                if (typeof showSuccess === 'function') {
                    showSuccess(`✅ Réservation annulée !<br>📧 Email de confirmation envoyé<br>💔 -${xpLoss} XP<br>🚫 QR Code INVALIDÉ`, 7000);
                } else {
                    alert(`✅ Réservation annulée !\n📧 Email envoyé\n💔 -${xpLoss} XP\n🚫 QR Code INVALIDÉ`);
                }
            } else {
                console.warn('Email non envoyé mais réservation annulée');
                if (typeof showWarning === 'function') {
                    showWarning(`Réservation annulée (-${xpLoss} XP) mais email non envoyé.`);
                }
            }
        } catch (emailError) {
            console.error('Erreur email:', emailError);
            if (typeof showWarning === 'function') {
                showWarning('Réservation annulée mais email non envoyé (serveur inaccessible).');
            }
        }

        // 6. Mettre à jour l'affichage
        if (typeof updateRankDisplay === 'function') {
            updateRankDisplay();
        }
        if (typeof loadReservations === 'function') {
            loadReservations();
        }

        return true;

    } catch (error) {
        console.error('Erreur lors de l\'annulation:', error);
        if (typeof showError === 'function') {
            showError('❌ Erreur lors de l\'annulation de la réservation');
        } else {
            alert('❌ Erreur lors de l\'annulation');
        }
        return false;
    }
}

/**
 * Valide un billet (vérifie si le QR code est toujours valide)
 */
async function validateTicketQR(ticketId) {
    try {
        const response = await fetch('http://localhost:3000/api/validate-ticket', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ticketId })
        });

        const result = await response.json();
        return result;
        
    } catch (error) {
        console.error('Erreur lors de la validation:', error);
        return { valid: false, reason: 'Erreur de connexion au serveur' };
    }
}

/**
 * Calcule la perte XP pour une annulation (si les fonctions ne sont pas définies)
 */
function getCancellationXP(currentXP) {
    if (typeof window.getCancellationXP === 'function') {
        return window.getCancellationXP(currentXP);
    }
    
    // Fallback: calculer manuellement
    const BASE_XP = 15;
    const levels = [0, 750, 1500, 2250, 3375, 5063, 6750, 9375, 12188, 15000, 20000, 25000, 30000, 38750, 46875, 55000, 70000, 85000];
    let level = 0;
    for (let i = 0; i < levels.length; i++) {
        if (currentXP >= levels[i]) level = i;
        else break;
    }
    const multiplier = 1 + (0.25 * level);
    return Math.round(BASE_XP * multiplier);
}

// Exporter les fonctions pour utilisation globale
window.cancelReservationWithQR = cancelReservationWithQR;
window.validateTicketQR = validateTicketQR;

console.log('✅ Système de validation QR Code chargé');
