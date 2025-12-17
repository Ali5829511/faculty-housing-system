import * as db from "./db";
import { storagePut } from "./storage";

/**
 * Plate Recognizer Snapshot API Webhook Handler
 * 
 * Based on Plate Recognizer documentation:
 * https://guides.platerecognizer.com/docs/snapshot/api-reference/
 * 
 * Webhook Payload Structure from Plate Recognizer:
 * {
 *   "processing_time": 123.456,
 *   "results": [
 *     {
 *       "box": { "xmin": 100, "ymin": 200, "xmax": 300, "ymax": 400 },
 *       "plate": "ABC123",
 *       "region": { "code": "sa", "score": 0.95 },
 *       "vehicle": {
 *         "type": "Sedan",
 *         "score": 0.92,
 *         "box": { "xmin": 50, "ymin": 100, "xmax": 500, "ymax": 600 }
 *       },
 *       "score": 0.95,
 *       "candidates": [
 *         { "score": 0.95, "plate": "ABC123" }
 *       ],
 *       "dscore": 0.85,
 *       "model_make": [
 *         { "make": "Toyota", "model": "Camry", "score": 0.90 }
 *       ],
 *       "color": [
 *         { "color": "white", "score": 0.88 }
 *       ],
 *       "orientation": [
 *         { "orientation": "Front", "score": 0.92 }
 *       ],
 *       "direction": [
 *         { "direction": "North", "score": 0.85 }
 *       ]
 *     }
 *   ],
 *   "filename": "image.jpg",
 *   "version": 1,
 *   "camera_id": "CAM001",
 *   "timestamp": "2025-01-28T19:30:00.000Z"
 * }
 */

interface PlateRecognizerResult {
  box: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  plate: string;
  region: {
    code: string;
    score: number;
  };
  vehicle?: {
    type: string;
    score: number;
    box: {
      xmin: number;
      ymin: number;
      xmax: number;
      ymax: number;
    };
  };
  score: number;
  candidates: Array<{
    score: number;
    plate: string;
  }>;
  dscore: number;
  model_make?: Array<{
    make: string;
    model: string;
    score: number;
  }>;
  color?: Array<{
    color: string;
    score: number;
  }>;
  orientation?: Array<{
    orientation: string;
    score: number;
  }>;
  direction?: Array<{
    direction: string;
    score: number;
  }>;
}

interface PlateRecognizerWebhookPayload {
  processing_time: number;
  results: PlateRecognizerResult[];
  filename: string;
  version: number;
  camera_id?: string;
  timestamp: string;
  // Optional: image data if webhook is configured to send images
  image?: string; // base64 encoded image
  plate_image?: string; // base64 encoded plate crop
}

/**
 * Process Plate Recognizer webhook data
 */
export async function processPlateRecognizerWebhook(payload: PlateRecognizerWebhookPayload) {
  try {
    console.log("[Plate Recognizer] Processing webhook:", {
      timestamp: payload.timestamp,
      camera_id: payload.camera_id,
      results_count: payload.results.length,
    });

    // Process each detected plate
    for (const result of payload.results) {
      const plateNumber = result.plate;
      const confidence = result.score;
      const regionCode = result.region?.code || "unknown";

      console.log("[Plate Recognizer] Processing plate:", {
        plate: plateNumber,
        confidence,
        region: regionCode,
      });

      // Extract vehicle information
      const vehicleType = result.vehicle?.type || "unknown";
      const vehicleMake = result.model_make?.[0]?.make || "unknown";
      const vehicleModel = result.model_make?.[0]?.model || "unknown";
      const vehicleColor = result.color?.[0]?.color || "unknown";
      const orientation = result.orientation?.[0]?.orientation || "unknown";
      const direction = result.direction?.[0]?.direction || "unknown";

      // Check if vehicle exists
      let vehicle = await db.getVehicleByPlate(plateNumber);

      if (!vehicle) {
        // Create new vehicle
        console.log("[Plate Recognizer] Creating new vehicle:", plateNumber);
        await db.createVehicle({
          plateNumber,
          ownerName: "غير محدد",
          ownerType: "visitor",
          make: vehicleMake,
          model: vehicleModel,
          color: vehicleColor,
          vehicleType: vehicleType === "Sedan" || vehicleType === "sedan" ? "sedan" : 
                       vehicleType === "SUV" || vehicleType === "suv" ? "suv" :
                       vehicleType === "Truck" || vehicleType === "truck" ? "truck" :
                       vehicleType === "Van" || vehicleType === "van" ? "van" :
                       vehicleType === "Motorcycle" || vehicleType === "motorcycle" ? "motorcycle" : "other",
          status: "active",
        });
        vehicle = await db.getVehicleByPlate(plateNumber);
      } else {
        // Update vehicle information if better data is available
        if (vehicleMake !== "unknown" || vehicleModel !== "unknown" || vehicleColor !== "unknown") {
          await db.updateVehicle(vehicle.id, {
            vehicleType: vehicleType !== "unknown" ? (
              vehicleType === "Sedan" || vehicleType === "sedan" ? "sedan" : 
              vehicleType === "SUV" || vehicleType === "suv" ? "suv" :
              vehicleType === "Truck" || vehicleType === "truck" ? "truck" :
              vehicleType === "Van" || vehicleType === "van" ? "van" :
              vehicleType === "Motorcycle" || vehicleType === "motorcycle" ? "motorcycle" : "other"
            ) : vehicle.vehicleType,
            make: vehicleMake !== "unknown" ? vehicleMake : vehicle.make,
            model: vehicleModel !== "unknown" ? vehicleModel : vehicle.model,
            color: vehicleColor !== "unknown" ? vehicleColor : vehicle.color,
          });
        }

        // Increment visit count
        await db.updateVehicle(vehicle.id, {
          visitCount: (vehicle.visitCount || 0) + 1,
        });
      }

      // Process images if provided
      let vehicleImageUrl: string | null = null;
      let plateImageUrl: string | null = null;

      if (payload.image) {
        try {
          // Convert base64 to buffer
          const imageBuffer = Buffer.from(payload.image, "base64");
          const imageName = `vehicle_${plateNumber}_${Date.now()}.jpg`;
          
          // Upload to S3
          const uploadResult = await storagePut(imageName, imageBuffer, "image/jpeg");
          vehicleImageUrl = uploadResult.url;
          console.log("[Plate Recognizer] Vehicle image uploaded:", vehicleImageUrl);
        } catch (error) {
          console.error("[Plate Recognizer] Failed to upload vehicle image:", error);
        }
      }

      if (payload.plate_image) {
        try {
          // Convert base64 to buffer
          const plateBuffer = Buffer.from(payload.plate_image, "base64");
          const plateName = `plate_${plateNumber}_${Date.now()}.jpg`;
          
          // Upload to S3
          const uploadResult = await storagePut(plateName, plateBuffer, "image/jpeg");
          plateImageUrl = uploadResult.url;
          console.log("[Plate Recognizer] Plate image uploaded:", plateImageUrl);
        } catch (error) {
          console.error("[Plate Recognizer] Failed to upload plate image:", error);
        }
      }

      // Create visit record
      if (vehicle) {
        // Find camera by camera_id string (e.g., "CAM001")
        let cameraDbId: number | null = null;
        if (payload.camera_id) {
          const camera = await db.getCameraByCode(payload.camera_id);
          if (camera) {
            cameraDbId = camera.id;
          }
        }

        const visitData = {
          vehicleId: vehicle.id,
          cameraId: cameraDbId,
          cameraCode: payload.camera_id || undefined,
          plateNumber,
          visitType: orientation?.toLowerCase().includes("front") ? "entry" as const : "exit" as const,
          confidence: Math.round(confidence * 100), // Convert 0.95 to 95
          region: regionCode,
          imageUrl: vehicleImageUrl || undefined,
          plateImageUrl: plateImageUrl || undefined,
          timestamp: new Date(payload.timestamp),
          notes: JSON.stringify({
            vehicleType,
            vehicleMake,
            vehicleModel,
            vehicleColor,
            orientation,
            direction,
            processingTime: payload.processing_time,
            rawData: result,
          }),
        };

        await db.createVisit(visitData);
        console.log("[Plate Recognizer] Visit record created for:", plateNumber);
      }
    }

    return {
      success: true,
      processed: payload.results.length,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[Plate Recognizer] Webhook processing error:", error);
    throw error;
  }
}

/**
 * Validate Plate Recognizer webhook payload
 */
export function validatePlateRecognizerPayload(payload: any): payload is PlateRecognizerWebhookPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  // Check required fields
  if (!Array.isArray(payload.results)) {
    return false;
  }

  if (typeof payload.timestamp !== "string") {
    return false;
  }

  // Validate each result
  for (const result of payload.results) {
    if (!result.plate || typeof result.plate !== "string") {
      return false;
    }
    if (typeof result.score !== "number") {
      return false;
    }
  }

  return true;
}
