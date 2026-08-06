// Tüm araçları getir
app.get('/api/cars', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM cars");
        res.json(result.rows || []); // Garanti olsun diye dizi döndürüyoruz
    } catch (err) {
        console.error("Araçları getirme hatası:", err);
        res.json([]); // Hata olsa bile boş dizi döndür ki frontend patlamasın
    }
});

// Tahsilat geçmişini getir
app.get('/api/revenue', async (req, res) => {
    try {
        const result = await db.execute("SELECT * FROM revenue");
        let revenueData = {};
        if (result && result.rows) {
            result.rows.forEach(row => {
                revenueData[row.monthKey] = {
                    total: row.total,
                    details: JSON.parse(row.details || '[]')
                };
            });
        }
        res.json(revenueData);
    } catch (err) {
        console.error("Tahsilat getirme hatası:", err);
        res.json({});
    }
});