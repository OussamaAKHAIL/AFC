// ==========================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/a/macros/edu.uiz.ac.ma/s/AKfycbzuCBV1mQ5NvNVN696HEx-oKFdtRu4T2XUtruDyGCekIiHbzevRiKzE0Ycc6UegtZ--/exec";

let participantsData = [];

function showView(viewId) {
    document.getElementById('registrationView').style.display = 'none';
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('dashboardView').style.display = 'none';
    
    document.getElementById(viewId).style.display = 'block';
    
    if (viewId === 'dashboardView') {
        fetchParticipants();
    }
}

// --- REGISTRATION LOGIC ---
document.getElementById('registrationForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const btn = document.getElementById('submitBtn');
    const firstName = document.getElementById('firstName').value;
    const lastName = document.getElementById('lastName').value;
    
    btn.textContent = 'Envoi en cours...';
    btn.disabled = true;

    if (!GOOGLE_SCRIPT_URL) {
        alert("Attention : L'URL du script Google n'est pas configurée dans script.js ! Les données ne seront pas sauvegardées en ligne.");
        btn.textContent = 'Soumettre ma candidature';
        btn.disabled = false;
        return;
    }

    // Prepare data to send
    const formData = new URLSearchParams();
    formData.append('action', 'register');
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);

    // Send POST request to Google Apps Script
    fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.result === 'success') {
            document.getElementById('registrationForm').style.display = 'none';
            document.getElementById('successMsg').style.display = 'block';
        } else {
            throw new Error('Server returned error');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert("Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer.");
        btn.textContent = 'Soumettre ma candidature';
        btn.disabled = false;
    });
});

// --- ADMIN LOGIN LOGIC ---
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const pass = document.getElementById('adminPassword').value;
    
    if (pass === 'admin2026') {
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
        showView('dashboardView');
    } else {
        document.getElementById('loginError').style.display = 'block';
    }
});

// --- DASHBOARD LOGIC ---
function fetchParticipants() {
    const tbody = document.getElementById('participantsList');
    const loading = document.getElementById('loadingData');
    
    tbody.innerHTML = '';
    loading.style.display = 'block';

    if (!GOOGLE_SCRIPT_URL) {
        loading.style.display = 'none';
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #FF6B6B;">Erreur : GOOGLE_SCRIPT_URL non configurée !</td></tr>';
        return;
    }

    // Fetch GET request from Google Apps Script
    fetch(GOOGLE_SCRIPT_URL + "?action=getUsers")
    .then(response => response.json())
    .then(data => {
        loading.style.display = 'none';
        participantsData = data.users || [];
        renderParticipants();
    })
    .catch(error => {
        console.error('Erreur:', error);
        loading.style.display = 'none';
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #FF6B6B;">Erreur de chargement des données.</td></tr>';
    });
}

function renderParticipants() {
    const tbody = document.getElementById('participantsList');
    tbody.innerHTML = '';
    
    if (participantsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #888;">Aucune inscription pour le moment.</td></tr>';
        return;
    }

    participantsData.forEach(p => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
        tr.innerHTML = `
            <td style="padding: 10px;">${p.date || '-'}</td>
            <td style="padding: 10px;">${p.firstName || '-'}</td>
            <td style="padding: 10px;">${p.lastName || '-'}</td>
        `;
        tbody.appendChild(tr);
    });
}

function downloadExcel() {
    if (participantsData.length === 0) {
        alert("Aucune donnée à télécharger !");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Date,Prénom,Nom\n";
    participantsData.forEach(p => {
        csvContent += `${p.date},${p.firstName},${p.lastName}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Inscriptions_Arduino_Challenge.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
