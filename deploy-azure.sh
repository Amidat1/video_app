#!/bin/bash

# VideoShare TikTok-Style App Azure Deployment Script
# This script deploys a complete video sharing platform to Azure Static Web Apps

set -e

echo "🚀 VideoShare TikTok-Style App Deployment Starting..."

# Configuration - Update with your Azure account details
APP_NAME="videoshare-$(date +%s)"
LOCATION="uksouth"
# SUBSCRIPTION_ID will be auto-detected or you can set it below
# SUBSCRIPTION_ID="your-subscription-id-here"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI not found. Please install: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    print_warning "Not logged in to Azure. Logging in..."
    az login
fi

# Set subscription (auto-detect current subscription)
print_info "Using current Azure subscription..."
CURRENT_SUB=$(az account show --query id --output tsv)
print_info "Current subscription: $CURRENT_SUB"

# Check if the HTML file exists
if [ ! -f "tiktok-app.html" ]; then
    print_error "tiktok-app.html not found! Please make sure you're in the correct directory."
    exit 1
fi

print_status "Preparing build directory..."
mkdir -p build
cp tiktok-app.html build/index.html

# Create Azure Static Web App
print_status "Creating Azure Static Web App..."
az staticwebapp create \
    --name "$APP_NAME" \
    --resource-group "$APP_NAME" \
    --source "." \
    --location "$LOCATION" \
    --branch "main" \
    --app-location "/" \
    --output none

print_status "Static Web App '$APP_NAME' created successfully"

# Get deployment token
print_info "Retrieving deployment token..."
DEPLOYMENT_TOKEN=$(az staticwebapp secrets list \
    --name "$APP_NAME" \
    --resource-group "$APP_NAME" \
    --query "properties.apiKey" \
    --output tsv)

if [ -z "$DEPLOYMENT_TOKEN" ]; then
    print_error "Failed to retrieve deployment token"
    exit 1
fi

print_status "Deployment token retrieved"

# Install SWA CLI if not present
if ! command -v swa &> /dev/null; then
    print_info "Installing Azure Static Web Apps CLI..."
    npm install -g @azure/static-web-apps-cli
fi

# Deploy the application
print_status "Deploying TikTok-style video sharing app..."
swa deploy build --deployment-token "$DEPLOYMENT_TOKEN" --env production

# Get the deployment URL
DEPLOYMENT_URL=$(az staticwebapp show \
    --name "$APP_NAME" \
    --resource-group "$APP_NAME" \
    --query "defaultHostname" \
    --output tsv)

print_status "Deployment completed successfully!"
echo ""
echo "🎉 Your TikTok-style VideoShare app is now live!"
echo ""
echo "📱 Application URL: https://$DEPLOYMENT_URL"
echo "🔧 Resource Group: $APP_NAME"
echo "📦 App Name: $APP_NAME"
echo ""
echo "✨ App Features:"
echo "  • 🔐 Login/Signup system with role selection"
echo "  • 📱 TikTok-style video feed with autoplay"
echo "  • 📤 Drag & drop video upload (up to 500MB)"
echo "  • 👤 User dashboard for uploaded videos"
echo "  • 💾 Data persistence with localStorage"
echo "  • 🎨 Modern dark theme with gradients"
echo ""
echo "🔐 Demo Credentials:"
echo "  Email: john@example.com"
echo "  Password: password123"
echo "  (or create a new account)"
echo ""
echo "🎯 Account Types:"
echo "  • Consumer: Browse and watch videos"
echo "  • Creator: Upload and manage videos"
echo ""
echo "🛠️ Management Commands:"
echo "  View in portal: az staticwebapp browse --name $APP_NAME --resource-group $APP_NAME"
echo "  Get deployment logs: swa build --print-build-info"
echo "  Delete resources: az group delete --name $APP_NAME --yes --no-wait"
echo ""

# Cleanup build directory
rm -rf build

print_status "🚀 TikTok-style VideoShare app is ready to use!"
print_info "Visit: https://$DEPLOYMENT_URL"