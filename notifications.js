/* ============================================
   SYSTÈME DE NOTIFICATIONS PREMIUM - JS
   Usage: showNotification('Message', 'type', duration)
   Types: 'success', 'error', 'warning', 'info'
   ============================================ */

// Créer le conteneur de notifications s'il n'existe pas
function initNotifications() {
    if (!document.getElementById('notification-container')) {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = 'notification-container';
        document.body.appendChild(container);
    }
}

// Icônes SVG pour chaque type
const notificationIcons = {
    success: `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
    </svg>`,
    
    error: `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path>
    </svg>`,
    
    warning: `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
    </svg>`,
    
    info: `<svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
    </svg>`
};

// Titres par défaut
const notificationTitles = {
    success: 'Succès',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Information'
};

/**
 * Afficher une notification
 * @param {string} message - Le message à afficher
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Durée en ms (défaut: 5000)
 * @param {string} title - Titre personnalisé (optionnel)
 */
function showNotification(message, type = 'info', duration = 5000, title = null) {
    initNotifications();
    
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const displayTitle = title || notificationTitles[type] || 'Notification';
    const icon = notificationIcons[type] || notificationIcons.info;
    
    notification.innerHTML = `
        <div class="notification-icon">
            ${icon}
        </div>
        <div class="notification-content">
            <h4 class="notification-title">${displayTitle}</h4>
            <p class="notification-message">${message}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
        ${duration > 0 ? '<div class="notification-progress"><div class="notification-progress-bar"></div></div>' : ''}
    `;
    
    container.appendChild(notification);
    
    // Auto-remove après la durée spécifiée
    if (duration > 0) {
        setTimeout(() => {
            notification.classList.add('removing');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }
    
    // Jouer un son subtil (optionnel)
    playNotificationSound(type);
    
    return notification;
}

// Sons de notification (très subtils)
function playNotificationSound(type) {
    // Vous pouvez ajouter des sons ici si vous le souhaitez
    // Pour l'instant, on utilise juste une vibration sur mobile
    if ('vibrate' in navigator) {
        if (type === 'success') {
            navigator.vibrate([50, 30, 50]);
        } else if (type === 'error') {
            navigator.vibrate([100, 50, 100]);
        } else {
            navigator.vibrate(50);
        }
    }
}

// Raccourcis pratiques
function showSuccess(message, duration = 5000) {
    return showNotification(message, 'success', duration);
}

function showError(message, duration = 6000) {
    return showNotification(message, 'error', duration);
}

function showWarning(message, duration = 5000) {
    return showNotification(message, 'warning', duration);
}

function showInfo(message, duration = 4000) {
    return showNotification(message, 'info', duration);
}

// Initialiser au chargement de la page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotifications);
} else {
    initNotifications();
}
