// Başlangıç değişkenleri
let cars = [];
let revenueData = {};
let currentUser = localStorage.getItem('rentACarUser') || null; 
let isAdmin = localStorage.getItem('rentACarIsAdmin') === 'true';

// Yönetici şifresi
const ADMIN_PASSWORD = "egemen123"; 

// DOM Elementleri
const carsContainer = document.getElementById('cars-container');
const totalCarsEl = document.getElementById('total-cars');
const rentedCarsEl = document.getElementById('rented-cars');
const dashboardSection = document.getElementById('dashboard-section');
const revenueSection = document.getElementById('revenue-section');

const addModal = document.getElementById('add-car-modal');
const rentModal = document.getElementById('rent-car-modal');
const returnModal = document.getElementById('return-car-modal');
const editKmModal = document.getElementById('edit-km-modal'); 

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

    if (!currentUser) {
        if (loginScreen) loginScreen.style.display = 'flex';
    } else {
        if (loginScreen) loginScreen.style.display = 'none';
        if (loggedInUserEl) loggedInUserEl.innerText = currentUser;
        
        if (navAddCar) {
            navAddCar.style.display = isAdmin ? 'block' : 'none';
        }
    }

    renderCars();
    updateStats();
    renderRevenue();
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
        if(!isAvailable) {
            rentDetails = `
                <p><i class="fa-solid fa-user"></i> Müşteri: <strong>${car.renterName}</strong></p>
                <p><i class="fa-solid fa-user-tie"></i> Personel: <strong>${car.employeeName}</strong></p>
                <p><i class="fa-regular fa-calendar"></i> Çıkış: <strong>${car.rentDate}</strong></p>
                <p><i class="fa-solid fa-money-bill-wave"></i> Günlük Ücret: <strong>${car.dailyPrice} ₺</strong></p>
            `;
        }

        let editKmIcon = (isAvailable && isAdmin)
            ? `<i class="fa-solid fa-pen edit-icon" onclick="openEditKmModal('${car.id}')" title="KM Düzenle"></i>` 
            : '';

        let displayPlate = car.plate ? car.plate : 'PLAKA YOK';
        let deleteButtonHtml = isAdmin 
            ? `<button class="btn-danger" onclick="deleteCar('${car.id}')"><i class="fa-solid fa-trash"></i></button>` 
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
            </div>
            <div class="card-actions">
                ${isAvailable 
                    ? `<button class="btn-success" onclick="openRentModal('${car.id}')">Kirala</button>`
                    : `<button class="btn-warning" onclick="openReturnModal('${car.id}')">Teslim Al</button>`
                }
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

function renderRevenue() {
    const container = document.getElementById('revenue-container');
    if (!container) return;
    container.innerHTML = '';
    const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

    const sortedKeys = Object.keys(revenueData).sort((a, b) => b.localeCompare(a));

    if(sortedKeys.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Henüz bir tahsilat kaydı bulunmuyor. Araç teslim alındığında buraya eklenecektir.</p>';
        return;
    }

    let htmlContent = '';

    sortedKeys.forEach(key => {
        const monthData = revenueData[key];
        const [year, month] = key.split('-');
        const monthName = months[parseInt(month) - 1];

        let detailsHtml = '';
        if (monthData.details && monthData.details.length > 0) {
            monthData.details.forEach((detail, index) => {
                let employeeText = detail.employee ? `Personel: ${detail.employee}, ` : '';
                let extraKmText = detail.extraKmCost ? ` (Aşan KM Ücreti: ${detail.extraKmCost} ₺)` : '';
                
                let deleteRevBtn = isAdmin 
                    ? `<button onclick="deleteRevenueItem('${key}', ${index})" style="background:none; border:none; color:var(--danger); cursor:pointer; margin-left:10px;" title="Kaydı Sil"><i class="fa-solid fa-trash"></i></button>`
                    : '';

                detailsHtml += `
                    <div class="revenue-detail-item" style="display: flex; justify-content: space-between; align-items: center;">
                        <div class="car-info">
                            <i class="fa-solid fa-car"></i> <span>${detail.carName}</span>
                            (Müşteri: ${detail.renter}, ${employeeText}${detail.days} Gün)${extraKmText}
                        </div>
                        <div style="display: flex; align-items: center;">
                            <div class="car-income">${detail.amount.toLocaleString('tr-TR')} ₺</div>
                            ${deleteRevBtn}
                        </div>
                    </div>
                `;
            });
        } else {
            detailsHtml = `<div class="revenue-detail-item" style="justify-content:center;">Detay bulunamadı.</div>`;
        }

        htmlContent += `
            <div class="revenue-card">
                <div class="revenue-card-header">
                    <div class="revenue-month">${monthName} ${year} Tahsilatı</div>
                    <div class="revenue-total">Toplam: ${monthData.total.toLocaleString('tr-TR')} ₺</div>
                </div>
                <div class="revenue-details-list">
                    ${detailsHtml}
                </div>
            </div>
        `;
    });

    container.innerHTML = htmlContent;
}

// --- ARAÇ EKLEME ---
const navAddCarBtn = document.getElementById('nav-add-car');
if (navAddCarBtn) {
    navAddCarBtn.addEventListener('click', () => {
        if (isAdmin && addModal) addModal.style.display = 'flex';
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
            km: parseInt(document.getElementById('car-km').value),
            status: 'available',
            rentDate: null,
            expectedReturnDate: null, 
            renterName: null, 
            employeeName: null,
            dailyPrice: null,
            startKm: null
        };
        cars.push(newCar);
        saveData();
        if (addModal) addModal.style.display = 'none';
        e.target.reset();
    });
}

// --- KM DÜZENLEME ---
const closeEditKmModalBtn = document.getElementById('close-edit-km-modal');
if (closeEditKmModalBtn) {
    closeEditKmModalBtn.addEventListener('click', () => {
        if (editKmModal) editKmModal.style.display = 'none';
    });
}

window.openEditKmModal = function(id) {
    if (!isAdmin) return;
    const car = cars.find(c => c.id === id);
    if (!car) return;
    document.getElementById('edit-km-car-id').value = id;
    document.getElementById('new-km-input').value = car.km; 
    if (editKmModal) editKmModal.style.display = 'flex';
};

const editKmForm = document.getElementById('edit-km-form');
if (editKmForm) {
    editKmForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!isAdmin) return;
        const id = document.getElementById('edit-km-car-id').value;
        const newKm = parseInt(document.getElementById('new-km-input').value);
        
        const carIndex = cars.findIndex(c => c.id === id);
        if (carIndex !== -1) {
            cars[carIndex].km = newKm;
            saveData();
        }
        if (editKmModal) editKmModal.style.display = 'none';
    });
}

// --- KİRALAMA İŞLEMLERİ ---
window.openRentModal = function(id) {
    const car = cars.find(c => c.id === id);
    if (!car) return;
    document.getElementById('rent-car-id').value = id;
    document.getElementById('rent-km').value = car.km; 
    document.getElementById('renter-name').value = ''; 
    document.getElementById('daily-price').value = ''; 
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
        const carIndex = cars.findIndex(c => c.id === id);
        if (carIndex === -1) return;

        cars[carIndex].status = 'rented';
        cars[carIndex].rentDate = document.getElementById('rent-date').value;
        cars[carIndex].expectedReturnDate = document.getElementById('expected-return-date').value; 
        cars[carIndex].renterName = document.getElementById('renter-name').value; 
        cars[carIndex].employeeName = currentUser;
        cars[carIndex].dailyPrice = parseInt(document.getElementById('daily-price').value); 
        
        const enteredStartKm = parseInt(document.getElementById('rent-km').value);
        cars[carIndex].startKm = enteredStartKm; 
        cars[carIndex].km = enteredStartKm; 
        
        saveData();
        if (rentModal) rentModal.style.display = 'none';
    });
}

// --- TESLİM ALMA VE KM AŞIM HESAPLAMA İŞLEMİ ---
window.openReturnModal = function(id) {
    const car = cars.find(c => c.id === id);
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
        const car = cars.find(c => c.id === id);
        if (!car || !car.startKm || !car.rentDate) return;

        const returnKm = parseInt(e.target.value) || 0;
        if (returnKm < car.startKm) return;

        const distanceTraveled = returnKm - car.startKm;
        const rentDate = new Date(car.rentDate);
        const today = new Date(); 
        
        const diffTime = Math.abs(today - rentDate);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if(diffDays === 0) diffDays = 1; 

        const allowedKm = diffDays * 300;
        const form = document.getElementById('return-car-form');
        let extraKmInputContainer = document.getElementById('extra-km-price-group');

        if (distanceTraveled > allowedKm) {
            if (!extraKmInputContainer && form) {
                const div = document.createElement('div');
                div.className = 'input-group';
                div.id = 'extra-km-price-group';
                div.innerHTML = `
                    <label style="color: var(--warning);">⚠️ KM Aşımı Tespit Edildi! (${distanceTraveled - allowedKm} KM fazla). Birim Ücret (₺/KM)</label>
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
        const returnKm = parseInt(document.getElementById('return-km').value);
        
        const extraKmPriceInput = document.getElementById('extra-km-price');
        const extraKmPrice = extraKmPriceInput ? (parseFloat(extraKmPriceInput.value) || 0) : 0;
        
        const carIndex = cars.findIndex(c => c.id === id);
        if (carIndex === -1) return;
        
        if(returnKm < cars[carIndex].startKm) {
            alert("Dönüş kilometresi, çıkış kilometresinden küçük olamaz!");
            return;
        }

        const distanceTraveled = returnKm - cars[carIndex].startKm;
        const rentDate = new Date(cars[carIndex].rentDate);
        const today = new Date(); 
        
        const diffTime = Math.abs(today - rentDate);
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if(diffDays === 0) diffDays = 1; 

        const allowedKm = diffDays * 300;
        let extraKm = 0;
        let extraKmCost = 0;

        if (distanceTraveled > allowedKm) {
            extraKm = distanceTraveled - allowedKm;
            extraKmCost = extraKm * extraKmPrice;
        }

        const rentalBaseCost = diffDays * cars[carIndex].dailyPrice;
        const totalCost = rentalBaseCost + extraKmCost;

        const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        if (!revenueData[monthKey] || typeof revenueData[monthKey] !== 'object') {
            revenueData[monthKey] = { total: 0, details: [] };
        }

        let displayPlate = cars[carIndex].plate ? ` - ${cars[carIndex].plate}` : '';

        revenueData[monthKey].total += totalCost;
        revenueData[monthKey].details.push({
            carName: `${cars[carIndex].brand} ${cars[carIndex].model}${displayPlate}`, 
            renter: cars[carIndex].renterName,
            employee: currentUser,
            days: diffDays,
            amount: totalCost,
            extraKmCost: extraKmCost,
            date: today.toLocaleDateString('tr-TR')
        });

        let alertMessage = `Araç teslim alındı!\n\n` +
                           `Kiralama Süresi: ${diffDays} Gün\n` +
                           `Yapılan Toplam Yol: ${distanceTraveled} KM\n` +
                           `Yasal KM Hakkı (${diffDays} gün x 300 KM): ${allowedKm} KM\n`;

        if (extraKm > 0) {
            alertMessage += `⚠️ Aşım Miktarı: ${extraKm} KM\n` +
                            `Extra Ücret: +${extraKmCost} ₺\n`;
        } else {
            alertMessage += `✅ KM aşımı yapılmamıştır (Hak edilen sınır içindeydi).\n`;
        }

        alertMessage += `\nToplam Tahsil Edilecek Tutar: ${totalCost} ₺`;
        alert(alertMessage);

        cars[carIndex].status = 'available';
        cars[carIndex].km = returnKm; 
        cars[carIndex].rentDate = null;
        cars[carIndex].expectedReturnDate = null; 
        cars[carIndex].renterName = null; 
        cars[carIndex].employeeName = null; 
        cars[carIndex].dailyPrice = null;
        cars[carIndex].startKm = null;
        
        saveData();
        if (returnModal) returnModal.style.display = 'none';
    });
}

// --- YÖNETİCİ: YANLIŞ TAHSİLAT KAYDINI SİLME ---
window.deleteRevenueItem = function(monthKey, index) {
    if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
    if (confirm("Bu tahsilat kaydını silmek istediğinize emin misiniz?")) {
        const item = revenueData[monthKey].details[index];
        revenueData[monthKey].total -= item.amount;
        revenueData[monthKey].details.splice(index, 1);

        if (revenueData[monthKey].details.length === 0) {
            delete revenueData[monthKey];
        }

        saveData();
    }
};

// --- EXCEL'E AKTAR İŞLEMİ ---
const exportExcelBtn = document.getElementById('export-excel-btn');
if (exportExcelBtn) {
    exportExcelBtn.addEventListener('click', () => {
        if(Object.keys(revenueData).length === 0) {
            alert("Dışa aktarılacak tahsilat verisi bulunmuyor.");
            return;
        }

        let csvContent = "Ay/Yıl;Araç Bilgisi;Müşteri;Personel;Süre (Gün);Aşan KM Ücreti;Tutar (TL);Teslim Tarihi\n";
        const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
        const sortedKeys = Object.keys(revenueData).sort((a, b) => b.localeCompare(a));

        sortedKeys.forEach(key => {
            const monthData = revenueData[key];
            const [year, month] = key.split('-');
            const monthName = `${months[parseInt(month) - 1]} ${year}`;

            if (monthData.details && monthData.details.length > 0) {
                monthData.details.forEach(detail => {
                    let car = `"${detail.carName || ''}"`;
                    let renter = `"${detail.renter || ''}"`;
                    let employee = `"${detail.employee || ''}"`;
                    let days = detail.days;
                    let extraCost = detail.extraKmCost || 0;
                    let amount = detail.amount;
                    let date = `"${detail.date || ''}"`;

                    csvContent += `${monthName};${car};${renter};${employee};${days};${extraCost};${amount};${date}\n`;
                });
            }
        });

        const bom = "\uFEFF";
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        
        const todayStr = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
        link.setAttribute("download", `Tahsilat_Raporu_${todayStr}.csv`);
        
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

window.deleteCar = function(id) {
    if (!isAdmin) return alert("Bu işlem için yetkiniz yok!");
    if(confirm('Bu aracı silmek istediğinize emin misiniz?')) {
        cars = cars.filter(c => c.id !== id);
        saveData();
    }
};

loadDataFromDB();