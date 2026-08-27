// Başlangıç değişkenleri
let cars = [];
let revenueData = {};
let currentUser = localStorage.getItem('rentACarUser') || null; 
let isAdmin = localStorage.getItem('rentACarIsAdmin') === 'true';
let originalExpectedReturnDate = null;

const ADMIN_PASSWORD = "egemen123"; 

// DOM Elementleri
const carsContainer = document.getElementById('cars-container');
const totalCarsEl = document.getElementById('total-cars');
const rentedCarsEl = document.getElementById('rented-cars');
const dashboardSection = document.getElementById('dashboard-section');
const revenueSection = document.getElementById('revenue-section');

const addModal = document.getElementById('add-car-modal');
const addExpenseModal = document.getElementById('add-expense-modal');
const rentModal = document.getElementById('rent-car-modal');
const editRentalModal = document.getElementById('edit-rental-modal');
const returnModal = document.getElementById('return-car-modal');
const editKmModal = document.getElementById('edit-km-modal'); 
const manualRevenueModal = document.getElementById('manual-revenue-modal');

// 1. Verileri Turso Veritabanından Çek
async function loadDataFromDB() {
    try {
        const carsRes = await fetch('/api/cars');
        const carsData = await carsRes.json();
        cars = Array.isArray(carsData) ? carsData : [];

        const revRes = await fetch('/api/revenue');
        const revData = await revRes.json();
        revenueData = (revData && typeof revData === 'object') ? revData : {};

        initApp();
    } catch (err) {
        console.error("Veriler yüklenirken hata oluştu:", err);
        cars = [];
        revenueData = {};
        initApp();
    }
}

function initApp() {
    const loginScreen = document.getElementById('login-screen');
    const loggedInUserEl = document.getElementById('logged-in-user');
    const navAddCar = document.getElementById('nav-add-car');
    const navAddExpense = document.getElementById('nav-add-expense');

    if (!currentUser) {
        if (loginScreen) loginScreen.style.display = 'flex';
    } else {
        if (loginScreen) loginScreen.style.display = 'none';
        if (loggedInUserEl) loggedInUserEl.innerText = currentUser;
        
        // Sadece Admin (Egemen Akbulut) görebilir
        if (navAddCar) navAddCar.style.display = isAdmin ? 'flex' : 'none';
        if (navAddExpense) navAddExpense.style.display = isAdmin ? 'flex' : 'none';

        checkOverdueCars();
    }

    renderCars();
    updateStats();
    renderRevenue();
}

// --- GİRİŞTE DÖNÜŞ SÜRESİ KONTROLÜ VE UYARI ---
function checkOverdueCars() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueCars = [];
    const todayCars = [];

    cars.filter(c => c.status === 'rented' && c.expectedReturnDate).forEach(car => {
        const [eY, eM, eD] = car.expectedReturnDate.split('-').map(Number);
        const expDate = new Date(eY, eM - 1, eD);

        if (expDate < today) {
            overdueCars.push(`${car.brand} ${car.model} (${car.plate || 'Plakasız'}) - Müşteri: ${car.renterName} (Beklenen: ${car.expectedReturnDate})`);
        } else if (expDate.getTime() === today.getTime()) {
            todayCars.push(`${car.brand} ${car.model} (${car.plate || 'Plakasız'}) - Müşteri: ${car.renterName}`);
        }
    });

    if (overdueCars.length > 0 || todayCars.length > 0) {
        let msg = "🚨 ARAÇ İADE BİLDİRİMİ!\n\n";
        if (overdueCars.length > 0) {
            msg += "⚠️ İADE SÜRESİ GEÇMİŞ ARAÇLAR:\n" + overdueCars.join("\n") + "\n\n";
        }
        if (todayCars.length > 0) {
            msg += "📅 BUGÜN GELMESİ BEKLENEN ARAÇLAR:\n" + todayCars.join("\n");
        }
        setTimeout(() => alert(msg), 300);
    }
}

// --- TOPLAM KİRALAMA GÜNÜNÜ DİNAMİK HESAPLAMA ---
function calculateTotalDays(rentDateStr, expectedDateStr) {
    if (!rentDateStr) return 1;
    
    const [rY, rM, rD] = rentDateStr.split('-').map(Number);
    const startDate = new Date(rY, rM - 1, rD);

    let endDate = new Date();
    endDate.setHours(0, 0, 0, 0);

    if (expectedDateStr) {
        const [eY, eM, eD] = expectedDateStr.split('-').map(Number);
        const expDate = new Date(eY, eM - 1, eD);
        if (expDate >= endDate) {
            endDate = expDate;
        }
    }

    const diffTime = endDate.getTime() - startDate.getTime();
    let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 0 ? 1 : diffDays;
}

// --- GİRİŞ / YETKİLENDİRME İŞLEMLERİ ---
window.handleUserClick = function(userName) {
    if (userName === 'EGEMEN AKBULUT') {
        const passContainer = document.getElementById('password-container');
        if (passContainer) passContainer.style.display = 'block';
    } else {
        loginUser(userName, false);
    }
};

window.verifyAdminPassword = function() {
    const passwordInput = document.getElementById('admin-password');
    const enteredPass = passwordInput ? passwordInput.value : '';
    if (enteredPass === ADMIN_PASSWORD) {
        loginUser('EGEMEN AKBULUT', true);
    } else {
        alert("Hatalı şifre!");
    }
};

function loginUser(userName, adminStatus) {
    currentUser = userName;
    isAdmin = adminStatus;
    localStorage.setItem('rentACarUser', userName); 
    localStorage.setItem('rentACarIsAdmin', adminStatus); 

    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) loginScreen.style.display = 'none';
    
    const loggedInUserEl = document.getElementById('logged-in-user');
    if (loggedInUserEl) loggedInUserEl.innerText = currentUser;

    const passContainer = document.getElementById('password-container');
    if (passContainer) passContainer.style.display = 'none';
    
    const adminPassInput = document.getElementById('admin-password');
    if (adminPassInput) adminPassInput.value = '';

    initApp();
}

const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        currentUser = null;
        isAdmin = false;
        localStorage.removeItem('rentACarUser'); 
        localStorage.removeItem('rentACarIsAdmin'); 
        
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.style.display = 'flex';
        
        const passContainer = document.getElementById('password-container');
        if (passContainer) passContainer.style.display = 'none';
    });
}

async function saveData() {
    try {
        await fetch('/api/cars/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cars)
        });

        await fetch('/api/revenue/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(revenueData)
        });

        renderCars();
        updateStats();
        renderRevenue();
    } catch (err) {
        console.error("Veriler kaydedilirken hata oluştu:", err);
    }
}

// --- MENÜ GEÇİŞLERİ ---
const navDashboard = document.getElementById('nav-dashboard');
if (navDashboard) {
    navDashboard.addEventListener('click', (e) => {
        dashboardSection.style.display = 'block';
        revenueSection.style.display = 'none';
        document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
        e.currentTarget.classList.add('active');
    });
}

const navRevenue = document.getElementById('nav-revenue');
if (navRevenue) {
    navRevenue.addEventListener('click', (e) => {
        dashboardSection.style.display = 'none';
        revenueSection.style.display = 'block';
        document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
        e.currentTarget.classList.add('active');
        renderRevenue();
    });
}

function renderCars() {
    if (!carsContainer) return;
    carsContainer.innerHTML = '';
    cars.forEach(car => {
        const isAvailable = car.status === 'available';
        
        const card = document.createElement('div');
        card.className = 'car-card';
        
        let rentDetails = '';
        let notesHtml = '';

        if(!isAvailable) {
            const currentTotalDays = calculateTotalDays(car.rentDate, car.expectedReturnDate);
            const currentAllowedKm = currentTotalDays * 300;

            rentDetails = `
                <p><i class="fa-solid fa-user"></i> Müşteri: <strong>${car.renterName}</strong></p>
                <p><i class="fa-solid fa-user-tie"></i> Personel: <strong>${car.employeeName}</strong></p>
                <p><i class="fa-regular fa-calendar"></i> Çıkış: <strong>${car.rentDate}</strong></p>
                <p><i class="fa-regular fa-calendar-check"></i> Beklenen Dönüş: <strong>${car.expectedReturnDate || '-'} (${currentTotalDays} Gün)</strong></p>
                <p><i class="fa-solid fa-route"></i> Toplam KM Limiti: <strong>${currentAllowedKm} KM</strong></p>
                <p><i class="fa-solid fa-money-bill-wave"></i> Günlük Ücret: <strong>${car.dailyPrice} ₺</strong></p>
            `;
            if (car.notes) {
                notesHtml = `
                    <div style="background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 8px; margin-top: 8px; font-size: 12px; border-left: 3px solid var(--warning);">
                        <i class="fa-solid fa-note-sticky" style="color: #fbbf24; margin-right: 5px;"></i> <strong>Not:</strong> ${car.notes}
                    </div>
                `;
            }
        }

        let editKmIcon = (isAvailable && isAdmin)
            ? `<i class="fa-solid fa-pen edit-icon" onclick="openEditKmModal('${car.id}')" title="KM Düzenle"></i>` 
            : '';

        let displayPlate = car.plate ? car.plate : 'PLAKA YOK';
        let deleteButtonHtml = isAdmin 
            ? `<button class="btn-danger" onclick="deleteCar('${car.id}')" style="width: auto; padding: 10px 14px;"><i class="fa-solid fa-trash"></i></button>` 
            : '';

        let editRentalBtn = (!isAvailable && isAdmin)
            ? `<button class="btn-primary" onclick="openEditRentalModal('${car.id}')" style="width: auto; padding: 10px 14px;" title="Kira ve Süre Düzenle"><i class="fa-solid fa-pen-to-square"></i></button>`
            : '';

        card.innerHTML = `
            <div class="car-header">
                <div class="car-header-top">
                    <h3>${car.brand} ${car.model}</h3>
                    <span class="status-badge ${isAvailable ? 'status-available' : 'status-rented'}">
                        ${isAvailable ? 'Müsait' : 'Kirada'}
                    </span>
                </div>
                <div class="plate-number">${displayPlate}</div>
            </div>
            <div class="car-details">
                <p><i class="fa-solid fa-gauge-high"></i> Güncel KM: <strong>${car.km}</strong> ${editKmIcon}</p>
                ${rentDetails}
                ${notesHtml}
            </div>
            <div class="card-actions">
                ${isAvailable 
                    ? `<button class="btn-success" onclick="openRentModal('${car.id}')"><i class="fa-solid fa-key"></i> Kirala</button>`
                    : `<button class="btn-warning" onclick="openReturnModal('${car.id}')"><i class="fa-solid fa-flag-checkered"></i> Teslim Al</button>`
                }
                ${editRentalBtn}
                ${deleteButtonHtml}
            </div>
        `;
        carsContainer.appendChild(card);
    });
}

function updateStats() {
    if (totalCarsEl) totalCarsEl.innerText = cars.length;
    if (rentedCarsEl) rentedCarsEl.innerText = cars.filter(c => c.status === 'rented').length;
}

// --- AYLIK GELİR/GİDER GÖSTERME (SOL GELİR - SAĞ GİDER AYRI SÜTUN) ---
function renderRevenue() {
    const container = document.getElementById('revenue-container');
    if (!container) return;
    container.innerHTML = '';
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    const sortedKeys = Object.keys(revenueData).sort((a, b) => b.localeCompare(a));

    if (sortedKeys.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 30px;">Henüz bir işlem kaydı bulunmuyor.</p>';
        return;
    }

    let htmlContent = '';

    sortedKeys.forEach(key => {
        const monthData = revenueData[key];
        const [year, month] = key.split('-');
        const monthName = months[parseInt(month) - 1];

        let totalIncome = 0;
        let totalExpense = 0;

        let incomeHtml = '';
        let expenseHtml = '';

        if (monthData.details && monthData.details.length > 0) {
            monthData.details.forEach((detail, index) => {
                const isExpense = detail.type === 'expense';
                const employeeText = detail.employee ? `Personel: ${detail.employee}` : '';
                
                const deleteRevBtn = isAdmin 
                    ? `<button onclick="deleteRevenueItem('${key}', ${index})" style="background:none; border:none; color:#f43f5e; cursor:pointer; margin-left:8px; width:auto; padding:4px;" title="Kaydı Sil"><i class="fa-solid fa-trash"></i></button>`
                    : '';

                if (isExpense) {
                    totalExpense += detail.amount;
                    expenseHtml += `
                        <div class="revenue-detail-item">
                            <div class="car-info">
                                <i class="fa-solid fa-receipt" style="color:#f43f5e;"></i> <span>${detail.carName}</span><br>
                                <small style="color: var(--text-muted);">(Kime/Nereye: ${detail.renter} | Ekleyen: ${detail.employee})</small>
                                <br><small style="color: var(--text-muted); font-size: 11px;">Tarih: ${detail.date}</small>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <div style="color: #f43f5e; font-weight: 800; font-size: 14.5px;">
                                    - ${detail.amount.toLocaleString('tr-TR')} ₺
                                </div>
                                ${deleteRevBtn}
                            </div>
                        </div>
                    `;
                } else {
                    totalIncome += detail.amount;
                    let kmInfoText = `Toplam Yol: ${detail.distanceTraveled || 0} KM`;
                    if (detail.extraKm && detail.extraKm > 0) {
                        kmInfoText += ` <span style="color: #fbbf24; font-weight: 700;">(⚠️ ${detail.extraKm} KM Aşım, +${detail.extraKmCost || 0} ₺)</span>`;
                    } else if (detail.distanceTraveled !== undefined && detail.distanceTraveled !== '-') {
                        kmInfoText += ` <span style="color: #34d399;">(Sınır İçinde)</span>`;
                    } else {
                        kmInfoText = 'Peşin Kiralama Bedeli';
                    }

                    incomeHtml += `
                        <div class="revenue-detail-item">
                            <div class="car-info">
                                <i class="fa-solid fa-car-side" style="color:#10b981;"></i> <span>${detail.carName}</span><br>
                                <small style="color: var(--text-muted);">(Müşteri: ${detail.renter}, ${employeeText}, ${detail.days} Gün) | ${kmInfoText}</small>
                                <br><small style="color: var(--text-muted); font-size: 11px;">Tarih: ${detail.date}</small>
                            </div>
                            <div style="display: flex; align-items: center;">
                                <div style="color: #10b981; font-weight: 800; font-size: 14.5px;">
                                    + ${detail.amount.toLocaleString('tr-TR')} ₺
                                </div>
                                ${deleteRevBtn}
                            </div>
                        </div>
                    `;
                }
            });
        }

        const netBalance = totalIncome - totalExpense;
        const netColor = netBalance >= 0 ? '#34d399' : '#f43f5e';
        const netSign = netBalance >= 0 ? '+' : '';

        // Sadece Admin görsün: "+ Yeni Tahsilat" Butonu
        let addManualRevBtn = isAdmin 
            ? `<button class="btn-add-manual-rev" onclick="openManualRevenueModal('${key}')"><i class="fa-solid fa-plus"></i> Yeni Tahsilat Ekle</button>`
            : '';

        htmlContent += `
            <div class="revenue-card">
                <div class="revenue-card-header">
                    <div class="revenue-month">${monthName} ${year} Özeti</div>
                    <div class="revenue-summary-badges">
                        <div class="badge-income">Gelir: +${totalIncome.toLocaleString('tr-TR')} ₺</div>
                        <div class="badge-expense">Gider: -${totalExpense.toLocaleString('tr-TR')} ₺</div>
                        <div class="badge-net" style="color: ${netColor};">Net Durum: ${netSign}${netBalance.toLocaleString('tr-TR')} ₺</div>
                    </div>
                </div>
                <div class="revenue-columns-grid">
                    <!-- Sol: Gelirler -->
                    <div class="revenue-column">
                        <div class="column-header-income">
                            <span><i class="fa-solid fa-arrow-down-left"></i> Gelir Kayıtları (+${totalIncome.toLocaleString('tr-TR')} ₺)</span>
                            ${addManualRevBtn}
                        </div>
                        <div class="column-items-list">
                            ${incomeHtml || '<div class="empty-col-msg">Bu ay için gelir kaydı yok.</div>'}
                        </div>
                    </div>

                    <!-- Sağ: Giderler -->
                    <div class="revenue-column">
                        <div class="column-header-expense">
                            <i class="fa-solid fa-arrow-up-right"></i> Masraf & Giderler (-${totalExpense.toLocaleString('tr-TR')} ₺)
                        </div>
                        <div class="column-items-list">
                            ${expenseHtml || '<div class="empty-col-msg">Bu ay için gider kaydı yok.</div>'}
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
}

// --- MANUEL / GEÇMİŞ TAHSİLAT EKLEME MODALI (Admin) ---
window.openManualRevenueModal = function() {
    if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
    
    const carSelect = document.getElementById('manual-car-select');
    if (carSelect) {
        carSelect.innerHTML = '<option value="">-- Araç Seçiniz --</option>';
        cars.forEach(car => {
            const opt = document.createElement('option');
            opt.value = car.id;
            opt.innerText = `${car.brand} ${car.model} (${car.plate || 'Plakasız'})`;
            carSelect.appendChild(opt);
        });
    }

    document.getElementById('manual-renter-name').value = '';
    document.getElementById('manual-daily-price').value = '';
    document.getElementById('manual-start-km').value = '';
    document.getElementById('manual-return-km').value = '';
    document.getElementById('manual-extra-km-price').value = '5';
    document.getElementById('manual-notes').value = '';
    document.getElementById('manual-has-km-overage').value = 'no';
    
    document.getElementById('manual-rent-date').valueAsDate = new Date();
    document.getElementById('manual-return-date').valueAsDate = new Date();
    
    const overageContainer = document.getElementById('manual-overage-container');
    if (overageContainer) overageContainer.style.display = 'none';

    if (manualRevenueModal) manualRevenueModal.style.display = 'flex';
};

const closeManualRevBtn = document.getElementById('close-manual-revenue-modal');
if (closeManualRevBtn) {
    closeManualRevBtn.addEventListener('click', () => {
        if (manualRevenueModal) manualRevenueModal.style.display = 'none';
    });
}

// Araç seçildiğinde KM'sini otomatik getir
const manualCarSelectEl = document.getElementById('manual-car-select');
if (manualCarSelectEl) {
    manualCarSelectEl.addEventListener('change', (e) => {
        const selectedCar = cars.find(c => String(c.id) === String(e.target.value));
        if (selectedCar) {
            document.getElementById('manual-start-km').value = selectedCar.km || 0;
        }
    });
}

// Aşım var mı seçimi değiştiğinde
const manualHasOverageEl = document.getElementById('manual-has-km-overage');
if (manualHasOverageEl) {
    manualHasOverageEl.addEventListener('change', (e) => {
        const container = document.getElementById('manual-overage-container');
        if (container) {
            container.style.display = e.target.value === 'yes' ? 'block' : 'none';
        }
    });
}

const manualRevForm = document.getElementById('manual-revenue-form');
if (manualRevForm) {
    manualRevForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");

        const carId = document.getElementById('manual-car-select').value;
        const selectedCar = cars.find(c => String(c.id) === String(carId));
        if (!selectedCar) return alert("Lütfen geçerli bir araç seçin!");

        const renterName = document.getElementById('manual-renter-name').value;
        const employee = document.getElementById('manual-employee-select').value;
        const rentDateStr = document.getElementById('manual-rent-date').value;
        const returnDateStr = document.getElementById('manual-return-date').value;
        const dailyPrice = parseInt(document.getElementById('manual-daily-price').value) || 0;
        const startKm = parseInt(document.getElementById('manual-start-km').value) || 0;
        const hasOverage = document.getElementById('manual-has-km-overage').value;

        const totalDays = calculateTotalDays(rentDateStr, returnDateStr);
        const baseIncome = totalDays * dailyPrice;

        let distanceTraveled = '-';
        let extraKm = 0;
        let extraKmCost = 0;

        if (hasOverage === 'yes') {
            const returnKm = parseInt(document.getElementById('manual-return-km').value) || 0;
            const extraKmPrice = parseFloat(document.getElementById('manual-extra-km-price').value) || 0;

            if (returnKm < startKm) {
                return alert("Dönüş KM'si çıkış KM'sinden küçük olamaz!");
            }

            distanceTraveled = returnKm - startKm;
            const allowedKm = totalDays * 300;

            if (distanceTraveled > allowedKm) {
                extraKm = distanceTraveled - allowedKm;
                extraKmCost = extraKm * extraKmPrice;
            }
        }

        const totalAmount = baseIncome + extraKmCost;

        const [rY, rM, rD] = returnDateStr.split('-').map(Number);
        const monthKey = `${rY}-${String(rM).padStart(2, '0')}`;

        if (!revenueData[monthKey] || typeof revenueData[monthKey] !== 'object') {
            revenueData[monthKey] = { total: 0, details: [] };
        }

        let displayPlate = selectedCar.plate ? ` - ${selectedCar.plate}` : '';

        revenueData[monthKey].total += totalAmount;
        revenueData[monthKey].details.push({
            type: 'income',
            carId: selectedCar.id,
            carName: `${selectedCar.brand} ${selectedCar.model}${displayPlate}`,
            renter: renterName,
            employee: employee,
            days: totalDays,
            distanceTraveled: distanceTraveled,
            extraKm: extraKm,
            extraKmCost: extraKmCost,
            amount: totalAmount,
            date: new Date(rY, rM - 1, rD).toLocaleDateString('tr-TR')
        });

        alert(`Tahsilat başarıyla eklendi!\nSüre: ${totalDays} Gün\nKira Geliri: ${baseIncome} ₺\nKM Aşım Geliri: ${extraKmCost} ₺\nToplam Tahsilat: ${totalAmount} ₺`);

        saveData();
        if (manualRevenueModal) manualRevenueModal.style.display = 'none';
        e.target.reset();
    });
}

// --- ARAÇ EKLEME (Admin) ---
const navAddCarBtn = document.getElementById('nav-add-car');
if (navAddCarBtn) {
    navAddCarBtn.addEventListener('click', () => {
        if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
        if (addModal) addModal.style.display = 'flex';
    });
}
const closeAddModalBtn = document.getElementById('close-add-modal');
if (closeAddModalBtn) {
    closeAddModalBtn.addEventListener('click', () => {
        if (addModal) addModal.style.display = 'none';
    });
}

const addCarForm = document.getElementById('add-car-form');
if (addCarForm) {
    addCarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
        
        let rawPlate = document.getElementById('car-plate').value;
        let upperPlate = rawPlate.toLocaleUpperCase('tr-TR');

        const newCar = {
            id: Date.now().toString(),
            plate: upperPlate, 
            brand: document.getElementById('car-brand').value,
            model: document.getElementById('car-model').value,
            km: parseInt(document.getElementById('car-km').value) || 0,
            status: 'available',
            rentDate: null,
            expectedReturnDate: null, 
            renterName: null, 
            employeeName: null,
            dailyPrice: null,
            startKm: null,
            notes: ''
        };
        cars.push(newCar);
        saveData();
        if (addModal) addModal.style.display = 'none';
        e.target.reset();
    });
}

// --- GİDER EKLEME İŞLEMLERİ (Admin) ---
const navAddExpenseBtn = document.getElementById('nav-add-expense');
if (navAddExpenseBtn) {
    navAddExpenseBtn.addEventListener('click', () => {
        if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
        if (addExpenseModal) {
            document.getElementById('expense-date').valueAsDate = new Date();
            addExpenseModal.style.display = 'flex';
        }
    });
}
const closeExpenseModalBtn = document.getElementById('close-expense-modal');
if (closeExpenseModalBtn) {
    closeExpenseModalBtn.addEventListener('click', () => {
        if (addExpenseModal) addExpenseModal.style.display = 'none';
    });
}

const addExpenseForm = document.getElementById('add-expense-form');
if (addExpenseForm) {
    addExpenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");

        const type = document.getElementById('expense-type').value;
        const dateStr = document.getElementById('expense-date').value;
        const desc = document.getElementById('expense-desc').value;
        const amount = parseInt(document.getElementById('expense-amount').value) || 0;

        const [dY, dM, dD] = dateStr.split('-').map(Number);
        const dDate = new Date(dY, dM - 1, dD);
        const monthKey = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!revenueData[monthKey] || typeof revenueData[monthKey] !== 'object') {
            revenueData[monthKey] = { total: 0, details: [] };
        }

        revenueData[monthKey].total -= amount; 
        revenueData[monthKey].details.push({
            type: 'expense',
            expenseType: type,
            carName: `GİDER: ${type}`,
            renter: desc,
            employee: currentUser,
            days: '-',
            distanceTraveled: '-',
            extraKm: '-',
            extraKmCost: '-',
            amount: amount,
            date: dDate.toLocaleDateString('tr-TR')
        });

        alert("Gider başarıyla kaydedildi!");
        saveData();
        
        if (addExpenseModal) addExpenseModal.style.display = 'none';
        e.target.reset();
    });
}

// --- KM DÜZENLEME (Admin) ---
const closeEditKmModalBtn = document.getElementById('close-edit-km-modal');
if (closeEditKmModalBtn) {
    closeEditKmModalBtn.addEventListener('click', () => {
        if (editKmModal) editKmModal.style.display = 'none';
    });
}

window.openEditKmModal = function(id) {
    if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
    const car = cars.find(c => String(c.id) === String(id));
    if (!car) return;
    document.getElementById('edit-km-car-id').value = id;
    document.getElementById('new-km-input').value = car.km; 
    if (editKmModal) editKmModal.style.display = 'flex';
};

const editKmForm = document.getElementById('edit-km-form');
if (editKmForm) {
    editKmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
        const id = document.getElementById('edit-km-car-id').value;
        const newKm = parseInt(document.getElementById('new-km-input').value) || 0;
        
        const carIndex = cars.findIndex(c => String(c.id) === String(id));
        if (carIndex !== -1) {
            cars[carIndex].km = newKm;
            saveData();
        }
        if (editKmModal) editKmModal.style.display = 'none';
    });
}

// --- KİRALAMA İŞLEMİ (Tüm Personel) ---
window.openRentModal = function(id) {
    const car = cars.find(c => String(c.id) === String(id));
    if (!car) return;
    document.getElementById('rent-car-id').value = id;
    document.getElementById('rent-km').value = car.km; 
    document.getElementById('renter-name').value = ''; 
    document.getElementById('daily-price').value = ''; 
    document.getElementById('rent-notes').value = ''; 
    document.getElementById('employee-name').value = currentUser;
    document.getElementById('rent-date').valueAsDate = new Date(); 
    
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('expected-return-date').valueAsDate = tomorrow;
    
    if (rentModal) rentModal.style.display = 'flex';
};

const closeRentModalBtn = document.getElementById('close-rent-modal');
if (closeRentModalBtn) {
    closeRentModalBtn.addEventListener('click', () => {
        if (rentModal) rentModal.style.display = 'none';
    });
}

const rentCarForm = document.getElementById('rent-car-form');
if (rentCarForm) {
    rentCarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('rent-car-id').value;
        const carIndex = cars.findIndex(c => String(c.id) === String(id));
        if (carIndex === -1) return;

        const rentDateStr = document.getElementById('rent-date').value;
        const expectedReturnStr = document.getElementById('expected-return-date').value;
        const dailyPrice = parseInt(document.getElementById('daily-price').value) || 0;
        const notes = document.getElementById('rent-notes').value;

        const plannedDays = calculateTotalDays(rentDateStr, expectedReturnStr);
        const initialCost = plannedDays * dailyPrice;

        cars[carIndex].status = 'rented';
        cars[carIndex].rentDate = rentDateStr;
        cars[carIndex].expectedReturnDate = expectedReturnStr; 
        cars[carIndex].renterName = document.getElementById('renter-name').value; 
        cars[carIndex].employeeName = currentUser;
        cars[carIndex].dailyPrice = dailyPrice; 
        cars[carIndex].notes = notes;
        
        const enteredStartKm = parseInt(document.getElementById('rent-km').value) || 0;
        cars[carIndex].startKm = enteredStartKm; 
        cars[carIndex].km = enteredStartKm; 

        const today = new Date();
        const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        if (!revenueData[monthKey] || typeof revenueData[monthKey] !== 'object') {
            revenueData[monthKey] = { total: 0, details: [] };
        }

        let displayPlate = cars[carIndex].plate ? ` - ${cars[carIndex].plate}` : '';

        revenueData[monthKey].total += initialCost;
        revenueData[monthKey].details.push({
            type: 'income',
            carId: cars[carIndex].id,
            carName: `${cars[carIndex].brand} ${cars[carIndex].model}${displayPlate}`, 
            renter: cars[carIndex].renterName,
            employee: currentUser,
            days: plannedDays,
            distanceTraveled: '-',
            extraKm: 0,
            extraKmCost: 0,
            amount: initialCost,
            date: today.toLocaleDateString('tr-TR')
        });

        alert(`Araç başarıyla kiraya verildi!\nPlanlanan Süre: ${plannedDays} Gün\nPeşin Alınan Kiralama Ücreti: ${initialCost} ₺\nToplam KM Hakkı: ${plannedDays * 300} KM`);

        saveData();
        if (rentModal) rentModal.style.display = 'none';
    });
}

// --- KİRA BİLGİLERİNİ DÜZENLEME (Admin) ---
window.openEditRentalModal = function(id) {
    if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
    const car = cars.find(c => String(c.id) === String(id));
    if (!car) return;

    originalExpectedReturnDate = car.expectedReturnDate;

    document.getElementById('edit-rental-car-id').value = id;
    document.getElementById('edit-renter-name').value = car.renterName || '';
    document.getElementById('edit-daily-price').value = car.dailyPrice || '';
    document.getElementById('edit-expected-return-date').value = car.expectedReturnDate || '';
    document.getElementById('edit-rent-km').value = car.startKm !== null && car.startKm !== undefined ? car.startKm : (car.km || 0);
    document.getElementById('edit-rent-notes').value = car.notes || '';

    const infoBox = document.getElementById('extension-info-box');
    if (infoBox) infoBox.style.display = 'none';

    if (editRentalModal) editRentalModal.style.display = 'flex';
};

const closeEditRentalModalBtn = document.getElementById('close-edit-rental-modal');
if (closeEditRentalModalBtn) {
    closeEditRentalModalBtn.addEventListener('click', () => {
        if (editRentalModal) editRentalModal.style.display = 'none';
    });
}

function calculateExtensionCost() {
    const newDateStr = document.getElementById('edit-expected-return-date').value;
    const dailyPrice = parseInt(document.getElementById('edit-daily-price').value) || 0;
    const infoBox = document.getElementById('extension-info-box');
    const daysText = document.getElementById('extension-days-text');
    const costText = document.getElementById('extension-cost-text');

    if (!originalExpectedReturnDate || !newDateStr || dailyPrice <= 0) {
        if (infoBox) infoBox.style.display = 'none';
        return 0;
    }

    const [oY, oM, oD] = originalExpectedReturnDate.split('-').map(Number);
    const origDate = new Date(oY, oM - 1, oD);

    const [nY, nM, nD] = newDateStr.split('-').map(Number);
    const newDate = new Date(nY, nM - 1, nD);

    const diffDays = Math.round((newDate - origDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
        const extraCost = diffDays * dailyPrice;
        if (daysText) daysText.innerText = diffDays;
        if (costText) costText.innerText = extraCost.toLocaleString('tr-TR');
        if (infoBox) infoBox.style.display = 'flex';
        return extraCost;
    } else {
        if (infoBox) infoBox.style.display = 'none';
        return 0;
    }
}

const editReturnDateInput = document.getElementById('edit-expected-return-date');
if (editReturnDateInput) {
    editReturnDateInput.addEventListener('input', calculateExtensionCost);
}

const editDailyPriceInput = document.getElementById('edit-daily-price');
if (editDailyPriceInput) {
    editDailyPriceInput.addEventListener('input', calculateExtensionCost);
}

const editRentalForm = document.getElementById('edit-rental-form');
if (editRentalForm) {
    editRentalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");

        const id = document.getElementById('edit-rental-car-id').value;
        const carIndex = cars.findIndex(c => String(c.id) === String(id));
        if (carIndex === -1) {
            alert("Araç bulunamadı!");
            return;
        }

        const newReturnDateStr = document.getElementById('edit-expected-return-date').value;
        const dailyPrice = parseInt(document.getElementById('edit-daily-price').value) || 0;
        const renterName = document.getElementById('edit-renter-name').value;
        const newStartKm = parseInt(document.getElementById('edit-rent-km').value) || 0;
        const rentNotes = document.getElementById('edit-rent-notes').value;

        let extraDays = 0;
        let extraCost = 0;

        if (originalExpectedReturnDate && newReturnDateStr) {
            const [oY, oM, oD] = originalExpectedReturnDate.split('-').map(Number);
            const origDate = new Date(oY, oM - 1, oD);

            const [nY, nM, nD] = newReturnDateStr.split('-').map(Number);
            const newDate = new Date(nY, nM - 1, nD);

            extraDays = Math.round((newDate - origDate) / (1000 * 60 * 60 * 24));
            if (extraDays > 0) {
                extraCost = extraDays * dailyPrice;
            }
        }

        cars[carIndex].renterName = renterName;
        cars[carIndex].dailyPrice = dailyPrice;
        cars[carIndex].expectedReturnDate = newReturnDateStr;
        cars[carIndex].startKm = newStartKm;
        cars[carIndex].km = newStartKm;
        cars[carIndex].notes = rentNotes;

        if (extraCost > 0) {
            const today = new Date();
            const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
            
            if (!revenueData[monthKey] || typeof revenueData[monthKey] !== 'object') {
                revenueData[monthKey] = { total: 0, details: [] };
            }

            let displayPlate = cars[carIndex].plate ? ` - ${cars[carIndex].plate}` : '';

            revenueData[monthKey].total += extraCost;
            revenueData[monthKey].details.push({
                type: 'income',
                carId: cars[carIndex].id,
                carName: `${cars[carIndex].brand} ${cars[carIndex].model}${displayPlate} (Süre Uzatma)`, 
                renter: cars[carIndex].renterName,
                employee: currentUser,
                days: extraDays,
                distanceTraveled: '-',
                extraKm: 0,
                extraKmCost: 0,
                amount: extraCost,
                date: today.toLocaleDateString('tr-TR')
            });

            const newTotalDays = calculateTotalDays(cars[carIndex].rentDate, newReturnDateStr);
            alert(`Kiralama süresi ${extraDays} gün uzatıldı!\nExtra Alınan Tutar: +${extraCost} ₺\nYeni Toplam KM Limiti: ${newTotalDays * 300} KM oldu.`);
        } else {
            alert("Kiralama bilgileri başarıyla güncellendi!");
        }

        saveData();
        if (editRentalModal) editRentalModal.style.display = 'none';
    });
}

// --- TESLİM ALMA VE KM AŞIM HESAPLAMA İŞLEMİ (Tüm Personel) ---
window.openReturnModal = function(id) {
    const car = cars.find(c => String(c.id) === String(id));
    if (!car) return;
    document.getElementById('return-car-id').value = id;
    document.getElementById('return-start-km').innerText = car.startKm;
    document.getElementById('return-km').min = car.startKm; 
    document.getElementById('return-km').value = '';
    
    const existingGroup = document.getElementById('extra-km-price-group');
    if (existingGroup) existingGroup.remove();

    if (returnModal) returnModal.style.display = 'flex';
};

const closeReturnModalBtn = document.getElementById('close-return-modal');
if (closeReturnModalBtn) {
    closeReturnModalBtn.addEventListener('click', () => {
        if (returnModal) returnModal.style.display = 'none';
    });
}

const returnKmInput = document.getElementById('return-km');
if (returnKmInput) {
    returnKmInput.addEventListener('input', (e) => {
        const id = document.getElementById('return-car-id').value;
        const car = cars.find(c => String(c.id) === String(id));
        if (!car || car.startKm === null || car.startKm === undefined || !car.rentDate) return;

        const returnKm = parseInt(e.target.value) || 0;
        if (returnKm < car.startKm) return;

        const distanceTraveled = returnKm - car.startKm;
        const totalDays = calculateTotalDays(car.rentDate, car.expectedReturnDate);
        const allowedKm = totalDays * 300;

        const form = document.getElementById('return-car-form');
        let extraKmInputContainer = document.getElementById('extra-km-price-group');

        if (distanceTraveled > allowedKm) {
            if (!extraKmInputContainer && form) {
                const div = document.createElement('div');
                div.className = 'input-group';
                div.id = 'extra-km-price-group';
                div.innerHTML = `
                    <label style="color: #fbbf24;">⚠️ KM Aşımı Tespit Edildi! (${distanceTraveled - allowedKm} KM fazla). Birim Ücret (₺/KM)</label>
                    <input type="number" id="extra-km-price" required value="5" placeholder="Örn: 5">
                `;
                form.insertBefore(div, form.querySelector('button'));
            }
        } else {
            if (extraKmInputContainer) {
                extraKmInputContainer.remove();
            }
        }
    });
}

const returnCarForm = document.getElementById('return-car-form');
if (returnCarForm) {
    returnCarForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('return-car-id').value;
        const returnKm = parseInt(document.getElementById('return-km').value) || 0;
        
        const extraKmPriceInput = document.getElementById('extra-km-price');
        const extraKmPrice = extraKmPriceInput ? (parseFloat(extraKmPriceInput.value) || 0) : 0;
        
        const carIndex = cars.findIndex(c => String(c.id) === String(id));
        if (carIndex === -1) return;
        
        if (returnKm < cars[carIndex].startKm) {
            alert("Dönüş kilometresi, çıkış kilometresinden küçük olamaz!");
            return;
        }

        const distanceTraveled = returnKm - cars[carIndex].startKm;
        const totalDays = calculateTotalDays(cars[carIndex].rentDate, cars[carIndex].expectedReturnDate);
        const allowedKm = totalDays * 300;

        let extraKm = 0;
        let extraKmCost = 0;

        if (distanceTraveled > allowedKm) {
            extraKm = distanceTraveled - allowedKm;
            extraKmCost = extraKm * extraKmPrice;
        }

        const today = new Date();
        const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        if (!revenueData[monthKey] || typeof revenueData[monthKey] !== 'object') {
            revenueData[monthKey] = { total: 0, details: [] };
        }

        let displayPlate = cars[carIndex].plate ? ` - ${cars[carIndex].plate}` : '';

        if (extraKmCost > 0) {
            revenueData[monthKey].total += extraKmCost;
            revenueData[monthKey].details.push({
                type: 'income',
                carId: cars[carIndex].id,
                carName: `${cars[carIndex].brand} ${cars[carIndex].model}${displayPlate} (KM Aşım Bedeli)`, 
                renter: cars[carIndex].renterName,
                employee: currentUser,
                days: totalDays,
                distanceTraveled: distanceTraveled,
                extraKm: extraKm,
                extraKmCost: extraKmCost,
                amount: extraKmCost,
                date: today.toLocaleDateString('tr-TR')
            });
        }

        let alertMessage = `Araç başarıyla teslim alındı!\n\n` +
                           `Toplam Kiralama Süresi: ${totalDays} Gün\n` +
                           `Yapılan Toplam Yol: ${distanceTraveled} KM\n` +
                           `Toplam Yasal KM Limiti (${totalDays} Gün x 300 KM): ${allowedKm} KM\n`;

        if (extraKm > 0) {
            alertMessage += `\n⚠️ Aşım Miktarı: ${extraKm} KM\n` +
                            `Birim Fiyat: ${extraKmPrice} ₺/KM\n` +
                            `Ekstra KM Ücreti: +${extraKmCost} ₺ tahsilata işlendi.\n`;
        } else {
            alertMessage += `\n✅ KM aşımı yapılmamıştır. Ekstra ücret alınmadı.\n`;
        }

        alert(alertMessage);

        cars[carIndex].status = 'available';
        cars[carIndex].km = returnKm; 
        cars[carIndex].rentDate = null;
        cars[carIndex].expectedReturnDate = null; 
        cars[carIndex].renterName = null; 
        cars[carIndex].employeeName = null; 
        cars[carIndex].dailyPrice = null;
        cars[carIndex].startKm = null;
        cars[carIndex].notes = '';
        
        saveData();
        if (returnModal) returnModal.style.display = 'none';
    });
}

// --- YÖNETİCİ: YANLIŞ KAYIT SİLME (Admin) ---
window.deleteRevenueItem = function(monthKey, index) {
    if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
    if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
        const item = revenueData[monthKey].details[index];
        
        if (item.type === 'expense') {
            revenueData[monthKey].total += item.amount;
        } else {
            revenueData[monthKey].total -= item.amount;
        }
        
        revenueData[monthKey].details.splice(index, 1);

        if (revenueData[monthKey].details.length === 0) {
            delete revenueData[monthKey];
        }

        saveData();
    }
};

// --- EXCEL'E AKTAR İŞLEMİ (.XLS) ---
const exportExcelBtn = document.getElementById('export-excel-btn');
if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
        if (Object.keys(revenueData).length === 0) {
            alert("Dışa aktarılacak işlem verisi bulunmuyor.");
            return;
        }

        const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const sortedKeys = Object.keys(revenueData).sort((a, b) => b.localeCompare(a));

        let excelTable = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <!--[if gte mso 9]>
            <xml>
                <x:ExcelWorkbook>
                    <x:ExcelWorksheets>
                        <x:ExcelWorksheet>
                            <x:Name>Tahsilat_Raporu</x:Name>
                            <x:WorksheetOptions>
                                <x:DisplayGridlines/>
                            </x:WorksheetOptions>
                        </x:ExcelWorksheet>
                    </x:ExcelWorksheets>
                </x:ExcelWorkbook>
            </xml>
            <![endif]-->
            <style>
                th { background-color: #1e293b; color: #ffffff; font-weight: bold; border: 1px solid #cbd5e1; }
                td { border: 1px solid #cbd5e1; mso-number-format:"\\@"; }
                .gelir { color: #059669; font-weight: bold; }
                .gider { color: #dc2626; font-weight: bold; }
            </style>
        </head>
        <body>
            <table border="1">
                <thead>
                    <tr>
                        <th>Ay / Yıl</th>
                        <th>İşlem Türü</th>
                        <th>Araç / Açıklama</th>
                        <th>Müşteri / Firma</th>
                        <th>Personel</th>
                        <th>Süre (Gün)</th>
                        <th>Toplam Yol (KM)</th>
                        <th>Aşan KM</th>
                        <th>Tutar (TL)</th>
                        <th>İşlem Tarihi</th>
                    </tr>
                </thead>
                <tbody>
        `;

        sortedKeys.forEach(key => {
            const monthData = revenueData[key];
            const [year, month] = key.split('-');
            const monthName = `${months[parseInt(month) - 1]} ${year}`;

            if (monthData.details && monthData.details.length > 0) {
                monthData.details.forEach(detail => {
                    const isExpense = detail.type === 'expense';
                    const typeStr = isExpense ? 'GİDER' : 'GELİR';
                    const amountClass = isExpense ? 'gider' : 'gelir';
                    const sign = isExpense ? '-' : '+';
                    
                    const car = detail.carName || '-';
                    const renter = detail.renter || '-';
                    const employee = detail.employee || '-';
                    const days = detail.days || '-';
                    const distance = detail.distanceTraveled !== undefined ? detail.distanceTraveled : '-';
                    const extraKm = detail.extraKm !== undefined ? detail.extraKm : '-';
                    const amount = `${sign}${detail.amount.toLocaleString('tr-TR')} ₺`;
                    const date = detail.date || '-';

                    excelTable += `
                        <tr>
                            <td>${monthName}</td>
                            <td class="${amountClass}">${typeStr}</td>
                            <td>${car}</td>
                            <td>${renter}</td>
                            <td>${employee}</td>
                            <td align="center">${days}</td>
                            <td align="center">${distance}</td>
                            <td align="center">${extraKm}</td>
                            <td class="${amountClass}" align="right">${amount}</td>
                            <td align="center">${date}</td>
                        </tr>
                    `;
                });
            }
        });

        excelTable += `
                </tbody>
            </table>
        </body>
        </html>
        `;

        const blob = new Blob([excelTable], { type: 'application/vnd.ms-excel;charset=utf-8' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        
        const todayStr = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
        link.setAttribute("download", `Gelir_Gider_Raporu_${todayStr}.xls`);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// --- PDF OLARAK İNDİR (YAZDIR) ---
const exportPdfBtn = document.getElementById('export-pdf-btn');
if (exportPdfBtn) {
    exportPdfBtn.addEventListener('click', () => {
        if (Object.keys(revenueData).length === 0) {
            alert("Dışa aktarılacak işlem verisi bulunmuyor.");
            return;
        }
        window.print();
    });
}

window.deleteCar = function(id) {
    if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
    if(confirm('Bu aracı silmek istediğinize emin misiniz?')) {
        cars = cars.filter(c => String(c.id) !== String(id));
        saveData();
    }
};

loadDataFromDB();