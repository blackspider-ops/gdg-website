#!/bin/bash

# Quick setup script for the Resources Management System
# This script will set up the resources table and verify the installation

echo "🚀 Setting up Resources Management System..."

# Check if we're in a Supabase project
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    
    # Run the setup SQL
    echo "📊 Creating resources table and sample data..."
    supabase db push
    
    # Run our custom setup
    echo "🔧 Running custom resources setup..."
    supabase db sql --file scripts/ensure-resources-table.sql
    
    # Verify the setup
    echo "🔍 Verifying setup..."
    supabase db sql --file scripts/verify-resources-system.sql
    
    echo "✅ Resources system setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Start your development server: npm run dev"
    echo "2. Navigate to /admin in your browser"
    echo "3. Go to the Resources section"
    echo "4. Start managing your resources!"
    echo ""
    echo "📚 For detailed documentation, see RESOURCES_SYSTEM.md"
    
else
    echo "❌ Supabase CLI not found"
    echo "Please install Supabase CLI first:"
    echo "npm install -g supabase"
    echo ""
    echo "Or run the SQL files manually in your database:"
    echo "1. scripts/ensure-resources-table.sql"
    echo "2. scripts/verify-resources-system.sql"
fi