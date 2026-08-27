# 🚗 kirada • Akıllı Filo & Gelir Yönetim Sistemi

**kirada**, araç kiralama (Rent a Car) işletmeleri için tasarlanmış; filo operasyonlarını, kiralama sözleşmelerini, akıllı kilometre takibini ve anlık gelir-gider (ön muhasebe) dengesini tek bir noktadan yöneten modern, bulut tabanlı bir yönetim panelidir.

---

## 🌟 Öne Çıkan Yetenekler ve Özellikler

### 1. 👥 Rol Tabanlı Kullanıcı & Güvenlik Sistemi
- **Operatör & Yönetici Ayrımı:** Personeller (Güven Akbulut, Anıl Şeker) kiralama, teslim alma ve gider girişlerini yönetebilir.
- **Yönetici Paneli (PIN Korumalı):** Egemen Akbulut için özel şifre korumalı yetkilendirme; araç ekleme/silme, geçmiş finansal kayıtları düzeltme ve kilometre revize yetkileri.
- **Kullanıcı Takibi:** Hangi işlemi hangi personelin yaptığı (araç kiralama, süre uzatma, gider girişi) kayıt altına alınır.

---

### 2. 🚘 Dinamik Filo & Kiralama Operasyonları
- **Peşin Tahsilat Mimarisi:** Araç kiraya verilirken günlük ücret $\times$ gün sayısı üzerinden peşin kiralama bedeli otomatik hesaplanır ve kasaya işlenir.
- **Kiralama Parametrelerini Canlı Düzenleme:** Araç kiradayken müşteri adı, çıkış kilometresi veya günlük ücret aracı teslim almaya gerek kalmadan güncellenebilir.
- **Süre Uzatma & Canlı Fark Hesabı:** Kiralama süresi ileri bir tarihe çekildiğinde, uzatılan gün sayısı ve ekstra tahsil edilmesi gereken tutar anlık hesaplanarak ekranda gösterilir ve tahsilata yansıtılır.
- **Operasyonel Not Defteri:** Her kiralamaya özel ekspertiz, depo durumu veya araç içi notlar (örn: *Ruhsat torpidoda, 4/4 depo*) eklenebilir ve araç kartı üzerinde görüntülenir.
- **Girişte Gecikme & İade Bildirimi:** Uygulama açıldığında bugün dönmesi gereken veya iade süresi geçmiş araçlar otomatik taranarak ekranda uyarı penceresiyle listelenir.

---

### 3. ⏱️ Akıllı Kilometre & Aşım Takibi
- **Sözleşmeye Duyarlı Dinamik Limit:** Yasal kilometre hakkı, toplam kiralama süresi üzerinden hesaplanır (**Günlük 300 KM**). Süre uzatıldığında yasal limit otomatik olarak artar (Örn: 2 gün = 600 KM $\rightarrow$ 3 gün = 900 KM).
- **Otomatik Aşım Tespiti:** Araç teslim alınırken girilen dönüş KM'si limiti aştığı an sistem dinamik birim fiyat kutusunu açar.
- **Aşım Bedeli Tahsilatı:** Teslim alma anında sadece aşım tutarı hesaplanıp o ayın gelir hanesine eklenir.

---

### 4. 📊 Çift Sütunlu Finans & Ön Muhasebe
- **Sol Gelir / Sağ Gider Ayrımı:** Aylık operasyonlar tek ekranda; sol tarafta araç kiralama gelirleri, sağ tarafta şirket/araç giderleri olarak listelenir.
- **Kategori Bazlı Gider Girişi:** "Araç Bakım / Mekanik & Yedek Parça" ve "Genel Şirket & Operasyon" seçenekleriyle tüm personeller harcama kaydedebilir.
- **Anlık Net Durum:** Üst bilgi kartlarında ayın Toplam Geliri (+), Toplam Gideri (-) ve Net Kâr/Zarar durumu anlık hesaplanır.

---

### 5. 📑 Raporlama & Dışa Aktarma
- **Türkçe Karakter Uyumlu Excel (`.xls`):** Tüm gelir ve gider dökümü; araç, müşteri, personel, süre, yapılan yol, aşan KM ve tutar detaylarıyla birlikte eski/yeni tüm Excel sürümlerinde bozulmadan açılacak şekilde indirilir.
- **Resmi PDF / Yazdırma:** Yazıcıya veya PDF'e aktarılırken gereksiz butonları ve menüleri gizleyen optimize yazdırma stili.

---

## 🛠️ Kullanılan Teknolojiler

- **Frontend:** Vanilla JavaScript (ES6+), HTML5, Modern CSS3 (Glassmorphism & Flexbox/Grid), FontAwesome 6, Google Fonts (Plus Jakarta Sans).
- **Backend:** Node.js, Express.js.
- **Veritabanı:** Turso Database (LibSQL / Cloud SQLite).
- **Barındırma / Dağıtım:** Render / Cloud Deployment.

---

## 🚀 Kurulum ve Yerel Çalıştırma

1. **Projeyi Klonlayın:**
   ```bash
   git clone <repo-url>
   cd kirada
