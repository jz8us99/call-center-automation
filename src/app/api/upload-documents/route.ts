import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/supabase';
import { supabase } from '@/lib/supabase-admin';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('type') as string;
    const clientId = formData.get('clientId') as string;

    if (!file || !documentType || !clientId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, type, clientId' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed',
        },
        { status: 400 }
      );
    }

    // Validate document type
    if (!['pricing', 'policy', 'hours'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type. Must be pricing, policy, or hours' },
        { status: 400 }
      );
    }

    // Extract text content from file
    const content = await extractTextFromFile(file);

    // Store file metadata and content in database
    const { data: businessKnowledge, error: dbError } = await supabase
      .from('business_knowledge')
      .insert({
        client_id: clientId,
        content_type: documentType,
        content_text: content,
        source_type: 'upload',
        source_reference: file.name,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save document content' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: businessKnowledge.id,
        content_type: documentType,
        preview:
          content.substring(0, 200) + (content.length > 200 ? '...' : ''),
        file_name: file.name,
        file_size: file.size,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function extractTextFromFile(file: File): Promise<string> {
  try {
    if (file.type === 'text/plain') {
      return await file.text();
    }

    if (file.type === 'application/pdf') {
      // For PDF files, you would typically use a library like pdf-parse
      // For now, we'll return a placeholder
      return 'PDF content extraction would be implemented here using pdf-parse library';
    }

    if (file.type.includes('word')) {
      // For Word documents, you would use mammoth.js or similar
      return 'Word document content extraction would be implemented here using mammoth.js';
    }

    // Fallback: try to read as text
    return await file.text();
  } catch (error) {
    console.error('Text extraction error:', error);
    throw new Error('Failed to extract text from file');
  }
}
