import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Webhook, 
  CheckCircle2, 
  XCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  Info
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function IntegrationTest() {
  const [activeTab, setActiveTab] = useState("data-only");
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample payloads based on Plate Recognizer Snapshot API documentation
  const dataOnlyPayload = {
    processing_time: 123.456,
    results: [
      {
        box: { xmin: 100, ymin: 200, xmax: 300, ymax: 400 },
        plate: "أ ب ج 1234",
        region: { code: "sa", score: 0.95 },
        vehicle: {
          type: "Sedan",
          score: 0.92,
          box: { xmin: 50, ymin: 100, xmax: 500, ymax: 600 }
        },
        score: 0.95,
        candidates: [
          { score: 0.95, plate: "أ ب ج 1234" }
        ],
        dscore: 0.85,
        model_make: [
          { make: "Toyota", model: "Camry", score: 0.90 }
        ],
        color: [
          { color: "white", score: 0.88 }
        ],
        orientation: [
          { orientation: "Front", score: 0.92 }
        ],
        direction: [
          { direction: "North", score: 0.85 }
        ]
      }
    ],
    filename: "test_image.jpg",
    version: 1,
    camera_id: "CAM001",
    timestamp: new Date().toISOString()
  };

  const webhookWithImagePayload = {
    processing_time: 156.789,
    results: [
      {
        box: { xmin: 120, ymin: 180, xmax: 320, ymax: 380 },
        plate: "د هـ و 5678",
        region: { code: "sa", score: 0.92 },
        vehicle: {
          type: "SUV",
          score: 0.89,
          box: { xmin: 60, ymin: 90, xmax: 520, ymax: 580 }
        },
        score: 0.92,
        candidates: [
          { score: 0.92, plate: "د هـ و 5678" }
        ],
        dscore: 0.82,
        model_make: [
          { make: "Nissan", model: "Patrol", score: 0.88 }
        ],
        color: [
          { color: "black", score: 0.85 }
        ],
        orientation: [
          { orientation: "Front", score: 0.90 }
        ],
        direction: [
          { direction: "South", score: 0.83 }
        ]
      }
    ],
    filename: "test_image_with_photo.jpg",
    version: 1,
    camera_id: "CAM002",
    timestamp: new Date().toISOString(),
    // Simulated base64 images (placeholder - in production, these would be real base64 strings)
    image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    plate_image: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
  };

  const [dataOnlyJson, setDataOnlyJson] = useState(JSON.stringify(dataOnlyPayload, null, 2));
  const [withImageJson, setWithImageJson] = useState(JSON.stringify(webhookWithImagePayload, null, 2));

  const webhookMutation = trpc.plateRecognizer.webhook.useMutation({
    onSuccess: (data) => {
      setTestResult({
        success: true,
        data,
        timestamp: new Date().toISOString()
      });
      toast.success("تم اختبار Webhook بنجاح!");
      setIsLoading(false);
    },
    onError: (error) => {
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      toast.error(`فشل الاختبار: ${error.message}`);
      setIsLoading(false);
    },
  });

  const handleTestDataOnly = () => {
    try {
      setIsLoading(true);
      const payload = JSON.parse(dataOnlyJson);
      webhookMutation.mutate(payload);
    } catch (error: any) {
      toast.error(`خطأ في تنسيق JSON: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleTestWithImage = () => {
    try {
      setIsLoading(true);
      const payload = JSON.parse(withImageJson);
      webhookMutation.mutate(payload);
    } catch (error: any) {
      toast.error(`خطأ في تنسيق JSON: ${error.message}`);
      setIsLoading(false);
    }
  };

  const resetDataOnly = () => {
    setDataOnlyJson(JSON.stringify(dataOnlyPayload, null, 2));
    toast.info("تم إعادة تعيين البيانات");
  };

  const resetWithImage = () => {
    setWithImageJson(JSON.stringify(webhookWithImagePayload, null, 2));
    toast.info("تم إعادة تعيين البيانات");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Webhook className="w-8 h-8 text-primary" />
          اختبار التكامل مع Plate Recognizer
        </h1>
        <p className="text-muted-foreground mt-2">
          اختبار Webhooks من Plate Recognizer Snapshot API مع محاكاة البيانات
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>معلومات التكامل</AlertTitle>
        <AlertDescription>
          تم تحديث النظام ليتكامل مع <strong>Plate Recognizer Snapshot API</strong>. 
          يمكنك اختبار الـ Webhook endpoints هنا قبل ربطها مع Plate Recognizer الفعلي.
        </AlertDescription>
      </Alert>

      {/* Test Results Card */}
      {testResult && (
        <Card className={testResult.success ? "border-green-500" : "border-red-500"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  نجح الاختبار
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-500" />
                  فشل الاختبار
                </>
              )}
            </CardTitle>
            <CardDescription>
              الوقت: {new Date(testResult.timestamp).toLocaleString("ar-SA")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResult.success ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <strong>عدد اللوحات المعالجة:</strong> {testResult.data.processed}
                </p>
                <p className="text-sm">
                  <strong>الحالة:</strong> تم إنشاء سجلات الزيارات وتحديث قاعدة البيانات
                </p>
                <Badge variant="default" className="bg-green-500">
                  تم معالجة البيانات بنجاح
                </Badge>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-red-500">
                  <strong>الخطأ:</strong> {testResult.error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Webhook Testing Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="data-only">
            <FileText className="w-4 h-4 ml-2" />
            Data Only
          </TabsTrigger>
          <TabsTrigger value="with-image">
            <ImageIcon className="w-4 h-4 ml-2" />
            With Images
          </TabsTrigger>
        </TabsList>

        {/* Data Only Webhook Tab */}
        <TabsContent value="data-only" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اختبار Webhook - بيانات فقط</CardTitle>
              <CardDescription>
                محاكاة webhook من Plate Recognizer بدون صور - معلومات اللوحة والمركبة فقط
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="data-only-json">Payload JSON</Label>
                <Textarea
                  id="data-only-json"
                  value={dataOnlyJson}
                  onChange={(e) => setDataOnlyJson(e.target.value)}
                  rows={25}
                  className="font-mono text-sm"
                  dir="ltr"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestDataOnly} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الاختبار...
                    </>
                  ) : (
                    <>
                      <Webhook className="w-4 h-4 ml-2" />
                      إرسال Webhook
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetDataOnly}
                  disabled={isLoading}
                >
                  إعادة تعيين
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-md space-y-2">
                <h4 className="font-semibold text-sm">ما سيحدث عند الاختبار:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>سيتم إنشاء مركبة جديدة إذا لم تكن موجودة</li>
                  <li>سيتم تحديث معلومات المركبة (الماركة، الموديل، اللون)</li>
                  <li>سيتم تحديث عداد الزيارات (visitCount) تلقائياً</li>
                  <li>سيتم حفظ سجل الزيارة في جدول visits</li>
                  <li>سيتم حفظ جميع البيانات الإضافية (الاتجاه، الثقة، إلخ)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhook With Image Tab */}
        <TabsContent value="with-image" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>اختبار Webhook - مع الصور</CardTitle>
              <CardDescription>
                محاكاة webhook من Plate Recognizer مع الصور - بيانات اللوحة + صور المركبة واللوحة
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="with-image-json">Payload JSON</Label>
                <Textarea
                  id="with-image-json"
                  value={withImageJson}
                  onChange={(e) => setWithImageJson(e.target.value)}
                  rows={30}
                  className="font-mono text-sm"
                  dir="ltr"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleTestWithImage} 
                  disabled={isLoading}
                  className="flex-1"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      جاري الاختبار...
                    </>
                  ) : (
                    <>
                      <Webhook className="w-4 h-4 ml-2" />
                      إرسال Webhook
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resetWithImage}
                  disabled={isLoading}
                >
                  إعادة تعيين
                </Button>
              </div>

              <div className="bg-muted p-4 rounded-md space-y-2">
                <h4 className="font-semibold text-sm">ما سيحدث عند الاختبار:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>سيتم تحميل الصور من base64 strings</li>
                  <li>سيتم حفظ الصور في S3 تلقائياً</li>
                  <li>سيتم ربط الصور بسجل الزيارة في قاعدة البيانات</li>
                  <li>سيتم حفظ روابط الصور (vehicleImageUrl, plateImageUrl)</li>
                  <li>الصور المستخدمة هنا للاختبار فقط (1x1 pixel)</li>
                  <li>في الإنتاج، سيتم استخدام صور حقيقية من Plate Recognizer</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Documentation Card */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات Webhook Endpoint</CardTitle>
          <CardDescription>
            استخدم هذا الرابط في إعدادات Plate Recognizer لاستقبال البيانات تلقائياً
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md">
            <p className="text-sm font-mono break-all" dir="ltr">
              POST https://your-domain.com/trpc/plateRecognizer.webhook
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">خطوات التكامل مع Plate Recognizer:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>انسخ رابط Webhook أعلاه</li>
              <li>سجل الدخول إلى لوحة تحكم Plate Recognizer</li>
              <li>انتقل إلى إعدادات Webhooks في Stream أو SDK</li>
              <li>أضف Webhook جديد والصق الرابط</li>
              <li>اختر نوع البيانات المطلوبة (مع أو بدون صور)</li>
              <li>احفظ الإعدادات وابدأ الاستقبال التلقائي</li>
            </ol>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold text-sm">الميزات المدعومة:</h4>
            <div className="grid grid-cols-2 gap-2">
              <Badge variant="outline">✅ التعرف على اللوحات السعودية</Badge>
              <Badge variant="outline">✅ استخراج معلومات المركبة</Badge>
              <Badge variant="outline">✅ تحديد الماركة والموديل</Badge>
              <Badge variant="outline">✅ تحديد اللون</Badge>
              <Badge variant="outline">✅ تحديد الاتجاه</Badge>
              <Badge variant="outline">✅ حفظ الصور في S3</Badge>
              <Badge variant="outline">✅ عداد الزيارات التلقائي</Badge>
              <Badge variant="outline">✅ ربط الكاميرات</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
