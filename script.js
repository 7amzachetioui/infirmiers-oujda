// ========== LIENS GOOGLE SHEETS (TES LIENS CSV CORRIGÉS) ==========
const SHEET1_URL = 'https://docs.google.com/spreadsheets/d/1RAIjiJZPwHMNFjBillgBEnOK5nDXQT658V3vbBulamc/export?format=csv&gid=0';
const SHEET2_URL = 'https://docs.google.com/spreadsheets/d/1RAIjiJZPwHMNFjBillgBEnOK5nDXQT658V3vbBulamc/export?format=csv&gid=1391565068';
const SHEET3_URL = 'https://docs.google.com/spreadsheets/d/1RAIjiJZPwHMNFjBillgBEnOK5nDXQT658V3vbBulamc/export?format=csv&gid=1213304758';

// ========== DONNÉES ==========
let infirmiersData = [];
let avisData = [];

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
        const response = await fetch(SHEET1_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim());
        if (rows.length < 2) return [];
        
        const infirmiers = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            if (values.length < 5) continue;
            
            const services = values[8] ? values[8].split(', ') : [];
            
            infirmiers.push({
                id: values[0],
                nom: values[1],
                telephone: values[2],
                email: values[3],
                adresse: values[4] || '',
                quartier: values[5] || '',
                ville: values[6] || 'Oujda',
                rayon: parseInt(values[7]) || 5,
                services: services,
                tarifs: values[9] || '',
                prixMin: parseInt(values[10]) || 0,
                prixMax: parseInt(values[11]) || 200,
                disponibilites: values[12] || 'Lundi-Vendredi 9h-17h',
                diplomes: values[13] || '',
                langues: values[14] || 'Arabe, Français',
                experience: parseInt(values[15]) || 0,
                photo: values[16] || '',
                dateInscription: values[17] || new Date().toISOString(),
                valide: values[18] === 'TRUE' || values[18] === 'true'
            });
        }
        
        infirmiersData = infirmiers;
        console.log('✅ Infirmiers chargés:', infirmiersData.length);
        return infirmiersData;
    } catch (error) {
        console.error('Erreur chargement infirmiers:', error);
        return [];
    }
}

async function loadAvisFromSheet() {
    try {
        const response = await fetch(SHEET2_URL);
        const csvText = await response.text();
        const rows = csvText.split('\n').filter(row => row.trim());
        if (rows.length < 2) return [];
        
        const avis = [];
        for (let i = 1; i < rows.length; i++) {
            const values = rows[i].split(',');
            if (values.length < 4) continue;
            
            avis.push({
                id: values[0],
                infirmierId: values[1],
                infirmierNom: values[2],
                note: parseInt(values[3]) || 0,
                commentaire: values[4] || '',
                date: values[5] || new Date().toISOString(),
                approuve: values[6] === 'TRUE' || values[6] === 'true'
            });
        }
        
        avisData = avis;
        console.log('✅ Avis chargés:', avisData.length);
        return avisData;
    } catch (error) {
        console.error('Erreur chargement avis:', error);
        return [];
    }
}

// ========== FONCTIONS GLOBALES ==========
async function getInfirmiers(onlyValides = true) {
    if (infirmiersData.length === 0) await loadInfirmiersFromSheet();
    if (onlyValides) return infirmiersData.filter(i => i.valide);
    return infirmiersData;
}

async function getAvis(infirmierId = null, seulementApprouves = true) {
    if (avisData.length === 0) await loadAvisFromSheet();
    let result = [...avisData];
    if (seulementApprouves) result = result.filter(a => a.approuve);
    if (infirmierId) result = result.filter(a => a.infirmierId === infirmierId);
    return result;
}

async function getStats() {
    const infirmiers = await getInfirmiers(false);
    const avis = await getAvis(null, true);
    const allServices = new Set();
    infirmiers.forEach(inf => {
        if (inf.services) inf.services.forEach(s => allServices.add(s));
    });
    return {
        nbInfirmiers: infirmiers.filter(i => i.valide).length,
        nbServices: allServices.size,
        nbAvis: avis.length
    };
}

// ========== INIT ==========
async function init() {
    await loadInfirmiersFromSheet();
    await loadAvisFromSheet();
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
        
        let inscrits = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
        inscrits.push(infirmier);
        localStorage.setItem('inscriptions_temp', JSON.stringify(inscrits));
        
        showNotification('✅ Inscription enregistrée ! Un administrateur la validera bientôt.', 'success', '📝 Inscription');
        setTimeout(() => { window.location.href = 'index.html'; }, 2000);
    });
}

// ========== PAGE RECHERCHE ==========
if (document.getElementById('btnRechercher')) {
    let currentResults = [];
    
    async function rechercher() {
        let infirmiers = await getInfirmiers(true);
        
        const serviceFiltre = document.getElementById('filtreService').value;
        const quartierFiltre = document.getElementById('filtreQuartier').value;
        const prixMax = parseInt(document.getElementById('filtrePrixMax').value) || 999999;
        
        if (serviceFiltre) infirmiers = infirmiers.filter(i => i.services.includes(serviceFiltre));
        if (quartierFiltre) infirmiers = infirmiers.filter(i => i.quartier === quartierFiltre);
        infirmiers = infirmiers.filter(i => i.prixMax <= prixMax);
        
        currentResults = infirmiers;
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
        
        const avis = await getAvis(null, true);
        
        container.innerHTML = infirmiers.map(inf => {
            const infAvis = avis.filter(a => a.infirmierId === inf.id);
            const avgNote = infAvis.length ? (infAvis.reduce((s,a)=>s+a.note,0)/infAvis.length).toFixed(1) : 0;
            const whatsappMsg = `Bonjour ${inf.nom}, je vous contacte depuis Infirmiers Oujda.`;
            
            return `
                <div class="infirmier-card">
                    <h3>${inf.nom}</h3>
                    <div class="stars">${'⭐'.repeat(Math.floor(avgNote))} ${avgNote > 0 ? `(${avgNote}/5)` : '⭐ Pas encore noté'}</div>
                    <p>📍 ${inf.quartier}, ${inf.ville} (${inf.rayon} km)</p>
                    <p>📞 ${formatPhoneNumber(inf.telephone)}</p>
                    <p>💰 ${inf.prixMin} - ${inf.prixMax} DH</p>
                    <p>🕒 ${inf.disponibilites}</p>
                    <p>🗣️ ${inf.langues}</p>
                    <p>🩺 ${inf.services.map(s => `<span class="service-badge">${s}</span>`).join('')}</p>
                    <div>
                        <a href="tel:${inf.telephone}" class="contact-btn">📞 Appeler</a>
                        <a href="${getWhatsAppUrl(inf.telephone, whatsappMsg)}" target="_blank" class="whatsapp-btn">💬 WhatsApp</a>
                        <button class="avis-btn" data-id="${inf.id}" data-nom="${inf.nom}">⭐ Noter</button>
                    </div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.avis-btn').forEach(btn => {
            btn.onclick = async () => {
                const note = prompt('Note sur 5 (1-5) :');
                if (note && note >= 1 && note <= 5) {
                    const commentaire = prompt('Votre commentaire :');
                    const newAvis = {
                        id: Date.now().toString(),
                        infirmierId: btn.dataset.id,
                        infirmierNom: btn.dataset.nom,
                        note: parseInt(note),
                        commentaire: commentaire || '',
                        date: new Date().toISOString(),
                        approuve: false
                    };
                    let avisExistants = JSON.parse(localStorage.getItem('avis_temp') || '[]');
                    avisExistants.push(newAvis);
                    localStorage.setItem('avis_temp', JSON.stringify(avisExistants));
                    showNotification('⭐ Merci pour votre avis !', 'success', 'Avis envoyé');
                    rechercher();
                }
            };
        });
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
        const inscriptionsTemp = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
        const tousInfirmiers = [...infirmiers, ...inscriptionsTemp];
        
        const container = document.getElementById('adminInfirmiersList');
        container.innerHTML = tousInfirmiers.map(inf => `
            <div class="infirmier-card">
                <h3>${inf.nom}</h3>
                <p>📞 ${inf.telephone} | 📧 ${inf.email}</p>
                <p>📍 ${inf.quartier}</p>
                <p>🩺 ${inf.services ? inf.services.join(', ') : ''}</p>
                <p>Statut: ${inf.valide ? '✅ Validé' : '⏳ En attente'}</p>
                ${!inf.valide ? `<button class="btn-small btn-primary" onclick="validerLocal('${inf.id}')">Valider</button>` : ''}
                <button class="btn-small btn-danger" onclick="supprimerLocal('${inf.id}')">Supprimer</button>
            </div>
        `).join('');
    }
    
    window.validerLocal = (id) => {
        let inscriptions = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
        const index = inscriptions.findIndex(i => i.id === id);
        if (index !== -1) {
            inscriptions[index].valide = true;
            localStorage.setItem('inscriptions_temp', JSON.stringify(inscriptions));
            loadAdminInfirmiers();
            showNotification('Infirmier validé', 'success');
        }
    };
    
    window.supprimerLocal = (id) => {
        if (confirm('Supprimer ?')) {
            let inscriptions = JSON.parse(localStorage.getItem('inscriptions_temp') || '[]');
            inscriptions = inscriptions.filter(i => i.id !== id);
            localStorage.setItem('inscriptions_temp', JSON.stringify(inscriptions));
            loadAdminInfirmiers();
            showNotification('Infirmier supprimé', 'info');
        }
    };
    
    async function loadAdminAvis() {
        const avisSheet = await getAvis(null, false);
        const avisTemp = JSON.parse(localStorage.getItem('avis_temp') || '[]');
        const tousAvis = [...avisSheet, ...avisTemp];
        
        const container = document.getElementById('adminAvisList');
        container.innerHTML = tousAvis.map(a => `
            <div class="infirmier-card">
                <p><strong>${a.infirmierNom}</strong> - Note: ${'⭐'.repeat(a.note)} (${a.note}/5)</p>
                <p>Commentaire: "${a.commentaire}"</p>
                <p>Statut: ${a.approuve ? '✅ Approuvé' : '⏳ En attente'}</p>
                ${!a.approuve ? `<button class="btn-small btn-primary" onclick="approuverAvisLocal('${a.id}')">Approuver</button>` : ''}
                <button class="btn-small btn-danger" onclick="supprimerAvisLocal('${a.id}')">Supprimer</button>
            </div>
        `).join('');
    }
    
    window.approuverAvisLocal = (id) => {
        let avis = JSON.parse(localStorage.getItem('avis_temp') || '[]');
        const index = avis.findIndex(a => a.id === id);
        if (index !== -1) {
            avis[index].approuve = true;
            localStorage.setItem('avis_temp', JSON.stringify(avis));
            loadAdminAvis();
            showNotification('Avis approuvé', 'success');
        }
    };
    
    window.supprimerAvisLocal = (id) => {
        let avis = JSON.parse(localStorage.getItem('avis_temp') || '[]');
        avis = avis.filter(a => a.id !== id);
        localStorage.setItem('avis_temp', JSON.stringify(avis));
        loadAdminAvis();
        showNotification('Avis supprimé', 'info');
    };
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
            if (btn.dataset.tab === 'infirmiers') loadAdminInfirmiers();
            if (btn.dataset.tab === 'avis') loadAdminAvis();
        };
    });
    
    loadAdminInfirmiers();
}

// ========== DÉMARRAGE ==========
init();
