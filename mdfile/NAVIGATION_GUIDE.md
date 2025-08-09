# JSX-ReceptionAI - Complete Navigation Guide

## 🏠 **Getting Started - How to Navigate Through Different Screens**

This guide will help you navigate through all the different screens and features in JSX-ReceptionAI, your AI-powered call center automation system.

---

## 📍 **Main Application Pages**

### 1. **Home Page** - `http://localhost:3000/`
**What you'll see**: Landing page with company information and sign-in options

**Navigation Options**:
- **Sign In** → Takes you to the authentication page
- **Sign Up** → Takes you to the registration page  
- **JSX-ReceptionAI Logo** → Always returns to home page
- **Dashboard/Admin Panel** (if logged in) → Quick access from user menu

**Help Available**: Click the "Help" button in bottom-right corner for page-specific guidance

---

### 2. **Sign In Page** - `http://localhost:3000/auth`
**What you'll see**: Login form with email/password and Google sign-in options

**Navigation Options**:
- **Home** button (top-right) → Return to main landing page
- **JSX-ReceptionAI Logo** → Return to home page
- **Sign up** link → Go to registration page
- **Forgot Password?** → Opens password reset modal

**After Sign In**: Automatically redirects to Dashboard or Admin Panel based on your role

---

### 3. **Sign Up Page** - `http://localhost:3000/signup`
**What you'll see**: Registration form to create new account

**Navigation Options**:
- **Home** button → Return to main landing page
- **Sign in** link → Go to login page

---

### 4. **Dashboard** - `http://localhost:3000/dashboard` *(Requires Authentication)*
**What you'll see**: Main control center with call logs, statistics, and call management

**Navigation Options**:
- **Home** button → Return to main landing page
- **Configuration** button → Go to AI agent setup
- **JSX-ReceptionAI Logo** → Return to home page
- **Sign out** → Log out and return to home

**Key Features**:
- **Call Statistics Cards** - View total calls, today's calls, unique numbers
- **Call Logs Table** - Browse all call records with search and filtering
- **Search Filters** - Filter by date range, call type, phone number
- **Audio Player** - Listen to call recordings (click play button on calls)
- **Transcript Modal** - Read AI-generated call summaries (click on call rows)

---

### 5. **Configuration Dashboard** - `http://localhost:3000/configuration` *(Requires Authentication)*
**What you'll see**: AI agent setup and business configuration interface

**Navigation Options**:
- **Home** button (top-right) → Return to main landing page
- **Dashboard** button (top-right) → Return to call logs dashboard
- **← Back to Dashboard** → Return to main dashboard

**Tab Navigation**:
- **Overview** → Quick setup guide and statistics
- **AI Agent** → Configure voice agents and business information
- **Staff** → Manage team members and schedules *(Coming Soon)*
- **Appointments** → Set up booking system *(Coming Soon)*

#### **AI Agent Configuration Sub-sections**:
- **Business Info** → Enter practice details, contact information, timezone
- **Call Scripts** → Customize conversation templates for different scenarios
- **Voice Settings** → Choose AI voice characteristics and test audio
- **Call Routing** → Set up call forwarding and voicemail options

---

### 6. **Admin Dashboard** - `http://localhost:3000/admin/dashboard` *(Admin Only)*
**What you'll see**: Admin-specific features and user management

**Access**: Only visible to users with admin or super_admin roles

---

## 🎯 **Quick Navigation Tips**

### **Universal Navigation Elements**
- **JSX-ReceptionAI Logo** - Always clickable, returns to home page
- **Home Button** (🏠) - Available on all authenticated pages
- **Help Button** - Available on all pages (bottom-right corner)

### **Navigation Patterns**
1. **From Home** → Sign In → Dashboard → Configuration
2. **From Dashboard** → Configuration → Back to Dashboard → Home
3. **From Any Page** → Click logo or Home button to return to start

### **Keyboard Shortcuts**
- **?** - Open help dialog on any page
- **Esc** - Close modals and dialogs
- **Tab** - Navigate between form fields
- **Ctrl+F** - Focus search in dashboard
- **Space** - Play/pause audio in call logs
- **Enter** - Open call details when call is selected

---

## 🔧 **Feature-Specific Navigation**

### **Call Logs Management**
**Location**: Dashboard → Call Logs Table

**How to Use**:
1. **View Calls** - Scroll through the table to see all call records
2. **Search** - Use the search filters above the table
3. **Listen to Recordings** - Click the play button (▶️) on any call row
4. **Read Transcripts** - Click anywhere on a call row to open transcript modal
5. **Filter by Date** - Use the date picker in search filters
6. **Filter by Type** - Select "Inbound", "Outbound", or "All" calls

### **AI Agent Setup**
**Location**: Configuration → AI Agent Tab

**Step-by-Step Setup**:
1. **Start Here** - Go to Configuration → Overview tab for guided setup
2. **Create Agent** - Click "Create New Agent" or "Create Your First Agent"
3. **Business Information** - Fill in your practice details (required)
4. **Call Scripts** - Customize how your AI responds (use templates provided)  
5. **Voice Settings** - Choose and test your AI voice
6. **Call Routing** - Set up forwarding and voicemail
7. **Test Everything** - Use preview functions before going live

### **Audio Playback**
**How to Play Call Recordings**:
1. Go to Dashboard
2. Find the call you want to hear in Call Logs Table
3. Click the play button (▶️) in the rightmost column
4. Use playback controls: Play/Pause, Skip forward/backward
5. Adjust volume with the volume slider

---

## 🆘 **Getting Help**

### **Built-in Help System**
- **Help Button** - Click the floating "Help" button on any page
- **Page-Specific Guidance** - Each page has tailored navigation instructions
- **Quick Reference** - View all available pages and their purposes

### **Common Issues & Solutions**

**❓ "I can't find the Configuration page"**
- Make sure you're logged in
- Go to Dashboard first, then click "Configuration" button in top navigation

**❓ "I don't see any call logs"**
- Check that you have the right user permissions
- Try refreshing the page
- Make sure you're looking at the correct date range in filters

**❓ "Audio won't play"**
- Check that your browser allows audio playback
- Ensure your volume is turned up
- Try a different browser if issues persist

**❓ "I'm lost and don't know where I am"**
- Click the JSX-ReceptionAI logo to return to home page
- Use the "Home" button available on all authenticated pages
- Click "Help" button for page-specific guidance

### **Navigation Best Practices**

1. **Start with Overview** - Always begin in Configuration → Overview tab when setting up
2. **Complete Setup in Order** - Follow: Business Info → Scripts → Voice → Routing
3. **Test Before Going Live** - Use voice preview and script testing features
4. **Use Help Frequently** - Click help button when you need guidance
5. **Save Your Work** - Click "Save" buttons before navigating away from configuration pages

---

## 📱 **Mobile Navigation Notes**

- **Responsive Design** - All pages work on mobile devices
- **Hidden Labels** - Some navigation labels hide on small screens but icons remain
- **Touch-Friendly** - All buttons and links are optimized for touch

---

## 🔄 **Workflow Examples**

### **New User Setup Workflow**:
1. Home Page → Sign Up → (verify email) → Sign In
2. Dashboard → Configuration → Overview (read guide)
3. AI Agent → Business Info (fill required fields)
4. Call Scripts → Review and customize templates
5. Voice Settings → Choose voice and test
6. Call Routing → Set up forwarding
7. Back to Dashboard → Monitor calls

### **Daily Usage Workflow**:
1. Sign In → Dashboard
2. Check today's call statistics
3. Review new call logs
4. Listen to important recordings
5. Read AI transcripts for insights
6. Adjust configuration if needed

### **Admin Management Workflow**:
1. Sign In → Admin Dashboard
2. Manage user accounts
3. Monitor system performance
4. Review all users' call data
5. Configure system-wide settings

---

## 📞 **Support & Additional Help**

- **In-App Help** - Always available via Help button
- **Navigation Issues** - Use Home button or logo to reset your location
- **Technical Problems** - Check browser console for error messages
- **Feature Requests** - Contact support team

**Remember**: Every page has a Help button in the bottom-right corner with specific guidance for that page. When in doubt, click Help!