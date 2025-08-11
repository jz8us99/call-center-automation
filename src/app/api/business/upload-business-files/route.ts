import { NextRequest, NextResponse } from 'next/server';
import { withAuth, isAuthError } from '@/lib/api-auth-helper';

export async function POST(request: NextRequest) {
  try {
    const authResult = await withAuth(request);
    if (isAuthError(authResult)) {
      return authResult;
    }
    const { user, supabaseWithAuth } = authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type || !['document', 'image'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Must be "document" or "image"' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 10MB' },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedDocTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];

    if (type === 'document' && !allowedDocTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid document type. Allowed: PDF, DOC, DOCX, TXT' },
        { status: 400 }
      );
    }

    if (type === 'image' && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid image type. Allowed: JPG, PNG, GIF, WEBP' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${randomSuffix}_${originalName}`;

    // Create storage path
    const storagePath = `business-files/${user.id}/${type}s/${filename}`;

    // Upload file to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: uploadData, error: uploadError } =
      await supabaseWithAuth.storage
        .from('user-documents')
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

    if (uploadError) {
      console.error('Error uploading to Supabase Storage:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Extract text content for documents (basic implementation)
    let extractedContent = '';
    if (type === 'document' && file.type === 'text/plain') {
      extractedContent = await file.text();
      // Truncate for preview
      extractedContent =
        extractedContent.substring(0, 500) +
        (extractedContent.length > 500 ? '...' : '');
    }

    // Get public URL for the uploaded file
    const { data: publicUrlData } = supabaseWithAuth.storage
      .from('user-documents')
      .getPublicUrl(storagePath);

    const fileInfo = {
      id: `${timestamp}_${Math.random().toString(36).substring(2, 11)}`,
      name: file.name,
      originalName: file.name,
      filename: filename,
      type: file.type,
      size: file.size,
      url: publicUrlData.publicUrl,
      storagePath: storagePath,
      uploadedAt: new Date().toISOString(),
      extractedContent: extractedContent || undefined,
    };

    return NextResponse.json({
      success: true,
      file: fileInfo,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'File upload endpoint. Use POST to upload files.',
    allowedTypes: {
      documents: ['PDF', 'DOC', 'DOCX', 'TXT'],
      images: ['JPEG', 'PNG', 'GIF', 'WEBP'],
    },
    maxSize: '10MB',
  });
}
