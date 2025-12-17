import axios from 'axios';

const PARKPOW_API_URL = 'https://api.platerecognizer.com/v1';

interface ParkPowConfig {
  apiToken: string;
  licenseKey?: string;
}

interface PlateBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

interface PlateRecognitionResult {
  results: Array<{
    plate: string;
    score: number;
    region: {
      code: string;
      score: number;
    };
    vehicle: {
      type: string;
      score: number;
      color?: Array<{
        color: string;
        score: number;
      }>;
      make?: Array<{
        name: string;
        score: number;
      }>;
      model?: Array<{
        name: string;
        score: number;
      }>;
    };
    box: PlateBox;
  }>;
  filename: string;
  timestamp: string;
  processing_time: number;
}

/**
 * Recognize license plate from image URL or base64
 */
export async function recognizePlate(
  imageData: string | Buffer,
  config: ParkPowConfig
): Promise<PlateRecognitionResult> {
  try {
    const formData = new FormData();
    
    // If imageData is a URL
    if (typeof imageData === 'string' && imageData.startsWith('http')) {
      formData.append('upload_url', imageData);
    } 
    // If imageData is base64 string
    else if (typeof imageData === 'string') {
      const buffer = Buffer.from(imageData, 'base64');
      const blob = new Blob([buffer]);
      formData.append('upload', blob, 'image.jpg');
    }
    // If imageData is Buffer
    else {
      const blob = new Blob([new Uint8Array(imageData)]);
      formData.append('upload', blob, 'image.jpg');
    }

    // Add regions for better accuracy (Saudi Arabia)
    formData.append('regions', 'sa');
    
    const response = await axios.post<PlateRecognitionResult>(
      `${PARKPOW_API_URL}/plate-reader/`,
      formData,
      {
        headers: {
          'Authorization': `Token ${config.apiToken}`,
        },
        timeout: 30000, // 30 seconds
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[ParkPow] API Error:', error.response?.data || error.message);
      throw new Error(`ParkPow API Error: ${error.response?.data?.error || error.message}`);
    }
    throw error;
  }
}

/**
 * Recognize plates from multiple images
 */
export async function recognizePlates(
  images: Array<string | Buffer>,
  config: ParkPowConfig
): Promise<PlateRecognitionResult[]> {
  const results: PlateRecognitionResult[] = [];
  
  for (const image of images) {
    try {
      const result = await recognizePlate(image, config);
      results.push(result);
    } catch (error) {
      console.error('[ParkPow] Failed to process image:', error);
      // Continue with next image
    }
  }
  
  return results;
}

/**
 * Get statistics from ParkPow API
 */
export async function getStatistics(config: ParkPowConfig) {
  try {
    const response = await axios.get(
      `${PARKPOW_API_URL}/statistics/`,
      {
        headers: {
          'Authorization': `Token ${config.apiToken}`,
        },
      }
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[ParkPow] Statistics Error:', error.response?.data || error.message);
    }
    throw error;
  }
}

/**
 * Extract vehicle information from recognition result
 */
export function extractVehicleInfo(result: PlateRecognitionResult) {
  if (!result.results || result.results.length === 0) {
    return null;
  }

  const firstResult = result.results[0];
  
  return {
    plateNumber: firstResult.plate,
    plateScore: firstResult.score,
    region: firstResult.region?.code || 'unknown',
    vehicleType: firstResult.vehicle?.type || 'unknown',
    vehicleColor: firstResult.vehicle?.color?.[0]?.color || null,
    vehicleMake: firstResult.vehicle?.make?.[0]?.name || null,
    vehicleModel: firstResult.vehicle?.model?.[0]?.name || null,
    confidence: firstResult.score,
  };
}

/**
 * Normalize Saudi plate number to standard format
 * Converts Arabic letters to Latin equivalents
 */
export function normalizeSaudiPlate(plate: string): string {
  // Remove spaces and special characters
  let normalized = plate.replace(/[\s\-_]/g, '');
  
  // Convert Arabic letters to Latin (Saudi plate mapping)
  const arabicToLatin: Record<string, string> = {
    'أ': 'A', 'ا': 'A',
    'ب': 'B',
    'ح': 'H', 'ج': 'J',
    'د': 'D',
    'ر': 'R',
    'س': 'S',
    'ص': 'X',
    'ط': 'T',
    'ع': 'E',
    'ق': 'G',
    'ك': 'K',
    'ل': 'L',
    'م': 'Z',
    'ن': 'N',
    'ه': 'H',
    'و': 'U', 'ى': 'V',
  };

  for (const [arabic, latin] of Object.entries(arabicToLatin)) {
    normalized = normalized.replace(new RegExp(arabic, 'g'), latin);
  }

  return normalized.toUpperCase();
}

/**
 * Extract plate image from original image using box coordinates
 * Returns base64 encoded cropped image
 */
export async function extractPlateImage(
  originalImageBuffer: Buffer,
  box: PlateBox
): Promise<string> {
  try {
    // This is a placeholder - in production, you would use sharp or jimp
    // to crop the image based on box coordinates
    // For now, return the original image
    return originalImageBuffer.toString('base64');
  } catch (error) {
    console.error('[ParkPow] Failed to extract plate image:', error);
    throw error;
  }
}

/**
 * Process image and extract all detected plates as separate images
 */
export async function processAndExtractPlates(
  imageBuffer: Buffer,
  config: ParkPowConfig
): Promise<Array<{
  plateNumber: string;
  plateImage: string; // base64
  confidence: number;
  vehicleInfo: ReturnType<typeof extractVehicleInfo>;
}>> {
  const result = await recognizePlate(imageBuffer, config);
  const extractedPlates = [];

  for (const plateResult of result.results) {
    try {
      const plateImage = await extractPlateImage(imageBuffer, plateResult.box);
      const vehicleInfo = extractVehicleInfo(result);

      extractedPlates.push({
        plateNumber: plateResult.plate,
        plateImage,
        confidence: plateResult.score,
        vehicleInfo,
      });
    } catch (error) {
      console.error('[ParkPow] Failed to process plate:', error);
    }
  }

  return extractedPlates;
}
