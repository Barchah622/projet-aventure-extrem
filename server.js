const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
const QRCode = require('qrcode'); // Import QRCode library
const fs = require('fs').promises; // File system pour la base de données
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, '.')));

// Database functions
const DB_FILE = path.join(__dirname, 'tickets-db.json');

async function readDB() {
    try {
        const data = await fs.readFile(DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si le fichier n'existe pas, créer une DB vide
        const emptyDB = { tickets: {}, cancelledTickets: [] };
        await writeDB(emptyDB);
        return emptyDB;
    }
}

async function writeDB(data) {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

async function addTicket(ticketId, ticketData) {
    const db = await readDB();
    db.tickets[ticketId] = {
        ...ticketData,
        createdAt: new Date().toISOString(),
        status: 'valid'
    };
    await writeDB(db);
    console.log('✅ Billet ajouté à la DB:', ticketId);
}

async function cancelTicket(ticketId) {
    const db = await readDB();
    
    // Supprimer des billets valides
    if (db.tickets[ticketId]) {
        delete db.tickets[ticketId];
        console.log('🗑️ Billet supprimé de la DB:', ticketId);
    }
    
    // Ajouter à la liste des annulés
    if (!db.cancelledTickets.includes(ticketId)) {
        db.cancelledTickets.push(ticketId);
        console.log('🚫 Billet ajouté à la liste d\'annulation:', ticketId);
    }
    
    await writeDB(db);
}

async function isTicketValid(ticketId) {
    const db = await readDB();
    
    // Vérifier si annulé
    if (db.cancelledTickets.includes(ticketId)) {
        return { valid: false, reason: 'Ce billet a été annulé' };
    }
    
    // Vérifier si existe dans les billets valides
    if (db.tickets[ticketId]) {
        return { valid: true, ticket: db.tickets[ticketId] };
    }
    
    // Si ni valide ni annulé, c'est un faux billet
    return { valid: false, reason: 'Ce billet n\'existe pas dans notre système' };
}

// === GESTION BASE DE DONNÉES UTILISATEURS ===
const USERS_DB_FILE = path.join(__dirname, 'users-db.json');

async function readUsersDB() {
    try {
        const data = await fs.readFile(USERS_DB_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        const emptyDB = { users: [] };
        await writeUsersDB(emptyDB);
        return emptyDB;
    }
}

async function writeUsersDB(data) {
    await fs.writeFile(USERS_DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// Route: Inscription
app.post('/api/register', async (req, res) => {
    try {
        let { email, password, name, lastName, ...rest } = req.body;
        if (!email || !password) return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
        
        email = email.toLowerCase(); // Normalisation
        const db = await readUsersDB();
        
        // Vérifier si l'email existe déjà
        if (db.users.find(u => u.email.toLowerCase() === email)) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
        }

        // Créer l'utilisateur
        const newUser = {
            id: 'u' + Date.now().toString(36),
            email,
            password, // En production, il faudrait hacher le mot de passe !
            name,
            lastName,
            xp: 0,
            reservations: [],
            createdAt: new Date().toISOString()
        };

        db.users.push(newUser);
        await writeUsersDB(db);

        // Pas de mot de passe renvoyé au client
        const userToReturn = { ...newUser };
        delete userToReturn.password;

        console.log('🎉 Nouvel utilisateur inscrit:', email);
        res.json({ success: true, user: userToReturn });

    } catch (error) {
        console.error('Erreur inscription:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route: Connexion
app.post('/api/login', async (req, res) => {
    try {
        let { email, password } = req.body;
        email = email.toLowerCase(); // Normalisation
        const db = await readUsersDB();
        
        const user = db.users.find(u => u.email.toLowerCase() === email && u.password === password);
        
        if (user) {
            const userToReturn = { ...user };
            delete userToReturn.password;
            console.log('🔑 Connexion réussie:', email);
            res.json({ success: true, user: userToReturn });
        } else {
            console.log('❌ Échec connexion:', email);
            res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
        }
    } catch (error) {
        console.error('Erreur connexion:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route: Synchronisation (Mise à jour complète ou partielle)
// Appelée quand le profil front-end change (XP, Réservation, Nom...)
app.post('/api/sync-user', async (req, res) => {
    try {
        const userData = req.body; 
        if (!userData || !userData.email) return res.status(400).json({ success: false, message: 'Données invalides' });
        
        // Normalisation de l'email reçu
        userData.email = userData.email.toLowerCase();

        const db = await readUsersDB();
        const index = db.users.findIndex(u => u.email.toLowerCase() === userData.email);

        if (index !== -1) {
            // Mettre à jour l'utilisateur existant en préservant son mot de passe et ID
            const existingUser = db.users[index];
            const updatedUser = {
                ...existingUser,     // Garder les anciennes données (comme ID, password)
                ...userData,         // Écraser avec les nouvelles (XP, reservations, nom...)
                password: existingUser.password // S'assurer que le password ne soit pas écrasé par null si non envoyé
            };
            
            console.log(`🔄 SYNC REÇU pour ${userData.email}:`, {
                recu_name: userData.name,
                recu_lastName: userData.lastName,
                db_avant: existingUser.name,
                db_apres: updatedUser.name
            });

            db.users[index] = updatedUser;
            await writeUsersDB(db);
            
            console.log('💾 Données synchronisées et SAUVEGARDÉES.');
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }

    } catch (error) {
        console.error('Erreur sync:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route: GET User Profile (Récupérer les données fraîches)
app.get('/api/user', async (req, res) => {
    try {
        let { email } = req.query;
        if (!email) return res.status(400).json({ success: false, message: 'Email requis' });
        
        email = email.toLowerCase(); // Normalisation

        const db = await readUsersDB();
        const user = db.users.find(u => u.email.toLowerCase() === email);

        if (user) {
            const userToReturn = { ...user };
            delete userToReturn.password;
            res.json({ success: true, user: userToReturn });
        } else {
            res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
        }
    } catch (error) {
        console.error('Erreur récupération user:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Global Transporter
let transporter;

// Initialize Email System (Real or Fake)
async function initEmail() {
    if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'votre-email@gmail.com') {
        // Mode PRO : Vrai Gmail
        transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });
        console.log('✅ Mode Email : PRO (Gmail)');
    } else {
        // Mode TEST : Ethereal (Automatique)
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('⚠️ Mode Email : TEST (Ethereal)');
        console.log('   Compte temporaire créé :', testAccount.user);
    }
}
initEmail();

// Endpoint pour envoyer le billet
// Endpoint pour envoyer le billet
app.post('/api/send-ticket', async (req, res) => {
    const { email, activity, date, ticketId } = req.body;

    if (!email) return res.status(400).json({ success: false, message: 'Email manquant' });

    try {
        // Generate QR Code as Data URL (More robust for Nodemailer)
        const qrDataUrl = await QRCode.toDataURL(ticketId || 'X-REM', {
            errorCorrectionLevel: 'H',
            margin: 1,
            width: 128,
            type: 'image/png',
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
        
        console.log('🎨 QR Code généré (Taille):', qrDataUrl.length);

        const safeTicketId = encodeURIComponent(ticketId || 'X-REM');
        const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${safeTicketId}&bgcolor=ffffff`;

        const mailOptions = {
            from: `"Aventure Xtreme" <${process.env.EMAIL_USER}>`, // Utilise la vraie adresse Gmail
            to: email,
            subject: `🎫 Confirmation : ${activity}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Arial', sans-serif;">
                    
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center;">
                        
                        <!-- HEADER ICON -->
                        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FFD700, #B8860B); border-radius: 50%; box-shadow: 0 0 30px rgba(255, 215, 0, 0.3); margin: 0 auto 30px; line-height: 80px; font-size: 40px; color: white;">
                            ✓
                        </div>

                        <!-- TITLE -->
                        <h1 style="color: #fff; font-style: italic; margin: 0; font-size: 28px; text-transform: uppercase; line-height: 1.2;">
                            Réservation <span style="color: #FFD700;">Confirmée</span>
                        </h1>
                        <p style="color: #666; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; margin-top: 10px; margin-bottom: 40px;">
                            Préparez-vous à l'aventure
                        </p>

                        <!-- TICKET CARD -->
                        <div style="background-color: #121212; border: 1px solid #333; border-radius: 30px; padding: 40px; text-align: left; position: relative; overflow: hidden;">
                            
                            <!-- GLOW EFFECT -->
                            <div style="position: absolute; top: -50px; right: -50px; width: 100px; height: 100px; background: #FFD700; opacity: 0.1; filter: blur(40px); border-radius: 50%;"></div>

                            <!-- ROW 1 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="60%" valign="top">
                                        <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0;">Aventure</p>
                                        <h2 style="color: #fff; font-size: 24px; font-style: italic; margin: 0; text-transform: uppercase;">${activity || 'Expérience'}</h2>
                                    </td>
                                    <td width="40%" valign="top" style="text-align: right;">
                                        <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0;">Date</p>
                                        <h2 style="color: #FFD700; font-size: 20px; margin: 0;">${date || 'Bientôt'}</h2>
                                    </td>
                                </tr>
                            </table>

                            <!-- ROW 2 -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                <tr>
                                    <td width="60%" valign="top">
                                        <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0;">Départ</p>
                                        <p style="color: #fff; font-size: 16px; font-weight: bold; margin: 0;">09:00 AM</p>
                                    </td>
                                    <td width="40%" valign="top" style="text-align: right;">
                                        <p style="color: #666; font-size: 10px; font-weight: bold; text-transform: uppercase; margin: 0 0 5px 0;">Siège</p>
                                        <p style="color: #FFD700; font-size: 16px; font-weight: bold; margin: 0;">4A (Premium)</p>
                                    </td>
                                </tr>
                            </table>

                            <!-- DIVIDER -->
                            <div style="border-top: 2px dashed #333; margin: 0 -40px 30px -40px;"></div>

                            <!-- QR CODE SECTION -->
                            <div style="text-align: center;">
                                <div style="background: #fff; padding: 15px; display: inline-block; border-radius: 15px; margin-bottom: 10px;">
                                    <!-- BASE64 INLINE IMAGE -->
                                    <img src="${qrDataUrl}" 
                                         alt="QR Code" 
                                         width="128" 
                                         height="128"
                                         style="display: block !important; border: 0; outline: none; margin: 0 auto; width: 128px !important; height: 128px !important; max-width: 128px !important; max-height: 128px !important;">
                                </div>
                                <p style="color: #888; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; margin: 0;">Scan to Board • Xtreme Pass</p>
                                <p style="color: #444; font-size: 9px; margin-top: 5px; margin-bottom: 10px; font-family: monospace;">ID: ${ticketId || 'X-0000'}</p>
                                
                                <a href="${fallbackUrl}" style="color: #444; font-size: 9px; text-decoration: none;">(Lien de secours)</a>
                            </div>

                        </div>
                        
                        <p style="color: #444; font-size: 10px; margin-top: 40px;">© 2026 Aventure Xtreme. Tous droits réservés.</p>
                    </div>
                </body>
                </html>
            `
        };

        console.log('📤 Tentative d\'envoi à:', email);
        console.log('📋 Sujet:', mailOptions.subject);
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email envoyé avec succès !');
        console.log('   Message ID:', info.messageId);
        console.log('   Destinataire:', email);
        console.log('   Réponse:', info.response);
        console.log('   Accepté:', info.accepted);
        console.log('   Rejeté:', info.rejected);
        
        // Enregistrer le billet dans la base de données
        await addTicket(ticketId || 'X-REM', {
            email,
            activity,
            date,
            ticketId: ticketId || 'X-REM',
            qrCode: qrDataUrl
        });
        console.log('💾 Billet enregistré dans la base de données');
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        
        if (previewUrl) {
            console.log('🔗 Prévisualisation (Mode Test):', previewUrl);
        }
        
        res.json({ 
            success: true, 
            message: 'Email envoyé avec succès !', 
            preview: previewUrl,
            accepted: info.accepted,
            rejected: info.rejected
        });

    } catch (error) {
        console.error('❌ ERREUR D\'ENVOI EMAIL:');
        console.error('   Message:', error.message);
        console.error('   Code:', error.code);
        console.error('   Détails:', error);
        res.status(500).json({ success: false, error: error.message, details: error.code });
    }
});

// Endpoint Welcome Email
app.post('/api/send-welcome', async (req, res) => {
    const { email, firstName } = req.body;

    if (!email) return res.status(400).json({ success: false, message: 'Email manquant' });

    try {
        const mailOptions = {
            from: `"Aventure Xtreme" <${process.env.EMAIL_USER}>`, // Utilise la vraie adresse Gmail
            to: email,
            subject: `Bienvenue au Club, ${firstName} !`,
            html: `
                <div style="font-family: sans-serif; background: #000; color: #fff; padding: 20px; text-align: center;">
                    <h1 style="color: #FFD700; text-transform: uppercase;">Bienvenue au Club</h1>
                    <p>Félicitations ${firstName}, votre compte est activé.</p>
                    <p>Vous avez désormais accès à nos ventes privées et alertes J-10.</p>
                    <div style="margin-top: 20px;">
                        <a href="http://localhost:3000/login.html" style="color: #000; background: #FFD700; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accéder à mon espace</a>
                    </div>
                </div>
            `
        };

        console.log('📤 Tentative d\'envoi Welcome à:', email);
        console.log('📋 Sujet:', mailOptions.subject);
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email Welcome envoyé avec succès !');
        console.log('   Message ID:', info.messageId);
        console.log('   Destinataire:', email);
        console.log('   Réponse:', info.response);
        console.log('   Accepté:', info.accepted);
        console.log('   Rejeté:', info.rejected);
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        
        if (previewUrl) {
            console.log('🔗 Prévisualisation (Mode Test):', previewUrl);
        }
        
        res.json({ 
            success: true, 
            message: 'Email de bienvenue envoyé avec succès !', 
            preview: previewUrl,
            accepted: info.accepted,
            rejected: info.rejected
        });

    } catch (error) {
        console.error('❌ ERREUR WELCOME EMAIL:');
        console.error('   Message:', error.message);
        console.error('   Code:', error.code);
        console.error('   Détails:', error);
        res.status(500).json({ success: false, error: error.message, details: error.code });
    }
});

// Endpoint code de validation
app.post('/api/send-verification', async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) return res.status(400).json({ success: false, message: 'Données manquantes' });

    try {
        const mailOptions = {
            from: `"Aventure Xtreme" <${process.env.EMAIL_USER}>`, // Utilise la vraie adresse Gmail
            to: email,
            subject: `Votre Code de Validation : ${code}`,
            html: `
                <div style="font-family: sans-serif; background: #000; color: #fff; padding: 20px; text-align: center;">
                    <h1 style="color: #FFD700;">Validation Email</h1>
                    <p>Pour finaliser votre inscription, voici votre code :</p>
                    <div style="background: #222; padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 30px; letter-spacing: 5px; font-weight: bold; color: #FFD700;">
                        ${code}
                    </div>
                    <p style="font-size: 10px; color: #888;">Si vous n'êtes pas à l'origine de cette demande, ignorez ce mail.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('🔑 Code envoyé à %s : %s', email, code);
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        res.json({ success: true, message: 'Code envoyé !', preview: previewUrl });

    } catch (error) {
        console.error('❌ Erreur Validation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Store reset tokens temporarily (in production, use Redis or database)
const resetTokens = new Map(); // { email: { token, expires } }

// Endpoint: Forgot Password
app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;
    
    if (!email) return res.status(400).json({ success: false, message: 'Email manquant' });
    
    try {
        // Generate unique token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        const expires = Date.now() + 3600000; // 1 hour
        
        // Store token
        resetTokens.set(email, { token, expires });
        
        // Create reset link
        const resetLink = `http://localhost:3000/reset-password.html?token=${token}&email=${encodeURIComponent(email)}`;
        
        const mailOptions = {
            from: `"Aventure Xtreme" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔐 Réinitialisation de votre mot de passe',
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Arial', sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        
                        <!-- HEADER -->
                        <div style="text-align: center; margin-bottom: 40px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #FFD700, #B8860B); border-radius: 50%; margin: 0 auto 20px; line-height: 80px; font-size: 40px; color: white;">
                                🔐
                            </div>
                            <h1 style="color: #fff; font-size: 28px; margin: 0; text-transform: uppercase;">
                                Réinitialisation du <span style="color: #FFD700;">Mot de Passe</span>
                            </h1>
                        </div>
                        
                        <!-- CONTENT CARD -->
                        <div style="background-color: #121212; border: 1px solid #333; border-radius: 20px; padding: 40px; text-align: center;">
                            <p style="color: #fff; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
                                Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :
                            </p>
                            
                            <!-- RESET BUTTON -->
                            <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 16px; text-transform: uppercase; margin: 20px 0;">
                                Réinitialiser mon mot de passe
                            </a>
                            
                            <p style="color: #888; font-size: 12px; margin: 30px 0 0 0; line-height: 1.6;">
                                Ce lien expire dans <strong style="color: #FFD700;">1 heure</strong>.<br>
                                Si vous n'avez pas demandé cette réinitialisation, ignorez ce message.
                            </p>
                            
                            <!-- LINK FALLBACK -->
                            <div style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #333;">
                                <p style="color: #666; font-size: 11px; margin: 0 0 10px 0;">Si le bouton ne fonctionne pas, copiez ce lien :</p>
                                <p style="color: #FFD700; font-size: 11px; word-break: break-all; margin: 0;">${resetLink}</p>
                            </div>
                        </div>
                        
                        <!-- FOOTER -->
                        <p style="text-align: center; color: #666; font-size: 11px; margin-top: 30px;">
                            © 2026 Aventure Xtreme - Tous droits réservés
                        </p>
                    </div>
                </body>
                </html>
            `
        };
        
        console.log('📤 Envoi email de réinitialisation à:', email);
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email de réinitialisation envoyé !');
        console.log('   Token généré:', token);
        console.log('   Lien:', resetLink);
        console.log('   Expire dans: 1 heure');
        
        res.json({ 
            success: true, 
            message: 'Email de réinitialisation envoyé avec succès !' 
        });
        
    } catch (error) {
        console.error('❌ ERREUR FORGOT PASSWORD:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint: Reset Password
app.post('/api/reset-password', async (req, res) => {
    const { email, token, newPassword } = req.body;
    
    if (!email || !token || !newPassword) {
        return res.status(400).json({ success: false, message: 'Données manquantes' });
    }
    
    try {
        // Verify token
        const storedData = resetTokens.get(email);
        
        if (!storedData) {
            return res.status(400).json({ success: false, message: 'Token invalide ou expiré' });
        }
        
        if (storedData.token !== token) {
            return res.status(400).json({ success: false, message: 'Token incorrect' });
        }
        
        if (Date.now() > storedData.expires) {
            resetTokens.delete(email);
            return res.status(400).json({ success: false, message: 'Token expiré. Veuillez refaire une demande.' });
        }
        
        // Update password in localStorage (simulation - in production, update database)
        console.log('✅ Mot de passe réinitialisé pour:', email);
        console.log('   Nouveau mot de passe:', newPassword);
        
        // Remove used token
        resetTokens.delete(email);
        
        res.json({ 
            success: true, 
            message: 'Mot de passe réinitialisé avec succès !',
            email: email,
            newPassword: newPassword // In production, NEVER send password back
        });
        
    } catch (error) {
        console.error('❌ ERREUR RESET PASSWORD:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint: Cancel Reservation Email
app.post('/api/cancel-reservation', async (req, res) => {
    const { email, reservation, userName } = req.body;
    
    if (!email || !reservation) {
        return res.status(400).json({ success: false, message: 'Données manquantes' });
    }
    
    try {
        const mailOptions = {
            from: `"Aventure Xtreme" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `❌ Annulation Confirmée : ${reservation.activity}`,
            html: `
                <!DOCTYPE html>
                <html>
                <body style="margin: 0; padding: 0; background-color: #050505; font-family: 'Arial', sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                        
                        <!-- HEADER -->
                        <div style="text-align: center; margin-bottom: 40px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #EF4444, #DC2626); border-radius: 50%; margin: 0 auto 20px; line-height: 80px; font-size: 40px; color: white;">
                                ❌
                            </div>
                            <h1 style="color: #fff; font-size: 28px; margin: 0; text-transform: uppercase;">
                                Réservation <span style="color: #EF4444;">Annulée</span>
                            </h1>
                            <p style="color: #888; font-size: 12px; margin-top: 10px;">
                                Nous avons bien reçu votre demande d'annulation
                            </p>
                        </div>
                        
                        <!-- CONTENT CARD -->
                        <div style="background-color: #121212; border: 1px solid #333; border-radius: 20px; padding: 40px;">
                            
                            <!-- Greeting -->
                            <p style="color: #fff; font-size: 16px; margin: 0 0 30px 0;">
                                Bonjour <strong style="color: #FFD700;">${userName || 'Aventurier'}</strong>,
                            </p>
                            
                            <p style="color: #ddd; font-size: 14px; line-height: 1.6; margin: 0 0 30px 0;">
                                Votre réservation a été <strong style="color: #EF4444;">annulée avec succès</strong>. 
                                Voici les détails de la réservation annulée :
                            </p>
                            
                            <!-- Reservation Details -->
                            <div style="background-color: #000; border: 1px solid #444; border-left: 4px solid #EF4444; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="color: #888; font-size: 12px; text-transform: uppercase;">Activité</td>
                                        <td style="color: #fff; font-size: 14px; font-weight: bold; text-align: right;">${reservation.activity}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #888; font-size: 12px; text-transform: uppercase;">ID Réservation</td>
                                        <td style="color: #FFD700; font-size: 12px; font-family: monospace; text-align: right;">${reservation.id}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #888; font-size: 12px; text-transform: uppercase;">Date</td>
                                        <td style="color: #fff; font-size: 14px; text-align: right;">${reservation.date}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #888; font-size: 12px; text-transform: uppercase;">Heure</td>
                                        <td style="color: #fff; font-size: 14px; text-align: right;">${reservation.time}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #888; font-size: 12px; text-transform: uppercase;">Siège</td>
                                        <td style="color: #fff; font-size: 14px; text-align: right;">${reservation.seat}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #888; font-size: 12px; text-transform: uppercase;">Montant</td>
                                        <td style="color: #EF4444; font-size: 16px; font-weight: bold; text-align: right;">${reservation.price}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #888; font-size: 12px; text-transform: uppercase;">QR Code</td>
                                        <td style="color: #666; font-size: 14px; font-style: italic; text-align: right;">❌ INVALIDÉ</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Refund Info -->
                            <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
                                <p style="color: #FFD700; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">
                                    💰 Remboursement
                                </p>
                                <p style="color: #ddd; font-size: 13px; line-height: 1.6; margin: 0;">
                                    Vous serez remboursé du montant total sous <strong>5 à 7 jours ouvrés</strong>. 
                                    Le remboursement sera effectué sur le mode de paiement utilisé lors de la réservation.
                                </p>
                            </div>
                            
                            <!-- XP Penalty -->
                            <div style="background-color: #2d1515; border: 1px solid #441818; border-radius: 12px; padding: 20px;">
                                <p style="color: #EF4444; font-size: 14px; font-weight: bold; margin: 0 0 10px 0;">
                                    ⚠️ Pénalité XP
                                </p>
                                <p style="color: #ddd; font-size: 13px; margin: 0;">
                                    <strong style="color: #EF4444;">-50 XP</strong> ont été déduits de votre compte pour cette annulation.
                                </p>
                            </div>
                            
                            <!-- CTA Button -->
                            <div style="text-align: center; margin-top: 40px;">
                                <a href="http://localhost:3000/index.html" style="display: inline-block; background: linear-gradient(135deg, #FFD700, #FFA500); color: #000; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-weight: bold; font-size: 14px; text-transform: uppercase;">
                                    Voir d'Autres Aventures
                                </a>
                            </div>
                        </div>
                        
                        <!-- FOOTER -->
                        <p style="text-align: center; color: #666; font-size: 11px; margin-top: 30px;">
                            © 2026 Aventure Xtreme - Tous droits réservés
                        </p>
                        <p style="text-align: center; color: #555; font-size: 10px; margin-top: 10px;">
                            Vous recevez cet email car vous avez annulé une réservation.
                        </p>
                    </div>
                </body>
                </html>
            `
        };
        
        console.log('📤 Envoi email d\'annulation à:', email);
        console.log('   Réservation:', reservation.id);
        console.log('   QR Code:', 'INVALIDÉ');
        
        const info = await transporter.sendMail(mailOptions);
        
        console.log('✅ Email d\'annulation envoyé !');
        console.log('   Message ID:', info.messageId);
        
        res.json({ 
            success: true, 
            message: 'Email d\'annulation envoyé avec succès !' 
        });
        
    } catch (error) {
        console.error('❌ ERREUR EMAIL ANNULATION:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Endpoint: Validate Ticket (check if QR code is still valid using DB)
app.post('/api/validate-ticket', async (req, res) => {
    const { ticketId } = req.body;
    
    if (!ticketId) {
        return res.status(400).json({ success: false, message: 'ID de billet manquant' });
    }
    
    try {
        const validation = await isTicketValid(ticketId);
        
        if (!validation.valid) {
            console.log('❌ Billet invalide:', ticketId, '-', validation.reason);
            return res.json({ 
                valid: false, 
                reason: validation.reason
            });
        }
        
        console.log('✅ Billet valide:', ticketId);
        
        // Retourner les informations du billet
        res.json({ 
            valid: true, 
            reservation: validation.ticket
        });
        
    } catch (error) {
        console.error('❌ Erreur validation:', error);
        res.status(500).json({ 
            valid: false, 
            reason: 'Erreur serveur lors de la validation' 
        });
    }
});

// Endpoint: Mark ticket as cancelled (using DB)
app.post('/api/cancel-ticket', async (req, res) => {
    const { ticketId } = req.body;
    
    if (!ticketId) {
        return res.status(400).json({ success: false, message: 'ID de billet manquant' });
    }
    
    try {
        // Annuler le billet dans la base de données
        await cancelTicket(ticketId);
        
        const db = await readDB();
        console.log('📋 Total billets annulés:', db.cancelledTickets.length);
        
        res.json({ 
            success: true, 
            message: 'Billet marqué comme annulé. QR Code invalidé et supprimé de la DB.' 
        });
    } catch (error) {
        console.error('❌ Erreur annulation:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Serveur prêt sur http://localhost:${PORT}`);
});
