const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = path.join(__dirname, '../Precios web-comparativa.xlsx');
const jsonPath = path.join(__dirname, 'src/data/products.json');

function importData() {
    console.log('Leyendo Excel...');
    const workbook = XLSX.readFile(excelPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const products = [];
    
    // Saltamos la cabecera (i=1)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row[0]) continue; // Skip empty rows

        products.push({
            id: i,
            name: row[0],
            sku: `PROD-${i}`,
            links: {
                'tiendauniverso.com.ar': row[3] || null,
                'somosrex.com': row[5] || null,
                'prestigio.com.ar': row[7] || null,
                'pisano.com.ar': row[9] || null,
                'pintureriasambito.com': row[11] || null,
                'pintecord.com.ar': row[13] || null,
                'pintureriagarin.com': row[15] || null,
                'pintureriasmercurio.com.ar': row[17] || null
            },
            prices: {}
        });
    }

    fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2));
    console.log(`¡Importación completada! Se cargaron ${products.length} productos.`);
}

importData();
