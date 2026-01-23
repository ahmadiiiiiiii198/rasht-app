const sharp = require('sharp');
const path = require('path');

const sizes = [
    { name: 'mipmap-mdpi', size: 48 },
    { name: 'mipmap-hdpi', size: 72 },
    { name: 'mipmap-xhdpi', size: 96 },
    { name: 'mipmap-xxhdpi', size: 144 },
    { name: 'mipmap-xxxhdpi', size: 192 }
];

const inputFile = path.join(__dirname, 'public', 'logo.jpg');
const outputDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

async function generateIcons() {
    for (const { name, size } of sizes) {
        const outputPath = path.join(outputDir, name, 'ic_launcher.png');
        const roundOutputPath = path.join(outputDir, name, 'ic_launcher_round.png');
        const foregroundPath = path.join(outputDir, name, 'ic_launcher_foreground.png');

        console.log(`Generating ${size}x${size} icon for ${name}...`);

        // Create circular/rounded icon by using a circular mask
        await sharp(inputFile)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .png()
            .toFile(outputPath);

        await sharp(inputFile)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .png()
            .toFile(roundOutputPath);

        await sharp(inputFile)
            .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
            .png()
            .toFile(foregroundPath);

        console.log(`  ✓ ${outputPath}`);
    }
    console.log('Done!');
}

generateIcons().catch(console.error);
