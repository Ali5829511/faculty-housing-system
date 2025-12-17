# دليل التكامل مع ParkPow API
## نظام إدارة المرور الجامعي - جامعة الإمام

---

## نظرة عامة

**ParkPow** هو نظام متقدم لإدارة مواقف السيارات والتحكم في الوصول. يوفر ParkPow واجهة برمجية (API) قوية تتيح التكامل مع الأنظمة الخارجية لمزامنة بيانات المركبات والتحكم في الوصول.

### لماذا التكامل مع ParkPow؟

1. **مزامنة تلقائية**: نقل بيانات المركبات بين النظامين تلقائياً
2. **إدارة موحدة**: إدارة المركبات من مكان واحد
3. **تحكم متقدم**: التحكم في البوابات والحواجز من خلال ParkPow
4. **تقارير شاملة**: دمج تقارير النظامين للحصول على رؤية كاملة

---

## المتطلبات الأساسية

### 1. حساب ParkPow

- إنشاء حساب على [ParkPow](https://app.parkpow.com/)
- الحصول على API Key من لوحة التحكم
- تفعيل API Access في إعدادات الحساب

### 2. الصلاحيات المطلوبة

```json
{
  "permissions": [
    "vehicles.read",
    "vehicles.write",
    "vehicles.import",
    "vehicles.export",
    "access.control"
  ]
}
```

---

## نقاط النهاية (Endpoints)

### 1. Import Vehicles (استيراد المركبات)

**الوصف**: استيراد قائمة مركبات من ParkPow إلى نظامنا

**Endpoint**: `POST /api/parkpow/import-vehicles`

**Request**:
```json
{
  "apiKey": "your-parkpow-api-key",
  "baseUrl": "https://app.parkpow.com/api/v1",
  "filters": {
    "status": "active",
    "type": ["student", "faculty", "staff"],
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  }
}
```

**Response**:
```json
{
  "success": true,
  "imported": 150,
  "skipped": 5,
  "errors": 2,
  "details": {
    "vehicles": [
      {
        "plateNumber": "ABC1234",
        "ownerName": "أحمد محمد",
        "ownerType": "student",
        "status": "imported"
      }
    ],
    "errors": [
      {
        "plateNumber": "XYZ5678",
        "error": "Duplicate entry"
      }
    ]
  }
}
```

### 2. Export Vehicles (تصدير المركبات)

**الوصف**: تصدير قائمة مركبات من نظامنا إلى ParkPow

**Endpoint**: `POST /api/parkpow/export-vehicles`

**Request**:
```json
{
  "apiKey": "your-parkpow-api-key",
  "baseUrl": "https://app.parkpow.com/api/v1",
  "vehicleIds": [1, 2, 3, 4, 5],
  "options": {
    "overwrite": true,
    "createNew": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "exported": 5,
  "failed": 0,
  "details": {
    "vehicles": [
      {
        "plateNumber": "ABC1234",
        "parkpowId": "pk_123456",
        "status": "exported"
      }
    ]
  }
}
```

### 3. Sync Vehicles (مزامنة المركبات)

**الوصف**: مزامنة ثنائية الاتجاه بين النظامين

**Endpoint**: `POST /api/parkpow/sync-vehicles`

**Request**:
```json
{
  "apiKey": "your-parkpow-api-key",
  "baseUrl": "https://app.parkpow.com/api/v1",
  "syncMode": "bidirectional",
  "conflictResolution": "latest",
  "options": {
    "deleteRemoved": false,
    "updateExisting": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "synced": {
    "imported": 10,
    "exported": 15,
    "updated": 5,
    "deleted": 0
  },
  "conflicts": [
    {
      "plateNumber": "ABC1234",
      "conflict": "Different owner names",
      "resolution": "kept_local"
    }
  ]
}
```

---

## تنفيذ التكامل

### الخطوة 1: إضافة إعدادات ParkPow

في صفحة الإعدادات، أضف تبويب "ParkPow":

```typescript
// client/src/pages/Settings.tsx
<TabsContent value="parkpow">
  <Card>
    <CardHeader>
      <CardTitle>إعدادات ParkPow API</CardTitle>
      <CardDescription>
        قم بإدخال بيانات الاتصال بـ ParkPow لتفعيل المزامنة التلقائية
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ParkPowSettingsForm />
    </CardContent>
  </Card>
</TabsContent>
```

### الخطوة 2: إنشاء نموذج الإعدادات

```typescript
// client/src/components/ParkPowSettingsForm.tsx
function ParkPowSettingsForm() {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("https://app.parkpow.com/api/v1");
  const [isConnected, setIsConnected] = useState(false);

  const testConnection = trpc.parkpow.testConnection.useMutation();
  const saveSettings = trpc.settings.upsert.useMutation();

  const handleTest = async () => {
    const result = await testConnection.mutateAsync({ apiKey, baseUrl });
    if (result.success) {
      toast.success("تم الاتصال بنجاح");
      setIsConnected(true);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>ParkPow API Key</Label>
        <Input value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
      </div>
      <div>
        <Label>Base URL</Label>
        <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button onClick={handleTest}>اختبار الاتصال</Button>
        <Button onClick={handleSave}>حفظ الإعدادات</Button>
      </div>
      {isConnected && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            الاتصال نشط - جاهز للمزامنة
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### الخطوة 3: إضافة API Endpoints في الخادم

```typescript
// server/routers.ts
parkpow: router({
  testConnection: protectedProcedure
    .input(z.object({
      apiKey: z.string(),
      baseUrl: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      try {
        const response = await fetch(`${input.baseUrl}/auth/verify`, {
          headers: {
            'Authorization': `Bearer ${input.apiKey}`,
          },
        });
        
        if (response.ok) {
          return { success: true, message: 'تم الاتصال بنجاح' };
        } else {
          return { success: false, message: 'مفتاح API غير صحيح' };
        }
      } catch (error) {
        return { success: false, message: 'فشل الاتصال بالخادم' };
      }
    }),

  importVehicles: protectedProcedure
    .input(z.object({
      filters: z.object({
        status: z.enum(['active', 'suspended', 'expired']).optional(),
        type: z.array(z.string()).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const settings = await db.getSetting('parkpow_api_key');
      if (!settings) {
        throw new Error('ParkPow API Key غير محفوظ');
      }

      const baseUrl = (await db.getSetting('parkpow_base_url'))?.value || 
                      'https://app.parkpow.com/api/v1';

      // Fetch vehicles from ParkPow
      const response = await fetch(`${baseUrl}/vehicles`, {
        headers: {
          'Authorization': `Bearer ${settings.value}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('فشل جلب البيانات من ParkPow');
      }

      const parkpowVehicles = await response.json();
      
      let imported = 0;
      let skipped = 0;
      let errors = 0;
      const details = { vehicles: [], errors: [] };

      // Import each vehicle
      for (const pv of parkpowVehicles.data) {
        try {
          // Check if vehicle already exists
          const existing = await db.getVehicleByPlateNumber(pv.plate_number);
          
          if (existing) {
            skipped++;
            continue;
          }

          // Create new vehicle
          await db.createVehicle({
            plateNumber: pv.plate_number,
            ownerName: pv.owner_name || 'غير محدد',
            ownerType: pv.owner_type || 'visitor',
            nationalId: pv.national_id,
            mobile: pv.mobile,
            email: pv.email,
            make: pv.make,
            model: pv.model,
            year: pv.year,
            color: pv.color,
            status: pv.status || 'active',
            createdBy: ctx.user.id,
          });

          imported++;
          details.vehicles.push({
            plateNumber: pv.plate_number,
            ownerName: pv.owner_name,
            status: 'imported',
          });
        } catch (error) {
          errors++;
          details.errors.push({
            plateNumber: pv.plate_number,
            error: error.message,
          });
        }
      }

      return {
        success: true,
        imported,
        skipped,
        errors,
        details,
      };
    }),

  exportVehicles: protectedProcedure
    .input(z.object({
      vehicleIds: z.array(z.number()),
      options: z.object({
        overwrite: z.boolean().default(true),
        createNew: z.boolean().default(true),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      const settings = await db.getSetting('parkpow_api_key');
      if (!settings) {
        throw new Error('ParkPow API Key غير محفوظ');
      }

      const baseUrl = (await db.getSetting('parkpow_base_url'))?.value || 
                      'https://app.parkpow.com/api/v1';

      let exported = 0;
      let failed = 0;
      const details = { vehicles: [] };

      for (const vehicleId of input.vehicleIds) {
        try {
          const vehicle = await db.getVehicleById(vehicleId);
          if (!vehicle) continue;

          // Export to ParkPow
          const response = await fetch(`${baseUrl}/vehicles`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${settings.value}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              plate_number: vehicle.plateNumber,
              owner_name: vehicle.ownerName,
              owner_type: vehicle.ownerType,
              national_id: vehicle.nationalId,
              mobile: vehicle.mobile,
              email: vehicle.email,
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              color: vehicle.color,
              status: vehicle.status,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            exported++;
            details.vehicles.push({
              plateNumber: vehicle.plateNumber,
              parkpowId: result.id,
              status: 'exported',
            });
          } else {
            failed++;
          }
        } catch (error) {
          failed++;
        }
      }

      return {
        success: true,
        exported,
        failed,
        details,
      };
    }),

  syncVehicles: protectedProcedure
    .input(z.object({
      syncMode: z.enum(['import', 'export', 'bidirectional']).default('bidirectional'),
      conflictResolution: z.enum(['local', 'remote', 'latest']).default('latest'),
      options: z.object({
        deleteRemoved: z.boolean().default(false),
        updateExisting: z.boolean().default(true),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Implementation for bidirectional sync
      // This would combine import and export logic
      // with conflict resolution
      
      const result = {
        success: true,
        synced: {
          imported: 0,
          exported: 0,
          updated: 0,
          deleted: 0,
        },
        conflicts: [],
      };

      // Implement sync logic here...

      return result;
    }),
}),
```

### الخطوة 4: إضافة أزرار الاستيراد والتصدير

في صفحة "قاعدة بيانات المركبات":

```typescript
// client/src/pages/VehicleDatabase.tsx
<div className="flex gap-2">
  <Button onClick={handleImportFromParkPow}>
    <Download className="w-4 h-4 ml-2" />
    استيراد من ParkPow
  </Button>
  <Button onClick={handleExportToParkPow} variant="outline">
    <Upload className="w-4 h-4 ml-2" />
    تصدير إلى ParkPow
  </Button>
  <Button onClick={handleSync} variant="secondary">
    <RefreshCw className="w-4 h-4 ml-2" />
    مزامنة
  </Button>
</div>
```

---

## حالات الاستخدام

### 1. الاستيراد الأولي

عند بدء استخدام النظام، استيراد جميع المركبات من ParkPow:

```typescript
const handleInitialImport = async () => {
  const result = await importVehicles.mutateAsync({
    filters: {
      status: 'active',
    },
  });
  
  toast.success(`تم استيراد ${result.imported} مركبة`);
};
```

### 2. المزامنة اليومية

إعداد مزامنة تلقائية يومياً:

```typescript
// في الخادم
cron.schedule('0 2 * * *', async () => {
  // المزامنة في الساعة 2 صباحاً
  await syncVehicles({
    syncMode: 'bidirectional',
    conflictResolution: 'latest',
  });
});
```

### 3. التصدير الانتقائي

تصدير مركبات محددة فقط:

```typescript
const handleExportSelected = async (selectedIds: number[]) => {
  const result = await exportVehicles.mutateAsync({
    vehicleIds: selectedIds,
    options: {
      overwrite: true,
      createNew: true,
    },
  });
  
  toast.success(`تم تصدير ${result.exported} مركبة`);
};
```

---

## معالجة الأخطاء

### أخطاء شائعة وحلولها

#### 1. Authentication Failed
```
Error: 401 Unauthorized
```
**الحل**: تحقق من صحة API Key في صفحة الإعدادات

#### 2. Rate Limit Exceeded
```
Error: 429 Too Many Requests
```
**الحل**: انتظر دقيقة وأعد المحاولة، أو قلل عدد الطلبات

#### 3. Duplicate Entry
```
Error: Vehicle already exists
```
**الحل**: استخدم خيار `overwrite: true` أو تخطي المركبات الموجودة

#### 4. Invalid Data Format
```
Error: Validation failed
```
**الحل**: تحقق من صحة البيانات قبل التصدير

---

## الأمان والخصوصية

### 1. تخزين API Keys

```typescript
// تخزين آمن في قاعدة البيانات
await db.upsertSetting(
  'parkpow_api_key',
  encryptApiKey(apiKey), // تشفير المفتاح
  'api',
  'ParkPow API Key (Encrypted)'
);
```

### 2. التحقق من الصلاحيات

```typescript
// التحقق من صلاحيات المستخدم قبل المزامنة
if (ctx.user.role !== 'admin') {
  throw new Error('غير مصرح لك بالمزامنة');
}
```

### 3. تسجيل العمليات (Logging)

```typescript
// تسجيل كل عملية مزامنة
await db.createAuditLog({
  userId: ctx.user.id,
  action: 'parkpow_sync',
  details: {
    imported: result.imported,
    exported: result.exported,
    timestamp: new Date(),
  },
});
```

---

## الخلاصة

التكامل مع ParkPow API يوفر:

✅ **مزامنة تلقائية** للمركبات بين النظامين
✅ **إدارة موحدة** من واجهة واحدة
✅ **تحديثات فورية** عند إضافة أو تعديل مركبة
✅ **تقارير شاملة** تجمع بيانات النظامين
✅ **أمان عالي** مع تشفير API Keys

للبدء:
1. احصل على API Key من ParkPow
2. أدخل المفتاح في صفحة الإعدادات
3. اختبر الاتصال
4. ابدأ المزامنة!

---

**تم إعداد هذا الدليل بواسطة**: فريق تطوير نظام إدارة المرور الجامعي
**التاريخ**: نوفمبر 2024
**الإصدار**: 1.0
