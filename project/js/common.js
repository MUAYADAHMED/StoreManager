// Global variables
let appData = {
  customers: [],
  employees: [],
  suppliers: [],
  items: [],
};

// === Data Management Functions ===
// Save data to data/data.json file ONLY (now returns a promise)
async function saveDataToLocalStorage() {
  try {
    const jsonString = JSON.stringify(appData);
    console.log('💾 جاري حفظ البيانات في data/data.json...');
    console.log('📊 حجم البيانات:', (jsonString.length / 1024).toFixed(2) + ' KB');
    
    // Wait for the save to complete
    const result = await saveToJsonFile();
    
    if (result) {
      console.log('✅ اكتملت عملية الحفظ بنجاح');
    } else {
      console.warn('⚠️ قد لم تكتمل عملية الحفظ بنجاح');
    }
    
    return result;
  } catch (error) {
    console.error('❌ خطأ في حفظ البيانات:', error);
    showNotification('⚠️ خطأ في حفظ البيانات: ' + error.message, 'error');
    return false;
  }
}

// Save data to data/data.json file via PUT request
async function saveToJsonFile() {
  try {
    const dataToSend = JSON.stringify(appData, null, 2);
    console.log('📤 إرسال البيانات إلى الخادم...');
    console.log('📦 حجم البيانات:', (dataToSend.length / 1024).toFixed(2) + ' KB');
    
    const response = await fetch('data/data.json', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: dataToSend
    });

    console.log('📨 حالة الاستجابة:', response.status);
    const responseText = await response.text();
    console.log('📋 رسالة الخادم:', responseText);

    if (response.ok) {
      console.log('✅ تم حفظ البيانات في data/data.json بنجاح');
      console.log('✅ الملف محدّث على الخادم الآن');
      return true;
    } else {
      console.warn('⚠️ فشل حفظ البيانات في الخادم:', response.status);
      console.warn('⚠️ الرسالة:', responseText);
      return false;
    }
  } catch (error) {
    console.error('❌ خطأ عند الاتصال بالخادم:', error);
    console.error('❌ تفاصيل الخطأ:', error.message);
    return false;
  }
}

// Load data from data.json only (localStorage is not used)
function loadDataFromJsonFile() {
  // This function is no longer used
  return false;
}

// Download data as JSON file
function downloadDataAsJSON() {
  try {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('✅ تم تحميل النسخة الاحتياطية', 'success');
  } catch (error) {
    console.error('❌ خطأ:', error);
    showNotification('❌ فشل التحميل', 'error');
  }
}

// Upload data from JSON file
function uploadDataFromJSON(file) {
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const uploadedData = JSON.parse(e.target.result);
      appData = uploadedData;
      saveDataToLocalStorage();
      updateCurrentPageData();
      showNotification('✅ تم استيراد البيانات بنجاح', 'success');
    } catch (error) {
      console.error('❌ خطأ:', error);
      showNotification('❌ فشل الاستيراد - تأكد من صيغة الملف', 'error');
    }
  };
  reader.readAsText(file);
}

// Handle file upload from input
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (file) {
    uploadDataFromJSON(file);
    // Reset input
    document.getElementById('fileInput').value = '';
  }
}

// Load component
function loadComponent(componentId, filePath) {
  fetch(filePath)
    .then(response => response.text())
    .then(html => {
      document.getElementById(componentId).innerHTML = html;
      // Trigger custom event after component is loaded
      document.dispatchEvent(new CustomEvent('componentLoaded', { detail: { componentId } }));
    })
    .catch(error => console.error('Error loading component:', error));
}

// Load data from data/data.json ONLY
async function loadData() {
  console.log('🔄 جاري تحميل البيانات من data/data.json...');
  try {
    const response = await fetch("data/data.json");
    if (response.ok) {
      const jsonData = await response.json();
      appData = jsonData;
      console.log('✅ تم تحميل البيانات من data/data.json بنجاح');
      updateCurrentPageData();
      return;
    } else {
      console.log('ℹ️ لم يتمكن من تحميل البيانات');
    }
  } catch (error) {
    console.log('ℹ️ لم يتمكن من تحميل data.json:', error.message);
  }
  
  console.log('ℹ️ تم إنشاء بيانات جديدة');
  updateCurrentPageData();
}

// Update current page data (to be overridden in each page)
function updateCurrentPageData() {
  // This will be implemented in each page's script
}

// Update current date
function updateDate() {
  const date = new Date();
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  };
  const dateElement = document.getElementById("currentDate");
  if (dateElement) {
    dateElement.textContent = date.toLocaleDateString("ar-SA", options);
  }
}

// Show notification
function showNotification(message, type) {
  const notification = document.createElement("div");
  const bgColor = type === "success" ? "bg-green-500" : "bg-red-500";
  notification.className = `fixed top-4 left-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 fade-in`;
  notification.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"} ml-2"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Floating Action Button Functions
function handleFabClick() {
  // سيتم تجاوز هذه الدالة في كل صفحة
  if (window.fabClickAction) {
    window.fabClickAction();
  }
}

function setFabAction(action, icon = 'fa-plus', color = 'blue') {
  window.fabClickAction = action;
  const fabBtn = document.getElementById('fab-btn');
  const fabIcon = document.getElementById('fab-icon');
  
  if (fabBtn && fabIcon) {
    fabIcon.className = `fas ${icon} text-2xl`;
    
    // تغيير اللون
    fabBtn.className = `fab bg-gradient-to-br text-white rounded-full w-16 h-16 shadow-2xl flex items-center justify-center transition-all transform hover:scale-125 active:scale-95 cursor-pointer`;
    
    if (color === 'blue') {
      fabBtn.classList.add('from-blue-600', 'to-blue-700', 'hover:from-blue-700', 'hover:to-blue-800');
    } else if (color === 'green') {
      fabBtn.classList.add('from-green-600', 'to-green-700', 'hover:from-green-700', 'hover:to-green-800');
    } else if (color === 'red') {
      fabBtn.classList.add('from-red-600', 'to-red-700', 'hover:from-red-700', 'hover:to-red-800');
    } else if (color === 'purple') {
      fabBtn.classList.add('from-purple-600', 'to-purple-700', 'hover:from-purple-700', 'hover:to-purple-800');
    }
  }
}

// Initialize common components and data
document.addEventListener("DOMContentLoaded", function () {
  updateDate();
  setInterval(updateDate, 60000);
  loadData();
  
  // Save data every 30 seconds
  setInterval(saveDataToLocalStorage, 30000);
});

// When user returns to page (back button), reload data from data.json
window.addEventListener('pageshow', function() {
  console.log('📄 عودة المستخدم للصفحة - إعادة تحميل البيانات...');
  loadData();
});

// When a component is loaded, update navbar active state if navbar was loaded
document.addEventListener('componentLoaded', function(e) {
  if (e && e.detail && e.detail.componentId === 'navbar') {
    updateNavbarActive();
  }
});

// Update navbar active button based on current page
function updateNavbarActive() {
  const path = window.location.pathname || window.location.href;
  // extract filename
  const file = path.split('/').pop().split('?')[0].toLowerCase();
  const tabMap = {
    'customers.html': 'customers',
    'customer-details.html': 'customers',
    'employees.html': 'employees',
    'suppliers.html': 'suppliers',
    'settings.html': 'settings',
    '': 'customers'
  };

  const activeTab = tabMap[file] || tabMap[''];
  const buttons = document.querySelectorAll('.nav-item');
  buttons.forEach(btn => {
    const tab = btn.getAttribute('data-tab');
    if (!tab) return;
    if (tab === activeTab) {
      btn.classList.remove('text-gray-600');
      btn.classList.add('text-blue-600');
    } else {
      btn.classList.remove('text-blue-600');
      btn.classList.add('text-gray-600');
    }
  });
}

// Save data before leaving the page
window.addEventListener('beforeunload', function() {
  saveDataToLocalStorage();
});

// Load transaction modal component
function loadTransactionModal() {
  fetch('components/transaction-modal.html')
    .then(response => response.text())
    .then(html => {
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = html;
      document.body.appendChild(modalContainer);
      
      // Setup event listeners for the modal
      setupTransactionModal();
    })
    .catch(error => console.error('Error loading transaction modal:', error));
}

// Setup transaction modal event listeners
function setupTransactionModal() {
  // Close button
  document.getElementById('trans-close-btn').addEventListener('click', function() {
    document.getElementById('transaction-modal').classList.add('hidden');
  });
  
  // Toggle between invoice and payment
  document.getElementById('btn-type-invoice').addEventListener('click', function() {
    this.classList.add('bg-white', 'text-emerald-600');
    this.classList.remove('text-gray-500');
    document.getElementById('btn-type-payment').classList.remove('bg-white', 'text-emerald-600');
    document.getElementById('btn-type-payment').classList.add('text-gray-500');
    document.getElementById('invoice-section').classList.remove('hidden');
    document.getElementById('payment-section').classList.add('hidden');
  });
  
  document.getElementById('btn-type-payment').addEventListener('click', function() {
    this.classList.add('bg-white', 'text-emerald-600');
    this.classList.remove('text-gray-500');
    document.getElementById('btn-type-invoice').classList.remove('bg-white', 'text-emerald-600');
    document.getElementById('btn-type-invoice').classList.add('text-gray-500');
    document.getElementById('invoice-section').classList.add('hidden');
    document.getElementById('payment-section').classList.remove('hidden');
  });
  
  // Add item to invoice
  document.getElementById('btn-add-item').addEventListener('click', function() {
    const itemName = document.getElementById('item-search').value;
    const itemPrice = parseFloat(document.getElementById('item-price').value) || 0;
    const itemQty = parseInt(document.getElementById('item-qty').value) || 1;
    
    if (!itemName || itemPrice <= 0 || itemQty <= 0) {
      showNotification('يرجى إدخال بيانات الصنف بشكل صحيح', 'error');
      return;
    }
    
    const item = {
      id: Date.now(),
      name: itemName,
      price: itemPrice,
      quantity: itemQty,
      total: itemPrice * itemQty
    };
    
    // Add to invoice items (this will be handled by each page)
    if (window.addInvoiceItem) {
      window.addInvoiceItem(item);
    }
    
    // Reset form
    document.getElementById('item-search').value = '';
    document.getElementById('item-price').value = '';
    document.getElementById('item-qty').value = '1';
  });
  
  // Update total when direct amount changes
  document.getElementById('direct-amount').addEventListener('input', function() {
    const amount = parseFloat(this.value) || 0;
    document.getElementById('total-display').textContent = amount.toFixed(2);
  });
  
  // Save transaction
  document.getElementById('btn-save-transaction').addEventListener('click', function() {
    if (window.saveTransaction) {
      window.saveTransaction();
    }
  });
}