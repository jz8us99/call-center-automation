# 🌐 ngrok Setup Guide for Call Center Automation

## 📋 Quick Start

### Step 1: Create ngrok Account
1. Go to https://dashboard.ngrok.com/signup
2. Sign up for a free account
3. Verify your email

### Step 2: Get Your Auth Token
1. After signing in, go to: https://dashboard.ngrok.com/get-started/your-authtoken
2. Copy your authtoken (looks like: `2XyzABC123...`)

### Step 3: Configure ngrok
```bash
# Add your authtoken to ngrok
./bin/ngrok.exe config add-authtoken YOUR_AUTH_TOKEN_HERE
```

### Step 4: Start Tunnel
```bash
# Expose your local server on port 19080
./bin/ngrok.exe http 19080
```

## 🚀 Usage for Retell AI Integration

When ngrok starts, you'll see output like:
```
Session Status                online
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok.io -> http://localhost:19080
```

### Using ngrok URL for Webhooks

1. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

2. **Update your .env file**:
```env
NEXT_PUBLIC_SITE_URL=https://abc123.ngrok.io
```

3. **Retell Webhook URL**:
Your webhook will be: `https://abc123.ngrok.io/api/retell/webhook`

## 📌 Important Commands

```bash
# Start tunnel (basic)
./bin/ngrok.exe http 19080

# Start with custom subdomain (paid feature)
./bin/ngrok.exe http --domain=your-custom-domain.ngrok.io 19080

# View tunnel status and requests
# Open browser at: http://localhost:4040

# Stop tunnel
# Press Ctrl+C in the terminal
```

## 🔍 Monitoring Requests

1. While ngrok is running, open: http://localhost:4040
2. You'll see:
   - All incoming requests
   - Request/response details
   - Headers and body content
   - Response times

## ⚠️ Important Notes

1. **Free tier limitations**:
   - URL changes each time you restart ngrok
   - Limited to 1 tunnel at a time
   - 40 connections/minute limit

2. **For production**:
   - Consider upgrading to paid plan for:
     - Custom domains
     - Reserved subdomains
     - Multiple tunnels
     - Higher rate limits

3. **Security**:
   - ngrok URLs are public - anyone with the URL can access
   - Use authentication if exposing sensitive endpoints
   - Don't share ngrok URLs publicly unless intended

## 🔄 Workflow for Development

1. Start your development server:
```bash
yarn dev
```

2. In a new terminal, start ngrok:
```bash
./bin/ngrok.exe http 19080
```

3. Update webhook URLs in Retell dashboard with ngrok URL

4. Test your integration with real webhooks!

## 🛠️ Troubleshooting

### "Authentication failed" error
- Make sure you've added your authtoken:
  ```bash
  ./bin/ngrok.exe config add-authtoken YOUR_TOKEN
  ```

### "Port already in use"
- Make sure your dev server is running on port 19080
- Check if another process is using the port

### Can't receive webhooks
- Verify ngrok URL is correct in Retell settings
- Check http://localhost:4040 for incoming requests
- Ensure your local server is running

## 📝 Example: Testing Retell Webhook

1. Start ngrok:
```bash
./bin/ngrok.exe http 19080
```

2. Copy the HTTPS URL (e.g., `https://xyz789.ngrok.io`)

3. In Retell dashboard, set webhook URL:
```
https://xyz789.ngrok.io/api/retell/webhook
```

4. Make a test call to trigger the webhook

5. Monitor requests at http://localhost:4040

---

Remember to update your webhook URLs whenever you restart ngrok (unless using a reserved subdomain)!