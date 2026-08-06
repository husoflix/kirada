// --- TESLİM ALMA VE KM AŞIM HESAPLAMA İŞLEMİ ---
function openReturnModal(id) {
    const car = cars.find(c => c.id === id);
    document.getElementById('return-car-id').value = id;
    document.getElementById('return-start-km').innerText = car.startKm;
    document.getElementById('return-km').min = car.startKm; 
    document.getElementById('return-km').value = '';
    
    // Önceki input kaldıysa temizle
    const existingGroup = document.getElementById('extra-km-price-group');
    if (existingGroup) existingGroup.remove();

    returnModal.style.display = 'flex';
}
document.getElementById('close-return-modal').addEventListener('click', () => returnModal.style.display = 'none');

// Dönüş KM'si girildiğinde KM aşımı olup olmadığını kontrol et
document.getElementById('return-km').addEventListener('input', (e) => {
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

    // Eğer yapılan yol yasal hakkı (300 * gün) geçtiyse KM aşım ücreti inputunu göster
    if (distanceTraveled > allowedKm) {
        if (!extraKmInputContainer) {
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
        // Aşım yoksa inputu gizle/kaldır
        if (extraKmInputContainer) {
            extraKmInputContainer.remove();
        }
    }
});

document.getElementById('return-car-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('return-car-id').value;
    const returnKm = parseInt(document.getElementById('return-km').value);
    
    const extraKmPriceInput = document.getElementById('extra-km-price');
    const extraKmPrice = extraKmPriceInput ? (parseFloat(extraKmPriceInput.value) || 0) : 0;
    
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
    returnModal.style.display = 'none';
});