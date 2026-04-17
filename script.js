// ========== LISTE DES INFIRMIERS (AJOUTE ICI MANUELLEMENT) ==========
let infirmiersData = [
    {
        id: '1',
        nom: 'hamza chetioui',
        telephone: '0755020097',
        email: 'hamzachetioui6@gmail.com',
        adresse: 'lazaret',
        quartier: 'lazaret',
        ville: 'Oujda',
        rayon: 5,
        services: ['Pansement', 'injection' , 'Prise de sang' , 'vaccination' , 'sondage urinaire' ],
        tarifs: '100-200 DH',
        prixMin: 100,
        prixMax: 200,
        disponibilites: 'Lundi-Vendredi 9h-17h',
        diplomes: 'DE Infirmier',
        langues: 'Arabe, Français',
        experience: 5,
        photo: '',
        dateInscription: '2024-04-17',
        valide: true
    },
    {
        id: '2',
        nom: 'Karima Benjelloun',
        telephone: '0612345678',
        email: 'karima@email.com',
        adresse: '15 Rue de la Liberté',
        quartier: 'Al Qods',
        ville: 'Oujda',
        rayon: 5,
        services: ['Pansement', 'Injection', 'Prise de sang'],
        tarifs: '80-150 DH',
        prixMin: 80,
        prixMax: 150,
        disponibilites: 'Lundi-Vendredi 9h-17h',
        diplomes: 'DE Infirmier',
        langues: 'Arabe, Français',
        experience: 6,
        photo: '',
        dateInscription: '2024-01-15',
        valide: true
    },
    {
        id: '3',
        nom: 'Youssef Alaoui',
        telephone: '0698765432',
        email: 'youssef@email.com',
        adresse: '8 Avenue Mohammed V',
        quartier: 'Oujda Centre',
        ville: 'Oujda',
        rayon: 8,
        services: ['Vaccination', 'Sondage urinaire'],
        tarifs: '120-200 DH',
        prixMin: 120,
        prixMax: 200,
        disponibilites: 'Mardi-Samedi 10h-18h',
        diplomes: 'DE Infirmier Urgences',
        langues: 'Arabe, Français',
        experience: 4,
        photo: '',
        dateInscription: '2024-01-20',
        valide: true
    },
    {
        id: '4',
        nom: 'Fatima Zahraoui',
        telephone: '0678901234',
        email: 'fatima@email.com',
        adresse: '3 Rue des Oliviers',
        quartier: 'Hay Ennasr',
        ville: 'Oujda',
        rayon: 4,
        services: ['Pansement', 'Surveillance tension'],
        tarifs: '70-180 DH',
        prixMin: 70,
        prixMax: 180,
        disponibilites: 'Lundi-Vendredi 8h-12h',
        diplomes: 'DE Infirmier Diabétologie',
        langues: 'Arabe, Français',
        experience: 8,
        photo: '',
        dateInscription: '2024-04-17',
        valide: true
    },
    
];

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

// ========== FONCTIONS ==========
async function getInfirmiers() {
    return infirmiersData.filter(i => i.valide === true);
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
