/**
 * Upload API Route
 * Handles panorama file uploads and conversion
 * 
 * For large DNG files, we use Vercel Blob Storage
 * Conversion: DNG → WebP (multiple resolutions)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { put } from '@vercel/blob';
import sharp from 'sharp';

// Configure body parser for large files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb',
    },
  },
};

interface UploadResult {
  success: boolean;
  panoramaId?: string;
  images?: {
    high: string;
    medium: string;
    low: string;
  };
  error?: string;
}

// Generate unique ID
function generateId(): string {
  return `pano_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Check if Blob storage is configured
function isBlobConfigured(): boolean {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// Process and convert image to multiple resolutions
async function processImage(
  buffer: Buffer,
  panoramaId: string,
  originalName: string
): Promise<{ high: string; medium: string; low: string }> {
  const isDng = originalName.toLowerCase().endsWith('.dng');
  
  let imageBuffer = buffer;
  
  // For DNG files, we need special handling
  // Note: In production, you'd use dcraw or a RAW processing library
  // For now, we'll handle JPEG/WebP/PNG directly
  if (isDng) {
    // DNG processing would go here
    // For now, throw an error to indicate this needs the full implementation
    throw new Error('DNG-Konvertierung wird vorbereitet. Bitte JPEG oder WebP verwenden für den ersten Test.');
  }

  // Load image with sharp
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) {
    throw new Error('Ungültiges Bildformat');
  }

  // Calculate aspect ratio (should be 2:1 for equirectangular)
  const aspectRatio = metadata.width / metadata.height;
  if (aspectRatio < 1.8 || aspectRatio > 2.2) {
    console.warn(`Warning: Aspect ratio ${aspectRatio.toFixed(2)} is not 2:1. Image may not display correctly as 360° panorama.`);
  }

  // Generate multiple resolutions
  const resolutions = {
    high: { width: 4096, height: 2048 },
    medium: { width: 2048, height: 1024 },
    low: { width: 512, height: 256 },
  };

  const urls: { high: string; medium: string; low: string } = {
    high: '',
    medium: '',
    low: '',
  };

  // Check if Blob storage is available
  const useBlob = isBlobConfigured();

  for (const [key, size] of Object.entries(resolutions)) {
    const resizedBuffer = await sharp(imageBuffer)
      .resize(size.width, size.height, {
        fit: 'cover',
        position: 'center',
      })
      .webp({ quality: key === 'low' ? 60 : 85 })
      .toBuffer();

    if (useBlob) {
      // Upload to Vercel Blob
      const blob = await put(
        `panoramas/${panoramaId}/${key}.webp`,
        resizedBuffer,
        {
          access: 'public',
          contentType: 'image/webp',
        }
      );
      urls[key as keyof typeof urls] = blob.url;
    } else {
      // Return as base64 data URL (for testing without Blob)
      const base64 = resizedBuffer.toString('base64');
      urls[key as keyof typeof urls] = `data:image/webp;base64,${base64}`;
    }
  }

  return urls;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    // Note: If BLOB_READ_WRITE_TOKEN is not set, we'll use base64 data URLs as fallback
    // This is fine for testing but not recommended for production with large files
    
    // Parse multipart form data
    // Note: Vercel automatically parses multipart if content-type is set correctly
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      res.status(400).json({
        success: false,
        error: 'Content-Type muss multipart/form-data sein',
      });
      return;
    }

    // Get the raw body as buffer
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk));
    }
    const body = Buffer.concat(chunks);

    // Extract file from multipart (simplified parsing)
    // In production, use a proper multipart parser like 'formidable' or 'busboy'
    const boundary = contentType.split('boundary=')[1];
    if (!boundary) {
      res.status(400).json({ success: false, error: 'Invalid multipart boundary' });
      return;
    }

    // Find file data in multipart body
    const boundaryBuffer = Buffer.from(`--${boundary}`);
    const parts = splitBuffer(body, boundaryBuffer);
    
    let fileBuffer: Buffer | null = null;
    let fileName = 'upload.jpg';

    for (const part of parts) {
      const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
      if (headerEnd === -1) continue;
      
      const headerStr = part.slice(0, headerEnd).toString();
      
      if (headerStr.includes('Content-Disposition') && headerStr.includes('filename=')) {
        // Extract filename
        const fileNameMatch = headerStr.match(/filename="([^"]+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
        
        // Get file content (skip headers and trailing CRLF)
        fileBuffer = part.slice(headerEnd + 4);
        // Remove trailing \r\n--
        if (fileBuffer.length > 2 && fileBuffer[fileBuffer.length - 2] === 13 && fileBuffer[fileBuffer.length - 1] === 10) {
          fileBuffer = fileBuffer.slice(0, -2);
        }
        break;
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      res.status(400).json({ success: false, error: 'Keine Datei gefunden' });
      return;
    }

    // Generate panorama ID
    const panoramaId = generateId();

    // Process and upload images
    const images = await processImage(fileBuffer, panoramaId, fileName);

    const result: UploadResult = {
      success: true,
      panoramaId,
      images,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    });
  }
}

// Helper: Split buffer by delimiter
function splitBuffer(buffer: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let index = buffer.indexOf(delimiter, start);
  
  while (index !== -1) {
    if (index > start) {
      parts.push(buffer.slice(start, index));
    }
    start = index + delimiter.length;
    index = buffer.indexOf(delimiter, start);
  }
  
  if (start < buffer.length) {
    parts.push(buffer.slice(start));
  }
  
  return parts;
}
