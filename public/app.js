// LocalStorage'dan verileri çek
let cars = JSON.parse(localStorage.getItem('rentACarData')) || [];
let revenueData = JSON.parse(localStorage.getItem('rentACarRevenue')) || {};
let currentUser = localStorage.getItem('rentACarUser') || null; 

Object.keys(revenueData).forEach(key => {
    if (typeof revenueData[key] === 'number') {
        revenueData[key] = {
            total: revenueData[key],
            details: []
        };
    }
});

// DOM Elementleri
const carsContainer = document.getElementById('cars-container');
const totalCarsEl = document.getElementById('total-cars');
const rentedCarsEl = document.getElementById('rented-cars');
const dashboardSection = document.getElementById('dashboard-section');
const revenueSection = document.getElementById('revenue-section');

// Modallar
const addModal = document.getElementById('add-car-modal');
const rentModal = document.getElementById('rent-car-modal');
const returnModal = document.getElementById('return-car-modal');
const editKmModal = document.getElementById('edit-km-modal'); 

// Uygulama Başlatıcı
function initApp() {
    if (!currentUser) {
        document.getElementById('login-screen').style.display = 'flex';
    } else {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('logged-in-user').innerText = currentUser;
    }

    renderCars();
    updateStats();
    renderRevenue();
}

// --- GİRİŞ / ÇIKIŞ İŞLEMLERİ ---
window.loginUser = function(userName) {
    currentUser = userName;
    localStorage.setItem('rentACarUser', userName); 
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('logged-in-user').innerText = currentUser;
};

document.getElementById('logout-btn').addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('rentACarUser'); 
    document.getElementById('login-screen').style.display = 'flex';
});

// Verileri LocalStorage'a kaydet
function saveData() {
    localStorage.setItem('rentACarData', JSON.stringify(cars));
    localStorage.setItem('rentACarRevenue', JSON.stringify(revenueData));
    renderCars();
    updateStats();
    renderRevenue();
}

// --- MENÜ GEÇİŞLERİ ---
document.getElementById('nav-dashboard').addEventListener('click', (e) => {
    dashboardSection.style.display = 'block';
    revenueSection.style.display = 'none';
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    e.currentTarget.classList.add('active');
});

document.getElementById('nav-revenue').addEventListener('click', (e) => {
    dashboardSection.style.display = 'none';
    revenueSection.style.display = 'block';
    document.querySelectorAll('.sidebar li').forEach(li => li.classList.remove('active'));
    e.currentTarget.classList.add('active');
    renderRevenue();
});

// Araçları Ekrana Çiz
function renderCars() {
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

        let editKmIcon = isAvailable 
            ? `<i class="fa-solid fa-pen edit-icon" onclick="openEditKmModal('${car.id}')" title="KM Düzenle"></i>` 
            : '';

        let displayPlate = car.plate ? car.plate : 'PLAKA YOK';

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
                <button class="btn-danger" onclick="deleteCar('${car.id}')"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        carsContainer.appendChild(card);
    });
}

// İstatistikleri Güncelle
function updateStats() {
    totalCarsEl.innerText = cars.length;
    rentedCarsEl.innerText = cars.filter(c => c.status === 'rented').length;
}

// Aylık Tahsilatları Ekrana Çiz
function renderRevenue() {
    const container = document.getElementById('revenue-container');
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
            monthData.details.forEach(detail => {
                
                let employeeText = detail.employee ? `Personel: ${detail.employee}, ` : '';

                detailsHtml += `
                    <div class="revenue-detail-item">
                        <div class="car-info">
                            <i class="fa-solid fa-car"></i> <span>${detail.carName}</span>
                            (Müşteri: ${detail.renter}, ${employeeText}${detail.days} Gün)
                        </div>
                        <div class="car-income">${detail.amount.toLocaleString('tr-TR')} ₺</div>
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

// --- ARAÇ EKLEME İŞLEMLERİ ---
document.getElementById('add-car-btn').addEventListener('click', () => addModal.style.display = 'flex');
document.getElementById('close-add-modal').addEventListener('click', () => addModal.style.display = 'none');

document.getElementById('add-car-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
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
    addModal.style.display = 'none';
    e.target.reset();
});

// --- KM DÜZENLEME İŞLEMLERİ ---
document.getElementById('close-edit-km-modal').addEventListener('click', () => editKmModal.style.display = 'none');

function openEditKmModal(id) {
    const car = cars.find(c => c.id === id);
    document.getElementById('edit-km-car-id').value = id;
    document.getElementById('new-km-input').value = car.km; 
    
    editKmModal.style.display = 'flex';
}

document.getElementById('edit-km-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-km-car-id').value;
    const newKm = parseInt(document.getElementById('new-km-input').value);
    
    const carIndex = cars.findIndex(c => c.id === id);
    
    if(newKm < cars[carIndex].km) {
        if(!confirm("Girdiğiniz yeni KM, eski değerden düşük! Yine de değiştirmek istediğinize emin misiniz?")) {
            return;
        }
    }
    
    cars[carIndex].km = newKm;
    saveData();
    editKmModal.style.display = 'none';
});

// --- KİRALAMA İŞLEMLERİ ---
function openRentModal(id) {
    const car = cars.find(c => c.id === id);
    document.getElementById('rent-car-id').value = id;
    document.getElementById('rent-km').value = car.km; 
    document.getElementById('renter-name').value = ''; 
    document.getElementById('daily-price').value = ''; 
    
    document.getElementById('employee-name').value = currentUser;
    
    document.getElementById('rent-date').valueAsDate = new Date(); 
    
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('expected-return-date').valueAsDate = tomorrow;
    
    rentModal.style.display = 'flex';
}
document.getElementById('close-rent-modal').addEventListener('click', () => rentModal.style.display = 'none');

document.getElementById('rent-car-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('rent-car-id').value;
    
    const carIndex = cars.findIndex(c => c.id === id);
    cars[carIndex].status = 'rented';
    cars[carIndex].rentDate = document.getElementById('rent-date').value;
    cars[carIndex].expectedReturnDate = document.getElementById('expected-return-date').value; 
    cars[carIndex].renterName = document.getElementById('renter-name').value; 
    
    cars[carIndex].employeeName = document.getElementById('employee-name').value; 
    cars[carIndex].dailyPrice = parseInt(document.getElementById('daily-price').value); 
    
    const enteredStartKm = parseInt(document.getElementById('rent-km').value);
    cars[carIndex].startKm = enteredStartKm; 
    cars[carIndex].km = enteredStartKm; 
    
    saveData();
    rentModal.style.display = 'none';
});

// --- TESLİM ALMA İŞLEMLERİ ---
function openReturnModal(id) {
    const car = cars.find(c => c.id === id);
    document.getElementById('return-car-id').value = id;
    document.getElementById('return-start-km').innerText = car.startKm;
    document.getElementById('return-km').min = car.startKm; 
    document.getElementById('return-km').value = '';
    
    returnModal.style.display = 'flex';
}
document.getElementById('close-return-modal').addEventListener('click', () => returnModal.style.display = 'none');

document.getElementById('return-car-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('return-car-id').value;
    const returnKm = parseInt(document.getElementById('return-km').value);
    
    const carIndex = cars.findIndex(c => c.id === id);
    
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

    const totalCost = diffDays * cars[carIndex].dailyPrice;

    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    
    if (!revenueData[monthKey] || typeof revenueData[monthKey] !== 'object') {
        revenueData[monthKey] = { total: 0, details: [] };
    }

    let displayPlate = cars[carIndex].plate ? ` - ${cars[carIndex].plate}` : '';

    revenueData[monthKey].total += totalCost;
    revenueData[monthKey].details.push({
        carName: `${cars[carIndex].brand} ${cars[carIndex].model}${displayPlate}`, 
        renter: cars[carIndex].renterName,
        employee: cars[carIndex].employeeName,
        days: diffDays,
        amount: totalCost,
        date: today.toLocaleDateString('tr-TR')
    });

    alert(`Araç teslim alındı!\n\nYapılan Yol: ${distanceTraveled} KM\nKiralama Süresi: ${diffDays} Gün\nTahsil Edilecek Tutar: ${totalCost} ₺`);

    cars[carIndex].status = 'available';
    cars[carIndex].km = returnKm; 
    cars[carIndex].rentDate = null;
    cars[carIndex].expectedReturnDate = null; 
    cars[carIndex].renterName = null; 
    cars[carIndex].employeeName = null; 
    cars[carIndex].dailyPrice = null;
    cars[carIndex].startKm = null;
    
    saveData();
    returnModal.style.display = 'none';
});

// --- EXCEL'E AKTAR İŞLEMİ (NOKTALI VİRGÜL İLE) ---
document.getElementById('export-excel-btn').addEventListener('click', () => {
    if(Object.keys(revenueData).length === 0) {
        alert("Dışa aktarılacak tahsilat verisi bulunmuyor.");
        return;
    }

    // Türkçe Windows ve Excel için sütun ayracı olarak NOKTALI VİRGÜL (;) kullanıyoruz.
    let csvContent = "Ay/Yıl;Araç Bilgisi;Müşteri;Personel;Süre (Gün);Tutar (TL);Teslim Tarihi\n";
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
                let amount = detail.amount;
                let date = `"${detail.date || ''}"`;

                // Tüm verileri virgül yerine noktalı virgül (;) ile birleştir
                csvContent += `${monthName};${car};${renter};${employee};${days};${amount};${date}\n`;
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

// Araç Silme
function deleteCar(id) {
    if(confirm('Bu aracı silmek istediğinize emin misiniz?')) {
        cars = cars.filter(c => c.id !== id);
        saveData();
    }
}

// Uygulamayı Başlat
initApp();