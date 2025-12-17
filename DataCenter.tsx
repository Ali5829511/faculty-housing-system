import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Plus, 
  Search, 
  Filter,
  Download,
  Upload,
  RefreshCw
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function DataCenter() {
  const [activeTab, setActiveTab] = useState("vehicles");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch data
  const { data: vehicles, isLoading: vehiclesLoading, refetch: refetchVehicles } = trpc.vehicles.list.useQuery();
  const { data: violations, isLoading: violationsLoading, refetch: refetchViolations } = trpc.violations.list.useQuery();
  
  // Mutations
  const createVehicle = trpc.vehicles.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المركبة بنجاح");
      setIsAddDialogOpen(false);
      refetchVehicles();
    },
    onError: (error) => {
      toast.error("فشل إضافة المركبة: " + error.message);
    },
  });

  const createViolation = trpc.violations.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المخالفة بنجاح");
      setIsAddDialogOpen(false);
      refetchViolations();
    },
    onError: (error) => {
      toast.error("فشل إضافة المخالفة: " + error.message);
    },
  });

  const handleAddVehicle = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createVehicle.mutate({
      plateNumber: formData.get("plateNumber") as string,
      ownerName: formData.get("ownerName") as string,
      ownerType: formData.get("ownerType") as "student" | "faculty" | "staff" | "visitor",
      nationalId: formData.get("nationalId") as string || undefined,
      mobile: formData.get("mobile") as string || undefined,
      email: formData.get("email") as string || undefined,
      make: formData.get("make") as string || undefined,
      model: formData.get("model") as string || undefined,
      year: formData.get("year") ? parseInt(formData.get("year") as string) : undefined,
      color: formData.get("color") as string || undefined,
    });
  };

  const handleAddViolation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const plateNumber = formData.get("plateNumber") as string;
    
    // Find vehicle by plate number
    const vehicle = vehicles?.find((v: any) => v.plateNumber === plateNumber);
    if (!vehicle) {
      toast.error("لم يتم العثور على مركبة بهذا الرقم");
      return;
    }
    
    createViolation.mutate({
      vehicleId: vehicle.id,
      plateNumber,
      violationType: formData.get("violationType") as string,
      location: formData.get("location") as string || undefined,
      description: formData.get("description") as string || undefined,
    });
  };

  const handleImport = () => {
    toast.info("ميزة الاستيراد قيد التطوير");
  };

  const handleExport = () => {
    toast.info("ميزة التصدير قيد التطوير");
  };

  if (vehiclesLoading || violationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Database className="w-8 h-8 text-primary" />
            مركز البيانات
          </h1>
          <p className="text-muted-foreground mt-2">
            إدارة شاملة لجميع بيانات النظام
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleImport} variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            استيراد
          </Button>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                إضافة جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {activeTab === "vehicles" ? "إضافة مركبة جديدة" : "إضافة مخالفة جديدة"}
                </DialogTitle>
                <DialogDescription>
                  {activeTab === "vehicles" 
                    ? "أدخل بيانات المركبة الجديدة" 
                    : "أدخل بيانات المخالفة الجديدة"}
                </DialogDescription>
              </DialogHeader>

              {activeTab === "vehicles" ? (
                <form onSubmit={handleAddVehicle} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plateNumber">رقم اللوحة *</Label>
                      <Input id="plateNumber" name="plateNumber" required placeholder="أ ب ج 1234" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerName">اسم المالك *</Label>
                      <Input id="ownerName" name="ownerName" required placeholder="أحمد محمد" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerType">نوع المالك *</Label>
                      <Select name="ownerType" required>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر نوع المالك" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">طالب</SelectItem>
                          <SelectItem value="faculty">عضو هيئة تدريس</SelectItem>
                          <SelectItem value="staff">موظف</SelectItem>
                          <SelectItem value="visitor">زائر</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationalId">رقم الهوية</Label>
                      <Input id="nationalId" name="nationalId" placeholder="1234567890" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobile">رقم الجوال</Label>
                      <Input id="mobile" name="mobile" placeholder="0501234567" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input id="email" name="email" type="email" placeholder="user@imamu.edu.sa" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="make">الصانع</Label>
                      <Input id="make" name="make" placeholder="تويوتا" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">الموديل</Label>
                      <Input id="model" name="model" placeholder="كامري" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">السنة</Label>
                      <Input id="year" name="year" type="number" placeholder="2023" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="color">اللون</Label>
                      <Input id="color" name="color" placeholder="أبيض" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={createVehicle.isPending}>
                      {createVehicle.isPending ? "جاري الإضافة..." : "إضافة"}
                    </Button>
                  </DialogFooter>
                </form>
              ) : (
                <form onSubmit={handleAddViolation} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="violationNumber">رقم المخالفة *</Label>
                      <Input id="violationNumber" name="violationNumber" required placeholder="VIO-2024-001" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="plateNumber">رقم اللوحة *</Label>
                      <Input id="plateNumber" name="plateNumber" required placeholder="أ ب ج 1234" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="violationType">نوع المخالفة *</Label>
                      <Input id="violationType" name="violationType" required placeholder="وقوف خاطئ" />
                    </div>

                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="location">الموقع</Label>
                      <Input id="location" name="location" placeholder="موقف كلية الهندسة" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label htmlFor="description">الوصف</Label>
                      <Textarea id="description" name="description" placeholder="تفاصيل المخالفة..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={createViolation.isPending}>
                      {createViolation.isPending ? "جاري الإضافة..." : "إضافة"}
                    </Button>
                  </DialogFooter>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث في البيانات..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              تصفية
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              refetchVehicles();
              refetchViolations();
              toast.success("تم تحديث البيانات");
            }}>
              <RefreshCw className="w-4 h-4" />
              تحديث
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="vehicles">المركبات ({vehicles?.length || 0})</TabsTrigger>
          <TabsTrigger value="violations">المخالفات ({violations?.length || 0})</TabsTrigger>
          <TabsTrigger value="entries">الحركات</TabsTrigger>
        </TabsList>

        <TabsContent value="vehicles">
          <Card>
            <CardHeader>
              <CardTitle>قاعدة بيانات المركبات</CardTitle>
              <CardDescription>جميع المركبات المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {vehicles && vehicles.length > 0 ? (
                  vehicles
                    .filter((v: any) => 
                      !searchQuery || 
                      v.plateNumber.includes(searchQuery) ||
                      v.ownerName.includes(searchQuery)
                    )
                    .map((vehicle: any) => (
                      <div key={vehicle.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">{vehicle.plateNumber.substring(0, 2)}</span>
                          </div>
                          <div>
                            <p className="font-bold text-lg">{vehicle.plateNumber}</p>
                            <p className="text-sm text-muted-foreground">{vehicle.ownerName}</p>
                            <p className="text-xs text-muted-foreground">
                              {vehicle.make} {vehicle.model} - {vehicle.color}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">تعديل</Button>
                          <Button variant="destructive" size="sm">حذف</Button>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد مركبات مسجلة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations">
          <Card>
            <CardHeader>
              <CardTitle>قاعدة بيانات المخالفات</CardTitle>
              <CardDescription>جميع المخالفات المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {violations && violations.length > 0 ? (
                  violations
                    .filter((v: any) => 
                      !searchQuery || 
                      v.plateNumber.includes(searchQuery) ||
                      v.violationNumber.includes(searchQuery)
                    )
                    .map((violation: any) => (
                      <div key={violation.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-destructive">!</span>
                          </div>
                          <div>
                            <p className="font-bold text-lg">{violation.violationNumber}</p>
                            <p className="text-sm text-muted-foreground">{violation.plateNumber} - {violation.violationType}</p>
                            <p className="text-xs text-muted-foreground">{violation.location}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-left">
                            <p className="text-xs text-muted-foreground">{violation.status === 'paid' ? 'مدفوعة' : 'معلقة'}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">تعديل</Button>
                            <Button variant="destructive" size="sm">حذف</Button>
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">لا توجد مخالفات مسجلة</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entries">
          <Card>
            <CardHeader>
              <CardTitle>سجل الحركات</CardTitle>
              <CardDescription>جميع حركات الدخول والخروج</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">قريباً...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
