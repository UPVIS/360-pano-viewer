#!/usr/bin/env node

/**
 * Tile Generator for 360° Panorama Viewer
 * 
 * Generates multi-resolution tiles from equirectangular panorama images
 * for use with Photo Sphere Viewer's EquirectangularTilesAdapter.
 * 
 * Supports:
 * - 4K, 8K, 11K+ panoramas
 * - Batch processing of multiple images
 * - Automatic level detection based on input size
 * 
 * Usage:
 *   Single image:
 *     node scripts/generate-tiles.js <input-image> [output-dir]
 * 
 *   Batch processing:
 *     node scripts/generate-tiles.js --batch <input-dir> [output-dir]
 * 
 * Examples:
 *   node scripts/generate-tiles.js test-assets/panorama.jpg
 *   node scripts/generate-tiles.js --batch test-assets/panoramas test-assets/tiles
 */

import sharp from 'sharp';
import { mkdir, writeFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { basename, dirname, join, extname } from 'path';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Tile size in pixels (512 is good balance between requests and file size)
  tileSize: 512,
  
  // WebP quality (0-100)
  quality: 85,
  
  // Resolution levels (from lowest to highest)
  // Levels are dynamically selected based on input resolution
  levels: [
    { name: 'preview', maxWidth: 512, isPreview: true },   // Blur-up preview
    { name: 'low', maxWidth: 2048 },                        // Level 0: Low
    { name: 'medium', maxWidth: 4096 },                     // Level 1: Medium (4K)
    { name: 'high', maxWidth: 8192 },                       // Level 2: High (8K)
    { name: 'ultra', maxWidth: 11264 },                     // Level 3: Ultra (11K)
    { name: 'max', maxWidth: 16384 },                       // Level 4: Max (16K future)
  ],
  
  // Supported image extensions
  supportedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif'],
  
  // Preview settings
  previewWidth: 256,
  previewQuality: 60,
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

function selectLevelsForResolution(originalWidth) {
  // Filter levels that are useful for this resolution
  // Don't include levels larger than the original
  const applicableLevels = CONFIG.levels.filter(level => {
    if (level.isPreview) return false; // Preview handled separately
    return level.maxWidth <= originalWidth * 1.1; // Allow small tolerance
  });
  
  // Always include at least 2 levels for progressive loading
  if (applicableLevels.length < 2) {
    return CONFIG.levels.filter(l => !l.isPreview).slice(0, 2);
  }
  
  return applicableLevels;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  return (ms / 1000).toFixed(1) + 's';
}

// ============================================
// TILE GENERATION
// ============================================

async function generateTilesForImage(inputPath, outputDir, options = {}) {
  const { silent = false, imageIndex = 0, totalImages = 1 } = options;
  const startTime = Date.now();
  
  const prefix = totalImages > 1 ? `[${imageIndex + 1}/${totalImages}] ` : '';
  
  if (!silent) {
    console.log(`\n${prefix}Processing: ${basename(inputPath)}`);
    console.log('─'.repeat(50));
  }
  
  // Get image metadata
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  if (!silent) {
    console.log(`  Original: ${metadata.width}x${metadata.height} (${metadata.format})`);
    console.log(`  Output:   ${outputDir}`);
  }
  
  await ensureDir(outputDir);
  
  // Generate preview image (for blur-up loading)
  const previewPath = join(outputDir, 'preview.webp');
  await sharp(inputPath)
    .resize(CONFIG.previewWidth)
    .webp({ quality: CONFIG.previewQuality })
    .toFile(previewPath);
  
  if (!silent) {
    console.log(`  Preview:  ${CONFIG.previewWidth}px`);
  }
  
  // Select appropriate levels based on input resolution
  const selectedLevels = selectLevelsForResolution(metadata.width);
  
  if (!silent) {
    console.log(`  Levels:   ${selectedLevels.length} (${selectedLevels.map(l => l.name).join(', ')})`);
  }
  
  // Generate tiles for each level
  const levelConfigs = [];
  let totalTiles = 0;
  
  for (let levelIndex = 0; levelIndex < selectedLevels.length; levelIndex++) {
    const level = selectedLevels[levelIndex];
    const levelDir = join(outputDir, `level-${levelIndex}`);
    await ensureDir(levelDir);
    
    // Calculate actual width (don't upscale)
    const targetWidth = Math.min(level.maxWidth, metadata.width);
    const targetHeight = Math.round(targetWidth / 2); // Equirectangular is 2:1
    
    // Resize image to this level's resolution
    const { cols, rows } = getColumnsAndRows(targetWidth, targetHeight, CONFIG.tileSize);
    
    if (!silent) {
      console.log(`  Level ${levelIndex}: ${targetWidth}x${targetHeight} (${cols}x${rows} = ${cols * rows} tiles)`);
    }
    
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
    
    totalTiles += tileCount;
    
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
    version: 2,
    created: new Date().toISOString(),
    original: {
      filename: basename(inputPath),
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
    },
    tileSize: CONFIG.tileSize,
    format: 'webp',
    quality: CONFIG.quality,
    preview: 'preview.webp',
    previewWidth: CONFIG.previewWidth,
    levels: levelConfigs,
  };
  
  const manifestPath = join(outputDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  
  const duration = Date.now() - startTime;
  
  if (!silent) {
    console.log(`  Total:    ${totalTiles} tiles in ${formatDuration(duration)}`);
  }
  
  return { manifest, duration, totalTiles };
}

async function generateTilesBatch(inputDir, outputDir) {
  console.log('\n🖼️  Panorama Tile Generator - Batch Mode');
  console.log('==========================================\n');
  
  // Find all supported images
  const files = await readdir(inputDir);
  const imageFiles = files.filter(file => {
    const ext = extname(file).toLowerCase();
    return CONFIG.supportedExtensions.includes(ext);
  });
  
  if (imageFiles.length === 0) {
    console.log(`No supported images found in ${inputDir}`);
    console.log(`Supported formats: ${CONFIG.supportedExtensions.join(', ')}`);
    return;
  }
  
  console.log(`Found ${imageFiles.length} image(s) to process:`);
  imageFiles.forEach(f => console.log(`  - ${f}`));
  
  const startTime = Date.now();
  const results = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    const inputPath = join(inputDir, file);
    const outputName = basename(file, extname(file));
    const tileOutputDir = join(outputDir, outputName);
    
    try {
      const result = await generateTilesForImage(inputPath, tileOutputDir, {
        imageIndex: i,
        totalImages: imageFiles.length,
      });
      results.push({ file, success: true, ...result });
    } catch (error) {
      console.error(`  Error processing ${file}:`, error.message);
      results.push({ file, success: false, error: error.message });
    }
  }
  
  const totalDuration = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  const totalTiles = results.reduce((sum, r) => sum + (r.totalTiles || 0), 0);
  
  console.log('\n==========================================');
  console.log(`✅ Batch complete: ${successCount}/${imageFiles.length} images`);
  console.log(`   Total tiles: ${totalTiles}`);
  console.log(`   Total time:  ${formatDuration(totalDuration)}`);
  console.log('==========================================\n');
  
  // Generate batch manifest
  const batchManifest = {
    version: 1,
    created: new Date().toISOString(),
    panoramas: results
      .filter(r => r.success)
      .map(r => ({
        id: basename(r.file, extname(r.file)),
        path: basename(r.file, extname(r.file)) + '/',
        ...r.manifest.original,
        levels: r.manifest.levels.length,
      })),
  };
  
  const batchManifestPath = join(outputDir, 'batch-manifest.json');
  await writeFile(batchManifestPath, JSON.stringify(batchManifest, null, 2));
  console.log(`📄 Batch manifest saved to ${batchManifestPath}\n`);
  
  return results;
}

// ============================================
// CLI
// ============================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log(`
Panorama Tile Generator
=======================

Usage:
  Single image:
    node scripts/generate-tiles.js <input-image> [output-dir]

  Batch processing:
    node scripts/generate-tiles.js --batch <input-dir> [output-dir]

Options:
  --batch    Process all images in a directory

Examples:
  node scripts/generate-tiles.js test-assets/panorama.jpg
  node scripts/generate-tiles.js test-assets/room.jpg test-assets/tiles/room
  node scripts/generate-tiles.js --batch test-assets/panoramas test-assets/tiles

Supported formats: ${CONFIG.supportedExtensions.join(', ')}
Supported resolutions: 4K, 8K, 11K, 16K
`);
    process.exit(1);
  }
  
  const isBatch = args[0] === '--batch';
  
  if (isBatch) {
    const inputDir = args[1];
    const outputDir = args[2] || join(inputDir, 'tiles');
    
    if (!inputDir || !existsSync(inputDir)) {
      console.error(`Error: Input directory not found: ${inputDir}`);
      process.exit(1);
    }
    
    try {
      await generateTilesBatch(inputDir, outputDir);
    } catch (error) {
      console.error('Error in batch processing:', error);
      process.exit(1);
    }
  } else {
    const inputPath = args[0];
    const outputDir = args[1] || join(dirname(inputPath), 'tiles', basename(inputPath, extname(inputPath)));
    
    if (!existsSync(inputPath)) {
      console.error(`Error: Input file not found: ${inputPath}`);
      process.exit(1);
    }
    
    console.log('\n🖼️  Panorama Tile Generator');
    console.log('===========================');
    
    try {
      const result = await generateTilesForImage(inputPath, outputDir);
      
      console.log('\n✅ Tile generation complete!\n');
      
      // Print usage info
      const levels = result.manifest.levels;
      console.log('Usage in Photo Sphere Viewer:');
      console.log('─────────────────────────────');
      console.log(`
import { EquirectangularTilesAdapter } from '@photo-sphere-viewer/equirectangular-tiles-adapter';

// Use the highest level for best quality
const TILES_CONFIG = {
  baseUrl: '${outputDir}/preview.webp',
  width: ${levels[levels.length - 1].width},
  cols: ${levels[levels.length - 1].cols},
  rows: ${levels[levels.length - 1].rows},
  tileUrl: (col, row) => \`${outputDir}/level-${levels.length - 1}/row-\${row}/tile-\${col}.webp\`
};
`);
    } catch (error) {
      console.error('Error generating tiles:', error);
      process.exit(1);
    }
  }
}

main();
