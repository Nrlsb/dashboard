import { NextResponse } from 'next/server';
import { getPrice } from '@/lib/scraper';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Obtener productos de Supabase
        const { data: products, error: fetchError } = await supabase
            .from('products')
            .select('*')
            .order('id', { ascending: true });

        if (fetchError) throw fetchError;

        const updatedProducts = await Promise.all(products.map(async (product) => {
            // Mantener precios anteriores para no borrarlos si el scraper falla o no está disponible el link
            const newPrices = { ...(product.prices || {}) };
            
            for (const [domain, url] of Object.entries(product.links)) {
                if (!url) continue;
                try {
                    const price = await getPrice(url);
                    if (price !== null && price !== undefined) {
                        newPrices[domain] = price;
                    }
                } catch (e) {
                    console.error(`Error scrapeando ${domain}:`, e.message);
                }
            }
            
            const lastUpdate = new Date().toISOString();
            
            // Actualizar en Supabase
            const { error: updateError } = await supabase
                .from('products')
                .update({ prices: newPrices, last_update: lastUpdate })
                .eq('id', product.id);

            if (updateError) console.error(`Error actualizando producto ${product.id}:`, updateError);

            return { ...product, prices: newPrices, last_update: lastUpdate };
        }));

        return NextResponse.json(updatedProducts);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
