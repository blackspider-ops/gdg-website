# Admin Secret Code System

## Overview
The admin secret code system provides a secure way to access the admin login interface through the public website. This prevents unauthorized users from even seeing the admin login form.

## How It Works

### 1. Secret Code Entry
- Users can enter a secret code in the newsletter signup field on the website footer
- If the entered email matches the admin secret code, it triggers the admin login popup
- The default secret code is: `gdg-secret@psu.edu`

### 2. Admin Login Process
1. User enters the secret code in the newsletter signup field
2. System recognizes the code and shows the admin login modal
3. Admin enters their credentials (email and password)
4. System authenticates and redirects to admin dashboard

### 3. Security Features
- **Hidden Access**: Admin login is not visible to regular users
- **Configurable Code**: Super admins can change the secret code
- **Email Format**: Secret code must be in valid email format
- **Audit Logging**: All secret code changes are logged
- **Real-time Validation**: Immediate feedback on code format

## Managing the Secret Code

### Current Secret Code
The current secret code is: **gdg-secret@psu.edu**

### Changing the Secret Code
1. Navigate to **Admin Users** → **Security** tab
2. Click "Change Secret Code" in the Admin Access Secret Code section
3. Enter a new secret code in email format (must end with .edu or .com)
4. Click "Save Code" to update

### Security Recommendations
- Change the secret code monthly
- Use a unique email format that's not easily guessable
- Avoid using obvious patterns or real email addresses
- Keep the code confidential among authorized administrators

## Technical Implementation

### Database Storage
- Secret code is stored in the `site_settings` table with key `admin_secret_code`
- Changes are tracked with timestamps and admin IDs
- All modifications are logged in the security events table

### Frontend Integration
- Newsletter signup component checks for secret code match
- Admin login modal is conditionally rendered
- Real-time validation ensures proper email format

### Security Events
All secret code changes are logged with:
- Admin who made the change
- Timestamp of the change
- Partial old and new codes (for security)
- IP address and user agent (if available)

## Code Examples

### Checking Secret Code (Frontend)
```typescript
const handleNewsletterSubmit = (email: string) => {
  if (email === adminSecretCode) {
    setShowAdminLogin(true);
  } else {
    // Process normal newsletter signup
    handleNewsletterSignup(email);
  }
};
```

### Updating Secret Code (Admin)
```typescript
const updateSecretCode = async (newCode: string) => {
  const success = await ContentService.updateAdminSecretCode(newCode, adminId);
  if (success) {
    await SecurityService.logSecurityEvent('password_change', adminId, {
      action: 'secret_code_change'
    });
  }
};
```

## Security Considerations

### Best Practices
1. **Regular Updates**: Change the secret code monthly
2. **Unique Format**: Use non-obvious email patterns
3. **Access Control**: Only super admins can change the code
4. **Monitoring**: Review security logs for unauthorized attempts
5. **Backup Access**: Ensure multiple super admins know the current code

### Potential Risks
- **Code Exposure**: If the secret code is compromised, unauthorized users can access the login form
- **Brute Force**: Attackers could try common email patterns
- **Social Engineering**: Code could be obtained through social engineering

### Mitigation Strategies
- Regular code rotation
- Monitoring of failed login attempts
- Rate limiting on newsletter signup attempts
- Security awareness training for administrators

## Troubleshooting

### Common Issues
1. **Code Not Working**: Ensure exact match including case sensitivity
2. **Validation Errors**: Check email format requirements (.edu or .com ending)
3. **Access Denied**: Verify user has super admin privileges to change code
4. **Login Not Appearing**: Clear browser cache and try again

### Support
For technical support with the admin secret code system, contact the development team or refer to the admin documentation.