// ==========================================
// 1. REPLACE THIS URL WITH YOUR DEPLOYED GOOGLE SCRIPT URL!
// ==========================================
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzuCBV1mQ5NvNVN696HEx-oKFdtRu4T2XUtruDyGCekIiHbzevRiKzE0Ycc6UegtZ--/exec";

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
document.getElementById('registrationForm').addEventListener('submit', function (e) {
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
        // IMPORTANT: Google Scripts requires no-cors mode, otherwise it throws a CORS error
        mode: 'no-cors',
        body: formData
    })
        .then(response => {
            // With no-cors mode, we can't read the response. It will be an "opaque" object.
            // We just have to assume it worked if the fetch didn't throw a network error.
            document.getElementById('registrationForm').style.display = 'none';
            document.getElementById('successMsg').style.display = 'block';
        })
        .catch(error => {
            console.error('Erreur:', error);
            alert("Une erreur s'est produite lors de l'enregistrement. Veuillez réessayer.");
            btn.textContent = 'Soumettre ma candidature';
            btn.disabled = false;
        });
});

// --- ADMIN LOGIN LOGIC ---
document.getElementById('loginForm').addEventListener('submit', function (e) {
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

    // Because Google blocks normal GET requests (CORS), we must use "JSONP"
    // This creates an invisible script tag that loads the data as a Javascript function!
    const script = document.createElement('script');

    // We pass our action and tell Google to wrap the data in a function named "googleScriptCallback"
    script.src = GOOGLE_SCRIPT_URL + "?action=getUsers&callback=googleScriptCallback";

    // Setup a timeout just in case it fails silently (JSONP downside)
    window.jsonpTimeout = setTimeout(() => {
        if (loading.style.display === 'block') {
            loading.style.display = 'none';
            tbody.innerHTML = '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #FF6B6B;">Le chargement a pris trop de temps. Vérifiez votre connexion ou l\'URL du script.</td></tr>';
        }
    }, 10000);

    document.body.appendChild(script);
}

// This function must be global so the JSONP script tag can find it!
window.googleScriptCallback = function (data) {
    clearTimeout(window.jsonpTimeout); // Stop the timeout error

    const loading = document.getElementById('loadingData');
    const tbody = document.getElementById('participantsList');

    loading.style.display = 'none';

    if (!data || !data.users) {
        tbody.innerHTML = '<tr><td colspan="3" style="padding: 10px; text-align: center; color: #FF6B6B;">Données invalides reçues.</td></tr>';
        return;
    }

    participantsData = data.users;
    renderParticipants();
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
