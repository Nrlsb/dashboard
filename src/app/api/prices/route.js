import { NextResponse } from 'next/server';
import { getPrice } from '@/lib/scraper';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'src/data/products.json');
        const fileData = fs.readFileSync(filePath, 'utf8');
        const products = JSON.parse(fileData);

        const updatedProducts = await Promise.all(products.map(async (product) => {
            const newPrices = {};
            for (const [domain, url] of Object.entries(product.links)) {
                const price = await getPrice(url);
                if (price) {
                    newPrices[domain] = price;
                }
            }
            return { ...product, prices: newPrices, lastUpdate: new Date().toISOString() };
        }));

        return NextResponse.json(updatedProducts);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
