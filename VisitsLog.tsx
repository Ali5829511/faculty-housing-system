import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  History, 
  Search,
  Camera,
  Car,
  Clock,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  Download,
  Printer,
  FileSpreadsheet,
  FileText
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function VisitsLog() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedVisits, setSelectedVisits] = useState<Set<number>>(new Set());
  const [exportFormat, setExportFormat] = useState<'excel' | 'html'>('excel');

  // Fetch all visits
  const { data: visits, isLoading } = trpc.visits.list.useQuery({ searchTerm });

  // Parse notes JSON
  const parseNotes = (notes: string | null) => {
    if (!notes) return null;
    try {
      return JSON.parse(notes);
    } catch {
      return null;
    }
  };

  // Format date
  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleString("ar-SA", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get visit type badge
  const getVisitTypeBadge = (type: string) => {
    switch (type) {
      case "entry":
        return <Badge className="bg-green-500"><ArrowRight className="w-3 h-3 ml-1" />دخول</Badge>;
      case "exit":
        return <Badge className="bg-red-500"><ArrowLeft className="w-3 h-3 ml-1" />خروج</Badge>;
      default:
        return <Badge variant="secondary">عبور</Badge>;
    }
  };

  // Open visit details dialog
  const openVisitDetails = (visit: any) => {
    setSelectedVisit(visit);
    setDialogOpen(true);
  };

  // Export mutations
  const exportExcelMutation = trpc.visitsExport.exportExcel.useMutation();
  const exportHTMLMutation = trpc.visitsExport.exportHTML.useMutation();

  // Toggle visit selection
  const toggleVisitSelection = (visitId: number) => {
    const newSelected = new Set(selectedVisits);
    if (newSelected.has(visitId)) {
      newSelected.delete(visitId);
    } else {
      newSelected.add(visitId);
    }
    setSelectedVisits(newSelected);
  };

  // Select all visits
  const selectAllVisits = () => {
    if (visits) {
      setSelectedVisits(new Set(visits.map((v: any) => v.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedVisits(new Set());
  };

  // Export selected visits
  const handleExport = async () => {
    const visitIds = selectedVisits.size > 0 ? Array.from(selectedVisits) : undefined;

    try {
      if (exportFormat === 'excel') {
        const result = await exportExcelMutation.mutateAsync({ visitIds });
        const blob = new Blob([Uint8Array.from(atob(result.data), c => c.charCodeAt(0))], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
      } else if (exportFormat === 'html') {
        const result = await exportHTMLMutation.mutateAsync({ visitIds });
        const blob = new Blob([result.data], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Print selected visits
  const handlePrint = async () => {
    const visitIds = selectedVisits.size > 0 ? Array.from(selectedVisits) : undefined;

    try {
      const result = await exportHTMLMutation.mutateAsync({ visitIds });
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(result.data);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      }
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <History className="w-8 h-8 text-primary" />
          سجل الزيارات الحية
        </h1>
        <p className="text-muted-foreground mt-2">
          عرض جميع الزيارات المسجلة من Plate Recognizer مع الصور والتفاصيل الكاملة
        </p>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">البحث والفلترة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">البحث برقم اللوحة</Label>
              <div className="relative mt-2">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="search"
                  placeholder="ابحث برقم اللوحة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                سجل الزيارات
              </CardTitle>
              <CardDescription>
                {visits?.length || 0} زيارة مسجلة | {selectedVisits.size} محدد
              </CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excel">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4" />
                      Excel
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      HTML
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={selectedVisits.size > 0 ? clearSelection : selectAllVisits}
              >
                {selectedVisits.size > 0 ? 'إلغاء التحديد' : 'تحديد الكل'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exportExcelMutation.isPending || exportHTMLMutation.isPending}
              >
                <Download className="w-4 h-4 ml-2" />
                {selectedVisits.size > 0 ? 'تصدير المحدد' : 'تصدير الكل'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                disabled={exportHTMLMutation.isPending}
              >
                <Printer className="w-4 h-4 ml-2" />
                طباعة
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : visits && visits.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-12">
                      <input
                        type="checkbox"
                        checked={selectedVisits.size === visits.length}
                        onChange={(e) => e.target.checked ? selectAllVisits() : clearSelection()}
                        className="cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="text-right">الصورة</TableHead>
                    <TableHead className="text-right">الوقت</TableHead>
                    <TableHead className="text-right">رقم اللوحة</TableHead>
                    <TableHead className="text-right">نوع الزيارة</TableHead>
                    <TableHead className="text-right">الكاميرا</TableHead>
                    <TableHead className="text-right">نسبة الثقة</TableHead>
                    <TableHead className="text-right">المنطقة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit: any) => {
                    const notes = parseNotes(visit.notes);
                    return (
                      <TableRow key={visit.id} className="hover:bg-muted/50">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedVisits.has(visit.id)}
                            onChange={() => toggleVisitSelection(visit.id)}
                            className="cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            {visit.imageUrl || visit.plateImageUrl ? (
                              <img 
                                src={visit.plateImageUrl || visit.imageUrl} 
                                alt="صورة المركبة" 
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => openVisitDetails(visit)}
                              />
                            ) : (
                              <Car className="w-8 h-8 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{formatDate(visit.timestamp)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono font-bold text-lg">{visit.plateNumber}</div>
                        </TableCell>
                        <TableCell>{getVisitTypeBadge(visit.visitType)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-muted-foreground" />
                            <span>{visit.cameraCode || "غير محدد"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {visit.confidence >= 80 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <XCircle className="w-4 h-4 text-yellow-500" />
                            )}
                            <span className="font-bold">{visit.confidence}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{visit.region || "غير محدد"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openVisitDetails(visit)}
                          >
                            التفاصيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد زيارات مسجلة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visit Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-5 h-5" />
              تفاصيل الزيارة
            </DialogTitle>
            <DialogDescription>
              معلومات كاملة عن الزيارة من Plate Recognizer
            </DialogDescription>
          </DialogHeader>

          {selectedVisit && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">رقم اللوحة</Label>
                  <div className="font-mono font-bold text-2xl mt-1">{selectedVisit.plateNumber}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">نوع الزيارة</Label>
                  <div className="mt-1">{getVisitTypeBadge(selectedVisit.visitType)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">الوقت</Label>
                  <div className="mt-1">{formatDate(selectedVisit.timestamp)}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">نسبة الثقة</Label>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedVisit.confidence >= 80 ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-500" />
                    )}
                    <span className="font-bold text-lg">{selectedVisit.confidence}%</span>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">الكاميرا</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Camera className="w-4 h-4" />
                    {selectedVisit.cameraCode || "غير محدد"}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">المنطقة</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <MapPin className="w-4 h-4" />
                    {selectedVisit.region || "غير محدد"}
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <Label className="text-lg font-semibold">الصور</Label>
                <div className="grid grid-cols-2 gap-4">
                  {selectedVisit.imageUrl && (
                    <div>
                      <Label className="text-sm text-muted-foreground">صورة المركبة</Label>
                      <img
                        src={selectedVisit.imageUrl}
                        alt="Vehicle"
                        className="w-full h-auto rounded-lg border mt-2"
                      />
                    </div>
                  )}
                  {selectedVisit.plateImageUrl && (
                    <div>
                      <Label className="text-sm text-muted-foreground">صورة اللوحة</Label>
                      <img
                        src={selectedVisit.plateImageUrl}
                        alt="Plate"
                        className="w-full h-auto rounded-lg border mt-2"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Additional Details from Notes */}
              {(() => {
                const notes = parseNotes(selectedVisit.notes);
                if (!notes) return null;

                return (
                  <div className="space-y-4">
                    <Label className="text-lg font-semibold">معلومات إضافية</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {notes.vehicleType && (
                        <div>
                          <Label className="text-muted-foreground">نوع المركبة</Label>
                          <div className="mt-1">{notes.vehicleType}</div>
                        </div>
                      )}
                      {notes.vehicleMake && (
                        <div>
                          <Label className="text-muted-foreground">الصانع</Label>
                          <div className="mt-1">{notes.vehicleMake}</div>
                        </div>
                      )}
                      {notes.vehicleModel && (
                        <div>
                          <Label className="text-muted-foreground">الموديل</Label>
                          <div className="mt-1">{notes.vehicleModel}</div>
                        </div>
                      )}
                      {notes.vehicleColor && (
                        <div>
                          <Label className="text-muted-foreground">اللون</Label>
                          <div className="mt-1">{notes.vehicleColor}</div>
                        </div>
                      )}
                      {notes.orientation && (
                        <div>
                          <Label className="text-muted-foreground">الاتجاه</Label>
                          <div className="mt-1">{notes.orientation}</div>
                        </div>
                      )}
                      {notes.direction && (
                        <div>
                          <Label className="text-muted-foreground">الوجهة</Label>
                          <div className="mt-1">{notes.direction}</div>
                        </div>
                      )}
                      {notes.processingTime && (
                        <div>
                          <Label className="text-muted-foreground">وقت المعالجة</Label>
                          <div className="mt-1">{notes.processingTime}ms</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
