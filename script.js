// ========== LIEN GOOGLE SHEETS ==========
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1RAIjiJZPwHMNFjBillgBEnOK5nDXQT658V3vbBulamc/export?format=csv&gid=0';

// ========== STOCKAGE LOCAL ==========
let inscriptionsEnAttente = [];
let infirmiersData = [];

// ========== NUMÉRO WHATSAPP ADMIN ==========
// Ton numéro : 0755020097 → format international : 212755020097
const ADMIN_WHATSAPP = '212755020097';

// ========== NOTIFICATION ==========
function showNotification(message, type = 'info', title = '') {
    const notification = document.getElementById('notification');
    if (!notification) { alert(message); return; }
    
    const titles = { success: '✅ Succès', error: '❌ Erreur', warning: '⚠️ Attention', info: 'ℹ️ Info' };
    notification.className = `notification ${type}`;
    notification.innerHTML = `<strong>${title || titles[type]}</strong><br>${message}`;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 5000);
}

// ========== FORMATAGE ==========
function formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('0')) return cleaned;
    if (cleaned.startsWith('212')) return '0' + cleaned.substring(3);
    return cleaned;
}

function getWhatsAppUrl(phone, message) {
    let cleaned = phone.replace(/\s/g, '');
    if (cleaned.startsWith('0')) cleaned = '212' + cleaned.substring(1);
    if (!cleaned.startsWith('212')) cleaned = '212' + cleaned;
    return `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
}

// ========== ENVOI WHATSAPP À L'ADMIN (VERSION FIABLE) ==========
function envoyerNotificationAdmin(infirmier) {
    // Message à envoyer
    const message = 
        `📋 NOUVELLE INSCRIPTION INFIRMIER 📋\n\n` +
        `👤 Nom: ${infirmier.nom}\n` +
        `📞 Téléphone: ${infirmier.telephone}\n` +
        `📧 Email: ${infirmier.email}\n` +
        `📍 Adresse: ${infirmier.adresse}\n` +
        `🏘️ Quartier: ${infirmier.quartier}\n` +
        `📍 Ville: ${infirmier.ville}\n` +
        `📏 Rayon: ${infirmier.rayon} km\n` +
        `🩺 Services: ${infirmier.services.join(', ')}\n` +
        `💰 Tarifs: ${infirmier.tarifs}\n` +
        `💶 Prix min: ${infirmier.prixMin} DH\n` +
        `💶 Prix max: ${infirmier.prixMax} DH\n` +
        `⏰ Disponibilités: ${infirmier.disponibilites}\n` +
        `🗣️ Langues: ${infirmier.langues}\n` +
        `🎓 Expérience: ${infirmier.experience} ans\n` +
        `📅 Date inscription: ${new Date(infirmier.dateInscription).toLocaleString()}\n\n` +
        `➡️ Ligne à copier dans Google Sheet (valide = FALSE):\n` +
        `${infirmier.id}\t${infirmier.nom}\t${infirmier.telephone}\t${infirmier.email}\t${infirmier.adresse}\t${infirmier.quartier}\t${infirmier.ville}\t${infirmier.rayon}\t${infirmier.services.join(', ')}\t${infirmier.tarifs}\t${infirmier.prixMin}\t${infirmier.prixMax}\t${infirmier.disponibilites}\t\t${infirmier.langues}\t${infirmier.experience}\t\t${infirmier.dateInscription}\tFALSE`;
    
    // Copier dans le presse-papier
    navigator.clipboard.writeText(message).then(() => {
        showNotification('✅ Message copié ! Ouvre WhatsApp et colle-le (Ctrl+V)', 'success', '📋 Copié');
        
        // Ouvrir WhatsApp
        window.open(`https://wa.me/${ADMIN_WHATSAPP}`, '_blank');
    }).catch(() => {
        // Si la copie échoue, ouvrir WhatsApp avec un message simple
        const simpleMsg = `📋 Nouvelle inscription: ${infirmier.nom} - ${infirmier.telephone}`;
        window.open(`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(simpleMsg)}`, '_blank');
        showNotification('Ouvre WhatsApp manuellement', 'info', '📱 WhatsApp');
    });
}

// ========== CHARGEMENT GOOGLE SHEETS ==========
async function loadInfirmiersFromSheet() {
    try {
        const response = await fetch(SHEET_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim());
        
        if (rows.length < 2) return [];
        
        const infirmiers = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            if (values.length < 5) continue;
            
            const clean = (str) => str ? str.replace(/^"|"$/g, '').trim() : '';
            const services = clean(values[8]) ? clean(values[8]).split(', ') : [];
            
            // Ne garder que ceux avec valide = TRUE
            const valide = clean(values[18]).toUpperCase() === 'TRUE';
            
            if (valide) {
                infirmiers.push({
                    id: clean(values[0]),
                    nom: clean(values[1]),
                    telephone: clean(values[2]),
                    email: clean(values[3]),
                    adresse: clean(values[4]),
                    quartier: clean(values[5]),
                    ville: clean(values[6]) || 'Oujda',
                    rayon: parseInt(clean(values[7])) || 5,
                    services: services,
                    tarifs: clean(values[9]),
                    prixMin: parseInt(clean(values[10])) || 0,
                    prixMax: parseInt(clean(values[11])) || 200,
                    disponibilites: clean(values[12]) || 'Lundi-Vendredi 9h-17h',
                    diplomes: clean(values[13]),
                    langues: clean(values[14]) || 'Arabe, Français',
                    experience: parseInt(clean(values[15])) || 0,
                    photo: clean(values[16]),
                    dateInscription: clean(values[17]),
                    valide: true
                });
            }
        }
        
        infirmiersData = infirmiers;
        console.log('✅ Infirmiers chargés:', infirmiersData.length);
        return infirmiersData;
    } catch (error) {
        console.error('Erreur chargement:', error);
        return [];
    }
}

// ========== FONCTIONS POUR LE SITE ==========
async function getInfirmiers() {
    if (infirmiersData.length === 0) await loadInfirmiersFromSheet();
    return infirmiersData;
}

async function getStats() {
    const infirmiers = await getInfirmiers();
    const allServices = new Set();
    infirmiers.forEach(inf => {
        if (inf.services) inf.services.forEach(s => allServices.add(s));
    });
    return {
        nbInfirmiers: infirmiers.length,
        nbServices: allServices.size,
        nbAvis: 0
    };
}

// ========== INIT ==========
async function init() {
    await loadInfirmiersFromSheet();
    await updateStats();
    setupTheme();
}

async function updateStats() {
    const stats = await getStats();
    const si = document.getElementById('statInfirmiers');
    const ss = document.getElementById('statServices');
    const sa = document.getElementById('statAvis');
    if (si) si.textContent = stats.nbInfirmiers;
    if (sa) sa.textContent = stats.nbAvis;
    if (ss) ss.textContent = stats.nbServices;
}

function setupTheme() {
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') document.body.classList.add('dark');
        themeBtn.onclick = () => {
            document.body.classList.toggle('dark');
            localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
            showNotification(`Mode ${document.body.classList.contains('dark') ? 'sombre' : 'clair'} activé`, 'info');
        };
    }
}

// ========== PAGE INSCRIPTION ==========
if (document.getElementById('infirmierForm')) {
    const form = document.getElementById('infirmierForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const services = [];
        document.querySelectorAll('#servicesGroup input:checked').forEach(cb => services.push(cb.value));
        
        if (services.length === 0) {
            showNotification('Veuillez sélectionner au moins un service', 'error');
            return;
        }
        
        const infirmier = {
            id: Date.now().toString(),
            nom: document.getElementById('nom').value,
            telephone: document.getElementById('telephone').value,
            email: document.getElementById('email').value,
            adresse: document.getElementById('adresse').value,
            quartier: document.getElementById('quartier').value,
            ville: 'Oujda',
            rayon: parseInt(document.getElementById('rayon').value),
            services: services,
            tarifs: document.getElementById('tarifs').value,
            prixMin: parseInt(document.getElementById('prixMin').value) || 0,
            prixMax: parseInt(document.getElementById('prixMax').value) || 200,
            disponibilites: document.getElementById('disponibilites').value || 'Lundi-Vendredi 9h-17h',
            diplomes: '',
            langues: document.getElementById('langues').value || 'Arabe, Français',
            experience: parseInt(document.getElementById('experience').value) || 0,
            photo: '',
            dateInscription: new Date().toISOString(),
            valide: false
        };
        
        // Sauvegarder dans localStorage
        let inscrits = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
        inscrits.push(infirmier);
        localStorage.setItem('inscriptions_temp', JSON.stringify(inscrits));
        
        // Envoyer notification à l'admin
        envoyerNotificationAdmin(infirmier);
        
        showNotification('✅ Inscription envoyée ! Vous serez contacté sous 48h.', 'success', '📝 Demande envoyée');
        
        // Rediriger après 3 secondes
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
    });
}

// ========== PAGE RECHERCHE ==========
if (document.getElementById('btnRechercher')) {
    async function rechercher() {
        let infirmiers = await getInfirmiers();
        
        const serviceFiltre = document.getElementById('filtreService').value;
        const quartierFiltre = document.getElementById('filtreQuartier').value;
        const prixMax = parseInt(document.getElementById('filtrePrixMax').value) || 999999;
        
        if (serviceFiltre) infirmiers = infirmiers.filter(i => i.services && i.services.includes(serviceFiltre));
        if (quartierFiltre) infirmiers = infirmiers.filter(i => i.quartier === quartierFiltre);
        infirmiers = infirmiers.filter(i => i.prixMax <= prixMax);
        
        document.getElementById('resultCount').textContent = infirmiers.length;
        afficherResultats(infirmiers);
    }
    
    function afficherResultats(infirmiers) {
        const container = document.getElementById('listeInfirmiers');
        if (!container) return;
        
        if (infirmiers.length === 0) {
            container.innerHTML = '<div class="aucun-resultat">❌ Aucun infirmier trouvé</div>';
            return;
        }
        
        container.innerHTML = infirmiers.map(inf => {
            const whatsappMsg = `Bonjour ${inf.nom}, je vous contacte depuis Infirmiers Oujda. Je souhaite prendre rendez-vous.`;
            
            return `
                <div class="infirmier-card">
                    <h3>${inf.nom}</h3>
                    <div class="stars">⭐ Infirmier diplômé</div>
                    <p>📍 ${inf.quartier}, ${inf.ville} (rayon ${inf.rayon} km)</p>
                    <p>📞 ${formatPhoneNumber(inf.telephone)}</p>
                    <p>💰 ${inf.prixMin} - ${inf.prixMax} DH</p>
                    <p>🕒 ${inf.disponibilites}</p>
                    <p>🗣️ ${inf.langues}</p>
                    <p>🎓 ${inf.experience} ans d'expérience</p>
                    <p>🩺 ${inf.services.map(s => `<span class="service-badge">${s}</span>`).join('')}</p>
                    <div>
                        <a href="tel:${inf.telephone}" class="contact-btn">📞 Appeler</a>
                        <a href="${getWhatsAppUrl(inf.telephone, whatsappMsg)}" target="_blank" class="whatsapp-btn">💬 WhatsApp</a>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    document.getElementById('btnRechercher').onclick = rechercher;
    document.getElementById('btnReset').onclick = () => {
        document.querySelectorAll('.filters-grid select, .filters-grid input').forEach(el => el.value = '');
        rechercher();
        showNotification('Filtres réinitialisés', 'info');
    };
    rechercher();
}

// ========== PAGE ADMIN (optionnelle) ==========
if (document.getElementById('tab-infirmiers')) {
    async function loadAdminInfirmiers() {
        const infirmiers = await getInfirmiers();
        const container = document.getElementById('adminInfirmiersList');
        if (container) {
            container.innerHTML = infirmiers.map(inf => `
                <div class="infirmier-card">
                    <h3>✅ ${inf.nom}</h3>
                    <p>📞 ${inf.telephone} | 📧 ${inf.email}</p>
                    <p>📍 ${inf.quartier} | ${inf.ville}</p>
                    <p>🕒 ${inf.disponibilites}</p>
                    <p>🩺 ${inf.services.join(', ')}</p>
                </div>
            `).join('');
            if (infirmiers.length === 0) {
                container.innerHTML = '<div class="aucun-resultat">Aucun infirmier validé</div>';
            }
        }
    }
    
    function loadAdminInscriptions() {
        const container = document.getElementById('adminInscriptionsList');
        if (!container) return;
        
        const inscriptions = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
        
        if (inscriptions.length === 0) {
            container.innerHTML = '<div class="aucun-resultat">✅ Aucune inscription en attente</div>';
            return;
        }
        
        container.innerHTML = inscriptions.map((inf, index) => `
            <div class="infirmier-card">
                <h3>⏳ ${inf.nom}</h3>
                <p>📞 ${inf.telephone} | 📧 ${inf.email}</p>
                <p>📍 ${inf.quartier}</p>
                <p>🩺 ${inf.services.join(', ')}</p>
                <p>📅 ${new Date(inf.dateInscription).toLocaleDateString()}</p>
                <button class="btn-small btn-primary" onclick="accepterInscription(${index})">✅ Accepter</button>
                <button class="btn-small btn-danger" onclick="refuserInscription(${index})">❌ Refuser</button>
            </div>
        `).join('');
    }
    
    window.accepterInscription = function(index) {
        let inscriptions = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
        const infirmier = inscriptions[index];
        
        // Copier dans le presse-papier
        const ligne = `${infirmier.id}\t${infirmier.nom}\t${infirmier.telephone}\t${infirmier.email}\t${infirmier.adresse}\t${infirmier.quartier}\t${infirmier.ville}\t${infirmier.rayon}\t${infirmier.services.join(', ')}\t${infirmier.tarifs}\t${infirmier.prixMin}\t${infirmier.prixMax}\t${infirmier.disponibilites}\t\t${infirmier.langues}\t${infirmier.experience}\t\t${infirmier.dateInscription}\tTRUE`;
        
        navigator.clipboard.writeText(ligne);
        
        inscriptions.splice(index, 1);
        localStorage.setItem('inscriptions_temp', JSON.stringify(inscriptions));
        
        loadAdminInscriptions();
        loadAdminInfirmiers();
        showNotification('✅ Infirmier accepté ! Ligne copiée. Colle-la dans Google Sheet', 'success');
    };
    
    window.refuserInscription = function(index) {
        let inscriptions = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
        const nom = inscriptions[index].nom;
        inscriptions.splice(index, 1);
        localStorage.setItem('inscriptions_temp', JSON.stringify(inscriptions));
        loadAdminInscriptions();
        showNotification(`❌ Inscription de ${nom} refusée`, 'warning');
    };
    
    // Onglets
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const tabId = document.getElementById(`tab-${btn.dataset.tab}`);
            if (tabId) tabId.classList.add('active');
            if (btn.dataset.tab === 'infirmiers') loadAdminInfirmiers();
            if (btn.dataset.tab === 'inscriptions') loadAdminInscriptions();
        };
    });
    
    loadAdminInfirmiers();
    loadAdminInscriptions();
}

// ========== DÉMARRAGE ==========
init();
