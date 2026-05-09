// --- CONFIGURATION ---
const API_BASE_URL = 'https://transaction-management-vq47.onrender.com/api/v1';
let jwtToken = localStorage.getItem('jwt_token');

// --- DOM ELEMENTS ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const loginForm = document.getElementById('login-form');
const errorMsg = document.getElementById('login-error');

// Views
const dashboardView = document.getElementById('dashboard-view');
const transactionsView = document.getElementById('transactions-view');

// Nav
const navDashboard = document.getElementById('nav-dashboard');
const navTransactions = document.getElementById('nav-transactions');
const navLogout = document.getElementById('nav-logout');

// --- INITIALIZATION ---
function init() {
    if (jwtToken) {
        showApp();
        loadDashboard();
    } else {
        showLogin();
    }
}

// --- UTILS ---
function authHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
    };
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

// --- NAVIGATION LOGIC ---
function showLogin() {
    authSection.classList.remove('hidden');
    appSection.classList.add('hidden');
}

function showApp() {
    authSection.classList.add('hidden');
    appSection.classList.remove('hidden');
}

function switchView(view) {
    dashboardView.classList.add('hidden');
    transactionsView.classList.add('hidden');
    view.classList.remove('hidden');
}

navDashboard.addEventListener('click', () => {
    switchView(dashboardView);
    loadDashboard();
});

navTransactions.addEventListener('click', () => {
    switchView(transactionsView);
});

navLogout.addEventListener('click', () => {
    localStorage.removeItem('jwt_token');
    jwtToken = null;
    showLogin();
});

// --- AUTHENTICATION ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userName = document.getElementById('username').value;
    const userPassword = document.getElementById('password').value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, userPassword })
        });

        if (response.ok) {
            const data = await response.json();
            jwtToken = data.token;
            localStorage.setItem('jwt_token', jwtToken);
            errorMsg.textContent = '';
            showApp();
            loadDashboard();
        } else {
            errorMsg.textContent = 'Invalid credentials. Please try again.';
        }
    } catch (err) {
        errorMsg.textContent = 'Server error. Is the backend running?';
        console.error(err);
    }
});

// --- DASHBOARD DATA ---
async function loadDashboard() {
    try {
        // Fetch Summary
        const summaryRes = await fetch(`${API_BASE_URL}/dashboard/summary`, { headers: authHeaders() });
        if (summaryRes.ok) {
            const summary = await summaryRes.json();
            document.getElementById('total-income').textContent = formatCurrency(summary.totalIncome);
            document.getElementById('total-expenses').textContent = formatCurrency(summary.totalExpenses);
            document.getElementById('net-balance').textContent = formatCurrency(summary.netBalance);
        } else if (summaryRes.status === 401) {
            navLogout.click(); // Token expired
        }

        // Fetch Recent Transactions
        const recentRes = await fetch(`${API_BASE_URL}/dashboard/recent`, { headers: authHeaders() });
        if (recentRes.ok) {
            const recentTxs = await recentRes.json();
            const tbody = document.getElementById('recent-tbody');
            tbody.innerHTML = ''; // Clear table

            recentTxs.forEach(tx => {
                const tr = document.createElement('tr');
                const amountClass = tx.type === 'INCOME' ? 'text-success' : 'text-danger';
                tr.innerHTML = `
                    <td>${tx.recordDate}</td>
                    <td>${tx.description || '-'}</td>
                    <td>${tx.category}</td>
                    <td class="${amountClass}">${tx.type === 'INCOME' ? '+' : '-'}${formatCurrency(tx.amount)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (err) {
        console.error("Failed to load dashboard data", err);
    }
}

// --- TRANSACTIONS DATA ---
document.getElementById('add-tx-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
        amount: parseFloat(document.getElementById('tx-amount').value),
        type: document.getElementById('tx-type').value,
        category: document.getElementById('tx-category').value,
        recordDate: document.getElementById('tx-date').value,
        description: document.getElementById('tx-desc').value
    };

    try {
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.status === 201) {
            alert('Transaction added successfully!');
            e.target.reset(); // Clear form
            navDashboard.click(); // Go back to dashboard to see the update
        } else {
            alert('Failed to add transaction.');
        }
    } catch (err) {
        console.error(err);
        alert('Server error.');
    }
});

// Boot the app
init();