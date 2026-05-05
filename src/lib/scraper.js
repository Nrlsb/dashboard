import axios from 'axios';
import * as cheerio from 'cheerio';

const selectors = {
    'tiendauniverso.com.ar': { 
        main: '[class*="flexRowContent--price-product-pdp"] span', 
        fraction: null 
    },
    'somosrex.com': { 
        main: '.price-container [data-price-type="finalPrice"] .price', 
        fraction: null 
    },
    'prestigio.com.ar': { 
        main: '[class*="sellingPriceValue"]', 
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
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' },
            timeout: 10000
        });

        const $ = cheerio.load(data);
        let mainPrice = $(config.main).first().text().trim();

        if (!mainPrice) {
            const generic = $('[class*="price"]').first().text().trim();
            if (!generic) return null;
            return parseFloat(generic.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, ''));
        }

        let price;
        if (config.fraction) {
            let fraction = $(config.fraction).first().text().trim();
            let priceStr = mainPrice.replace(/[^\d]/g, '');
            if (fraction) {
                priceStr += '.' + fraction.replace(/[^\d]/g, '');
            }
            price = parseFloat(priceStr);
        } else {
            let cleanedPrice = mainPrice.replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '');
            price = parseFloat(cleanedPrice);
        }

        return isNaN(price) ? null : price;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}
