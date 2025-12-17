import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import * as parkpow from "./parkpow";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Dashboard stats
  dashboard: router({
    stats: protectedProcedure.query(async () => {
      const vehicleStats = await db.getVehicleStats();
      const violationStats = await db.getViolationStats();
      const recentEntries = await db.getRecentEntries(10);
      
      return {
        vehicles: vehicleStats,
        violations: violationStats,
        recentEntries,
      };
    }),
  }),

  // Vehicles management
  vehicles: router({
    list: protectedProcedure
      .input(z.object({ searchTerm: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllVehicles(input?.searchTerm);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getVehicleById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        plateNumber: z.string(),
        ownerName: z.string(),
        ownerType: z.enum(["student", "faculty", "staff", "visitor"]),
        nationalId: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().optional(),
        make: z.string().optional(),
        model: z.string().optional(),
        year: z.number().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createVehicle({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          status: z.enum(["active", "suspended", "expired"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateVehicle(input.id, input.updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteVehicle(input.id);
      }),
  }),

  // Violations management
  violations: router({
    list: protectedProcedure
      .input(z.object({ searchTerm: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllViolations(input?.searchTerm);
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getViolationById(input.id);
      }),
    
    create: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        plateNumber: z.string(),
        violationType: z.string(),
        points: z.number().optional(),
        severity: z.enum(["low", "medium", "high", "critical"]).optional(),
        location: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createViolation({
          ...input,
          violationNumber: '',
          createdBy: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          status: z.enum(["pending", "paid", "appealed", "cancelled"]).optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateViolation(input.id, input.updates);
      }),
  }),

  // Reports and Export
  reports: router({    exportComprehensiveExcel: protectedProcedure.query(async () => {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      
      // Get data from database
      const vehicles = await db.getAllVehicles();
      const violations = await db.getAllViolations();
      
      // Sheet 1: ملخص حسب النوع (Summary by Type)
      const summarySheet = workbook.addWorksheet('ملخص حسب النوع');
      summarySheet.columns = [
        { header: 'نوع المخالفة', key: 'type', width: 30 },
        { header: 'عدد المخالفات', key: 'count', width: 15 },
        { header: 'النسبة المئوية', key: 'percentage', width: 15 },
      ];
      
      // Group violations by type
      const violationsByType = violations.reduce((acc: Record<string, number>, v) => {
        acc[v.violationType] = (acc[v.violationType] || 0) + 1;
        return acc;
      }, {});
      
      const totalViolations = violations.length;
      Object.entries(violationsByType).forEach(([type, count]) => {
        summarySheet.addRow({
          type,
          count,
          percentage: `${((count / totalViolations) * 100).toFixed(2)}%`,
        });
      });
      
      // Style header row
      summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      summarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF045D84' },
      };
      summarySheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Sheet 2: ملخص لكل مركبة (Summary per Vehicle)
      const vehicleSummarySheet = workbook.addWorksheet('ملخص لكل مركبة');
      vehicleSummarySheet.columns = [
        { header: 'رقم اللوحة', key: 'plateNumber', width: 20 },
        { header: 'اسم المالك', key: 'ownerName', width: 25 },
        { header: 'نوع المالك', key: 'ownerType', width: 15 },
        { header: 'عدد المخالفات', key: 'violationsCount', width: 15 },
        { header: 'عدد الزيارات', key: 'visitCount', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 },
      ];
      
      vehicles.forEach(vehicle => {
        vehicleSummarySheet.addRow({
          plateNumber: vehicle.plateNumber,
          ownerName: vehicle.ownerName,
          ownerType: vehicle.ownerType,
          violationsCount: vehicle.violationsCount,
          visitCount: vehicle.visitCount || 0,
          status: vehicle.status,
        });
      });
      
      vehicleSummarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      vehicleSummarySheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF045D84' },
      };
      vehicleSummarySheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Sheet 3: كشف تفصيلي (Detailed Report)
      const detailedSheet = workbook.addWorksheet('كشف تفصيلي');
      detailedSheet.columns = [
        { header: 'رقم المخالفة', key: 'violationNumber', width: 20 },
        { header: 'رقم اللوحة', key: 'plateNumber', width: 20 },
        { header: 'نوع المخالفة', key: 'violationType', width: 30 },
        { header: 'الموقع', key: 'location', width: 25 },
        { header: 'الخطورة', key: 'severity', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'التاريخ', key: 'createdAt', width: 20 },
      ];
      
      violations.forEach(violation => {
        detailedSheet.addRow({
          violationNumber: violation.violationNumber,
          plateNumber: violation.plateNumber,
          violationType: violation.violationType,
          location: violation.location || '-',
          severity: violation.severity,
          status: violation.status,
          createdAt: new Date(violation.createdAt).toLocaleDateString('ar-SA'),
        });
      });
      
      detailedSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      detailedSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF045D84' },
      };
      detailedSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Sheet 4: كشف السيارات (Vehicles Report)
      const vehiclesSheet = workbook.addWorksheet('كشف السيارات');
      vehiclesSheet.columns = [
        { header: 'رقم اللوحة', key: 'plateNumber', width: 20 },
        { header: 'اسم المالك', key: 'ownerName', width: 25 },
        { header: 'نوع المالك', key: 'ownerType', width: 15 },
        { header: 'الجوال', key: 'mobile', width: 20 },
        { header: 'البريد الإلكتروني', key: 'email', width: 30 },
        { header: 'الماركة', key: 'make', width: 15 },
        { header: 'الموديل', key: 'model', width: 15 },
        { header: 'السنة', key: 'year', width: 10 },
        { header: 'اللون', key: 'color', width: 15 },
        { header: 'الحالة', key: 'status', width: 15 },
        { header: 'تاريخ التسجيل', key: 'createdAt', width: 20 },
      ];
      
      vehicles.forEach(vehicle => {
        vehiclesSheet.addRow({
          plateNumber: vehicle.plateNumber,
          ownerName: vehicle.ownerName,
          ownerType: vehicle.ownerType,
          mobile: vehicle.mobile || '-',
          email: vehicle.email || '-',
          make: vehicle.make || '-',
          model: vehicle.model || '-',
          year: vehicle.year || '-',
          color: vehicle.color || '-',
          status: vehicle.status,
          createdAt: new Date(vehicle.createdAt).toLocaleDateString('ar-SA'),
        });
      });
      
      vehiclesSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      vehiclesSheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF045D84' },
      };
      vehiclesSheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
      
      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      return {
        success: true,
        data: base64,
        filename: `تقرير_شامل_${new Date().toISOString().split('T')[0]}.xlsx`,
      };
    }),
  }),

  // Plate Recognizer API Integration
  plateRecognizer: router({
    // Webhook endpoint for Plate Recognizer
    webhook: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        const { processPlateRecognizerWebhook, validatePlateRecognizerPayload } = await import('./plateRecognizerWebhook');
        
        // Validate payload
        if (!validatePlateRecognizerPayload(input)) {
          throw new Error('Invalid Plate Recognizer webhook payload');
        }
        
        return await processPlateRecognizerWebhook(input);
      }),
  }),

  // ParkPow Plate Recognition (Legacy - keeping for backward compatibility)
  parkpow: router({
    recognizePlate: protectedProcedure
      .input(z.object({
        imageData: z.string(), // base64
      }))
      .mutation(async ({ input }) => {
        const apiToken = process.env.PARKPOW_API_TOKEN;
        if (!apiToken) {
          throw new Error('ParkPow API Token not configured');
        }

        const buffer = Buffer.from(input.imageData, 'base64');
        const result = await parkpow.recognizePlate(buffer, { apiToken });
        
        return {
          success: true,
          data: result,
          vehicleInfo: parkpow.extractVehicleInfo(result),
        };
      }),
    
    processAndExtract: protectedProcedure
      .input(z.object({
        imageData: z.string(), // base64
        saveToDatabase: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const apiToken = process.env.PARKPOW_API_TOKEN;
        if (!apiToken) {
          throw new Error('ParkPow API Token not configured');
        }

        const buffer = Buffer.from(input.imageData, 'base64');
        const plates = await parkpow.processAndExtractPlates(buffer, { apiToken });
        
        // Save to database if requested
        if (input.saveToDatabase) {
          for (const plate of plates) {
            // Check if vehicle exists
            const existingVehicle = await db.getVehicleByPlate(
              parkpow.normalizeSaudiPlate(plate.plateNumber)
            );

            if (existingVehicle) {
              // Create entry record
              await db.createVehicleEntry({
                vehicleId: existingVehicle.id,
                plateNumber: existingVehicle.plateNumber,
                entryType: 'entry',
                createdBy: ctx.user.id,
              });
            } else {
              // Create new vehicle record
              const normalizedPlate = parkpow.normalizeSaudiPlate(plate.plateNumber);
              await db.createVehicle({
                plateNumber: normalizedPlate,
                ownerName: 'Unknown',
                ownerType: 'visitor',
                color: plate.vehicleInfo?.vehicleColor || undefined,
                make: plate.vehicleInfo?.vehicleMake || undefined,
                model: plate.vehicleInfo?.vehicleModel || undefined,
                createdBy: ctx.user.id,
              });
            }

            // Save plate image to S3
            const imageBuffer = Buffer.from(plate.plateImage, 'base64');
            const fileKey = `plates/${Date.now()}-${nanoid()}.jpg`;
            await storagePut(fileKey, imageBuffer, 'image/jpeg');
          }
        }
        
        return {
          success: true,
          plates,
          count: plates.length,
        };
      }),
    
    getStatistics: protectedProcedure.query(async () => {
      const apiToken = process.env.PARKPOW_API_TOKEN;
      if (!apiToken) {
        throw new Error('ParkPow API Token not configured');
      }

      return await parkpow.getStatistics({ apiToken });
    }),
    
    // Webhook endpoint for ParkPow
    webhook: publicProcedure
      .input(z.any())
      .mutation(async ({ input }) => {
        const { processWebhook } = await import('./parkpowWebhook');
        return await processWebhook(input);
      }),
  }),

  // Cameras management
  cameras: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllCameras();
    }),
    
    create: protectedProcedure
      .input(z.object({
        code: z.string(),
        name: z.string(),
        type: z.enum(["entrance", "exit", "both"]),
        location: z.string().optional(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createCamera({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          name: z.string().optional(),
          status: z.enum(["active", "inactive", "maintenance"]).optional(),
          location: z.string().optional(),
          notes: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateCamera(input.id, input.updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteCamera(input.id);
      }),
  }),

  // Visits management
  visits: router({
    list: protectedProcedure
      .input(z.object({ searchTerm: z.string().optional() }).optional())
      .query(async ({ input }) => {
        return await db.getAllVisits(input?.searchTerm);
      }),
    
    byVehicle: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVisitsByVehicle(input.vehicleId);
      }),
    
    byCamera: protectedProcedure
      .input(z.object({ cameraId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVisitsByCamera(input.cameraId);
      }),
  }),

  // Tags management
  tags: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTags();
    }),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        nameAr: z.string().optional(),
        color: z.string().optional(),
        description: z.string().optional(),
        category: z.enum(["authorization", "status", "priority", "custom"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createTag({
          ...input,
          createdBy: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        updates: z.object({
          name: z.string().optional(),
          nameAr: z.string().optional(),
          color: z.string().optional(),
          description: z.string().optional(),
        }),
      }))
      .mutation(async ({ input }) => {
        return await db.updateTag(input.id, input.updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteTag(input.id);
      }),
    
    assignToVehicle: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.assignTagToVehicle(input.vehicleId, input.tagId, ctx.user.id);
      }),
    
    removeFromVehicle: protectedProcedure
      .input(z.object({
        vehicleId: z.number(),
        tagId: z.number(),
      }))
      .mutation(async ({ input }) => {
        return await db.removeTagFromVehicle(input.vehicleId, input.tagId);
      }),
    
    getVehicleTags: protectedProcedure
      .input(z.object({ vehicleId: z.number() }))
      .query(async ({ input }) => {
        return await db.getVehicleTags(input.vehicleId);
      }),
  }),

  // Analytics & Reports
  analytics: router({
    // Most frequent vehicles
    topVehicles: protectedProcedure
      .input(z.object({
        limit: z.number().default(10),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];

        const { vehicles } = await import("../drizzle/schema");
        const { desc } = await import("drizzle-orm");

        // Get vehicles ordered by visitCount
        const topVehicles = await dbInstance
          .select()
          .from(vehicles)
          .orderBy(desc(vehicles.visitCount))
          .limit(input.limit);

        return topVehicles;
      }),

    // Visit distribution by hour
    visitsByHour: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];

        const { visits } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");

        // Get visit count by hour
        const result = await dbInstance.execute(sql`
          SELECT 
            HOUR(timestamp) as hour,
            COUNT(*) as count
          FROM visits
          WHERE 1=1
            ${input.startDate ? sql`AND timestamp >= ${input.startDate}` : sql``}
            ${input.endDate ? sql`AND timestamp <= ${input.endDate}` : sql``}
          GROUP BY HOUR(timestamp)
          ORDER BY hour
        `);

        return result;
      }),

    // Visit distribution by day of week
    visitsByDayOfWeek: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];

        const { visits } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");

        // Get visit count by day of week
        const result = await dbInstance.execute(sql`
          SELECT 
            DAYOFWEEK(timestamp) as dayOfWeek,
            COUNT(*) as count
          FROM visits
          WHERE 1=1
            ${input.startDate ? sql`AND timestamp >= ${input.startDate}` : sql``}
            ${input.endDate ? sql`AND timestamp <= ${input.endDate}` : sql``}
          GROUP BY DAYOFWEEK(timestamp)
          ORDER BY dayOfWeek
        `);

        return result;
      }),

    // Visit distribution by date
    visitsByDate: protectedProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }))
      .query(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) return [];

        const { visits } = await import("../drizzle/schema");
        const { sql } = await import("drizzle-orm");

        // Get visit count by date
        const result = await dbInstance.execute(sql`
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as count
          FROM visits
          WHERE 1=1
            ${input.startDate ? sql`AND timestamp >= ${input.startDate}` : sql``}
            ${input.endDate ? sql`AND timestamp <= ${input.endDate}` : sql``}
          GROUP BY DATE(timestamp)
          ORDER BY date DESC
          LIMIT 30
        `);

        return result;
      }),
  }),

  // Batch Processing Router
  batchProcessing: router({
    // Process single image with Plate Recognizer
    processImage: protectedProcedure
      .input(z.object({
        imageData: z.string(), // base64 image data
        filename: z.string(),
      }))
      .mutation(async ({ input }) => {
        try {
          // TODO: Replace with actual Plate Recognizer API key
          const apiKey = process.env.PLATE_RECOGNIZER_API_KEY || 'YOUR_API_KEY_HERE';
          
          // Convert base64 to buffer
          const base64Data = input.imageData.replace(/^data:image\/\w+;base64,/, '');
          const imageBuffer = Buffer.from(base64Data, 'base64');

          // Call Plate Recognizer API
          const FormData = (await import('form-data')).default;
          const formData = new FormData();
          formData.append('upload', imageBuffer, input.filename);
          formData.append('regions', 'sa'); // Saudi Arabia

          const response = await fetch('https://api.platerecognizer.com/v1/plate-reader/', {
            method: 'POST',
            headers: {
              'Authorization': `Token ${apiKey}`,
              ...formData.getHeaders(),
            },
            body: formData as any,
          });

          if (!response.ok) {
            throw new Error(`Plate Recognizer API error: ${response.statusText}`);
          }

          const result = await response.json();

          // Extract plate information
          const plates = result.results || [];
          if (plates.length === 0) {
            return {
              success: false,
              error: 'لم يتم العثور على لوحة في الصورة',
            };
          }

          const plate = plates[0];
          const plateNumber = plate.plate; // English format
          const plateNumberArabic = plate.plate_arabic || plateNumber; // Arabic format
          const confidence = Math.round(plate.score * 100);
          const region = plate.region?.code || 'غير محدد';
          
          // Extract vehicle information
          const vehicle = plate.vehicle || {};
          const vehicleType = vehicle.type || 'غير محدد';
          const vehicleMake = vehicle.make?.[0]?.name || 'غير محدد';
          const vehicleModel = vehicle.make_model?.[0]?.name || 'غير محدد';
          const vehicleColor = vehicle.color?.[0]?.color || 'غير محدد';
          const vehicleYear = vehicle.year?.[0]?.year || null;

          // Upload image to S3
          const { storagePut } = await import('./storage');
          const imageKey = `batch-processing/${Date.now()}-${input.filename}`;
          const uploadResult = await storagePut(imageKey, imageBuffer, 'image/jpeg');

          // Save to database
          const dbInstance = await db.getDb();
          let vehicleId = null;
          let visitCount = 1;
          
          if (dbInstance) {
            const { vehicles, visits } = await import('../drizzle/schema');
            const { eq, sql } = await import('drizzle-orm');

            // Check if vehicle exists
            const existingVehicles = await dbInstance.select().from(vehicles).where(eq(vehicles.plateNumber, plateNumber));
            
            if (existingVehicles.length > 0) {
              // Update existing vehicle
              vehicleId = existingVehicles[0].id;
              visitCount = (existingVehicles[0].visitCount || 0) + 1;
              
              await dbInstance.update(vehicles)
                .set({
                  visitCount: sql`${vehicles.visitCount} + 1`,
                  updatedAt: new Date(),
                })
                .where(eq(vehicles.id, vehicleId));
            } else {
              // Create new vehicle
              const { createVehicle } = await import('./db');
              const newVehicle = await createVehicle({
                plateNumber,
                ownerName: 'غير محدد',
                ownerType: 'visitor',
                make: vehicleMake !== 'غير محدد' ? vehicleMake : null,
                model: vehicleModel !== 'غير محدد' ? vehicleModel : null,
                color: vehicleColor !== 'غير محدد' ? vehicleColor : null,
                year: vehicleYear,
                visitCount: 1,
                status: 'active',
              });
              vehicleId = Number(newVehicle[0].insertId);
            }

            // Create visit record
            await dbInstance.insert(visits).values({
              vehicleId,
              plateNumber,
              visitType: 'entry',
              confidence,
              region: region !== 'غير محدد' ? region : null,
              imageUrl: uploadResult.url,
              imageKey: uploadResult.key,
              timestamp: new Date(),
              notes: JSON.stringify({
                source: 'batch_processing',
                plateNumberArabic,
                vehicleType,
                vehicleMake,
                vehicleModel,
                vehicleColor,
                vehicleYear,
                filename: input.filename,
              }),
            });
          }

          return {
            success: true,
            data: {
              plateNumber,
              plateNumberArabic,
              confidence,
              region,
              vehicleType,
              vehicleMake,
              vehicleModel,
              vehicleColor,
              vehicleYear,
              imageUrl: uploadResult.url,
              visitCount,
            },
          };
        } catch (error: any) {
          console.error('[Batch Processing] Error:', error);
          return {
            success: false,
            error: error.message || 'حدث خطأ أثناء معالجة الصورة',
          };
        }
      }),
  }),

  // Settings Router
  settings: router({ 
    get: protectedProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await db.getSetting(input.key);
      }),

    getByCategory: protectedProcedure
      .input(z.object({ category: z.enum(["api", "system", "notification", "security"]) }))
      .query(async ({ input }) => {
        return await db.getSettingsByCategory(input.category);
      }),

    upsert: protectedProcedure
      .input(z.object({
        key: z.string(),
        value: z.string(),
        category: z.enum(["api", "system", "notification", "security"]),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.upsertSetting(
          input.key,
          input.value,
          input.category,
          input.description,
          ctx.user.id
        );
      }),

    testPlateRecognizerAPI: protectedProcedure
      .input(z.object({ apiKey: z.string() }))
      .mutation(async ({ input }) => {
        try {
          // Test API by making a simple request
          const response = await fetch('https://api.platerecognizer.com/v1/statistics/', {
            method: 'GET',
            headers: {
              'Authorization': `Token ${input.apiKey}`,
            },
          });

          if (!response.ok) {
            return {
              success: false,
              message: 'مفتاح API غير صحيح أو منتهي الصلاحية',
            };
          }

          const data = await response.json();
          return {
            success: true,
            message: 'تم التحقق من المفتاح بنجاح',
            data: {
              usage: data.usage || {},
              total_calls: data.total_calls || 0,
            },
          };
        } catch (error: any) {
          return {
            success: false,
            message: error.message || 'فشل الاتصال بـ Plate Recognizer API',
          };
        }
      }),
  }),

  // Visits Export Router
  visitsExport: router({
    exportExcel: protectedProcedure
      .input(z.object({
        visitIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const ExcelJS = await import('exceljs');
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('قاعدة البيانات غير متاحة');

        const { visits } = await import('../drizzle/schema');
        const { inArray } = await import('drizzle-orm');

        // Fetch visits
        let visitsData;
        if (input.visitIds && input.visitIds.length > 0) {
          visitsData = await dbInstance.select().from(visits).where(inArray(visits.id, input.visitIds));
        } else {
          visitsData = await dbInstance.select().from(visits);
        }

        // Create workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('سجل الزيارات');

        // Add headers
        worksheet.columns = [
          { header: 'الرقم', key: 'id', width: 10 },
          { header: 'رقم اللوحة', key: 'plateNumber', width: 20 },
          { header: 'نوع الزيارة', key: 'visitType', width: 15 },
          { header: 'نسبة الثقة', key: 'confidence', width: 12 },
          { header: 'المنطقة', key: 'region', width: 15 },
          { header: 'الكاميرا', key: 'cameraCode', width: 15 },
          { header: 'التوقيت', key: 'timestamp', width: 25 },
        ];

        // Add data
        visitsData.forEach((visit: any) => {
          worksheet.addRow({
            id: visit.id,
            plateNumber: visit.plateNumber,
            visitType: visit.visitType === 'entry' ? 'دخول' : visit.visitType === 'exit' ? 'خروج' : 'عبور',
            confidence: `${visit.confidence}%`,
            region: visit.region || 'غير محدد',
            cameraCode: visit.cameraCode || 'غير محدد',
            timestamp: new Date(visit.timestamp).toLocaleString('ar-SA'),
          });
        });

        // Style header
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0066A1' },
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer() as Buffer;
        const base64 = Buffer.from(buffer).toString('base64');

        return {
          data: base64,
          filename: `visits-${Date.now()}.xlsx`,
        };
      }),

    exportHTML: protectedProcedure
      .input(z.object({
        visitIds: z.array(z.number()).optional(),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await db.getDb();
        if (!dbInstance) throw new Error('قاعدة البيانات غير متاحة');

        const { visits } = await import('../drizzle/schema');
        const { inArray } = await import('drizzle-orm');

        // Fetch visits
        let visitsData;
        if (input.visitIds && input.visitIds.length > 0) {
          visitsData = await dbInstance.select().from(visits).where(inArray(visits.id, input.visitIds));
        } else {
          visitsData = await dbInstance.select().from(visits);
        }

        // Generate HTML
        let html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>سجل الزيارات</title>
  <style>
    @media print {
      @page { margin: 0; }
      body { margin: 1cm; }
    }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: right; }
    th { background-color: #0066A1; color: white; font-weight: bold; }
    tr:nth-child(even) { background-color: #f9f9f9; }
    h1 { color: #0066A1; text-align: center; }
    img { max-width: 80px; max-height: 80px; object-fit: cover; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>سجل الزيارات - نظام إدارة المرور الجامعي</h1>
  <table>
    <thead>
      <tr>
        <th>الصورة</th>
        <th>رقم اللوحة</th>
        <th>نوع الزيارة</th>
        <th>نسبة الثقة</th>
        <th>المنطقة</th>
        <th>الكاميرا</th>
        <th>التوقيت</th>
      </tr>
    </thead>
    <tbody>
`;

        visitsData.forEach((visit: any) => {
          const imageUrl = visit.plateImageUrl || visit.imageUrl || '';
          html += `
      <tr>
        <td>${imageUrl ? `<img src="${imageUrl}" alt="صورة">` : 'لا توجد صورة'}</td>
        <td><strong>${visit.plateNumber}</strong></td>
        <td>${visit.visitType === 'entry' ? 'دخول' : visit.visitType === 'exit' ? 'خروج' : 'عبور'}</td>
        <td>${visit.confidence}%</td>
        <td>${visit.region || 'غير محدد'}</td>
        <td>${visit.cameraCode || 'غير محدد'}</td>
        <td>${new Date(visit.timestamp).toLocaleString('ar-SA')}</td>
      </tr>
`;
        });

        html += `
    </tbody>
  </table>
</body>
</html>
`;

        return {
          data: html,
          filename: `visits-${Date.now()}.html`,
        };
      }),
  }),
});



export type AppRouter = typeof appRouter;
