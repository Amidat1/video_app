#!/bin/bash

# Simple Azure Static Web App Deploy
# For: https://github.com/Amidat1/video_app

PROJECT_NAME="videoapp$(date +%s)"
RESOURCE_GROUP="${PROJECT_NAME}-rg"
APP_NAME="${PROJECT_NAME}-app"

echo "🚀 Deploying Static Web App..."
echo "Project: $PROJECT_NAME"

# Login check
az account show > /dev/null || az login

# Create resource group
echo "📦 Creating resource group..."
az group create --name $RESOURCE_GROUP --location "East US 2"

# Deploy static web app
echo "🌐 Creating static web app..."
az staticwebapp create \
  --name $APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --source https://github.com/Amidat1/video_app \
  --location "East US 2" \
  --branch main \
  --login-with-github

# Get URL
URL=$(az staticwebapp show --name $APP_NAME --resource-group $RESOURCE_GROUP --query defaultHostname -o tsv)

echo ""
echo "🎉 DEPLOYED SUCCESSFULLY!"
echo "🌍 URL: https://$URL"
echo "📊 Resource Group: $RESOURCE_GROUP"
echo ""
