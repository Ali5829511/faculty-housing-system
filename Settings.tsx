import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Database,
  Key,
  Globe,
  Palette
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

function APISettingsForm() {
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  const { data: savedApiKey, isLoading: loadingApiKey } = trpc.settings.get.useQuery({ key: "plate_recognizer_api_key" });
  const upsertSetting = trpc.settings.upsert.useMutation();
  const testAPI = trpc.settings.testPlateRecognizerAPI.useMutation();

  // Load saved API key
  useEffect(() => {
    if (savedApiKey?.value) {
      setApiKey(savedApiKey.value);
    }
  }, [savedApiKey]);

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      toast.error("يرجى إدخال مفتاح API");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testAPI.mutateAsync({ apiKey });
      setTestResult(result);
      
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        message: error.message || "فشل الاتصال",
      });
      toast.error("فشل اختبار الاتصال");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("يرجى إدخال مفتاح API");
      return;
    }

    try {
      await upsertSetting.mutateAsync({
        key: "plate_recognizer_api_key",
        value: apiKey,
        category: "api",
        description: "Plate Recognizer API Key for vehicle plate recognition",
      });
      toast.success("تم حفظ مفتاح API بنجاح");
    } catch (error: any) {
      toast.error("فشل حفظ مفتاح API");
    }
  };

  if (loadingApiKey) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="apiKey">مفتاح API</Label>
        <Textarea
          id="apiKey"
          placeholder="أدخل مفتاح Plate Recognizer API هنا..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          rows={3}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          يمكنك الحصول على مفتاح API من{" "}
          <a
            href="https://app.platerecognizer.com/start/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Plate Recognizer
          </a>
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          onClick={handleTestConnection}
          variant="outline"
          disabled={isTesting || !apiKey.trim()}
          className="flex-1"
        >
          {isTesting ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الاختبار...
            </>
          ) : (
            "اختبار الاتصال"
          )}
        </Button>
        <Button
          onClick={handleSave}
          disabled={upsertSetting.isPending || !apiKey.trim()}
          className="flex-1"
        >
          {upsertSetting.isPending ? (
            <>
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              جاري الحفظ...
            </>
          ) : (
            "حفظ المفتاح"
          )}
        </Button>
      </div>

      {testResult && (
        <div
          className={`p-4 rounded-lg border ${
            testResult.success
              ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
              : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  testResult.success
                    ? "text-green-900 dark:text-green-100"
                    : "text-red-900 dark:text-red-100"
                }`}
              >
                {testResult.message}
              </p>
              {testResult.data && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <p>إجمالي الاستخدام: {testResult.data.total_calls || 0} طلب</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-3">
        <h3 className="text-sm font-semibold">معلومات عن Plate Recognizer API</h3>
        <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
          <li>يتم استخدام API للتعرف التلقائي على لوحات المركبات</li>
          <li>يدعم اللوحات السعودية بالعربي والإنجليزي</li>
          <li>يستخرج معلومات المركبة (النوع، الصانع، الموديل، اللون)</li>
          <li>يحفظ الصور تلقائيًا في S3</li>
          <li>يحدث عداد التكرار لكل مركبة</li>
        </ul>
      </div>
    </div>
  );
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const { data: user } = trpc.auth.me.useQuery();

  const handleSaveGeneral = () => {
    toast.success("تم حفظ الإعدادات العامة");
  };

  const handleSaveNotifications = () => {
    toast.success("تم حفظ إعدادات الإشعارات");
  };

  const handleSaveSecurity = () => {
    toast.success("تم حفظ إعدادات الأمان");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <SettingsIcon className="w-8 h-8 text-primary" />
          الإعدادات
        </h1>
        <p className="text-muted-foreground mt-2">
          إدارة إعدادات النظام والحساب الشخصي
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="gap-2">
            <Globe className="w-4 h-4" />
            عام
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="api" className="gap-2">
            <Key className="w-4 h-4" />
            إعدادات API
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            الأمان
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الإعدادات العامة</CardTitle>
                <CardDescription>إعدادات النظام الأساسية</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">اسم النظام</Label>
                    <Input id="systemName" defaultValue="نظام المرور الجامعي" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="universityName">اسم الجامعة</Label>
                    <Input id="universityName" defaultValue="جامعة الإمام محمد بن سعود الإسلامية" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">اللغة</Label>
                    <Select defaultValue="ar">
                      <SelectTrigger id="language">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ar">العربية</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">المنطقة الزمنية</Label>
                    <Select defaultValue="asia/riyadh">
                      <SelectTrigger id="timezone">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia/riyadh">الرياض (GMT+3)</SelectItem>
                        <SelectItem value="asia/dubai">دبي (GMT+4)</SelectItem>
                        <SelectItem value="africa/cairo">القاهرة (GMT+2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    المظهر
                  </h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>الوضع الداكن</Label>
                      <p className="text-sm text-muted-foreground">تفعيل الوضع الداكن للنظام</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>الرسوم المتحركة</Label>
                      <p className="text-sm text-muted-foreground">تفعيل التأثيرات المتحركة</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Button onClick={handleSaveGeneral} className="w-full">
                  حفظ التغييرات
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  إعدادات قاعدة البيانات
                </CardTitle>
                <CardDescription>معلومات الاتصال بقاعدة البيانات</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>النسخ الاحتياطي التلقائي</Label>
                    <p className="text-sm text-muted-foreground">نسخ احتياطي يومي للبيانات</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>تنظيف البيانات القديمة</Label>
                    <p className="text-sm text-muted-foreground">حذف البيانات الأقدم من سنة</p>
                  </div>
                  <Switch />
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1">
                    نسخ احتياطي الآن
                  </Button>
                  <Button variant="outline" className="flex-1">
                    استعادة نسخة
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>الملف الشخصي</CardTitle>
              <CardDescription>معلومات حسابك الشخصي</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-lg">{user?.name || "المستخدم"}</p>
                  <p className="text-sm text-muted-foreground">{user?.email || "user@imamu.edu.sa"}</p>
                  <p className="text-xs text-muted-foreground">الدور: {user?.role === "admin" ? "مدير" : "مستخدم"}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">الاسم الكامل</Label>
                  <Input id="displayName" defaultValue={user?.name || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input id="email" type="email" defaultValue={user?.email || ""} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">رقم الجوال</Label>
                  <Input id="phone" placeholder="05xxxxxxxx" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">القسم</Label>
                  <Select defaultValue="traffic">
                    <SelectTrigger id="department">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="traffic">إدارة المرور</SelectItem>
                      <SelectItem value="security">الأمن الجامعي</SelectItem>
                      <SelectItem value="admin">الشؤون الإدارية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button className="w-full">تحديث الملف الشخصي</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                إعدادات Plate Recognizer API
              </CardTitle>
              <CardDescription>
                قم بإدخال مفتاح API لتفعيل ميزة التعرف التلقائي على لوحات المركبات
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <APISettingsForm />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
              <CardDescription>إدارة تفضيلات الإشعارات</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">إشعارات المخالفات</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>المخالفات الجديدة</Label>
                    <p className="text-sm text-muted-foreground">إشعار عند تسجيل مخالفة جديدة</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>المخالفات المدفوعة</Label>
                    <p className="text-sm text-muted-foreground">إشعار عند دفع مخالفة</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>الاعتراضات</Label>
                    <p className="text-sm text-muted-foreground">إشعار عند تقديم اعتراض</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">إشعارات المركبات</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>دخول مركبة</Label>
                    <p className="text-sm text-muted-foreground">إشعار عند دخول مركبة للحرم</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>مركبة معلقة</Label>
                    <p className="text-sm text-muted-foreground">تنبيه عند محاولة دخول مركبة معلقة</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">طرق الإشعار</h3>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>البريد الإلكتروني</Label>
                    <p className="text-sm text-muted-foreground">إرسال إشعارات عبر البريد</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>الرسائل النصية</Label>
                    <p className="text-sm text-muted-foreground">إرسال إشعارات عبر SMS</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>إشعارات المتصفح</Label>
                    <p className="text-sm text-muted-foreground">إشعارات فورية في المتصفح</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} className="w-full">
                حفظ التغييرات
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>الأمان وكلمة المرور</CardTitle>
                <CardDescription>إدارة إعدادات الأمان والوصول</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>المصادقة الثنائية</Label>
                      <p className="text-sm text-muted-foreground">طبقة أمان إضافية لحسابك</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>تسجيل الخروج التلقائي</Label>
                      <p className="text-sm text-muted-foreground">بعد 30 دقيقة من عدم النشاط</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    تغيير كلمة المرور
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                    <Input id="currentPassword" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <Input id="newPassword" type="password" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>

                  <Button onClick={handleSaveSecurity} className="w-full">
                    تحديث كلمة المرور
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الجلسات النشطة</CardTitle>
                <CardDescription>الأجهزة المتصلة بحسابك</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-semibold">الجهاز الحالي</p>
                    <p className="text-sm text-muted-foreground">Chrome على Windows - الرياض، السعودية</p>
                    <p className="text-xs text-muted-foreground">آخر نشاط: الآن</p>
                  </div>
                  <Button variant="outline" size="sm">
                    تسجيل الخروج
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
