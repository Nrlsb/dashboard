import axios from 'axios';
import * as cheerio from 'cheerio';

const selectors = {
    'tiendauniverso.com.ar': { 
        main: '[class*="flexRowContent--price-product-pdp"] span', 
        fraction: null 
    },
    'somosrex.com': { 
        main: '.product-info-main [data-price-type="defaultPromoPrice"].price, [data-price-type="defaultPromoPrice"] .price, [data-price-type="defaultPromoPrice"]', 
        fraction: null 
    },
    'prestigio.com.ar': { 
        main: 'meta[property="product:price:amount"]', 
        fraction: null 
    },
    'pisano.com.ar': { 
        main: '.pisano-pdp-price__online-value', 
        fraction: null 
    },
    'pintureriasambito.com': { 
        main: '[class*="sellingPriceValue"]', 
        fraction: null 
    },
    'pintecord.com.ar': { 
        main: '.oe_currency_value',
        fraction: null
    },
    'pintureriasmercurio.com.ar': { 
        main: '#PrecioDetalle',
        fraction: null
    }
};

export async function getPrice(url) {
    if (!url || !url.startsWith('http')) return null;
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        const config = selectors[domain];
        if (!config) return null;

        // Soporte especial para Pintecord (Odoo) y variantes
        if (domain === 'pintecord.com.ar' && url.includes('#attr=')) {
            try {
                const productPath = urlObj.pathname;
                // Intentar extraer el ID del producto del slug (ej: -56867)
                const match = productPath.match(/-(\d+)/);
                const productId = match ? match[1] : null;
                
                // Extraer los IDs de los atributos del hash
                const hash = url.split('#')[1] || '';
                const attrPart = hash.split('attr=')[1];
                const attrIds = attrPart ? attrPart.split(',').map(id => parseInt(id)).filter(id => !isNaN(id)) : [];

                if (productId && attrIds.length > 0) {
                    // Endpoint exacto capturado de la red
                    const { data: odooData } = await axios.post(`https://${domain}/website_sale/get_combination_info`, {
                        jsonrpc: "2.0",
                        method: "call",
                        params: {
                            product_template_id: parseInt(productId),
                            product_id: false, // Odoo acepta false aquí para buscar por combinación
                            combination: attrIds,
                            add_qty: 1,
                            parent_combination: []
                        }
                    }, { 
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 10000 
                    });

                    if (odooData?.result?.price) {
                        return odooData.result.price;
                    }
                }
            } catch (e) {
                console.error("Error fetching Odoo variant price:", e.message);
            }
        }

        const { data } = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
            },
            timeout: 15000
        });

        const $ = cheerio.load(data);
        let mainPrice = '';

        // Intentar con el selector configurado
        const el = $(config.main).first();
        
        // Priorizar atributos de datos que suelen tener el precio "limpio" o meta tags
        if (config.main.includes('meta')) {
            mainPrice = el.attr('content') || '';
        } else {
            // Intentamos obtener el valor numérico directo si el sitio lo provee (común en Magento/Rex)
            mainPrice = el.attr('data-price-amount') || el.attr('content') || el.text().trim();
        }

        // Si falla el selector específico, intentar con meta tags estándar de SEO (muy comunes en VTEX)
        if (!mainPrice) {
            mainPrice = $('meta[property="product:price:amount"]').attr('content') || 
                        $('meta[property="og:price:amount"]').attr('content') ||
                        $('.vtex-product-price-1-x-sellingPriceValue').first().text().trim();
        }

        if (!mainPrice) return null;

        // Limpieza profunda del precio
        let cleaned = mainPrice.replace(/\s/g, ''); // Quitar espacios
        
        // Manejar formato latino (1.234,56) vs internacional (1,234.56)
        if (cleaned.includes(',') && cleaned.includes('.')) {
            if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
                // Formato latino: 1.234,56 -> Quitar puntos (miles) y cambiar coma por punto (decimal)
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
                // Formato internacional: 1,234.56 -> Quitar comas (miles)
                cleaned = cleaned.replace(/,/g, '');
            }
        } else if (cleaned.includes(',')) {
            // Solo coma: en Argentina es decimal (ej: 1234,56)
            cleaned = cleaned.replace(',', '.');
        } else if (cleaned.includes('.')) {
            // Solo punto: Caso crítico (ej: Rex "$172.873")
            const parts = cleaned.split('.');
            const lastPart = parts[parts.length - 1].replace(/[^\d]/g, '');
            if (lastPart.length === 3) {
                cleaned = cleaned.replace(/\./g, '');
            }
        }

        const price = parseFloat(cleaned.replace(/[^\d.]/g, ''));
        return isNaN(price) ? null : price;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}
