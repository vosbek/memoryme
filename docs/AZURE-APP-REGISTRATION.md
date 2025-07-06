# Azure App Registration for DevMemory M365 Integration

This guide explains how to register DevMemory in your company's Azure Active Directory to enable M365 enterprise integration.

## 🏢 **For IT Administrators**

DevMemory requires an Azure AD App Registration to authenticate with your company's M365 services. This process is typically handled by your IT department.

### **Step 1: Register DevMemory in Azure Portal**

1. **Login to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Sign in with Global Administrator or Application Administrator permissions

2. **Navigate to App Registrations**
   - Go to `Azure Active Directory` → `App registrations`
   - Click `+ New registration`

3. **Configure Basic Settings**
   ```
   Name: DevMemory Enterprise
   Supported account types: Accounts in this organizational directory only (Single tenant)
   Redirect URI: Public client/native (mobile & desktop) → http://localhost
   ```

4. **Complete Registration**
   - Click `Register`
   - **Copy the Application (client) ID** - you'll need this for DevMemory configuration

### **Step 2: Configure API Permissions**

DevMemory needs these Microsoft Graph permissions to function:

#### **Required Permissions (Minimum)**
```
Microsoft Graph - Delegated Permissions:
├── User.Read                    # Basic user profile
├── Mail.Read                    # Read user's email
├── Calendars.Read              # Read user's calendar
└── Files.Read.All              # Read user's files
```

#### **Recommended Permissions (Full Features)**
```
Microsoft Graph - Delegated Permissions:
├── User.Read                    # User profile information  
├── User.ReadBasic.All          # Read basic info of all users
├── Mail.Read                    # Email content and metadata
├── Calendars.Read              # Calendar events and meetings
├── Sites.Read.All              # SharePoint sites and documents
├── Files.Read.All              # OneDrive and SharePoint files
├── Chat.Read                    # Teams chat messages
├── OnlineMeetings.Read         # Teams meeting information
├── People.Read                 # People and org chart
└── Directory.Read.Basic        # Basic directory information
```

#### **Steps to Add Permissions:**
1. In your app registration, go to `API permissions`
2. Click `+ Add a permission`
3. Select `Microsoft Graph` → `Delegated permissions`
4. Search for and select each permission above
5. Click `Add permissions`
6. **Important**: Click `Grant admin consent for [Your Organization]`

### **Step 3: Configure Authentication**

1. **Go to Authentication**
   - Navigate to `Authentication` in your app registration

2. **Add Platform**
   - Click `+ Add a platform`
   - Select `Mobile and desktop applications`
   - Add redirect URI: `http://localhost`
   - Check `https://login.microsoftonline.com/common/oauth2/nativeclient`

3. **Advanced Settings**
   ```
   ☑ Allow public client flows
   ☐ Enable the following mobile and desktop flows (leave unchecked)
   
   Supported account types: Single tenant (your organization only)
   ```

### **Step 4: Security Configuration**

#### **Conditional Access (Recommended)**
- DevMemory supports your existing Conditional Access policies
- MFA requirements will be enforced automatically
- Device compliance policies are respected

#### **Application Security**
```
Certificates & secrets: Not required (DevMemory uses PKCE flow)
Token configuration: Default settings are sufficient
Owners: Add DevMemory administrators
```

### **Step 5: Provide Configuration to Users**

Share these details with DevMemory users:

```bash
# Environment Variables (can be set system-wide)
AZURE_CLIENT_ID=your-application-client-id
AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id

# Alternative: Users can configure in DevMemory settings
Application ID: your-application-client-id
Tenant ID: your-tenant-id (optional for single-tenant)
```

## 👨‍💻 **For DevMemory Users**

### **Option 1: Environment Variables (Recommended)**

Your IT department should set these system-wide:

```bash
# Windows (System Environment Variables)
AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789012
AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id

# macOS/Linux (.bashrc or .zshrc)
export AZURE_CLIENT_ID=12345678-1234-1234-1234-123456789012
export AZURE_AUTHORITY=https://login.microsoftonline.com/your-tenant-id
```

### **Option 2: DevMemory Settings**

Configure in DevMemory application:

1. Open DevMemory Settings (`Ctrl+,`)
2. Navigate to `M365 Integration`
3. Enter:
   - **Client ID**: (provided by IT)
   - **Tenant ID**: (optional, provided by IT)

### **Test Authentication**

1. Click `Connect to M365` in DevMemory
2. You'll see your company's login page
3. Enter your usual work credentials (`name@company.com`)
4. Complete any MFA requirements
5. Grant permissions when prompted
6. DevMemory will confirm successful connection

## 🔒 **Security & Compliance**

### **Data Handling**
- ✅ **All M365 data processed locally** on user's device
- ✅ **No data sent to external servers** (except Microsoft Graph APIs)
- ✅ **Tokens stored securely** using OS-level encryption
- ✅ **Respects all Azure AD policies** (Conditional Access, MFA, device compliance)

### **Permissions Explained**
```
User.Read              → Get user's name, email, profile picture
Mail.Read              → Extract knowledge from emails, no sending
Calendars.Read         → Meeting context, no calendar modifications
Sites.Read.All         → SharePoint document intelligence
Files.Read.All         → OneDrive/SharePoint file content
Chat.Read              → Teams conversation knowledge
OnlineMeetings.Read    → Meeting recordings and transcripts
People.Read            → Organization chart and contacts
Directory.Read.Basic   → Basic company directory info
```

### **What DevMemory Cannot Do**
- ❌ Send emails or calendar invites
- ❌ Modify or delete any M365 content
- ❌ Access other users' private data
- ❌ Bypass your organization's security policies
- ❌ Share data outside your organization

## 🛠 **Troubleshooting**

### **Common Issues**

#### **"Application not found" Error**
- Verify the Client ID is correct
- Ensure app registration is in the correct tenant
- Check that the app is not disabled

#### **"Insufficient privileges" Error**
- Admin consent may not be granted
- Ask IT to grant admin consent for the required permissions
- User may not have permission to consent to applications

#### **"Redirect URI mismatch" Error**
- Ensure `http://localhost` is configured as a redirect URI
- Check that platform is set to "Mobile and desktop applications"

#### **Authentication Loops**
- Clear DevMemory's stored credentials (Settings → M365 → Disconnect)
- Check Conditional Access policies aren't blocking the application
- Verify "Allow public client flows" is enabled

### **IT Support Checklist**

```
☐ App registration created with correct name
☐ Client ID provided to users
☐ All required permissions added
☐ Admin consent granted for organization
☐ Redirect URI configured: http://localhost
☐ Public client flows enabled
☐ Conditional Access policies allow DevMemory
☐ Users have permission to use the application
```

### **Logs and Diagnostics**

DevMemory provides detailed authentication logs:
- Open DevMemory Settings → Advanced → View Logs
- Authentication events are logged with timestamps
- Share relevant log entries with IT support if needed

## 📞 **Support Contacts**

- **For App Registration Issues**: Your IT Administrator
- **For DevMemory Configuration**: [DevMemory Support]
- **For Microsoft Graph Permissions**: [Microsoft Documentation](https://docs.microsoft.com/en-us/graph/permissions-reference)

---

**Security Note**: This integration is designed to respect all your organization's existing security policies and controls. DevMemory acts as a read-only client that enhances your personal knowledge management without compromising enterprise security.