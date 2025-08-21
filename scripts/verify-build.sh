#!/bin/bash

echo "🔍 Verifying build before deployment..."

# Check if og-image.png exists
if [ ! -f "out/og-image.png" ]; then
    echo "❌ Error: og-image.png not found in build output"
    exit 1
fi

# Check if favicon.ico exists
if [ ! -f "out/favicon.ico" ]; then
    echo "❌ Error: favicon.ico not found in build output"
    exit 1
fi

# Check meta tags in HTML
if ! grep -q "og:image" out/index.html; then
    echo "❌ Error: og:image meta tag not found in HTML"
    exit 1
fi

# Check file sizes
OG_SIZE=$(stat -f%z "out/og-image.png" 2>/dev/null || stat -c%s "out/og-image.png" 2>/dev/null)
if [ "$OG_SIZE" -lt 10000 ]; then
    echo "❌ Error: og-image.png seems too small (less than 10KB)"
    exit 1
fi

echo "✅ All checks passed!"
echo "📦 Build output verified:"
echo "  - og-image.png: $(ls -lh out/og-image.png | awk '{print $5}')"
echo "  - favicon.ico: $(ls -lh out/favicon.ico | awk '{print $5}')"
echo "  - Meta tags: Found in HTML"