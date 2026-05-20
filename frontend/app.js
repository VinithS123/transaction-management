const BASE_URL = 'https://transaction-management-vq47.onrender.com/api/v1';

// State Management
let currentToken = localStorage.getItem('token');
let userRole = 'VIEWER';
let currentPage = 0;
let totalPages = 0;
const pageSize = 10;
let categoryChartInstance = null;
let monthlyChartInstance = null;
let activeTransactionMenu = null;

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

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function hasAnalyticsAccess() {
    return userRole === 'ADMIN' || userRole === 'ANALYST';
}

function hasDashboardAccess() {
    return userRole === 'ADMIN' || userRole === 'ANALYST' || userRole === 'VIEWER';
}

function isAdmin() {
    return userRole === 'ADMIN';
}

function normalizeRole(value) {
    return String(value ?? 'VIEWER')
        .replace(/^ROLE_/i, '')
        .trim()
        .toUpperCase();
}

function decodeJwtPayload(token) {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
        return JSON.parse(atob(padded));
    } catch (e) {
        console.error("Failed to decode token:", e);
        return null;
    }
}

function isTokenExpired(token) {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return false;
    return payload.exp * 1000 <= Date.now();
}

function formatCurrency(value) {
    const amount = Number(value);
    return `$${Number.isFinite(amount) ? amount.toFixed(2) : '0.00'}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Core API wrapper.
 * Includes 'silent403' option to prevent annoying toasts during background fetches/filters.
 */
async function apiCall(endpoint, options = {}) {
    const { silent403, ...fetchOptions } = options;
    const headers = { 'Content-Type': 'application/json', ...fetchOptions.headers };

    const isAuthRoute = endpoint.includes('/login') || endpoint.includes('/signin');

    if (currentToken && !isAuthRoute) {
        if (isTokenExpired(currentToken)) {
            logout();
            throw new Error("Session expired. Please login again.");
        }

        headers['Authorization'] = `Bearer ${currentToken}`;
    }

    const config = { ...fetchOptions, headers };

    const slowTimer = setTimeout(() => {
        toggleLoader(true, "Server is waking up, please wait...");
    }, 2500);

    toggleLoader(true);

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        clearTimeout(slowTimer);
        toggleLoader(false);

        // 401 = invalid/expired token -> clear session
        if (response.status === 401 && !isAuthRoute) {
            logout();
            throw new Error("Session expired. Please login again.");
        }

        // 403 = forbidden -> flag the error
        if (response.status === 403 && !isAuthRoute) {
            const error = new Error("Access denied. You don't have permission for this action.");
            error.status = 403;
            throw error;
        }

        if (response.status === 204) return null;

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMsg = data.message || data.error || data.details || `Server Error: ${response.status}`;
            throw new Error(errorMsg);
        }

        return data;
    } catch (error) {
        clearTimeout(slowTimer);
        toggleLoader(false);

        // If it's a 403 and we specifically asked to silence it (e.g., filter changes)
        if (error.status === 403 && silent403) {
            console.warn(`403 Forbidden suppressed for endpoint: ${endpoint}`);
        } else {
            // Show toast for all other errors, or for 403s on direct actions (like Save/Delete)
            showToast(error.message, 'error');
        }

        throw error;
    }
}

/**
 * Extracts the user role from the JWT token.
 * Safely handles string, array, and object formats (e.g., from Spring Boot).
 */
function extractRoleFromToken(token) {
    if (!token) return 'VIEWER';
    try {
        const payload = decodeJwtPayload(token);
        if (!payload) return 'VIEWER';

        // Find the role field (different frameworks use different standard names)
        let r = payload.role || payload.roles || payload.authorities || 'VIEWER';

        // If it's an array (e.g., ["ROLE_ADMIN"] or [{"authority": "ROLE_ADMIN"}]), grab the first item
        if (Array.isArray(r)) {
            r = r[0];
        }

        // If it's an object (e.g., Spring Boot's { authority: "ROLE_ADMIN" }), extract the text value
        if (typeof r === 'object' && r !== null) {
            r = r.authority || r.name || r.role || r.value || 'VIEWER';
        }

        return normalizeRole(r);
    } catch (e) {
        console.error("Failed to parse token role:", e);
        return 'VIEWER';
    }
}

// --- INITIALIZATION & AUTH ---

function init() {
    setupDynamicFilters();

    if (currentToken) {
        if (isTokenExpired(currentToken)) {
            showToast("Session expired. Please login again.", "error");
            logout();
            return;
        }

        userRole = extractRoleFromToken(currentToken);
        showApp();
    } else {
        showAuth();
    }
}

function setupDynamicFilters() {
    const searchInput = document.getElementById('search-keyword');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 0;
            loadTransactions();
        }, 500));
    }

    const filterIds = ['filter-type', 'filter-category', 'filter-start', 'filter-end'];
    filterIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => {
                currentPage = 0;
                loadTransactions();
            });
        }
    });
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

    currentToken = null;
    localStorage.removeItem('token');

    const userName = document.getElementById('login-username').value;
    const userPassword = document.getElementById('login-password').value;

    try {
        const res = await apiCall('/login', {
            method: 'POST',
            body: JSON.stringify({ userName, userPassword })
        });

        if (!res || !res.token) {
            showToast("Login failed: no token received.", 'error');
            return;
        }

        localStorage.setItem('token', res.token);
        currentToken = res.token;
        userRole = extractRoleFromToken(res.token);

        showToast("Login Successful");
        showApp();

    } catch (err) {
        console.error("Login process failed", err);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const companyId = Number(document.getElementById('reg-company-id').value);
    const payload = {
        userName: document.getElementById('reg-username').value,
        email: document.getElementById('reg-email').value,
        companyId,
        userPassword: document.getElementById('reg-password').value,
        role: document.getElementById('reg-role').value,
        status: "ACTIVE"
    };

    if (!Number.isInteger(companyId) || companyId <= 0) {
        showToast("Company ID must be a positive number.", "error");
        return;
    }

    try {
        await apiCall('/signin', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        showToast("Registration Successful! Please login.");
        switchAuthTab('login');
    } catch (err) {
        console.error("Registration process failed", err);
    }
}

// --- UI / ROLE LOGIC ---

function applyRolePermissions() {
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        if (isAdmin()) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });

    const analyticsNav = document.getElementById('nav-analytics');
    if (hasDashboardAccess()) {
        analyticsNav.classList.remove('hidden');
    } else {
        analyticsNav.classList.add('hidden');
    }

    const analyticsElements = document.querySelectorAll('.analytics-only');
    analyticsElements.forEach(el => {
        if (hasAnalyticsAccess()) el.classList.remove('hidden');
        else el.classList.add('hidden');
    });
}

function switchAppTab(tab) {
    if (tab === 'analytics' && !hasDashboardAccess()) {
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

function closeTransactionMenu() {
    if (activeTransactionMenu) {
        activeTransactionMenu.remove();
        activeTransactionMenu = null;
    }
}

function toggleTransactionMenu(event, id) {
    event.stopPropagation();
    closeTransactionMenu();

    const menu = document.createElement('div');
    menu.className = 'menu-content menu-content-floating';
    menu.innerHTML = `<button type="button" onclick="viewTransaction(${id})">View</button>`;

    if (isAdmin()) {
        menu.innerHTML += `
            <button type="button" onclick="editTransaction(${id})">Edit</button>
            <button type="button" class="danger-action" onclick="deleteTransaction(${id})">Delete</button>`;
    }

    document.body.appendChild(menu);

    const buttonRect = event.currentTarget.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const margin = 8;
    const left = Math.min(
        Math.max(margin, buttonRect.right - menuRect.width),
        window.innerWidth - menuRect.width - margin
    );
    const belowTop = buttonRect.bottom + margin;
    const top = belowTop + menuRect.height > window.innerHeight - margin
        ? Math.max(margin, buttonRect.top - menuRect.height - margin)
        : belowTop;

    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    activeTransactionMenu = menu;
}

// --- TRANSACTIONS MODULE ---

async function loadTransactions() {
    const search = document.getElementById('search-keyword').value.trim();
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;
    const start = document.getElementById('filter-start').value;
    const end = document.getElementById('filter-end').value;

    let queryParams = new URLSearchParams({
        page: currentPage,
        size: pageSize,
        sortBy: 'recordDate',
        sortDir: 'DESC'
    });

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
        // Pass silent403: true to stop toast popups on filter changes
        const data = await apiCall(endpoint, { silent403: true });
        const transactions = Array.isArray(data) ? data : (data?.content || []);
        renderTransactionsTable(transactions);

        document.getElementById('page-info').textContent = `Page ${currentPage + 1}`;
        document.getElementById('btn-prev').disabled = currentPage === 0;
        document.getElementById('btn-next').disabled = transactions.length < pageSize;
    } catch (e) {
        console.error("Data load failed", e);
        // Safely clear table if the user is completely restricted
        renderTransactionsTable([]);
    }
}

function renderTransactionsTable(transactions) {
    const tbody = document.getElementById('transactions-body');
    tbody.innerHTML = '';

    if (!transactions || transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">No transactions found</td></tr>';
        return;
    }

    transactions.forEach(tx => {
        const tr = document.createElement('tr');
        const typeClass = tx.type === 'INCOME' ? 'type-income' : 'type-expense';
        const txId = Number(tx.id);
        const safeId = Number.isFinite(txId) ? txId : '';

        const actionsHtml = `<div class="menu-container">
            <button type="button" class="menu-btn" aria-label="Transaction actions" onclick="toggleTransactionMenu(event, ${safeId})">&#8942;</button>
        </div>`;

        tr.innerHTML = `
            <td>${escapeHtml(tx.recordDate || '-')}</td>
            <td class="${typeClass}"><b>${escapeHtml(tx.type || '-')}</b></td>
            <td>${escapeHtml(tx.category || '-')}</td>
            <td>${formatCurrency(tx.amount)}</td>
            <td>${escapeHtml(tx.description || '-')}</td>
            <td>${actionsHtml}</td>
        `;
        tbody.appendChild(tr);
    });
}

function changePage(direction) {
    closeTransactionMenu();
    currentPage += direction;
    if (currentPage < 0) currentPage = 0;
    loadTransactions();
}

function openTransactionModal(tx = null, isViewOnly = false) {
    if (!isViewOnly && !isAdmin()) {
        showToast("Only admins can add or edit transactions.", "error");
        return;
    }

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
    closeTransactionMenu();
    try {
        const tx = await apiCall(`/transactions/${id}`);
        openTransactionModal(tx, true);
    } catch(e) {}
}

async function editTransaction(id) {
    closeTransactionMenu();
    try {
        const tx = await apiCall(`/transactions/${id}`);
        openTransactionModal(tx, false);
    } catch(e) {}
}

async function deleteTransaction(id) {
    closeTransactionMenu();
    if (!confirm("Confirm Delete?")) return;
    try {
        await apiCall(`/transactions/${id}`, { method: 'DELETE' });
        showToast("Transaction Deleted");
        loadTransactions();
    } catch(e) {}
}

async function saveTransaction(e) {
    e.preventDefault();
    if (!isAdmin()) {
        showToast("Only admins can save transactions.", "error");
        return;
    }

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
            await apiCall(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify({ id: parseInt(id), ...payload }) });
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
        // Passed silent403: true to stop toast popups
        const summary = await apiCall('/dashboard/summary', { silent403: true });
        if(summary) {
            document.getElementById('sum-income').textContent = formatCurrency(summary.totalIncome);
            document.getElementById('sum-expenses').textContent = formatCurrency(summary.totalExpenses);
            document.getElementById('sum-balance').textContent = formatCurrency(summary.netBalance);
        }

        const recent = await apiCall('/dashboard/recent', { silent403: true });
        const list = document.getElementById('recent-list');
        list.innerHTML = '';
        if(recent) {
            recent.forEach(tx => {
                const li = document.createElement('li');
                const color = tx.type === 'INCOME' ? 'var(--secondary-color)' : 'var(--error-color)';
                li.innerHTML = `
                    <span>${escapeHtml(tx.category || '-')} (${escapeHtml(tx.recordDate || '-')})</span>
                    <strong style="color:${color}">${tx.type === 'INCOME' ? '+' : '-'}${formatCurrency(tx.amount)}</strong>
                `;
                list.appendChild(li);
            });
        }

        if (!hasAnalyticsAccess()) {
            return;
        }

        const categoryData = await apiCall('/dashboard/category', { silent403: true });
        if(categoryData) renderCategoryChart(categoryData);

        const trendData = await apiCall('/dashboard/monthly', { silent403: true });
        if(trendData) renderMonthlyChart(trendData);

    } catch(e) { console.error("Analytics load failed", e); }
}

function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (categoryChartInstance) categoryChartInstance.destroy();

    const labels = data.map(d => d.category);
    const amounts = data.map(d => Number(d.totalAmount) || 0);
    const colors = ['#bb86fc', '#03dac6', '#cf6679', '#ffb74d', '#4dd0e1', '#81c784', '#e57373', '#ba68c8'];

    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: amounts, backgroundColor: colors, borderWidth: 0 }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'right', labels: { color: '#fff' } } }
        }
    });
}

function renderMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart').getContext('2d');
    if (monthlyChartInstance) monthlyChartInstance.destroy();

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const labels = data.map(d => `${monthNames[d.month - 1] || 'Month'} ${d.year || ''}`.trim());
    const profits = data.map(d => Number(d.profit) || 0);

    monthlyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Profit',
                data: profits,
                borderColor: '#bb86fc',
                backgroundColor: 'rgba(187, 134, 252, 0.1)',
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
document.addEventListener('click', closeTransactionMenu);
window.addEventListener('resize', closeTransactionMenu);
window.addEventListener('scroll', closeTransactionMenu, true);
window.onload = init;
