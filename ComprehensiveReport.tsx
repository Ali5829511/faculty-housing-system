import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import * as XLSX from 'xlsx';

export default function ComprehensiveReport() {
  const [isExporting, setIsExporting] = useState(false);

  // Fetch data
  const { data: vehicles, isLoading: vehiclesLoading } = trpc.vehicles.list.useQuery({});
  const { data: violations, isLoading: violationsLoading } = trpc.violations.list.useQuery({});

  const isLoading = vehiclesLoading || violationsLoading;

  // Calculate statistics
  const violationsByType = violations?.reduce((acc: any, v: any) => {
    const type = v.violationType || "غير محدد";
    if (!acc[type]) {
      acc[type] = { count: 0, type };
    }
    acc[type].count++;
    return acc;
  }, {} as Record<string, { count: number; type: string }>) || {};

  const violationsByVehicle = violations?.reduce((acc: any, v: any) => {
    const plate = v.plateNumber || "غير محدد";
    if (!acc[plate]) {
      acc[plate] = { count: 0, plate };
    }
    acc[plate].count++;
    return acc;
  }, {} as Record<string, { count: number; plate: string }>) || {};

  const handleExportExcel = () => {
    setIsExporting(true);
    
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();

      // Sheet 1: ملخص حسب النوع
      const typeData = (Object.values(violationsByType) as Array<{ count: number; type: string }>).map(item => ({
        "نوع المخالفة": item.type,
        "العدد": item.count,
      }));
      const ws1 = XLSX.utils.json_to_sheet(typeData);
      XLSX.utils.book_append_sheet(wb, ws1, "ملخص حسب النوع");

      // Sheet 2: ملخص لكل مركبة
      const vehicleData = (Object.values(violationsByVehicle) as Array<{ count: number; plate: string }>).map(item => ({
        "رقم اللوحة": item.plate,
        "عدد المخالفات": item.count,
      }));
      const ws2 = XLSX.utils.json_to_sheet(vehicleData);
      XLSX.utils.book_append_sheet(wb, ws2, "ملخص لكل مركبة");

      // Sheet 3: كشف تفصيلي
      const detailedData = violations?.map((v: any) => ({
        "رقم اللوحة": v.plateNumber,
        "نوع المخالفة": v.violationType,
        "تاريخ المخالفة": new Date(v.violationDate).toLocaleDateString('ar-SA'),
        "الموقع": v.location,
        "اسم المسؤول": v.officerName,
        "حالة المخالفة": v.status === 'open' ? 'مفتوحة' : v.status === 'paid' ? 'مدفوعة' : 'مغلقة',
      })) || [];
      const ws3 = XLSX.utils.json_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(wb, ws3, "كشف تفصيلي");

      // Sheet 4: كشف السيارات
      const vehiclesData = vehicles?.map((v: any) => ({
        "رقم اللوحة": v.plateNumber,
        "نوع المركبة": v.vehicleType,
        "اللون": v.color,
        "عدد الاكتشافات": v.detectionCount || 0,
        "أول ظهور": v.firstSeen ? new Date(v.firstSeen).toLocaleDateString('ar-SA') : '-',
        "آخر ظهور": v.lastSeen ? new Date(v.lastSeen).toLocaleDateString('ar-SA') : '-',
        "الحالة": v.status === 'active' ? 'نشط' : 'غير نشط',
      })) || [];
      const ws4 = XLSX.utils.json_to_sheet(vehiclesData);
      XLSX.utils.book_append_sheet(wb, ws4, "كشف السيارات");

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `تقرير_شامل_${timestamp}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error exporting Excel:", error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary">التقرير الشامل</h1>
          <p className="text-muted-foreground mt-2">
            تقرير شامل يحتوي على جميع البيانات والإحصائيات
          </p>
        </div>
        <Button
          onClick={handleExportExcel}
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              جاري التصدير...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              تصدير Excel
            </>
          )}
        </Button>
      </div>

      {/* ملخص حسب النوع */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            ملخص حسب النوع
          </CardTitle>
          <CardDescription>إحصائيات المخالفات حسب النوع</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>نوع المخالفة</TableHead>
                <TableHead className="text-center">العدد</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.values(violationsByType) as Array<{ count: number; type: string }>).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.type}</TableCell>
                  <TableCell className="text-center">{item.count}</TableCell>
                </TableRow>
              ))}
              {Object.keys(violationsByType).length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ملخص لكل مركبة */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            ملخص لكل مركبة
          </CardTitle>
          <CardDescription>عدد المخالفات لكل مركبة</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>رقم اللوحة</TableHead>
                <TableHead className="text-center">عدد المخالفات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Object.values(violationsByVehicle) as Array<{ count: number; plate: string }>).map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.plate}</TableCell>
                  <TableCell className="text-center">{item.count}</TableCell>
                </TableRow>
              ))}
              {Object.keys(violationsByVehicle).length === 0 && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* كشف تفصيلي */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            كشف تفصيلي
          </CardTitle>
          <CardDescription>قائمة المخالفات التفصيلية</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم اللوحة</TableHead>
                  <TableHead>نوع المخالفة</TableHead>
                  <TableHead>تاريخ المخالفة</TableHead>
                  <TableHead>الموقع</TableHead>
                  <TableHead>اسم المسؤول</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations?.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.plateNumber}</TableCell>
                    <TableCell>{v.violationType}</TableCell>
                    <TableCell>{new Date(v.violationDate).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{v.location}</TableCell>
                    <TableCell>{v.officerName}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        v.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                        v.status === 'paid' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {v.status === 'open' ? 'مفتوحة' : v.status === 'paid' ? 'مدفوعة' : 'مغلقة'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!violations || violations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      لا توجد مخالفات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* كشف السيارات */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            كشف السيارات
          </CardTitle>
          <CardDescription>معلومات المركبات المسجلة</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم اللوحة</TableHead>
                  <TableHead>نوع المركبة</TableHead>
                  <TableHead>اللون</TableHead>
                  <TableHead className="text-center">عدد الاكتشافات</TableHead>
                  <TableHead>أول ظهور</TableHead>
                  <TableHead>آخر ظهور</TableHead>
                  <TableHead>الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles?.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">{v.plateNumber}</TableCell>
                    <TableCell>{v.vehicleType}</TableCell>
                    <TableCell>{v.color}</TableCell>
                    <TableCell className="text-center">{v.detectionCount || 0}</TableCell>
                    <TableCell>{v.firstSeen ? new Date(v.firstSeen).toLocaleDateString('ar-SA') : '-'}</TableCell>
                    <TableCell>{v.lastSeen ? new Date(v.lastSeen).toLocaleDateString('ar-SA') : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        v.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {v.status === 'active' ? 'نشط' : 'غير نشط'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {!vehicles || vehicles.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      لا توجد مركبات
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
