/**
 * ParkPow Webhook Handler
 * Handles incoming webhooks from ParkPow Snapshot API
 */

import * as db from './db';
import { storagePut } from './storage';
import { nanoid } from 'nanoid';

export interface ParkPowWebhookPayload {
  hook_id: string;
  timestamp: string;
  camera_id: string;
  license_plate: string;
  region: string;
  score: number;
  vehicle?: {
    type?: string;
    make?: string;
    color?: string;
  };
  image_url?: string;
  plate_image_url?: string;
}

/**
 * Process incoming webhook from ParkPow
 */
export async function processWebhook(payload: ParkPowWebhookPayload) {
  try {
    console.log('[ParkPow Webhook] Received:', payload);

    // Normalize plate number
    const plateNumber = payload.license_plate.replace(/\s+/g, '').toUpperCase();

    // Check if vehicle exists
    let vehicle = await db.getVehicleByPlate(plateNumber);

    if (!vehicle) {
      // Create new vehicle
      await db.createVehicle({
        plateNumber,
        ownerName: 'غير معروف',
        ownerType: 'visitor',
        make: payload.vehicle?.make,
        color: payload.vehicle?.color,
        visitCount: 0,
        createdBy: 1, // System user
      });
      
      // Fetch the created vehicle
      vehicle = await db.getVehicleByPlate(plateNumber);
    }

    // Update visit count
    if (vehicle) {
      await db.updateVehicle(vehicle.id, {
        visitCount: (vehicle.visitCount || 0) + 1,
      });
    }

    // Save images to S3 if provided
    let imageUrl: string | undefined;
    let imageKey: string | undefined;
    let plateImageUrl: string | undefined;
    let plateImageKey: string | undefined;

    if (payload.image_url) {
      try {
        const response = await fetch(payload.image_url);
        const buffer = await response.arrayBuffer();
        imageKey = `visits/${Date.now()}-${nanoid()}.jpg`;
        const result = await storagePut(imageKey, Buffer.from(buffer), 'image/jpeg');
        imageUrl = result.url;
      } catch (error) {
        console.error('[ParkPow Webhook] Error saving vehicle image:', error);
      }
    }

    if (payload.plate_image_url) {
      try {
        const response = await fetch(payload.plate_image_url);
        const buffer = await response.arrayBuffer();
        plateImageKey = `plates/${Date.now()}-${nanoid()}.jpg`;
        const result = await storagePut(plateImageKey, Buffer.from(buffer), 'image/jpeg');
        plateImageUrl = result.url;
      } catch (error) {
        console.error('[ParkPow Webhook] Error saving plate image:', error);
      }
    }

    // Create visit record
    if (!vehicle) {
      throw new Error('Vehicle not found or created');
    }

    await db.createVisit({
      vehicleId: vehicle.id,
      plateNumber,
      cameraCode: payload.camera_id,
      visitType: 'entry', // Default to entry
      confidence: Math.round(payload.score * 100),
      region: payload.region,
      imageUrl,
      imageKey,
      plateImageUrl,
      plateImageKey,
      parkpowVisitId: payload.hook_id,
      timestamp: new Date(payload.timestamp),
    });

    console.log('[ParkPow Webhook] Successfully processed visit for:', plateNumber);

    return {
      success: true,
      vehicleId: vehicle.id,
      plateNumber,
    };
  } catch (error) {
    console.error('[ParkPow Webhook] Error processing webhook:', error);
    throw error;
  }
}

/**
 * Validate webhook signature (if ParkPow provides one)
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  // TODO: Implement signature validation if ParkPow provides it
  // For now, return true
  return true;
}
