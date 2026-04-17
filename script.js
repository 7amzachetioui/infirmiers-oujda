// ========== LIEN API SHEET.BEST ==========
const API_URL = 'https://api.sheetbest.com/sheets/3c2bfe43-ee74-460d-95fb-00de2f4292c4';

// ========== DONNÉES ==========
let infirmiersData = [];

// ========== NOTIFICATION ==========
function showNotification(message, type = 'info', title = '') {
    const notification = document.getElementById('notification');
    if (!notification) { alert(message); return; }
    
    const titles = { success: '✅ Succès', error: '❌ Erreur', warning: '⚠️ Attention', info: 'ℹ️ Info' };
    notification.className = `notification ${type}`;
    notification.innerHTML = `<strong>${title || titles[type]}</strong><br>${message}`;
    notification.style.display = 'block';
    setTimeout(() => { notification.style.display = 'none'; }, 4000);
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

// ========== CHARGEMENT DEPUIS SHEET.BEST ==========
async function loadInfirmiersFromAPI() {
    try {
        const response = await fetch(API_URL);
        const data = await response.json();
        
        const infirmiers = data.map(item => ({
            id: item.id,
            nom: item.nom,
            telephone: item.telephone,
            email: item.email,
            adresse: item.adresse || '',
            quartier: item.quartier || '',
            ville: item.ville || 'Oujda',
            rayon: parseInt(item.rayon) || 5,
            services: item.services ? (typeof item.services === 'string' ? item.services.split(', ') : item.services) : [],
            tarifs: item.tarifs || '',
            prixMin: parseInt(item.prixMin) || 0,
            prixMax: parseInt(item.prixMax) || 200,
            disponibilites: item.disponibilites || 'Lundi-Vendredi 9h-17h',
            diplomes: item.diplomes || '',
            langues: item.langues || 'Arabe, Français',
            experience: parseInt(item.experience) || 0,
            photo: item.photo || '',
            dateInscription: item.dateInscription || new Date().toISOString(),
            valide: item.valide === 'TRUE' || item.valide === true
        }));
        
        infirmiersData = infirmiers;
        console.log('✅ Infirmiers chargés:', infirmiersData.length);
        return infirmiersData;
    } catch (error) {
        console.error('Erreur chargement:', error);
        return [];
    }
}

// ========== AJOUTER INFIRMIER ==========
async function ajouterInfirmier(infirmier) {
    try {
        // Nettoyer les données pour l'API
        const dataToSend = {
            id: infirmier.id,
            nom: infirmier.nom,
            telephone: infirmier.telephone,
            email: infirmier.email,
            adresse: infirmier.adresse,
            quartier: infirmier.quartier,
            ville: infirmier.ville,
            rayon: infirmier.rayon.toString(),
            services: Array.isArray(infirmier.services) ? infirmier.services.join(', ') : infirmier.services,
            tarifs: infirmier.tarifs,
            prixMin: infirmier.prixMin.toString(),
            prixMax: infirmier.prixMax.toString(),
            disponibilites: infirmier.disponibilites,
            diplomes: infirmier.diplomes,
            langues: infirmier.langues,
            experience: infirmier.experience.toString(),
            photo: infirmier.photo,
            dateInscription: infirmier.dateInscription,
            valide: infirmier.valide ? 'TRUE' : 'FALSE'
        };
        
        console.log('Envoi des données:', dataToSend);
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        
        console.log('Réponse status:', response.status);
        
        if (response.ok) {
            const result = await response.json();
            console.log('Succès:', result);
            await loadInfirmiersFromAPI(); // Recharger les données
            return true;
        } else {
            const errorText = await response.text();
            console.error('Erreur réponse:', errorText);
            return false;
        }
    } catch (error) {
        console.error('Erreur ajout:', error);
        return false;
    }
}

// ========== FONCTIONS GLOBALES ==========
async function getInfirmiers(onlyValides = true) {
    if (infirmiersData.length === 0) await loadInfirmiersFromAPI();
    if (onlyValides) return infirmiersData.filter(i => i.valide);
    return infirmiersData;
}

async function getStats() {
    const infirmiers = await getInfirmiers(false);
    const allServices = new Set();
    infirmiers.forEach(inf => {
        if (inf.services) {
            if (Array.isArray(inf.services)) {
                inf.services.forEach(s => allServices.add(s));
            } else if (typeof inf.services === 'string') {
                inf.services.split(', ').forEach(s => allServices.add(s));
            }
        }
    });
    return {
        nbInfirmiers: infirmiers.filter(i => i.valide).length,
        nbServices: allServices.size,
        nbAvis: 0
    };
}

// ========== INIT ==========
async function init() {
    await loadInfirmiersFromAPI();
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
            showNotification(`Mode ${document.body.classList.contains('dark') ? 'sombre' : 'clair'}`, 'info');
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
            showNotification('Veuillez sélectionner au moins un service', 'error', '📋 Formulaire');
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
        
        showNotification('Envoi en cours...', 'info', '📝 Inscription');
        
        const success = await ajouterInfirmier(infirmier);
        if (success) {
            showNotification('✅ Inscription enregistrée ! Un administrateur la validera bientôt.', 'success', '📝 Inscription');
            setTimeout(() => { window.location.href = 'index.html'; }, 2000);
        } else {
            showNotification('Erreur lors de l\'inscription. Vérifie ta connexion.', 'error', '❌ Erreur');
        }
    });
}

// ========== PAGE RECHERCHE ==========
if (document.getElementById('btnRechercher')) {
    async function rechercher() {
        let infirmiers = await getInfirmiers(true);
        
        const serviceFiltre = document.getElementById('filtreService').value;
        const quartierFiltre = document.getElementById('filtreQuartier').value;
        const prixMax = parseInt(document.getElementById('filtrePrixMax').value) || 999999;
        
        if (serviceFiltre) infirmiers = infirmiers.filter(i => i.services && i.services.includes(serviceFiltre));
        if (quartierFiltre) infirmiers = infirmiers.filter(i => i.quartier === quartierFiltre);
        infirmiers = infirmiers.filter(i => i.prixMax <= prixMax);
        
        document.getElementById('resultCount').textContent = infirmiers.length;
        await afficherResultats(infirmiers);
    }
    
    async function afficherResultats(infirmiers) {
        const container = document.getElementById('listeInfirmiers');
        if (!container) return;
        
        if (infirmiers.length === 0) {
            container.innerHTML = '<div class="aucun-resultat">❌ Aucun infirmier trouvé</div>';
            return;
        }
        
        container.innerHTML = infirmiers.map(inf => {
            const whatsappMsg = `Bonjour ${inf.nom}, je vous contacte depuis Infirmiers Oujda.`;
            const servicesList = Array.isArray(inf.services) ? inf.services : (inf.services ? inf.services.split(', ') : []);
            
            return `
                <div class="infirmier-card">
                    <h3>${inf.nom}</h3>
                    <div class="stars">⭐ Pas encore noté</div>
                    <p>📍 ${inf.quartier}, ${inf.ville} (${inf.rayon} km)</p>
                    <p>📞 ${formatPhoneNumber(inf.telephone)}</p>
                    <p>💰 ${inf.prixMin} - ${inf.prixMax} DH</p>
                    <p>🕒 ${inf.disponibilites}</p>
                    <p>🗣️ ${inf.langues}</p>
                    <p>🩺 ${servicesList.map(s => `<span class="service-badge">${s.trim()}</span>`).join('')}</p>
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
    };
    rechercher();
}

// ========== PAGE ADMIN ==========
if (document.getElementById('tab-infirmiers')) {
    async function loadAdminInfirmiers() {
        const infirmiers = await getInfirmiers(false);
        
        const container = document.getElementById('adminInfirmiersList');
        if (container) {
            container.innerHTML = infirmiers.map(inf => `
                <div class="infirmier-card">
                    <h3>${inf.nom}</h3>
                    <p>📞 ${inf.telephone} | 📧 ${inf.email}</p>
                    <p>📍 ${inf.quartier}</p>
                    <p>🩺 ${Array.isArray(inf.services) ? inf.services.join(', ') : inf.services}</p>
                    <p>Statut: ${inf.valide ? '✅ Validé' : '⏳ En attente'}</p>
                </div>
            `).join('');
        }
    }
    
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.onclick = () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            const tabId = document.getElementById(`tab-${btn.dataset.tab}`);
            if (tabId) tabId.classList.add('active');
            if (btn.dataset.tab === 'infirmiers') loadAdminInfirmiers();
        };
    });
    
    loadAdminInfirmiers();
}

// ========== DÉMARRAGE ==========
init();
