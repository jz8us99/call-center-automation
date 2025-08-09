import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('business_type');
    const userId = searchParams.get('user_id');
    const id = searchParams.get('id');
    const categoryId = searchParams.get('category_id');

    if (id) {
      // Get specific product
      const { data: product, error } = await supabase
        .from('business_products')
        .select(
          `
          *,
          product_categories (
            id,
            category_name,
            category_description
          )
        `
        )
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ product });
    }

    if (!businessType || !userId) {
      return NextResponse.json(
        { error: 'business_type and user_id are required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('business_products')
      .select(
        `
        *,
        product_categories (
          id,
          category_name,
          category_description
        )
      `
      )
      .eq('business_type', businessType)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    const { data: products, error } = await query
      .order('display_order', { ascending: true })
      .order('product_name', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      products: products || [],
    });
  } catch (error) {
    console.error('Error in business-products GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      user_id,
      business_type,
      category_id,
      product_name,
      product_description,
      product_code,
      brand,
      price,
      price_currency = 'USD',
      cost,
      track_inventory = false,
      current_stock,
      low_stock_threshold,
      weight,
      dimensions_length,
      dimensions_width,
      dimensions_height,
      image_urls,
      product_documents,
      is_featured = false,
      display_order = 0,
    } = body;

    if (!user_id || !business_type || !product_name) {
      return NextResponse.json(
        { error: 'user_id, business_type, and product_name are required' },
        { status: 400 }
      );
    }

    // Check if product with same name already exists for this user
    const { data: existingProduct } = await supabase
      .from('business_products')
      .select('id')
      .eq('user_id', user_id)
      .eq('product_name', product_name)
      .single();

    if (existingProduct) {
      return NextResponse.json(
        { error: 'A product with this name already exists' },
        { status: 409 }
      );
    }

    const { data: product, error } = await supabase
      .from('business_products')
      .insert({
        user_id,
        business_type,
        category_id,
        product_name,
        product_description,
        product_code,
        brand,
        price,
        price_currency,
        cost,
        track_inventory,
        current_stock: track_inventory ? current_stock : null,
        low_stock_threshold: track_inventory ? low_stock_threshold : null,
        weight,
        dimensions_length,
        dimensions_width,
        dimensions_height,
        image_urls,
        product_documents,
        is_active: true,
        is_featured,
        display_order,
      })
      .select(
        `
        *,
        product_categories (
          id,
          category_name,
          category_description
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product', details: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Error in business-products POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();

    const {
      id,
      category_id,
      product_name,
      product_description,
      product_code,
      brand,
      price,
      price_currency,
      cost,
      track_inventory,
      current_stock,
      low_stock_threshold,
      weight,
      dimensions_length,
      dimensions_width,
      dimensions_height,
      image_urls,
      product_documents,
      is_active = true,
      is_featured,
      display_order,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('business_products')
      .update({
        category_id,
        product_name,
        product_description,
        product_code,
        brand,
        price,
        price_currency,
        cost,
        track_inventory,
        current_stock: track_inventory ? current_stock : null,
        low_stock_threshold: track_inventory ? low_stock_threshold : null,
        weight,
        dimensions_length,
        dimensions_width,
        dimensions_height,
        image_urls,
        product_documents,
        is_active,
        is_featured,
        display_order,
      })
      .eq('id', id)
      .select(
        `
        *,
        product_categories (
          id,
          category_name,
          category_description
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product', details: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Error in business-products PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('business_products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json(
        { error: 'Failed to delete product', details: (error as Error).message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error in business-products DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    );
  }
}
