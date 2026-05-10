const BASE_URL = 'https://transaction-management-vq47.onrender.com/api/v1';

// State Management
let currentToken = localStorage.getItem('token');
let userRole = 'VIEWER'; // Default. Will be updated from JWT.
let currentPage = 0;
let totalPages = 0;
const pageSize = 10;
let categoryChartInstance = null;
let monthlyChartInstance = null;

// --- UTILITIES & HTTP CLIENT ---

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}

function toggleLoader(show, message = 'Loading...') {
    const loader = document.getElementById('loader-overlay');
    const msg = document.getElementById('loader-msg');
    msg.textContent = message;
    if (show) loader.classList.remove('hidden');
    else loader.classList.add('hidden');
}

// Wrapper to handle API calls with JWT and Slow Server detection
async function apiCall(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (currentToken) headers['Authorization'] = `Bearer ${currentToken}`;

    const config = { ...options, headers };

    let isSlow = false;
    const slowTimer = setTimeout(() => {
        isSlow = true;
        toggleLoader(true, "Server is waking up, please wait...");
    }, 2000);

    toggleLoader(true);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        clearTimeout(slowTimer);
        toggleLoader(false);

        if (response.status === 401 || response.status === 403) {
            logout();
            throw new Error("unauthorized");
        }

        if (response.status === 204) return null; // Used for DELETE

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error("failed");
        }
        return data;
    } catch (error) {
        clearTimeout(slowTimer);
        toggleLoader(false);
        // Displaying a generic error message as requested
        showToast("An error occurred.", 'error');
        throw error;
    }
}

// Very basic JWT decode to grab the Role embedded in the token payload
function extractRoleFromToken(token) {
    if (!token) return 'VIEWER';
    try {
        const payloadStr = atob(token.split('.')[1]);
        const payload = JSON.parse(payloadStr);
        return payload.role || payload.roles || payload.authorities || 'VIEWER';
    } catch (e) {
        return 'VIEWER';
    }
}

// --- INITIALIZATION & AUTH ---

function init() {
    if (currentToken) {
        userRole = extractRoleFromToken(currentToken);
        showApp();
    } else {
        showAuth();
    }
}

function showAuth() {
    document.getElementById('auth-page').classList.remove('hidden');
    document.getElementById('app-page').classList.add('hidden');
}

function showApp() {
    document.getElementById('auth-page').classList.add('hidden');
    document.getElementById('app-page').classList.remove('hidden');
    document.getElementById('user-role-badge').textContent = `Role: ${userRole}`;
    applyRolePermissions();
    switchAppTab('transactions');
}

function logout() {
    localStorage.removeItem('token');
    currentToken = null;
    userRole = 'VIEWER';
    showAuth();
}

function switchAuthTab(tab) {
    document.getElementById('tab-login').classList.remove('active');
    document.getElementById('tab-register').classList.remove('active');
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');

    document.getElementById(`tab-${tab}`).classList.add('active');
    document.getElementById(`${tab}-form`).classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();
    const userName = document.getElementById('login-username').value;
    const userPassword = document.getElementById('login-password').value;

    try {
        const res = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ userName, userPassword })
        });
        if (res.token) {
            localStorage.setItem('token', res.token);
            currentToken = res.token;
            userRole = extractRoleFromToken(res.token);
            showToast("Login Successful");
            showApp();
        }
    } catch (err) { console.error("Login failed"); }
}

async function handleRegister(e) {
    e.preventDefault();
    const payload = {
        userName: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        userPassword: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value,
        status: "ACTIVE"
    };

    try {
        await apiCall('/signin', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Registration Successful");
        switchAuthTab('login');
    } catch (err) { console.error("Registration failed"); }
}

// --- UI / ROLE LOGIC ---

function applyRolePermissions() {
    // 1. Admin controls (Add/Edit/Delete buttons)
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if (userRole === 'ADMIN') el.classList.remove('hidden');
        else el.classList.add('hidden'); // Hidden for both Analyst and Viewer
    });

    // 2. Dashboard Analytics Access
    const analyticsNav = document.getElementById('nav-analytics');
    if (userRole === 'VIEWER') {
        analyticsNav.classList.add('hidden'); // Hide analytics tab for Viewer
    } else {
        analyticsNav.classList.remove('hidden'); // Show for Admin and Analyst
    }
}

function switchAppTab(tab) {
    // Prevent viewers from navigating to analytics programmatically
    if (tab === 'analytics' && userRole === 'VIEWER') {
        showToast("Access Denied", "error");
        return;
    }

    document.getElementById('nav-transactions').classList.remove('active');
    document.getElementById('nav-analytics').classList.remove('active');
    document.getElementById('transactions-tab').classList.add('hidden');
    document.getElementById('analytics-tab').classList.add('hidden');

    document.getElementById(`nav-${tab}`).classList.add('active');
    document.getElementById(`${tab}-tab`).classList.remove('hidden');

    if (tab === 'transactions') loadTransactions();
    if (tab === 'analytics') loadAnalytics();
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// --- TRANSACTIONS MODULE ---

async function loadTransactions() {
    const search = document.getElementById('search-keyword').value;
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;
    const start = document.getElementById('filter-start').value;
    const end = document.getElementById('filter-end').value;

    let queryParams = new URLSearchParams({ page: currentPage, size: pageSize, sortBy: 'recordDate', sortDir: 'DESC' });

    if (type) queryParams.append('type', type);
    if (category) queryParams.append('category', category);
    if (start) queryParams.append('startDate', start);
    if (end) queryParams.append('endDate', end);

    let endpoint = `/transactions?${queryParams.toString()}`;
    if (search) {
        queryParams.append('keyword', search);
        endpoint = `/transactions/search?${queryParams.toString()}`;
    }

    try {
        const data = await apiCall(endpoint);
        const transactions = Array.isArray(data) ? data : (data.content || []);
        renderTransactionsTable(transactions);

        if (transactions.length < pageSize && currentPage === 0) totalPages = 1;
        document.getElementById('page-info').textContent = `Page ${currentPage + 1}`;
        document.getElementById('btn-prev').disabled = currentPage === 0;
        document.getElementById('btn-next').disabled = transactions.length < pageSize;
    } catch (e) { console.error("Failed to load transactions"); }
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No transactions found</td></tr>';
        return;
    }

    transactions.forEach(tx => {
        const tr = document.createElement('tr');
        const typeClass = tx.type === 'INCOME' ? 'type-income' : 'type-expense';

        let actionsHtml = `<div class="menu-container">
            <button class="menu-btn">⋮</button>
            <div class="menu-content">
                <a onclick="viewTransaction(${tx.id})">View</a>`;

        // Only Admin gets Edit/Delete options in the menu
        if (userRole === 'ADMIN') {
            actionsHtml += `
                <a onclick="editTransaction(${tx.id})">Edit</a>
                <a onclick="deleteTransaction(${tx.id})" style="color:var(--error-color)">Delete</a>`;
        }
        actionsHtml += `</div></div>`;

        tr.innerHTML = `
            <td>${tx.recordDate}</td>
            <td class="${typeClass}"><b>${tx.type}</b></td>
            <td>${tx.category}</td>
            <td>$${tx.amount.toFixed(2)}</td>
            <td>${tx.description || '-'}</td>
            <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function changePage(direction) {
    currentPage += direction;
    if (currentPage < 0) currentPage = 0;
    loadTransactions();
}

function openTransactionModal(tx = null, isViewOnly = false) {
    document.getElementById('transaction-modal').classList.remove('hidden');
    const form = document.getElementById('transaction-form');
    const title = document.getElementById('modal-title');
    const actions = document.getElementById('modal-actions');

    form.reset();
    document.getElementById('tx-id').value = '';

    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => input.disabled = isViewOnly);

    if (isViewOnly) {
        title.textContent = "View Transaction";
        actions.classList.add('hidden');
    } else {
        actions.classList.remove('hidden');
        title.textContent = tx ? "Edit Transaction" : "Add Transaction";
    }

    if (tx) {
        document.getElementById('tx-id').value = tx.id;
        document.getElementById('tx-amount').value = tx.amount;
        document.getElementById('tx-type').value = tx.type;
        document.getElementById('tx-category').value = tx.category;
        document.getElementById('tx-date').value = tx.recordDate;
        document.getElementById('tx-desc').value = tx.description || '';
    }
}

async function viewTransaction(id) {
    try {
        const tx = await apiCall(`/transactions/${id}`);
        openTransactionModal(tx, true);
    } catch(e) {}
}

async function editTransaction(id) {
    try {
        const tx = await apiCall(`/transactions/${id}`);
        openTransactionModal(tx, false);
    } catch(e) {}
}

async function deleteTransaction(id) {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
        await apiCall(`/transactions/${id}`, { method: 'DELETE' });
        showToast("Transaction Deleted");
        loadTransactions();
    } catch(e) {}
}

async function saveTransaction(e) {
    e.preventDefault();
    const id = document.getElementById('tx-id').value;
    const payload = {
        amount: parseFloat(document.getElementById('tx-amount').value),
        type: document.getElementById('tx-type').value,
        category: document.getElementById('tx-category').value,
        recordDate: document.getElementById('tx-date').value,
        description: document.getElementById('tx-desc').value
    };

    try {
        if (id) {
            await apiCall(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify({id: parseInt(id), ...payload}) });
            showToast("Transaction Updated");
        } else {
            await apiCall(`/transactions`, { method: 'POST', body: JSON.stringify(payload) });
            showToast("Transaction Created");
        }
        closeModal('transaction-modal');
        loadTransactions();
    } catch(e) {}
}

// --- ANALYTICS MODULE ---

async function loadAnalytics() {
    try {
        const summary = await apiCall('/dashboard/summary');
        document.getElementById('sum-income').textContent = `$${summary.totalIncome.toFixed(2)}`;
        document.getElementById('sum-income').style.color = 'var(--secondary-color)';
        document.getElementById('sum-expenses').textContent = `$${summary.totalExpenses.toFixed(2)}`;
        document.getElementById('sum-expenses').style.color = 'var(--error-color)';
        document.getElementById('sum-balance').textContent = `$${summary.netBalance.toFixed(2)}`;

        const recent = await apiCall('/dashboard/recent');
        const list = document.getElementById('recent-list');
        list.innerHTML = '';
        recent.forEach(tx => {
            const li = document.createElement('li');
            const color = tx.type === 'INCOME' ? 'var(--secondary-color)' : 'var(--error-color)';
            li.innerHTML = `
                <span>${tx.category} (${tx.recordDate})</span>
                <strong style="color:${color}">${tx.type === 'INCOME' ? '+' : '-'}$${tx.amount.toFixed(2)}</strong>
            `;
            list.appendChild(li);
        });

        const categoryData = await apiCall('/dashboard/category');
        renderCategoryChart(categoryData);

        const trendData = await apiCall('/dashboard/monthly');
        renderMonthlyChart(trendData);

    } catch(e) { console.error("Failed to load analytics"); }
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const labels = data.map(d => d.category);
    const amounts = data.map(d => d.totalAmount);

    // Updated color array to accommodate more categories gracefully
    const colors = ['#bb86fc', '#03dac6', '#cf6679', '#ffb74d', '#4dd0e1', '#81c784', '#e57373', '#ba68c8'];

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: amounts, backgroundColor: colors, borderWidth: 0 }]
        },
        options: { responsive: true, plugins: { legend: { position: 'right', labels: { color: '#fff' } } } }
    });
}

function renderMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChartInstance) monthlyChartInstance.destroy();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = data.map(d => `${monthNames[d.month-1]} ${d.year}`);
    const profits = data.map(d => d.profit);

    monthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit',
                data: profits,
                borderColor: '#bb86fc',
                backgroundColor: 'rgba(187, 134, 252, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { ticks: { color: '#b3b3b3' }, grid: { color: '#333' } },
                y: { ticks: { color: '#b3b3b3' }, grid: { color: '#333' } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

// Bootstrap
window.onload = init;