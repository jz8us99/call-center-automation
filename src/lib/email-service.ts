import { supabase } from './supabase-admin';

interface EmailNotificationData {
  agentName: string;
  clientName: string;
  retellAgentId: string;
  businessType: string;
  webhookUrl: string;
  createdAt?: string;
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  metadata?: Record<string, unknown>;
}

export class EmailService {
  private adminEmail: string;

  constructor() {
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@callcenterai.com';
  }

  async sendAgentCreationNotification(
    data: EmailNotificationData
  ): Promise<boolean> {
    try {
      const subject = 'New AI Agent Created - Phone Configuration Required';
      const html = this.generateAgentCreationTemplate(data);

      return await this.sendEmail({
        to: this.adminEmail,
        subject,
        html,
        metadata: {
          notification_type: 'agent_creation',
          agent_id: data.retellAgentId,
          client_name: data.clientName,
        },
      });
    } catch (error) {
      console.error('Failed to send agent creation notification:', error);
      return false;
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Store notification in database first
      const { data: notification, error: dbError } = await supabase
        .from('email_notifications')
        .insert({
          notification_type: options.metadata?.notification_type || 'general',
          recipient_email: options.to,
          subject: options.subject,
          content: options.html,
          status: 'pending',
          metadata: options.metadata || {},
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error storing email notification:', dbError);
        return false;
      }

      // Send email using your preferred service
      const emailSent = await this.deliverEmail(options);

      // Update notification status
      await supabase
        .from('email_notifications')
        .update({
          status: emailSent ? 'sent' : 'failed',
          sent_at: emailSent ? new Date().toISOString() : null,
        })
        .eq('id', notification.id);

      return emailSent;
    } catch (error) {
      console.error('Error in sendEmail:', error);
      return false;
    }
  }

  private async deliverEmail(options: EmailOptions): Promise<boolean> {
    try {
      // In a production environment, you would integrate with an email service
      // such as SendGrid, AWS SES, Mailgun, etc.

      if (process.env.NODE_ENV === 'development') {
        // In development, just log the email
        console.log('=== EMAIL NOTIFICATION ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('Body:', options.html);
        console.log('========================');
        return true;
      }

      // Example with SendGrid (uncomment and configure when ready):
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);

      const msg = {
        to: options.to,
        from: process.env.FROM_EMAIL,
        subject: options.subject,
        html: options.html,
      };

      await sgMail.send(msg);
      return true;
      */

      // Example with AWS SES (uncomment and configure when ready):
      /*
      const AWS = require('aws-sdk');
      const ses = new AWS.SES({
        region: process.env.AWS_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

      const params = {
        Destination: {
          ToAddresses: [options.to],
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: options.html,
            },
          },
          Subject: {
            Charset: 'UTF-8',
            Data: options.subject,
          },
        },
        Source: process.env.FROM_EMAIL,
      };

      await ses.sendEmail(params).promise();
      return true;
      */

      // For now, return true for development
      return true;
    } catch (error) {
      console.error('Error delivering email:', error);
      return false;
    }
  }

  private generateAgentCreationTemplate(data: EmailNotificationData): string {
    const timestamp = data.createdAt || new Date().toISOString();
    const formattedDate = new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New AI Agent Created</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            background-color: #f8f9fa;
            padding: 20px;
        }
        .email-container {
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 30px;
        }
        .alert-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
        }
        .alert-box .alert-title {
            font-weight: 600;
            color: #856404;
            margin-bottom: 8px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
        }
        .info-item {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #ff6b35;
        }
        .info-item .label {
            font-weight: 600;
            color: #666;
            font-size: 12px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }
        .info-item .value {
            color: #333;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #ff6b35, #f7931e);
            color: white;
            text-decoration: none;
            padding: 12px 30px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #e9ecef;
        }
        @media (max-width: 600px) {
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>🤖 New AI Agent Created</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Phone configuration required</p>
        </div>
        
        <div class="content">
            <p>Hello Admin,</p>
            
            <p>A new Retell AI agent has been successfully created and is ready for phone number configuration.</p>
            
            <div class="alert-box">
                <div class="alert-title">⚠️ Action Required</div>
                <p style="margin: 0;">Please configure the phone number in the Retell AI dashboard to activate this agent.</p>
            </div>
            
            <div class="info-grid">
                <div class="info-item">
                    <div class="label">Agent Name</div>
                    <div class="value">${data.agentName}</div>
                </div>
                <div class="info-item">
                    <div class="label">Client Business</div>
                    <div class="value">${data.clientName}</div>
                </div>
                <div class="info-item">
                    <div class="label">Business Type</div>
                    <div class="value">${data.businessType}</div>
                </div>
                <div class="info-item">
                    <div class="label">Created</div>
                    <div class="value">${formattedDate}</div>
                </div>
            </div>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <div class="label" style="font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px;">Agent ID</div>
                <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 13px;">${data.retellAgentId}</code>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://dashboard.retellai.com/agents" class="cta-button">
                    Configure Phone Number →
                </a>
            </div>
            
            <div style="background-color: #e8f4fd; padding: 15px; border-radius: 6px; border-left: 4px solid #2196F3;">
                <h4 style="margin-top: 0; color: #1976D2;">Webhook Information</h4>
                <p style="margin-bottom: 10px; font-size: 14px;">The webhook URL has been automatically configured:</p>
                <code style="background-color: #fff; padding: 8px; border-radius: 4px; font-family: monospace; font-size: 12px; word-break: break-all; display: block;">${data.webhookUrl}</code>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef;">
                <h4>Next Steps:</h4>
                <ol style="padding-left: 20px;">
                    <li>Log in to the <a href="https://dashboard.retellai.com">Retell AI Dashboard</a></li>
                    <li>Navigate to the agent with ID: <code>${data.retellAgentId}</code></li>
                    <li>Configure a phone number for this agent</li>
                    <li>Test the agent to ensure proper functionality</li>
                </ol>
            </div>
        </div>
        
        <div class="footer">
            <p>This notification was sent automatically by the Call Center Automation System.</p>
            <p>If you have any questions, please contact your system administrator.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  async retryFailedNotifications(): Promise<void> {
    try {
      // Get failed notifications from the last 24 hours
      const oneDayAgo = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: failedNotifications, error } = await supabase
        .from('email_notifications')
        .select('*')
        .eq('status', 'failed')
        .gte('created_at', oneDayAgo)
        .limit(10); // Process max 10 at a time

      if (error) {
        console.error('Error fetching failed notifications:', error);
        return;
      }

      for (const notification of failedNotifications || []) {
        const emailSent = await this.deliverEmail({
          to: notification.recipient_email,
          subject: notification.subject,
          html: notification.content,
          metadata: notification.metadata,
        });

        if (emailSent) {
          await supabase
            .from('email_notifications')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
            })
            .eq('id', notification.id);

          console.log(`Retry successful for notification ${notification.id}`);
        }
      }
    } catch (error) {
      console.error('Error retrying failed notifications:', error);
    }
  }
}

export const emailService = new EmailService();
