#!/usr/bin/env node

/**
 * Tile Generator for 360° Panorama Viewer
 * 
 * Generates multi-resolution tiles from equirectangular panorama images
 * for use with Photo Sphere Viewer's EquirectangularTilesAdapter.
 * 
 * Usage:
 *   node scripts/generate-tiles.js <input-image> [output-dir]
 * 
 * Example:
 *   node scripts/generate-tiles.js test-assets/sample-4k.jpg output/tiles
 */

import sharp from 'sharp';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, dirname, join } from 'path';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Tile size in pixels (512 is good balance between requests and file size)
  tileSize: 512,
  
  // WebP quality (0-100)
  quality: 85,
  
  // Resolution levels (from lowest to highest)
  // Each level doubles the resolution
  levels: [
    { name: 'low', maxWidth: 2048 },     // Level 0: Preview
    { name: 'medium', maxWidth: 4096 },  // Level 1: Medium
    { name: 'high', maxWidth: 8192 },    // Level 2: Full (or original if smaller)
  ],
  
  // Generate a low-res preview for blur-up loading
  previewWidth: 256,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

function getColumnsAndRows(width, height, tileSize) {
  const cols = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);
  return { cols, rows };
}

// ============================================
// TILE GENERATION
// ============================================

async function generateTiles(inputPath, outputDir) {
  console.log('\n🖼️  Panorama Tile Generator');
  console.log('===========================\n');
  
  // Get image metadata
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  console.log(`📁 Input: ${inputPath}`);
  console.log(`📐 Original size: ${metadata.width}x${metadata.height}`);
  console.log(`📦 Output: ${outputDir}\n`);
  
  await ensureDir(outputDir);
  
  // Generate preview image (for blur-up loading)
  console.log('🔄 Generating preview image...');
  const previewPath = join(outputDir, 'preview.webp');
  await sharp(inputPath)
    .resize(CONFIG.previewWidth)
    .webp({ quality: 60 })
    .toFile(previewPath);
  console.log(`   ✓ Preview: ${CONFIG.previewWidth}px wide\n`);
  
  // Generate tiles for each level
  const levelConfigs = [];
  
  for (let levelIndex = 0; levelIndex < CONFIG.levels.length; levelIndex++) {
    const level = CONFIG.levels[levelIndex];
    const levelDir = join(outputDir, `level-${levelIndex}`);
    await ensureDir(levelDir);
    
    // Calculate actual width (don't upscale)
    const targetWidth = Math.min(level.maxWidth, metadata.width);
    const targetHeight = Math.round(targetWidth / 2); // Equirectangular is 2:1
    
    console.log(`🔄 Level ${levelIndex} (${level.name}): ${targetWidth}x${targetHeight}`);
    
    // Resize image to this level's resolution
    const resizedBuffer = await sharp(inputPath)
      .resize(targetWidth, targetHeight, { fit: 'fill' })
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    const { cols, rows } = getColumnsAndRows(targetWidth, targetHeight, CONFIG.tileSize);
    console.log(`   Tiles: ${cols} columns x ${rows} rows = ${cols * rows} tiles`);
    
    // Generate each tile
    let tileCount = 0;
    for (let row = 0; row < rows; row++) {
      const rowDir = join(levelDir, `row-${row}`);
      await ensureDir(rowDir);
      
      for (let col = 0; col < cols; col++) {
        const left = col * CONFIG.tileSize;
        const top = row * CONFIG.tileSize;
        const width = Math.min(CONFIG.tileSize, targetWidth - left);
        const height = Math.min(CONFIG.tileSize, targetHeight - top);
        
        const tilePath = join(rowDir, `tile-${col}.webp`);
        
        await sharp(inputPath)
          .resize(targetWidth, targetHeight, { fit: 'fill' })
          .extract({ left, top, width, height })
          .webp({ quality: CONFIG.quality })
          .toFile(tilePath);
        
        tileCount++;
      }
    }
    
    console.log(`   ✓ Generated ${tileCount} tiles\n`);
    
    // Store level config for manifest
    levelConfigs.push({
      level: levelIndex,
      name: level.name,
      width: targetWidth,
      height: targetHeight,
      cols,
      rows,
      tileSize: CONFIG.tileSize,
    });
  }
  
  // Generate manifest file
  const manifest = {
    version: 1,
    created: new Date().toISOString(),
    original: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    },
    tileSize: CONFIG.tileSize,
    format: 'webp',
    preview: 'preview.webp',
    levels: levelConfigs,
  };
  
  const manifestPath = join(outputDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log('📄 Manifest saved to manifest.json');
  console.log('\n✅ Tile generation complete!\n');
  
  // Print usage info
  console.log('Usage in Photo Sphere Viewer:');
  console.log('─────────────────────────────');
  console.log(`
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';

const viewer = new Viewer({
  adapter: [EquirectangularTilesAdapter, {
    baseUrl: '${outputDir}/preview.webp',
    tileUrl: (col, row, level) => \`${outputDir}/level-\${level}/row-\${row}/tile-\${col}.webp\`,
    levels: ${JSON.stringify(levelConfigs.map(l => ({
      width: l.width,
      cols: l.cols,
      rows: l.rows,
    })), null, 4)}
  }],
  // ...
});
`);
  
  return manifest;
}

// ============================================
// CLI
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node scripts/generate-tiles.js <input-image> [output-dir]');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/generate-tiles.js test-assets/sample-4k.jpg output/tiles');
    process.exit(1);
  }
  
  const inputPath = args[0];
  const outputDir = args[1] || join(dirname(inputPath), 'tiles', basename(inputPath, '.jpg'));
  
  if (!existsSync(inputPath)) {
    console.error(`Error: Input file not found: ${inputPath}`);
    process.exit(1);
  }
  
  try {
    await generateTiles(inputPath, outputDir);
  } catch (error) {
    console.error('Error generating tiles:', error);
    process.exit(1);
  }
}

main();
