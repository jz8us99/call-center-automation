'use server';

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// PUT /api/admin/pricing/[tierId] - Update specific pricing tier
export async function PUT(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
  try {
    const { tierId } = params;
    const body = await request.json();

    // 权限验证已由中间件处理

    // For now, just return success message
    // In a real implementation, you would update the tier in the database
    const updatedTier = {
      id: tierId,
      ...body,
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({ tier: updatedTier });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/pricing/[tierId] - Delete specific pricing tier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tierId: string } }
) {
  try {
    const { tierId } = params;

    // 权限验证已由中间件处理

    // For now, just return success message
    // In a real implementation, you would delete the tier from the database
    return NextResponse.json({ message: 'Pricing tier deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
