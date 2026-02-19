// =================================================================================
// == المنطق الأساسي لتطبيق الصفحة الواحدة (SPA) ==
// =================================================================================

/**
 * دالة لقراءة المعلمات من رابط المتصفح (مثل #supplier-details?id=1&name=...)
 */
function getHashParams() {
    const hash = window.location.hash.substring(1); // إزالة #
    const params = {};
    if (hash.includes('?')) {
        const [page, queryString] = hash.split('?');
        const pairs = queryString.split('&');
        pairs.forEach(pair => {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        });
        return { page, params };
    }
    return { page: hash, params: {} };
}

/**
 * دالة لتحديث رابط المتصفح بدون إعادة تحميل الصفحة
 */
const updateBrowserUrl = (page, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `#${page}?${queryString}` : `#${page}`;
    history.pushState({ page, params }, '', url);
};

/**
 * دالة لعرض مؤشر التحميل أثناء جلب محتوى الصفحة
 */
const showLoading = () => {
    const contentArea = document.getElementById("page-content");
    contentArea.innerHTML = `
        <div class="flex justify-center items-center h-64">
            <div class="text-center">
                <i class="ri-loader-4-line animate-spin text-4xl text-primary"></i>
                <p class="mt-2 text-gray-500">جاري التحميل...</p>
            </div>
        </div>
    `;
};

/**
 * الدالة الرئيسية لتحميل الصفحات ديناميكياً
 */
async function loadPage(page, params = {}) {
    updateBrowserUrl(page, params);
    showLoading();

    try {
        const response = await fetch(`pages/${page}.html`);
        if (!response.ok) {
            throw new Error(`الصفحة غير موجودة (${response.status})`);
        }

        const html = await response.text();
        document.getElementById("page-content").innerHTML = html;

        // تحديث العنوان العلوي للصفحات الفرعية
        if (page.startsWith('employee-details') || page.startsWith('supplier-details') || page.startsWith('customer-details')) {
            document.getElementById("section-sub").textContent = "تفاصيل";
        } else {
            updateHeader(page);
        }

        updateFloatingButton(page, params);
        highlightNav(page.replace(/-.*/, '')); // تظليل القائمة الرئيسية
        initializePageScripts(page, params);

    } catch (error) {
        console.error("Failed to load page:", error);
        document.getElementById("page-content").innerHTML = `
            <div class="flex justify-center items-center h-64">
                <div class="text-center text-red-500">
                    <i class="ri-error-warning-line text-4xl"></i>
                    <p class="mt-2">عذراً، حدث خطأ ما.</p>
                    <p class="text-sm">${error.message}</p>
                </div>
            </div>
        `;
    }
}

/**
 * دالة لتهيئة الأكواد البرمجية الخاصة بكل صفحة بعد تحميلها
 */
function initializePageScripts(page, params) {
    // إزالة مستمعي الأحداث القديمة لتجنب التكرار
    document.querySelectorAll('.modal-close-btn').forEach(btn => {
        btn.removeEventListener('click', globalModalCloseHandler);
    });
    // إضافة مستمع حدث عام لإغلاق النوافذ المنبثقة
    document.addEventListener('click', globalModalCloseHandler);

    switch (page) {
        case 'customers':
            initCustomersPage();
            break;
        case 'customer-details':
            initCustomerDetailsPage(params);
            break;
        case 'employees':
            initEmployeesPage();
            break;
        case 'employee-details':
            initEmployeeDetailsPage(params);
            break;
        case 'suppliers':
            initSuppliersPage();
            break;
        case 'supplier-details':
            initSupplierDetailsPage(params);
            break;
    }
}

/**
 * مستمع حدث عام لإغلاق أي نافذة منبثقة
 */
const globalModalCloseHandler = (e) => {
    if (e.target.matches('.modal-close-btn')) {
        hideModal(e.target.dataset.modal);
    }
};

// =================================================================================
// == دوال الواجهة العامة (UI Functions) ==
// =================================================================================

function updateHeader(page) {
    const sub = document.getElementById("section-sub");
    const names = {
        customers: "إدارة العملاء",
        employees: "إدارة الموظفين",
        suppliers: "إدارة الموردين",
        reports: "التقارير",
        settings: "الإعدادات",
      };
    if (sub) sub.textContent = names[page];
}

function updateFloatingButton(page, params = {}) {
    const fab = document.getElementById("fab-btn");
    const fabIcon = document.getElementById("fab-icon");
    if (!fab || !fabIcon) return;

    let action;
    if (page === 'employee-details') {
        action = () => {
            document.getElementById('advance-employee-input').value = params.name;
            showModal('advanceModal');
        };
    } else if (page === 'supplier-details') {
        action = () => {
            document.getElementById('transaction-supplier-input').value = params.name;
            showModal('transactionModal');
        };
    } else if (page === 'customer-details') {
        action = () => {
            document.getElementById('transaction-customer-input').value = params.name;
            showModal('transactionModal');
        };
    } else {
        const actions = {
            customers: () => showModal('addCustomerModal'),
            employees: () => showModal('advanceModal'),
            suppliers: () => toggleQuickActionsMenu(),
            reports: () => alert("إنشاء تقرير"),
            settings: () => alert("رفع نسخة احتياطية"),
        };
        action = actions[page];
    }

    const icons = {
        customers: "ri-user-add-fill",
        employees: "ri-hand-coin-fill",
        'employee-details': "ri-hand-coin-fill",
        suppliers: "ri-add-fill",
        'supplier-details': "ri-shopping-cart-fill",
        'customer-details': "ri-add-circle-fill",
        reports: "ri-file-chart-fill",
        settings: "ri-upload-cloud-2-fill",
    };
    
    fabIcon.className = `text-2xl ${icons[page]}`;
    fab.onclick = action;
}

function highlightNav(page) {
    document.querySelectorAll(".nav-item").forEach((btn) => {
        btn.classList.remove("text-primary");
        btn.classList.add("text-gray-500");
    });
    const activeBtn = document.getElementById(`nav-${page}`);
    if (activeBtn) {
        activeBtn.classList.remove("text-gray-500");
        activeBtn.classList.add("text-primary");
    }
}

window.addEventListener('popstate', () => {
    const { page, params } = getHashParams();
    loadPage(page, params);
});

// =================================================================================
// == دوال النوافذ المنبثقة المشتركة ==
// =================================================================================

function showModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal.querySelector('.transform');
    if (modal && content) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        }, 10);
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal.querySelector('.transform');
    if (modal && content) {
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        }, 300);
    }
}

// =================================================================================
// == قواعد بيانات وهمية (Mock Databases) ==
// =================================================================================

let employeeAdvances = {
    "أحمد محمد العلي": [
        { amount: 500, date: "2024-11-01", notes: "لأغراض شخصية" },
        { amount: 200, date: "2024-11-10", notes: "طارئ طبي" }
    ],
    "فاطمة أحمد السالم": []
};
let currentEmployeeName = null;

let supplierTransactions = {
    "supplier1": [
        { type: 'purchase', amount: 1500, date: "2024-11-01", details: "خضروات متنوعة" },
        { type: 'payment', amount: 500, date: "2024-11-05", details: "دفعة جزئية" },
        { type: 'purchase', amount: 950, date: "2024-11-10", details: "فواكه موسمية" }
    ],
    "supplier2": [
        { type: 'purchase', amount: 2200, date: "2024-11-02", details: "لحوم حمراء وبيضاء" },
        { type: 'payment', amount: 2200, date: "2024-11-03", details: "تسديد كامل" }
    ]
};
let currentSupplierId = null;

let customerTransactions = {
    "أحمد محمد العلي": [
        { type: 'debt', amount: 150, date: "2024-11-01", details: "شاورما وبيتزا" },
        { type: 'debt', amount: 300, date: "2024-11-05", details: "مشروبات متنوعة" },
        { type: 'payment', amount: 200, date: "2024-11-10", details: "دفعة جزئية" }
    ],
    "فاطمة أحمد السالم": []
};
let currentCustomerName = null;


// =================================================================================
// == منطق صفحة العملاء ==
// =================================================================================

const menuItems = ["شاي", "شاورما", "شربة", "عصير", "برجر", "بيتزا", "مياه", "حمص", "فلافل", "كشري"];
let currentInvoiceItems = [];
// --- Page-Specific Logic (Customers) ---
function initCustomersPage() {
    // ربط أزرار الإضافة والمعاملات
    document.getElementById('add-customer-btn')?.addEventListener('click', () => showModal('addCustomerModal'));
    document.getElementById('add-transaction-btn')?.addEventListener('click', () => {
        document.getElementById('selected-customer-display').innerHTML = '<span class="text-gray-500">اختر العميل</span>';
        showModal('transactionModal');
    });

    // البحث والفلترة
    const searchInput = document.getElementById('customer-search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.customer-card').forEach(card => {
            const name = card.dataset.customerName.toLowerCase();
            card.style.display = name.includes(searchTerm) ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-600');
            });
            btn.classList.remove('bg-gray-100', 'text-gray-600');
            btn.classList.add('bg-primary', 'text-white');
            console.log('Filter by:', btn.dataset.filter);
        });
    });

    // --- التعديل الأهم هنا ---
    // ربط النقر على بطاقة العميل للانتقال إلى صفحة التفاصيل
    document.querySelectorAll('.customer-card').forEach(card => {
        card.addEventListener('click', () => {
            const customerName = card.dataset.customerName;
            const customerBalance = card.dataset.customerBalance;
            loadPage('customer-details', { name: customerName, balance: customerBalance });
        });
    });
}

// --- (Keep all other logic from previous steps for employees and suppliers) ---
// --- Employees logic ---
function initEmployeesPage() { /* ... same as before ... */ }
function initEmployeeDetailsPage(params) { /* ... same as before ... */ }
function saveAdvanceOnDetailsPage() { /* ... same as before ... */ }
function saveNewEmployee() { /* ... same as before ... */ }
function showSalaryReport() { /* ... same as before ... */ }
function showPayrollReport() { /* ... same as before ... */ }

// --- Suppliers logic ---
function initSuppliersPage() { /* ... same as before ... */ }
function initSupplierDetailsPage(params) { /* ... same as before ... */ }
function savePurchaseOnDetailsPage() { /* ... same as before ... */ }
function toggleQuickActionsMenu() { /* ... same as before ... */ }

// --- Placeholder Action Functions ---
function saveNewCustomer() {
    hideModal('addCustomerModal');
    alert('تم حفظ العميل الجديد بنجاح!');
}

function saveTransaction() {
    const customer = document.getElementById('selected-customer-display').textContent.trim();
    const type = document.querySelector('.transaction-type-btn.bg-red-100')?.textContent.trim() || 'دين';
    
    if (!customer || customer === 'اختر العميل') {
        alert('يرجى اختيار العميل');
        return;
    }

    console.log('Transaction Data:', { customer, type });
    alert(`تم حفظ معاملة "${type}" للعميل ${customer} بنجاح.`);
    hideModal('transactionModal');
}

// --- (Keep all other placeholder functions) ---

function initInvoiceModal() {
    const searchInput = document.getElementById('item-search-input');
    const dropdown = document.getElementById('autocomplete-dropdown');
    if (!searchInput || !dropdown) return;

    searchInput.addEventListener('input', (e) => {
        const value = e.target.value.toLowerCase().trim();
        dropdown.innerHTML = '';
        if (value.length === 0) { dropdown.classList.add('hidden'); return; }

        const filteredItems = menuItems.filter(item => item.toLowerCase().includes(value));
        if (filteredItems.length > 0) {
            dropdown.classList.remove('hidden');
            filteredItems.forEach(item => {
                const div = document.createElement('div');
                div.className = 'px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm';
                div.textContent = item;
                div.addEventListener('click', () => {
                    addInvoiceItem(item);
                    searchInput.value = '';
                    dropdown.classList.add('hidden');
                });
                dropdown.appendChild(div);
            });
        } else {
            dropdown.classList.add('hidden');
        }
    });

    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}

function addInvoiceItem(itemName) {
    if (!currentInvoiceItems.includes(itemName)) {
        currentInvoiceItems.push(itemName);
        updateSelectedItemsList();
    }
}

function removeInvoiceItem(itemName) {
    currentInvoiceItems = currentInvoiceItems.filter(item => item !== itemName);
    updateSelectedItemsList();
}

function updateSelectedItemsList() {
    const list = document.getElementById('selected-items-list');
    if (currentInvoiceItems.length === 0) {
        list.innerHTML = '<li class="text-gray-400 text-sm text-center">لم تتم إضافة أي منتجات بعد</li>';
    } else {
        list.innerHTML = currentInvoiceItems.map(item => `
            <li class="flex justify-between items-center bg-gray-50 rounded-lg p-2">
                <span class="text-sm">${item}</span>
                <button onclick="removeInvoiceItem('${item}')" class="text-red-500 hover:text-red-700">
                    <i class="ri-delete-bin-line"></i>
                </button>
            </li>
        `).join('');
    }
}

// =================================================================================
// == منطق صفحة الموظفين ==
// =================================================================================

function initEmployeesPage() {
    document.getElementById('add-employee-btn')?.addEventListener('click', () => showModal('addEmployeeModal'));
    document.getElementById('salary-report-btn')?.addEventListener('click', () => showSalaryReport());
    document.getElementById('payroll-btn')?.addEventListener('click', () => showPayrollReport());

    document.querySelectorAll('.employee-card').forEach(card => {
        card.addEventListener('click', () => {
            const employeeName = card.dataset.employeeName;
            loadPage('employee-details', { name: employeeName });
        });
    });
}

function initEmployeeDetailsPage(params) {
    currentEmployeeName = params.name;
    const salary = parseInt(document.querySelector(`.employee-card[data-employee-name="${currentEmployeeName}"]`)?.dataset.salary) || 0;
    const advances = employeeAdvances[currentEmployeeName] || [];
    const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);
    const remaining = salary - totalAdvances;

    // Update page content
    document.getElementById('details-page-employee-name').textContent = `تفاصيل: ${currentEmployeeName}`;
    document.getElementById('details-page-salary').textContent = `${salary} ر.س`;
    document.getElementById('details-page-total-advances').textContent = `${totalAdvances} ر.س`;
    document.getElementById('details-page-remaining').textContent = `${remaining} ر.س`;

    // Update transactions list
    const transactionsList = document.getElementById('details-page-transactions-list');
    if (advances.length === 0) {
        transactionsList.innerHTML = '<li class="text-gray-400 text-sm text-center p-4 bg-gray-50 rounded-lg">لا توجد عمليات مسجلة</li>';
    } else {
        transactionsList.innerHTML = advances.map(adv => `
            <li class="bg-white rounded-xl p-4 shadow-sm border">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-medium text-gray-800">سلفة</p>
                        <p class="text-xs text-gray-500">${adv.notes || 'بدون ملاحظات'} - ${adv.date}</p>
                    </div>
                    <span class="text-sm font-bold text-orange-600">${adv.amount} ر.س</span>
                </div>
            </li>
        `).join('');
    }

    // Setup button listeners
    document.getElementById('back-to-employees-btn').onclick = () => loadPage('employees');
    document.getElementById('record-advance-btn').onclick = () => {
        document.getElementById('advance-employee-input').value = currentEmployeeName;
        showModal('advanceModal');
    };
    document.getElementById('settle-salary-btn').onclick = () => {
        if (confirm(`هل أنت متأكد من تسديد راتب "${currentEmployeeName}" بالكامل؟ سيتم مسح جميع السلفات المسجلة.`)) {
            employeeAdvances[currentEmployeeName] = [];
            alert(`تم تسديد راتب ${currentEmployeeName} بنجاح.`);
            loadPage('employee-details', { name: currentEmployeeName });
        }
    };
}

// =================================================================================
// == منطق صفحة الموردين ==
// =================================================================================

function initSuppliersPage() {
    document.getElementById('fab-btn').onclick = toggleQuickActionsMenu;
    document.getElementById('quick-add-supplier-btn').onclick = () => { toggleQuickActionsMenu(); showModal('addSupplierModal'); };
    document.getElementById('quick-add-purchase-btn').onclick = () => { toggleQuickActionsMenu(); quickAddPurchase(); };
    document.getElementById('quick-add-payment-btn').onclick = () => { toggleQuickActionsMenu(); quickAddPayment(); };

    document.getElementById('add-supplier-form').addEventListener('submit', (e) => {
        e.preventDefault();
        console.log('Saving supplier...');
        hideModal('addSupplierModal');
        alert('تم حفظ المورد الجديد بنجاح!');
        e.target.reset();
    });

    const searchInput = document.getElementById('supplier-search-input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.supplier-card').forEach(card => {
            const name = card.dataset.supplierName.toLowerCase();
            card.style.display = name.includes(searchTerm) ? 'block' : 'none';
        });
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => {
                b.classList.remove('bg-primary', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-600');
            });
            btn.classList.remove('bg-gray-100', 'text-gray-600');
            btn.classList.add('bg-primary', 'text-white');
            console.log('Filter by:', btn.dataset.filter);
        });
    });

    document.querySelectorAll('.supplier-card').forEach(card => {
        card.addEventListener('click', () => {
            const supplierId = card.dataset.supplierId;
            const supplierName = card.dataset.supplierName;
            loadPage('supplier-details', { id: supplierId, name: supplierName });
        });
    });
}


function toggleQuickActionsMenu() {
    const menu = document.getElementById('quickActionsMenu');
    menu.classList.toggle('hidden');
}

// =================================================================================
// == منطق صفحة تفاصيل المورد (المحدثة والآمنة) ==
// =================================================================================

function initSupplierDetailsPage(params) {
    console.log('Initializing supplier details page for:', params.name);

    currentSupplierId = params.id;
    const transactions = supplierTransactions[currentSupplierId] || [];

    const totalPurchases = transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
    const remaining = totalPurchases - totalPayments;

    // Update page content
    document.getElementById('details-page-supplier-name').textContent = params.name;
    document.getElementById('details-page-total-purchases').textContent = `${totalPurchases} ر.س`;
    document.getElementById('details-page-total-payments').textContent = `${totalPayments} ر.س`;
    document.getElementById('details-page-remaining').textContent = `${remaining} ر.س`;

    // Update transactions list
    const transactionsList = document.getElementById('details-page-transactions-list');
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<li class="text-gray-400 text-sm text-center p-4 bg-gray-50 rounded-lg">لا توجد معاملات مسجلة</li>';
    } else {
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        transactionsList.innerHTML = transactions.map(t => `
            <li class="bg-white rounded-xl p-4 shadow-sm border">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-medium text-gray-800">${t.type === 'purchase' ? 'مشتراة' : 'دفعة'}</p>
                        <p class="text-xs text-gray-500">${t.details || 'بدون تفاصيل'} - ${t.date}</p>
                    </div>
                    <span class="text-sm font-bold ${t.type === 'purchase' ? 'text-red-600' : 'text-green-600'}">${t.type === 'purchase' ? '+' : '-'}${t.amount} ر.س</span>
                </div>
            </li>
        `).join('');
    }

    // --- Robust Event Listener Attachment ---
    const backBtn = document.getElementById('back-to-suppliers-btn');
    const addPurchaseBtn = document.getElementById('add-purchase-btn');
    const addPaymentBtn = document.getElementById('add-payment-btn');

    if (backBtn) {
        backBtn.addEventListener('click', () => loadPage('suppliers'));
    } else {
        console.error('back-to-suppliers-btn not found!');
    }

    if (addPurchaseBtn) {
        addPurchaseBtn.addEventListener('click', () => {
            document.getElementById('transaction-supplier-input').value = params.name;
            showModal('transactionModal');
        });
    } else {
        console.error('add-purchase-btn not found!');
    }

    if (addPaymentBtn) {
        addPaymentBtn.addEventListener('click', () => {
            alert(`تسجيل دفعة للمورد: ${params.name}`);
        });
    } else {
        console.error('add-payment-btn not found!');
    }
}

// =================================================================================
// == منطق صفحة تفاصيل العميل (المحدثة والآمنة) ==
// =================================================================================
function initCustomerDetailsPage(params) {
    currentCustomerName = params.name;
    let currentBalance = parseInt(params.balance) || 0;
    const transactions = customerTransactions[currentCustomerName] || [];

    // Recalculate balance from transactions for accuracy
    const totalDebt = transactions.filter(t => t.type === 'debt').reduce((sum, t) => sum + t.amount, 0);
    const totalPayment = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + t.amount, 0);
    currentBalance = totalDebt - totalPayment;

    // Update page content (Using CORRECT IDs)
    document.getElementById('details-page-customer-name').textContent = `تفاصيل: ${currentCustomerName}`;
    document.getElementById('details-page-balance').textContent = `${currentBalance > 0 ? '-' : '+'}${Math.abs(currentBalance)} ر.س`;
    document.getElementById('details-page-balance').className = `text-2xl font-bold ${currentBalance > 0 ? 'text-red-600' : 'text-green-600'}`;

    // Update transactions list (Using CORRECT ID)
    const transactionsList = document.getElementById('details-page-transactions-list');
    if (transactions.length === 0) {
        transactionsList.innerHTML = '<li class="text-gray-400 text-sm text-center p-4 bg-gray-50 rounded-lg">لا توجد عمليات مسجلة</li>';
    } else {
        transactionsList.innerHTML = transactions.map(t => `
            <li class="bg-white rounded-xl p-4 shadow-sm border">
                <div class="flex justify-between items-center">
                    <div>
                        <p class="font-medium text-gray-800">${t.type === 'debt' ? 'دين' : 'دفعة'}</p>
                        <p class="text-xs text-gray-500">${t.notes || 'بدون ملاحظات'} - ${t.date}</p>
                    </div>
                    <span class="text-sm font-bold ${t.type === 'debt' ? 'text-red-600' : 'text-green-600'}">${t.type === 'debt' ? '+' : '-'}${t.amount} ر.س</span>
                </div>
            </li>
        `).join('');
    }

    // --- Robust Event Listener Attachment ---
    const backBtn = document.getElementById('back-to-customers-btn');
    if (backBtn) {
        backBtn.addEventListener('click', () => loadPage('customers'));
    } else {
        console.error('back-to-customers-btn not found!');
    }

    // --- التعديل الأهم هنا ---
    // البحث عن الزر باستخدام ID الفريد مباشرة. هذا أكثر استقراراً.
    const addTransactionBtn = document.getElementById('add-transaction-btn');

    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', () => {
            // تحديث اسم العميل في نافذة المعاملة
            document.getElementById('transaction-customer-input').value = currentCustomerName;
            showModal('transactionModal');
        });
    } else {
        console.error('add-transaction-btn not found!'); // هذا الخطأ سيختفي الآن
    }
}

// --- (Keep all other functions in app.js the same) ---


// =================================================================================
// == دوال الإجراءات (Action Functions) ==
// =================================================================================

function saveNewCustomer() {
    hideModal('addCustomerModal');
    alert('تم حفظ العميل الجديد بنجاح!');
}

function saveInvoice() {
    const customer = document.getElementById('invoice-customer-display').textContent.trim();
    const total = document.getElementById('invoice-total-input').value;
    
    if (!customer || customer === 'اختر العميل') {
        alert('يرجى اختيار العميل');
        return;
    }
    if (currentInvoiceItems.length === 0) {
        alert('يرجى إضافة منتج واحد على الأقل');
        return;
    }
    if (!total || total <= 0) {
        alert('يرجى إدخال الإجمالي الصحيح');
        return;
    }

    console.log('Invoice Data:', { customer, items: currentInvoiceItems, total });
    alert(`تم حفظ الفاتورة بنجاح!\nالعميل: ${customer}\nالمنتجات: ${currentInvoiceItems.join(', ')}\nالإجمالي: ${total} ر.س`);
    
    hideModal('invoiceModal');
}

function saveNewEmployee() {
    hideModal('addEmployeeModal');
    console.log('تم حفظ الموظف الجديد');
    alert('تم حفظ الموظف الجديد بنجاح!');
}

function saveAdvanceOnDetailsPage() {
    const employeeName = document.getElementById('advance-employee-input').value;
    const amount = parseInt(document.getElementById('advance-amount-input').value);
    const notes = document.getElementById('advance-notes-input').value;

    if (!employeeName || !amount || amount <= 0) {
        alert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
        return;
    }

    if (!employeeAdvances[employeeName]) {
        employeeAdvances[employeeName] = [];
    }

    employeeAdvances[employeeName].push({
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        notes: notes
    });

    document.getElementById('advance-amount-input').value = '';
    document.getElementById('advance-notes-input').value = '';
    hideModal('advanceModal');

    alert(`تم منح سلفة قدرها ${amount} ر.س للموظف ${employeeName} بنجاح.`);
    loadPage('employee-details', { name: employeeName });
}

function saveSupplierTransactionOnDetailsPage() {
    const supplierName = document.getElementById('transaction-supplier-input').value;
    const amount = parseInt(document.getElementById('transaction-amount-input').value);
    const details = document.getElementById('transaction-details-input').value;
    
    // Get selected transaction type
    const typeInput = document.querySelector('input[name="transaction-type"]:checked');

    if (!supplierName || !amount || amount <= 0 || !typeInput) {
        alert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
        return;
    }

    const type = typeInput.value; // Will be 'purchase' or 'payment'

    if (!supplierTransactions[currentSupplierId]) {
        supplierTransactions[currentSupplierId] = [];
    }

    supplierTransactions[currentSupplierId].push({
        type: type,
        amount: amount,
        date: new Date().toISOString().split('T')[0],
        details: details
    });

    // Reset form and hide modal
    document.getElementById('transaction-amount-input').value = '';
    document.getElementById('transaction-details-input').value = '';
    // Reset radio button to default
    document.querySelector('input[name="transaction-type"][value="purchase"]').checked = true;
    
    hideModal('transactionModal');

    const actionText = type === 'purchase' ? 'مشتراة' : 'دفعة';
    alert(`تم تسجيل ${actionText} بقيمة ${amount} ر.س من المورد ${supplierName} بنجاح.`);
    
    // Refresh page to show the new transaction
    loadPage('supplier-details', { id: currentSupplierId, name: supplierName });
}

function saveCustomerTransactionOnDetailsPage() {
    const customerName = document.getElementById('transaction-customer-input').value;
    const typeInput = document.querySelector('input[name="transaction-type"]:checked');

    if (typeInput.value === 'debt') {
        const amount = currentInvoiceItems.length; // Simplified: 1 unit per item
        const details = currentInvoiceItems.join(', ');
        if (currentInvoiceItems.length === 0) {
            alert('يرجى إضافة منتج واحد على الأقل.');
            return;
        }
        // Save debt transaction
        if (!customerTransactions[currentCustomerName]) {
            customerTransactions[currentCustomerName] = [];
        }
        customerTransactions[currentCustomerName].push({
            type: 'debt',
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            details: details
        });
        alert(`تم حفظ فاتورة دين بقيمة ${amount} ر.س للعميل ${customerName} بنجاح.`);
    } else {
        const amount = parseInt(document.getElementById('payment-amount-input').value);
        const notes = document.getElementById('payment-notes-input').value;
        if (!amount || amount <= 0) {
            alert('يرجى إدخال المبلغ بشكل صحيح.');
            return;
        }
        // Save payment transaction
        if (!customerTransactions[currentCustomerName]) {
            customerTransactions[currentCustomerName] = [];
        }
        customerTransactions[currentCustomerName].push({
            type: 'payment',
            amount: amount,
            date: new Date().toISOString().split('T')[0],
            notes: notes
        });
        alert(`تم تسديد دفعة بقيمة ${amount} ر.س للعميل ${customerName} بنجاح.`);
    }

    // Reset form and hide modal
    document.getElementById('item-search-input').value = '';
    document.getElementById('payment-amount-input').value = '';
    document.getElementById('payment-notes-input').value = '';
    currentInvoiceItems = [];
    hideModal('transactionModal');

    // Refresh the page to show the new transaction
    loadPage('customer-details', { name: currentCustomerName });
}

// --- (Keep all other code in app.js same) ---

// =================================================================================
// == منطق صفحة الإعدادات (Settings) ==
// =================================================================================

// --- Mock Data for Settings Page ---
let appSettings = {
    profile: {
        name: "أحمد محمد العلي",
        email: "ahmed.ali@example.com",
        phone: "0501234567",
        picture: "https://readdy.ai/api/search-image?query=professional%20arabic%20man%20in%20business%20attire%2C%20clean%20corporate%20headshot%2C%20confident%20expression%2C%20white%20background%2C%20high%20quality%20professional%20photography%2C%20modern%20business%20portrait%2C%20formal%20appearance%2C%20executive%20look&width=64&height=64&seq=profile-pic&orientation=squarish"
    },
    account: {
        password: "password123", // In a real app, this should be hashed
        twoFactorEnabled: false,
        lastLogin: "2024-11-15 10:30 AM"
    },
    notifications: {
        push: true,
        email: true,
        inApp: true,
        sound: true
    },
    appearance: {
        darkMode: false,
        fontSize: 'medium',
        colorTheme: 'blue'
    },
    privacy: {
        shareData: true,
        analytics: true,
        marketingEmails: false
    },
    backup: {
        autoBackup: true,
        lastBackup: "2024-11-20 02:00 AM",
        backupLocation: 'cloud' // or 'local'
    }
};

// --- Initialization Function for Settings Page ---
function initSettingsPage() {
    console.log('Initializing settings page...');
    renderSettingsData();
    setupSettingsEventListeners();
}

// --- Function to Render Data from Mock Object ---
function renderSettingsData() {
    // Profile Section
    document.querySelector('#settings-profile-pic img').src = appSettings.profile.picture;
    document.querySelector('#settings-profile-name').textContent = appSettings.profile.name;
    document.querySelector('#settings-profile-email').textContent = appSettings.profile.email;
    document.querySelector('#settings-profile-phone').textContent = appSettings.profile.phone;

    // Account Section
    document.querySelector('#settings-2fa-toggle').checked = appSettings.account.twoFactorEnabled;
    document.querySelector('#settings-last-login').textContent = `آخر تسجيل: ${appSettings.account.lastLogin}`;

    // Notifications Section
    document.querySelector('#notifications-push-toggle').checked = appSettings.notifications.push;
    document.querySelector('#notifications-email-toggle').checked = appSettings.notifications.email;
    document.querySelector('#notifications-inapp-toggle').checked = appSettings.notifications.inApp;
    document.querySelector('#notifications-sound-toggle').checked = appSettings.notifications.sound;

    // Appearance Section
    document.querySelector('#appearance-dark-toggle').checked = appSettings.appearance.darkMode;
    // For simplicity, we'll just set the text for font size and theme
    const fontSizeText = { small: 'صغير', medium: 'متوسط', large: 'كبير' };
    document.querySelector('#appearance-font-size').textContent = `حجم الخط: ${fontSizeText[appSettings.appearance.fontSize]}`;
    document.querySelector('#appearance-color-theme').textContent = `السمة: ${appSettings.appearance.colorTheme}`;

    // Privacy Section
    document.querySelector('#privacy-share-data-toggle').checked = appSettings.privacy.shareData;
    document.querySelector('#privacy-analytics-toggle').checked = appSettings.privacy.analytics;
    document.querySelector('#privacy-marketing-toggle').checked = appSettings.privacy.marketingEmails;

    // Backup Section
    document.querySelector('#backup-auto-toggle').checked = appSettings.backup.autoBackup;
    document.querySelector('#backup-last-backup').textContent = `آخر نسخة احتياطية: ${appSettings.backup.lastBackup}`;
    document.querySelector('#backup-location').textContent = appSettings.backup.location === 'cloud' ? 'السحابة' : 'جهاز';
}

// --- Function to Setup All Event Listeners ---
function setupSettingsEventListeners() {
    // Profile Listeners
    document.querySelector('#edit-profile-btn').addEventListener('click', () => {
        console.log("فتح شاشحة تعديل الملف الشخصي");
        alert("فتح شاشحة تعديل الملف الشخصي");
    });

    // Account Listeners
    document.querySelector('#settings-2fa-toggle').addEventListener('change', (e) => {
        appSettings.account.twoFactorEnabled = e.target.checked;
        console.log("تغيير المصادقة الثنائية:", appSettings.account.twoFactorEnabled);
    });
    document.querySelector('#change-password-btn').addEventListener('click', () => {
        console.log("فتح شاشحة تغيير كلمة المرور");
        alert("فتح شاشحة تغيير كلمة المرور");
    });

    // Notification Listeners
    ['push', 'email', 'inapp', 'sound'].forEach(type => {
        const toggle = document.querySelector(`#notifications-${type}-toggle`);
        toggle.addEventListener('change', (e) => {
            appSettings.notifications[type] = e.target.checked;
            console.log(`تغيير إشعارات ${type}:`, e.target.checked);
        });
    });

    // Appearance Listeners
    document.querySelector('#appearance-dark-toggle').addEventListener('change', (e) => {
        appSettings.appearance.darkMode = e.target.checked;
        console.log("تغيير الوضع الليلي:", appSettings.appearance.darkMode);
        // In a real app, you would apply the dark mode class to the body here
        document.body.classList.toggle('dark-mode', e.target.checked);
    });
    
    // Placeholder for font size and theme changes
    document.querySelector('#appearance-font-size').addEventListener('click', () => alert("فتح خيارات حجم الخط"));
    document.querySelector('#appearance-color-theme').addEventListener('click', () => alert("فتح خيارات السمة اللونية"));

    // Privacy Listeners
    ['shareData', 'analytics', 'marketingEmails'].forEach(type => {
        const toggle = document.querySelector(`#privacy-${type}-toggle`);
        toggle.addEventListener('change', (e) => {
            appSettings.privacy[type] = e.target.checked;
            console.log(`تغيير إعدادات الخصوصية ${type}:`, e.target.checked);
        });
    });

    // Backup Listeners
    document.querySelector('#backup-auto-toggle').addEventListener('change', (e) => {
        appSettings.backup.autoBackup = e.target.checked;
        console.log("تغيير النسخ الاحتياطي التلقائي:", e.target.checked);
    });

    document.querySelector('#create-backup-btn').addEventListener('click', () => {
        console.log("إنشاء نسخة احتياطية يدوياً");
        alert("جاري إنشاء نسخة احتياطية...");
        // Simulate backup creation
        setTimeout(() => {
            appSettings.backup.lastBackup = new Date().toLocaleString('ar-EG');
            renderSettingsData(); // Refresh the UI
            alert("تم إنشاء نسخة احتياطية بنجاح!");
        }, 2000);
    });
    
    document.querySelector('#restore-backup-btn').addEventListener('click', () => {
        console.log("استعادة نسخة احتياطية");
        alert("جاري استعادة نسخة احتياطية...");
        // Simulate restore
        setTimeout(() => {
            alert("تم استعادة النسخة الاحتياطية بنجاح!");
        }, 2000);
    });

    // Footer Buttons
    document.querySelector('#save-all-btn').addEventListener('click', () => {
        console.log("حفظ جميع الإعدادات:", appSettings);
        alert("تم حفظ جميع الإعدادات بنجاح!");
    });

    document.querySelector('#reset-btn').addEventListener('click', () => {
        if (confirm("هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى القيم الافتراضية؟")) {
            console.log("إعادة تعيين الإعدادات");
            // Reset mock data to defaults
            appSettings = {
                profile: { /* ... default profile ... */ },
                account: { /* ... default account ... */ },
                // ... reset all other settings
            };
            renderSettingsData();
            alert("تم إعادة تعيين الإعدادات بنجاح!");
        }
    });
}
function editSupplier(supplierId) {
    console.log("تعديل المورد:", supplierId);
    alert(`تعديل بيانات المورد: ${supplierId}`);
}

function addPurchase(supplierId) {
    console.log("إضافة مشتراة للمورد:", supplierId);
    alert(`إضافة مشتراة من المورد: ${supplierId}`);
}

function quickAddPurchase() {
    console.log("إضافة مشتراة سريعة");
    alert("إضافة مشتراة سريعة");
}

function quickAddPayment() {
    console.log("إضافة دفعة سريعة");
    alert("إضافة دفعة سريعة");
}

function showSalaryReport() {
    console.log("عرض تقرير الرواتب");
    alert("عرض كشف الرواتب الشهري");
}

function showPayrollReport() {
    console.log("عرض تقرير تسديد الرواتب");
    alert("عرض تقرير تسديد الرواتب");
}