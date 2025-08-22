# Starfield Systems Deployment Guide

## Quick Deploy
```bash
npm run build
git add .
git commit -m "Your message"
git push origin main
```

GitHub Actions will automatically deploy to S3.

## CloudFront Cache Invalidation
```bash
aws cloudfront create-invalidation --distribution-id E1GGWLRD4YW3XY --paths "/*"
```

## Key Files
- **Favicon**: `/app/favicon.ico` (NOT in /public)
- **Social Image**: `/public/og-image.png` (1200x630)
- **Build Output**: `/out/` directory

## AWS Resources
- **S3 Bucket**: `starfield-systems-web`
- **CloudFront Distribution**: `E1GGWLRD4YW3XY`
- **Domain**: `starfieldsystems.com`

## Common Issues
1. **Favicon not updating**: Must be in `/app/favicon.ico`, not `/public`
2. **Social image not working**: Check dimensions (1200x630) and path in metadata
3. **Changes not showing**: Run CloudFront invalidation command above