import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join, resolve } from 'path';
import { existsSync } from 'fs';
import { authenticateRequest } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user first
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to upload files.' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;
    const clientId = formData.get('clientId') as string;

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

    // Validate clientId to prevent path traversal
    if (!clientId || !/^[a-zA-Z0-9_-]+$/.test(clientId)) {
      return NextResponse.json(
        { error: 'Invalid client ID format' },
        { status: 400 }
      );
    }

    // Create upload directory if it doesn't exist
    const baseUploadDir = join(process.cwd(), 'uploads');
    const clientDir = join(baseUploadDir, clientId);
    const uploadDir = join(clientDir, type + 's');

    // Ensure the upload directory is within expected bounds (prevent path traversal)
    const resolvedUploadDir = resolve(uploadDir);
    const resolvedBaseDir = resolve(baseUploadDir);
    if (!resolvedUploadDir.startsWith(resolvedBaseDir)) {
      return NextResponse.json(
        { error: 'Invalid upload path' },
        { status: 400 }
      );
    }

    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Generate unique filename with additional security
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}_${randomSuffix}_${originalName}`;
    const filepath = join(uploadDir, filename);

    // Final path traversal check
    const resolvedFilepath = resolve(filepath);
    if (!resolvedFilepath.startsWith(resolvedUploadDir)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Extract text content for documents (basic implementation)
    let extractedContent = '';
    if (type === 'document' && file.type === 'text/plain') {
      extractedContent = await file.text();
      // Truncate for preview
      extractedContent =
        extractedContent.substring(0, 500) +
        (extractedContent.length > 500 ? '...' : '');
    }

    const fileInfo = {
      id: `${timestamp}_${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      originalName: file.name,
      filename: filename,
      type: file.type,
      size: file.size,
      url: `/uploads/${clientId || 'default'}/${type}s/${filename}`,
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

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'File upload endpoint. Use POST to upload files.',
    allowedTypes: {
      documents: ['PDF', 'DOC', 'DOCX', 'TXT'],
      images: ['JPEG', 'PNG', 'GIF', 'WEBP'],
    },
    maxSize: '10MB',
  });
}
