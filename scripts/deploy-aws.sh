#!/bin/bash

# Starfield Systems - AWS Deployment Script
# Deploy to S3 and CloudFront

set -e

echo "🚀 Starting Starfield Systems deployment..."

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Check required environment variables
if [ -z "$AWS_S3_BUCKET" ]; then
  echo "❌ Error: AWS_S3_BUCKET not set"
  exit 1
fi

# Build the application
echo "📦 Building application..."
npm run build

# Upload to S3
echo "☁️ Uploading to S3..."
aws s3 sync out/ s3://$AWS_S3_BUCKET/ \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "*.html" \
  --exclude "*.json"

# Upload HTML files with shorter cache
aws s3 sync out/ s3://$AWS_S3_BUCKET/ \
  --delete \
  --cache-control "public, max-age=0, must-revalidate" \
  --exclude "*" \
  --include "*.html" \
  --include "*.json"

# Invalidate CloudFront distribution if configured
if [ ! -z "$AWS_CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "🔄 Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id $AWS_CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"
fi

echo "✅ Deployment complete!"
echo "🌐 Visit your site at: https://$AWS_S3_BUCKET.s3-website-$AWS_REGION.amazonaws.com"