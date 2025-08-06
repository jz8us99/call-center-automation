import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-utils';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const businessType = searchParams.get('business_type');
    const id = searchParams.get('id');

    if (id) {
      // Get specific category
      const { data: category, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching product category:', error);
        return NextResponse.json(
          { error: 'Product category not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ category });
    }

    if (!businessType) {
      return NextResponse.json(
        { error: 'business_type is required' },
        { status: 400 }
      );
    }

    // Get categories for business type
    const { data: categories, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('business_type', businessType)
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('category_name', { ascending: true });

    if (error) {
      console.error('Error fetching product categories:', error);
      return NextResponse.json(
        { error: 'Failed to fetch product categories' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      categories: categories || [],
    });
  } catch (error) {
    console.error('Error in product-categories GET:', error);
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
      business_type,
      category_name,
      category_description,
      parent_category_id,
      display_order = 0,
    } = body;

    if (!business_type || !category_name) {
      return NextResponse.json(
        { error: 'business_type and category_name are required' },
        { status: 400 }
      );
    }

    // Check if category already exists for this business type
    const { data: existingCategory } = await supabase
      .from('product_categories')
      .select('id')
      .eq('business_type', business_type)
      .eq('category_name', category_name)
      .single();

    if (existingCategory) {
      return NextResponse.json(
        {
          error:
            'A category with this name already exists for this business type',
        },
        { status: 409 }
      );
    }

    const { data: category, error } = await supabase
      .from('product_categories')
      .insert({
        business_type,
        category_name,
        category_description,
        parent_category_id,
        display_order,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product category:', error);
      return NextResponse.json(
        { error: 'Failed to create product category', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      category,
      message: 'Product category created successfully',
    });
  } catch (error) {
    console.error('Error in product-categories POST:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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
      category_name,
      category_description,
      parent_category_id,
      display_order,
      is_active = true,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { data: category, error } = await supabase
      .from('product_categories')
      .update({
        category_name,
        category_description,
        parent_category_id,
        display_order,
        is_active,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product category:', error);
      return NextResponse.json(
        { error: 'Failed to update product category', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      category,
      message: 'Product category updated successfully',
    });
  } catch (error) {
    console.error('Error in product-categories PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
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

    // Check if category has products
    const { data: products } = await supabase
      .from('business_products')
      .select('id')
      .eq('category_id', id)
      .limit(1);

    if (products && products.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete category that contains products. Please move or delete the products first.',
        },
        { status: 409 }
      );
    }

    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting product category:', error);
      return NextResponse.json(
        { error: 'Failed to delete product category', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Product category deleted successfully',
    });
  } catch (error) {
    console.error('Error in product-categories DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
