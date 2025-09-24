# Custom Linktree Setup Guide

This guide will help you set up and use the custom linktree feature in your GDG website.

## Features

- **Custom Profiles**: Create multiple linktree profiles with unique usernames
- **Drag & Drop Reordering**: Easily reorder links with intuitive drag and drop
- **Analytics**: Track clicks, views, and engagement metrics
- **Custom Styling**: Customize colors, backgrounds, and button styles
- **Icon Library**: Choose from dozens of icons for your links
- **Admin Panel**: Full management interface for profiles and links

## Database Setup

1. **Run Migrations**: The linktree tables will be created automatically when you run:
   ```bash
   supabase db reset
   ```

2. **Seed Data**: Sample data will be inserted including a demo profile for "gdg-psu"

## Admin Panel Access

1. Navigate to `/admin/linktree` in your admin panel
2. Create new profiles or manage existing ones
3. Add, edit, and reorder links for each profile
4. View analytics and engagement metrics

## Creating Your First Profile

1. Go to Admin Panel → Linktree
2. Click "New Profile"
3. Fill in the profile details:
   - **Username**: URL-friendly name (e.g., "my-profile")
   - **Display Name**: Public name shown on the page
   - **Bio**: Optional description
   - **Avatar URL**: Profile image URL
   - **Theme**: Light, dark, or auto
   - **Background**: Color, gradient, or image

## Adding Links

1. Select a profile from the admin panel
2. Click "Add Link" in the Links tab
3. Configure your link:
   - **Title**: Link display name
   - **URL**: Destination URL (can be external or internal)
   - **Description**: Optional subtitle
   - **Icon**: Choose from available icons
   - **Button Style**: Default, outline, filled, or minimal
   - **Colors**: Customize button and text colors

## Accessing Your Linktree

Your linktree will be available at:
```
https://yourdomain.com/l/[username]
```

For example: `https://yourdomain.com/l/gdg-psu`

## Demo Page

Visit `/linktree` to see a demo of the linktree functionality and features.

## URL Structure

- `/linktree` - Demo and information page
- `/l/[username]` - Public linktree page
- `/admin/linktree` - Admin management panel

## Analytics

The system tracks:
- Profile views
- Link clicks
- Unique visitors
- Referrer information
- Daily activity trends
- Click-through rates per link

## Customization Options

### Background Types
- **Color**: Solid color background
- **Gradient**: CSS gradient backgrounds with presets
- **Image**: Custom background image URL

### Button Styles
- **Default**: Subtle border with background
- **Outline**: Border only, transparent background
- **Filled**: Solid color background
- **Minimal**: Text only, no background or border

### Icons
Choose from categories:
- General icons (link, mail, phone, etc.)
- Social media icons (GitHub, Twitter, LinkedIn, etc.)
- Custom icons (specify icon name)

## Best Practices

1. **Keep URLs Short**: Use concise, memorable usernames
2. **Optimize for Mobile**: Test your linktree on mobile devices
3. **Use Clear Titles**: Make link purposes obvious
4. **Monitor Analytics**: Track which links perform best
5. **Update Regularly**: Keep links current and relevant
6. **Brand Consistency**: Use colors that match your organization

## Troubleshooting

### Profile Not Found
- Check that the username is correct
- Ensure the profile is marked as "Active"
- Verify the profile exists in the admin panel

### Links Not Working
- Ensure URLs include `http://` or `https://` for external links
- Use relative paths (starting with `/`) for internal links
- Check that links are marked as "Active"

### Analytics Not Tracking
- Verify the analytics policies are properly set up
- Check browser console for any JavaScript errors
- Ensure the increment function is working in the database

## Security

- All profiles and links are protected by Row Level Security (RLS)
- Only authenticated admins can manage linktree content
- Public access is read-only for active profiles and links
- Analytics data is anonymized and aggregated

## Support

For additional help or feature requests, contact your development team or refer to the main project documentation.