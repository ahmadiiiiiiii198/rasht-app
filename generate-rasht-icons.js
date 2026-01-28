const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_IMAGE = path.join(__dirname, 'public', 'rasht-logo-new.jpg');
const ANDROID_RES = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Android icon sizes for each density
const ICON_SIZES = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192
};

// Foreground sizes (larger for adaptive icons)
const FOREGROUND_SIZES = {
    'mipmap-mdpi': 108,
    'mipmap-hdpi': 162,
    'mipmap-xhdpi': 216,
    'mipmap-xxhdpi': 324,
    'mipmap-xxxhdpi': 432
};

async function generateIcons() {
    console.log('🎨 Generating icons from new Rasht logo...\n');

    // First, create web logo (PNG version for public folder)
    await sharp(SOURCE_IMAGE)
        .resize(512, 512, { fit: 'cover' })
        .png()
        .toFile(path.join(PUBLIC_DIR, 'rasht-logo.png'));
    console.log('✅ Generated public/rasht-logo.png (512x512)');

    // Generate favicon
    await sharp(SOURCE_IMAGE)
        .resize(32, 32, { fit: 'cover' })
        .png()
        .toFile(path.join(PUBLIC_DIR, 'favicon.png'));
    console.log('✅ Generated public/favicon.png (32x32)');

    for (const [folder, size] of Object.entries(ICON_SIZES)) {
        const outputDir = path.join(ANDROID_RES, folder);

        // Ensure directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Generate ic_launcher.png (square icon)
        await sharp(SOURCE_IMAGE)
            .resize(size, size, { fit: 'cover' })
            .png()
            .toFile(path.join(outputDir, 'ic_launcher.png'));

        console.log(`✅ Generated ${folder}/ic_launcher.png (${size}x${size})`);

        // Generate ic_launcher_round.png (round icon)
        const roundMask = Buffer.from(
            `<svg width="${size}" height="${size}">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>
      </svg>`
        );

        await sharp(SOURCE_IMAGE)
            .resize(size, size, { fit: 'cover' })
            .composite([{
                input: roundMask,
                blend: 'dest-in'
            }])
            .png()
            .toFile(path.join(outputDir, 'ic_launcher_round.png'));

        console.log(`✅ Generated ${folder}/ic_launcher_round.png (${size}x${size})`);
    }

    // Generate foreground icons for adaptive icons
    for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
        const outputDir = path.join(ANDROID_RES, folder);

        // For adaptive icons, the logo should be centered with padding
        const logoSize = Math.round(size * 0.6);
        const padding = Math.round((size - logoSize) / 2);

        await sharp(SOURCE_IMAGE)
            .resize(logoSize, logoSize, { fit: 'cover' })
            .extend({
                top: padding,
                bottom: padding,
                left: padding,
                right: padding,
                background: { r: 13, g: 61, b: 46, alpha: 1 } // #0d3d2e
            })
            .resize(size, size)
            .png()
            .toFile(path.join(outputDir, 'ic_launcher_foreground.png'));

        console.log(`✅ Generated ${folder}/ic_launcher_foreground.png (${size}x${size})`);
    }

    console.log('\n🎉 All icons generated successfully!');
}

generateIcons().catch(console.error);
