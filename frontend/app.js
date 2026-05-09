const BASE_URL = 'https://transaction-management-vq47.onrender.com/api/v1';

// DOM Elements
const authView = document.getElementById('auth-view');
const dashboardView = document.getElementById('dashboard-view');

// Auth DOM Elements
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');

// Transaction DOM Elements
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
    authView.classList.add('active');
    dashboardView.classList.remove('active');
}

function showDashboard() {
    authView.classList.remove('active');
    dashboardView.classList.add('active');
    loadDashboardData();
}

// Tab Switching Logic
tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.add('active');
    loginForm.classList.remove('active');
});

// Fetch Helper (Automatically attaches JWT)
function getHeaders() {
    const token = localStorage.getItem('jwt');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// --- REGISTRATION LOGIC ---
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgElement = document.getElementById('reg-msg');

    const payload = {
        userName: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        userPassword: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value,
        status: "ACTIVE" // Defaulting to ACTIVE based on your Swagger Schema
    };

    try {
        const response = await fetch(`${BASE_URL}/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Registration failed. Username or email might be taken.');
        }

        // Success
        msgElement.className = 'msg success-msg';
        msgElement.innerText = 'Account created successfully! Please log in.';
        registerForm.reset();

        // Auto-switch to login tab after 2 seconds
        setTimeout(() => {
            tabLogin.click();
            msgElement.innerText = '';
        }, 2000);

    } catch (error) {
        msgElement.className = 'msg error-msg';
        msgElement.innerText = error.message;
    }
});

// --- LOGIN LOGIC ---
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userName = document.getElementById('login-username').value;
    const userPassword = document.getElementById('login-password').value;
    const msgElement = document.getElementById('login-msg');

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userName, userPassword })
        });

        if (!response.ok) throw new Error('Invalid credentials');

        const data = await response.json();
        localStorage.setItem('jwt', data.token);
        msgElement.innerText = '';
        loginForm.reset();
        showDashboard();
    } catch (error) {
        msgElement.innerText = 'Login failed. Please check your credentials.';
    }
});

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('jwt');
    showAuthView();
});

// --- DASHBOARD DATA ---
async function loadDashboardData() {
    try {
        // Fetch Summary
        const summaryRes = await fetch(`${BASE_URL}/dashboard/summary`, { headers: getHeaders() });
        if (summaryRes.status === 401) return logoutBtn.click(); // Token expired
        const summary = await summaryRes.json();

        document.getElementById('total-income').innerText = `$${summary.totalIncome.toFixed(2)}`;
        document.getElementById('total-expenses').innerText = `$${summary.totalExpenses.toFixed(2)}`;
        document.getElementById('net-balance').innerText = `$${summary.netBalance.toFixed(2)}`;

        // Fetch Recent Transactions
        const recentRes = await fetch(`${BASE_URL}/dashboard/recent`, { headers: getHeaders() });
        const recentTxs = await recentRes.json();

        renderTransactions(recentTxs);
    } catch (error) {
        console.error("Error loading dashboard data:", error);
    }
}

function renderTransactions(transactions) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = ''; // Clear current rows

    transactions.forEach(tx => {
        const tr = document.createElement('tr');
        const typeClass = tx.type === 'INCOME' ? 'type-income' : 'type-expense';

        tr.innerHTML = `
            <td>${tx.recordDate}</td>
            <td>${tx.description || '-'}</td>
            <td>${tx.category}</td>
            <td class="${typeClass}">${tx.type}</td>
            <td>$${tx.amount.toFixed(2)}</td>
        `;
        tbody.appendChild(tr);
    });
}

// --- ADD TRANSACTION ---
transactionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msgElement = document.getElementById('tx-msg');

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

        if (response.ok) {
            msgElement.className = 'msg success-msg';
            msgElement.innerText = 'Transaction added!';
            transactionForm.reset();
            loadDashboardData(); // Refresh data
        } else {
            throw new Error('Failed to add transaction');
        }
    } catch (error) {
        msgElement.className = 'msg error-msg';
        msgElement.innerText = error.message;
    }

    setTimeout(() => { msgElement.innerText = ''; }, 3000);
});