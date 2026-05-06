import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
    try {
        const product = await request.json();
        
        const { data, error } = await supabase
            .from('products')
            .insert([
                {
                    name: product.name,
                    sku: product.sku || `PROD-${Date.now()}`,
                    links: product.links,
                    prices: {}
                }
            ])
            .select();

        if (error) throw error;

        return NextResponse.json(data[0]);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const product = await request.json();
        const { id, ...updateData } = product;
        
        const { data, error } = await supabase
            .from('products')
            .update(updateData)
            .eq('id', id)
            .select();

        if (error) throw error;

        return NextResponse.json(data[0]);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
