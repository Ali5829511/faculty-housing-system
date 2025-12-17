import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  Download, 
  FileText, 
  TrendingUp, 
  Car, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Users,
  Activity
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Fetch data from backend
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: vehicles, isLoading: vehiclesLoading } = trpc.vehicles.list.useQuery();
  const { data: violations, isLoading: violationsLoading } = trpc.violations.list.useQuery();

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log("Exporting to PDF...");
  };

  const exportExcelMutation = trpc.reports.exportComprehensiveExcel.useQuery(undefined, {
    enabled: false,
  });

  const handleExportExcel = async () => {
    try {
      const result = await exportExcelMutation.refetch();
      if (result.data?.success && result.data?.data) {
        // Convert base64 to blob
        const byteCharacters = atob(result.data.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = result.data.filename || 'comprehensive_report.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting Excel:', error);
      alert('حدث خطأ أثناء تصدير التقرير');
    }
  };

  if (statsLoading || vehiclesLoading || violationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري تحميل التقارير...</p>
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
            <BarChart3 className="w-8 h-8 text-primary" />
            التقارير والإحصائيات
          </h1>
          <p className="text-muted-foreground mt-2">
            تقارير شاملة ومفصلة عن نظام إدارة المرور الجامعي
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleExportPDF} variant="outline" className="gap-2">
            <FileText className="w-4 h-4" />
            تصدير PDF
          </Button>
          <Button onClick={handleExportExcel} className="gap-2">
            <Download className="w-4 h-4" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Car className="w-4 h-4" />
              إجمالي المركبات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.vehicles?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              نشط: {stats?.vehicles?.active || 0} | معلق: {stats?.vehicles?.suspended || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              إجمالي المخالفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.violations?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              معلقة: {stats?.violations?.pending || 0} | مدفوعة: {stats?.violations?.paid || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              إجمالي المخالفات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.violations?.total?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              إجمالي المخالفات المسجلة
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Activity className="w-4 h-4" />
              الحركة اليومية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {stats?.recentEntries?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              آخر 10 حركات مسجلة
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="vehicles">تقرير المركبات</TabsTrigger>
          <TabsTrigger value="violations">تقرير المخالفات</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ملخص النظام</CardTitle>
              <CardDescription>نظرة شاملة على أداء نظام إدارة المرور</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Car className="w-5 h-5 text-primary" />
                    توزيع المركبات حسب الحالة
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">نشطة</span>
                      <Badge variant="default" className="bg-green-600">
                        {stats?.vehicles?.active || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium">معلقة</span>
                      <Badge variant="default" className="bg-yellow-600">
                        {stats?.vehicles?.suspended || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium">منتهية</span>
                      <Badge variant="default" className="bg-red-600">
                        {stats?.vehicles?.expired || 0}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    توزيع المخالفات حسب الحالة
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="text-sm font-medium">معلقة</span>
                      <Badge variant="default" className="bg-orange-600">
                        {stats?.violations?.pending || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium">مدفوعة</span>
                      <Badge variant="default" className="bg-green-600">
                        {stats?.violations?.paid || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium">معترض عليها</span>
                      <Badge variant="default" className="bg-blue-600">
                        {stats?.violations?.appealed || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Entries */}
          <Card>
            <CardHeader>
              <CardTitle>آخر الحركات المسجلة</CardTitle>
              <CardDescription>سجل دخول وخروج المركبات الأخير</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم اللوحة</TableHead>
                    <TableHead>نوع الحركة</TableHead>
                    <TableHead>الموقع</TableHead>
                    <TableHead>التاريخ والوقت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats?.recentEntries && stats.recentEntries.length > 0 ? (
                    stats.recentEntries.map((entry: any) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.plateNumber}</TableCell>
                        <TableCell>
                          <Badge variant={entry.entryType === 'entry' ? 'default' : 'secondary'}>
                            {entry.entryType === 'entry' ? 'دخول' : 'خروج'}
                          </Badge>
                        </TableCell>
                        <TableCell>{entry.gateLocation || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(entry.timestamp).toLocaleString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        لا توجد حركات مسجلة
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vehicles Tab */}
        <TabsContent value="vehicles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تقرير المركبات المسجلة</CardTitle>
              <CardDescription>قائمة شاملة بجميع المركبات المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصورة</TableHead>
                    <TableHead>رقم اللوحة</TableHead>
                    <TableHead>اسم المالك</TableHead>
                    <TableHead>نوع المالك</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المخالفات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles && vehicles.length > 0 ? (
                    vehicles.map((vehicle: any) => (
                      <TableRow key={vehicle.id}>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={vehicle.vehicleImageUrl || undefined} />
                            <AvatarFallback>
                              <Car className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-bold">{vehicle.plateNumber}</TableCell>
                        <TableCell>{vehicle.ownerName}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {vehicle.ownerType === 'student' ? 'طالب' : 
                             vehicle.ownerType === 'faculty' ? 'عضو هيئة تدريس' :
                             vehicle.ownerType === 'staff' ? 'موظف' : 'زائر'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={vehicle.status === 'active' ? 'default' : 
                                   vehicle.status === 'suspended' ? 'destructive' : 'secondary'}
                          >
                            {vehicle.status === 'active' ? 'نشط' : 
                             vehicle.status === 'suspended' ? 'معلق' : 'منتهي'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {vehicle.violationsCount || 0}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        لا توجد مركبات مسجلة
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Violations Tab */}
        <TabsContent value="violations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>تقرير المخالفات المرورية</CardTitle>
              <CardDescription>قائمة شاملة بجميع المخالفات المسجلة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الصورة</TableHead>
                    <TableHead>رقم المخالفة</TableHead>
                    <TableHead>رقم اللوحة</TableHead>
                    <TableHead>نوع المخالفة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>التاريخ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {violations && violations.length > 0 ? (
                    violations.map((violation: any) => (
                      <TableRow key={violation.id}>
                        <TableCell>
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={violation.evidenceImageUrl || undefined} />
                            <AvatarFallback>
                              <AlertTriangle className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-bold">{violation.violationNumber}</TableCell>
                        <TableCell>{violation.plateNumber}</TableCell>
                        <TableCell>{violation.violationType}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={violation.status === 'paid' ? 'default' : 
                                   violation.status === 'appealed' ? 'secondary' : 'destructive'}
                          >
                            {violation.status === 'paid' ? 'مدفوعة' : 
                             violation.status === 'appealed' ? 'معترض عليها' : 
                             violation.status === 'cancelled' ? 'ملغاة' : 'معلقة'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(violation.createdAt).toLocaleDateString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        لا توجد مخالفات مسجلة
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
