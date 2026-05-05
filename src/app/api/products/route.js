import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
    try {
        const product = await request.json();
        const filePath = path.join(process.cwd(), 'src/data/products.json');
        
        let products = [];
        if (fs.existsSync(filePath)) {
            const fileData = fs.readFileSync(filePath, 'utf8');
            products = JSON.parse(fileData);
        }

        const newProduct = {
            id: Date.now(),
            name: product.name,
            sku: product.sku || `PROD-${Date.now()}`,
            links: product.links,
            prices: {}
        };

        products.push(newProduct);
        
        // Solo intentamos escribir si no estamos en Vercel (opcional, para desarrollo local)
        try {
            fs.writeFileSync(filePath, JSON.stringify(products, null, 2));
        } catch (e) {
            console.log('No se pudo guardar en disco (entorno de solo lectura)');
        }

        return NextResponse.json(newProduct);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
