const BASE_URL = 'https://transaction-management-vq47.onrender.com/api/v1';

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const transactionForm = document.getElementById('transaction-form');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('jwt');
    if (token) {
        showDashboard();
    } else {
        showAuthView();
    }
});

// --- NAVIGATION & TOGGLES ---
function showAuthView() {
    authView.classList.remove('hidden-view');
    dashboardView.classList.add('hidden-view');
}

function showDashboard() {
    authView.classList.add('hidden-view');
    dashboardView.classList.remove('hidden-view');
    loadDashboardData();
}

// Tab Switching UI
tabLogin.addEventListener('click', () => {
    tabLogin.className = 'flex-1 py-4 text-sm font-semibold text-gray-900 border-b-2 border-primary transition-colors';
    tabRegister.className = 'flex-1 py-4 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors border-b-2 border-transparent';
    loginForm.classList.remove('hidden-view');
    registerForm.classList.add('hidden-view');
});

tabRegister.addEventListener('click', () => {
    tabRegister.className = 'flex-1 py-4 text-sm font-semibold text-gray-900 border-b-2 border-primary transition-colors';
    tabLogin.className = 'flex-1 py-4 text-sm font-medium text-gray-400 hover:text-gray-700 transition-colors border-b-2 border-transparent';
    registerForm.classList.remove('hidden-view');
    loginForm.classList.add('hidden-view');
});

// Fetch Helper
function getHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
    };
}

// --- REGISTRATION LOGIC ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('reg-msg');

    const payload = {
        userName: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        userPassword: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value,
        status: "ACTIVE"
    };

    try {
        const response = await fetch(`${BASE_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Username or email taken.');

        msg.className = 'mt-4 text-sm text-center text-green-600 font-medium';
        msg.innerText = 'Account created! Redirecting to login...';
        registerForm.reset();

        setTimeout(() => {
            tabLogin.click();
            msg.innerText = '';
        }, 2000);

    } catch (error) {
        msg.className = 'mt-4 text-sm text-center text-red-500 font-medium';
        msg.innerText = error.message;
    }
});

// --- LOGIN LOGIC ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('login-msg');

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userName: document.getElementById('login-username').value,
                userPassword: document.getElementById('login-password').value
            })
        });

        if (!response.ok) throw new Error('Invalid credentials');

        const data = await response.json();
        localStorage.setItem('jwt', data.token);
        msg.innerText = '';
        loginForm.reset();
        showDashboard();
    } catch (error) {
        msg.innerText = error.message;
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    showAuthView();
});

// --- DASHBOARD DATA ---
async function loadDashboardData() {
    try {
        const summaryRes = await fetch(`${BASE_URL}/dashboard/summary`, { headers: getHeaders() });
        if (summaryRes.status === 401) return logoutBtn.click();
        const summary = await summaryRes.json();

        // Format to currency
        document.getElementById('total-income').innerText = `$${summary.totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('total-expenses').innerText = `$${summary.totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
        document.getElementById('net-balance').innerText = `$${summary.netBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

        const recentRes = await fetch(`${BASE_URL}/dashboard/recent`, { headers: getHeaders() });
        const recentTxs = await recentRes.json();
        renderTransactions(recentTxs);
    } catch (error) {
        console.error("Dashboard error:", error);
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    transactions.forEach(tx => {
        const isIncome = tx.type === 'INCOME';
        const amountColor = isIncome ? 'text-emerald-600' : 'text-gray-900';
        const sign = isIncome ? '+' : '-';

        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors';
        tr.innerHTML = `
            <td class="px-6 py-4">${tx.recordDate}</td>
            <td class="px-6 py-4">
                <span class="block text-gray-900 font-medium">${tx.description || 'No description'}</span>
            </td>
            <td class="px-6 py-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    ${tx.category}
                </span>
            </td>
            <td class="px-6 py-4 text-right font-medium ${amountColor}">
                ${sign}$${tx.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- ADD TRANSACTION ---
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('tx-msg');
    const btn = transactionForm.querySelector('button');
    btn.disabled = true;
    btn.innerText = 'Saving...';

    const payload = {
        amount: parseFloat(document.getElementById('amount').value),
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        recordDate: document.getElementById('recordDate').value,
        description: document.getElementById('description').value
    };

    try {
        const response = await fetch(`${BASE_URL}/transactions`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Failed to save');

        msg.className = 'mt-2 text-sm text-center text-green-600 font-medium';
        msg.innerText = 'Success!';
        transactionForm.reset();
        loadDashboardData();
    } catch (error) {
        msg.className = 'mt-2 text-sm text-center text-red-500 font-medium';
        msg.innerText = error.message;
    } finally {
        btn.disabled = false;
        btn.innerText = 'Save Record';
        setTimeout(() => { msg.innerText = ''; }, 3000);
    }
});