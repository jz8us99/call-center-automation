# Call Center Configuration Feature Enhancement

## Overview

This feature enhancement allows clients to upload business documents or provide their website URL to enable AI agents to understand their business context for intelligent customer support through Retell AI agents.

## Features Implemented

### ✅ 1. Document Upload & URL Configuration
- **File Upload**: Support for PDF, DOC, DOCX, and TXT files (max 10MB)
- **Website URL**: Alternative to file uploads with automatic content extraction
- **File Validation**: Type and size validation with preview functionality
- **Document Categories**: Pricing, Customer Policy, and Office Hours

### ✅ 2. AI Content Processing
- **Text Extraction**: From uploaded documents and website content
- **Content Categorization**: Automatic organization into pricing, policies, and hours
- **Knowledge Base Creation**: Structured information for AI agent consumption
- **Database Storage**: Secure storage in Supabase with proper indexing

### ✅ 3. Retell AI Agent Creation
- **Agent Configuration**: Business-specific knowledge base integration
- **Personality Settings**: Professional, Friendly, or Technical response styles
- **Custom Prompts**: Configurable greeting messages and behavior
- **Voice Settings**: Speed, pitch, and tone configuration

### ✅ 4. Webhook Storage & Database Integration
- **Webhook Endpoints**: For Retell AI agent interactions
- **Call Logging**: Complete call history with transcripts and analysis
- **Event Handling**: Call started, ended, and analyzed events
- **RLS Security**: Row-level security for data protection

### ✅ 5. Admin Notification System
- **Email Notifications**: Automated alerts when agents are created
- **Rich Templates**: Professional HTML email templates
- **Retry Mechanism**: Failed notification retry system
- **Notification Tracking**: Database logging of all notifications

## Database Schema

### New Tables Created:
- `agents`: Store Retell AI agent configurations
- `business_knowledge`: Store extracted business information
- `call_logs`: Enhanced call logging with analysis
- `agent_configurations`: Detailed agent settings
- `email_notifications`: Notification tracking

### Key Features:
- **Row Level Security (RLS)**: Ensures data privacy
- **Indexes**: Optimized for performance
- **Triggers**: Automatic timestamp updates
- **Functions**: Helper functions for complex queries

## API Endpoints

### Document Processing
- `POST /api/upload-documents` - Handle file uploads
- `POST /api/extract-website-content` - Process website URLs

### Agent Management
- `POST /api/create-retell-agent` - Generate AI agents
- `GET /api/agent-status/[clientId]` - Check agent status

### Webhooks
- `POST /api/webhook/retell/[agentId]` - Handle Retell AI webhooks

## File Structure

```
src/
├── app/api/
│   ├── upload-documents/route.ts
│   ├── extract-website-content/route.ts
│   ├── create-retell-agent/route.ts
│   ├── agent-status/[clientId]/route.ts
│   └── webhook/retell/[agentId]/route.ts
├── components/configuration/
│   └── BusinessInformationForm.tsx (enhanced)
├── lib/
│   └── email-service.ts
└── types/
    └── agent-types.ts (updated)
```

## Setup Instructions

### 1. Environment Variables
Add to your `.env.local`:

```env
# Retell AI Configuration
RETELL_API_KEY=your_retell_api_key
RETELL_WEBHOOK_SECRET=your_webhook_secret
RETELL_WEBSOCKET_URL=wss://api.retellai.com/llm-websocket

# Email Configuration
ADMIN_EMAIL=admin@yourdomain.com
FROM_EMAIL=noreply@yourdomain.com

# Email Service (choose one)
# SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app-domain.com
```

### 2. Database Migration
Run the SQL commands from `database-migrations.sql` in your Supabase SQL editor.

### 3. Dependencies
Add these packages for document processing (optional):

```bash
yarn add pdf-parse mammoth @sendgrid/mail aws-sdk
```

### 4. Email Service Setup
Choose and configure one email service:
- **SendGrid**: Uncomment SendGrid code in `email-service.ts`
- **AWS SES**: Uncomment AWS SES code in `email-service.ts`
- **Development**: Uses console.log by default

## Usage Flow

### Client Configuration:
1. Navigate to Configuration > AI Agent
2. Choose agent type and configure business information
3. Upload documents OR provide website URL
4. Set agent personality and greeting message
5. Save configuration

### System Processing:
1. Documents are processed and content extracted
2. Business knowledge is stored in database
3. Retell AI agent is created with knowledge base
4. Webhook URLs are configured automatically
5. Admin receives email notification

### Admin Actions:
1. Receive email notification
2. Log into Retell AI dashboard
3. Configure phone number for the new agent
4. Test agent functionality

## Security Features

- **Authentication**: All endpoints require valid user tokens
- **File Validation**: Type and size restrictions
- **RLS Policies**: Database-level access control
- **Webhook Signatures**: Optional webhook validation
- **Content Sanitization**: Safe content processing

## Error Handling

- **File Upload Errors**: Clear error messages for users
- **API Failures**: Proper error responses and logging
- **Database Errors**: Transaction rollbacks on failures
- **Email Failures**: Retry mechanism for notifications
- **Webhook Errors**: Comprehensive error logging

## Testing

### Manual Testing:
1. Upload different file types and sizes
2. Test website content extraction
3. Verify agent creation flow
4. Check webhook functionality
5. Confirm email notifications

### Automated Testing:
- Unit tests for content extraction
- API endpoint testing
- Database function testing
- Email template validation

## Production Considerations

### Performance:
- File processing is async where possible
- Database queries are optimized with indexes
- Webhook processing is lightweight

### Scalability:
- File uploads could be moved to cloud storage (S3)
- Document processing could use background jobs
- Email sending could use queue systems

### Monitoring:
- API endpoint metrics
- File processing success rates
- Email delivery rates
- Agent creation success rates

## Future Enhancements

1. **Advanced Document Processing**: OCR for images, better parsing
2. **Bulk Operations**: Multiple file uploads, batch processing
3. **Content Validation**: AI-powered content verification
4. **Integration Extensions**: More document sources, CMS integration
5. **Analytics Dashboard**: Usage metrics and performance tracking

## Support

For issues or questions about this feature:
1. Check the error logs in Supabase
2. Verify environment variables are set correctly
3. Test API endpoints independently
4. Check email service configuration
5. Review Retell AI dashboard for agent status

---

**Note**: This feature requires proper Retell AI account setup and Supabase configuration. Ensure all environment variables are correctly set before testing.