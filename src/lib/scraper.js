import axios from 'axios';
import * as cheerio from 'cheerio';

const selectors = {
    'tiendauniverso.com.ar': { 
        main: '[class*="flexRowContent--price-product-pdp"] span', 
        fraction: null 
    },
    'somosrex.com': { 
        main: '[data-price-type="defaultPromoPrice"] .price, [data-price-type="defaultPromoPrice"].price', 
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
        const domain = new URL(url).hostname.replace('www.', '');
        const config = selectors[domain];
        if (!config) return null;

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
        
        // Si el selector es un meta tag, obtener el atributo 'content'
        if (config.main.includes('meta')) {
            mainPrice = el.attr('content') || '';
        } else {
            mainPrice = el.text().trim();
        }

        // Si falla el selector específico, intentar con meta tags estándar de SEO (muy comunes en VTEX)
        if (!mainPrice) {
            mainPrice = $('meta[property="product:price:amount"]').attr('content') || 
                        $('meta[property="og:price:amount"]').attr('content') ||
                        $('.vtex-product-price-1-x-sellingPriceValue').first().text().trim();
        }

        if (!mainPrice) return null;

        // Limpieza profunda del precio
        // Si viene de meta tag suele ser "172873.00", si viene de HTML "$ 172.873,00"
        let cleaned = mainPrice.replace(/\s/g, ''); // Quitar espacios
        
        // Manejar formato latino (1.234,56) vs internacional (1,234.56)
        if (cleaned.includes(',') && cleaned.includes('.')) {
            if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
                // Formato latino: 1.234,56
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            } else {
                // Formato internacional: 1,234.56
                cleaned = cleaned.replace(/,/g, '');
            }
        } else if (cleaned.includes(',')) {
            // Solo coma: podría ser decimal o separador de miles. 
            // En Argentina suele ser decimal.
            cleaned = cleaned.replace(',', '.');
        }

        const price = parseFloat(cleaned.replace(/[^\d.]/g, ''));
        return isNaN(price) ? null : price;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}
