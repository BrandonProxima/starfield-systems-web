# DNS Setup Instructions for starfieldsystems.com

## Step 1: SSL Certificate Validation (Do this first!)

Add to GoDaddy DNS:

**CNAME Record:**
- Type: `CNAME`
- Name: `_98b5761ed550d6d3b1a84ff65299eecf`
- Value: `_12c6c12a0c6b71913ecb332a90a7d2cb.xlfgrmvvlj.acm-validations.aws.`
- TTL: 600

## Step 2: Point Domain to CloudFront ✅

Add these records to GoDaddy:

**For www subdomain (ADD THIS FIRST):**
- Type: `CNAME`
- Name: `www`
- Value: `d2g1l0lxl07xlc.cloudfront.net`
- TTL: 600

**For root domain (starfieldsystems.com):**
Since GoDaddy doesn't support ALIAS records for root domains pointing to CloudFront, you have two options:

Option 1: Use GoDaddy's forwarding (Recommended)
- Set up domain forwarding from `starfieldsystems.com` to `www.starfieldsystems.com`
- Enable "Forward with masking" if you want to keep the root domain in the URL

Option 2: Use an A record (Less ideal)
- We'd need to get CloudFront IP addresses (not recommended as they can change)

## Certificate ARN
arn:aws:acm:us-east-1:675169529592:certificate/173933ab-df49-4698-b5a1-3f6394673bb7