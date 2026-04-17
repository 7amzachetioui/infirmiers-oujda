// ========== LIEN GOOGLE SHEETS ==========
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1RAIjiJZPwHMNFjBillgBEnOK5nDXQT658V3vbBulamc/export?format=csv&gid=0';

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

// ========== FONCTIONS ==========
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

// ========== PAGE RECHERCHE ==========
if (document.getElementById('btnRechercher')) {
    async function rechercher() {
        let infirmiers = await getInfirmiers();
        
        const serviceFiltre = document.getElementById('filtreService')?.value || '';
        const quartierFiltre = document.getElementById('filtreQuartier')?.value || '';
        const prixMax = parseInt(document.getElementById('filtrePrixMax')?.value) || 999999;
        
        if (serviceFiltre) infirmiers = infirmiers.filter(i => i.services && i.services.includes(serviceFiltre));
        if (quartierFiltre) infirmiers = infirmiers.filter(i => i.quartier === quartierFiltre);
        infirmiers = infirmiers.filter(i => i.prixMax <= prixMax);
        
        const resultCount = document.getElementById('resultCount');
        if (resultCount) resultCount.textContent = infirmiers.length;
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
    
    const btnRechercher = document.getElementById('btnRechercher');
    if (btnRechercher) btnRechercher.onclick = rechercher;
    
    const btnReset = document.getElementById('btnReset');
    if (btnReset) {
        btnReset.onclick = () => {
            const inputs = document.querySelectorAll('.filters-grid select, .filters-grid input');
            inputs.forEach(el => { if (el) el.value = ''; });
            rechercher();
            showNotification('Filtres réinitialisés', 'info');
        };
    }
    
    rechercher();
}

// ========== DÉMARRAGE ==========
init();
