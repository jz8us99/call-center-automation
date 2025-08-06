import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Website content extraction endpoint. Use POST with a URL.',
    example: {
      url: 'https://example.com',
    },
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Website extraction coming soon',
  });
}
