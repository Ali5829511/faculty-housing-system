import { useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Upload, 
  FileImage, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Download,
  Eye
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProcessedImage {
  fileName: string;
  plateNumber: string;
  confidence: number;
  imageUrl: string;
  status: 'success' | 'error';
  error?: string;
}

export default function BulkImport() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);

  const recognizePlateMutation = trpc.parkpow.recognizePlate.useMutation();
  const saveVehicleMutation = trpc.vehicles.create.useMutation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const imageFiles = Array.from(files).filter(file => 
        file.type.startsWith('image/')
      );
      setSelectedFiles(imageFiles);
      toast.success(`تم اختيار ${imageFiles.length} صورة`);
    }
  };

  const processImages = async () => {
    if (selectedFiles.length === 0) {
      toast.error("الرجاء اختيار الصور أولاً");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setResults([]);

    const processedResults: ProcessedImage[] = [];

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      try {
        // تحويل الملف إلى base64
        const base64 = await fileToBase64(file);
        
        // التعرف على اللوحة
        const result = await recognizePlateMutation.mutateAsync({
          imageData: base64
        });

        if (result.success && result.vehicleInfo) {
          processedResults.push({
            fileName: file.name,
            plateNumber: result.vehicleInfo.plateNumber,
            confidence: result.vehicleInfo.confidence || 0,
            imageUrl: URL.createObjectURL(file),
            status: 'success'
          });
        } else {
          processedResults.push({
            fileName: file.name,
            plateNumber: '',
            confidence: 0,
            imageUrl: '',
            status: 'error',
            error: 'لم يتم العثور على لوحة'
          });
        }
      } catch (error) {
        processedResults.push({
          fileName: file.name,
          plateNumber: '',
          confidence: 0,
          imageUrl: '',
          status: 'error',
          error: error instanceof Error ? error.message : 'خطأ غير معروف'
        });
      }

      setProgress(((i + 1) / selectedFiles.length) * 100);
      setResults([...processedResults]);
    }

    setProcessing(false);
    
    const successCount = processedResults.filter(r => r.status === 'success').length;
    toast.success(`تمت معالجة ${successCount} من ${selectedFiles.length} صورة بنجاح`);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // إزالة البادئة data:image/...;base64,
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const exportResults = () => {
    const csv = [
      ['اسم الملف', 'رقم اللوحة', 'نسبة الثقة', 'الحالة', 'الخطأ'],
      ...results.map(r => [
        r.fileName,
        r.plateNumber,
        r.confidence.toFixed(2),
        r.status === 'success' ? 'نجح' : 'فشل',
        r.error || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `import-results-${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Upload className="w-8 h-8 text-primary" />
            الاستيراد الجماعي
          </h1>
          <p className="text-muted-foreground mt-2">
            رفع مجلد صور والتعرف التلقائي على اللوحات واستيرادها إلى قاعدة البيانات
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>رفع الصور</CardTitle>
            <CardDescription>
              اختر مجلد يحتوي على صور المركبات للمعالجة الجماعية
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              <FileImage className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
                disabled={processing}
              />
              <label htmlFor="file-upload">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  disabled={processing}
                  asChild
                >
                  <span>
                    <Upload className="w-4 h-4 mr-2" />
                    اختيار الصور
                  </span>
                </Button>
              </label>
              {selectedFiles.length > 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  تم اختيار {selectedFiles.length} صورة
                </p>
              )}
            </div>

            {selectedFiles.length > 0 && (
              <div className="flex gap-3">
                <Button
                  onClick={processImages}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      جاري المعالجة...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      بدء المعالجة
                    </>
                  )}
                </Button>
                {results.length > 0 && (
                  <Button
                    onClick={exportResults}
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    تصدير النتائج
                  </Button>
                )}
              </div>
            )}

            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>التقدم</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Table */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>نتائج المعالجة</CardTitle>
              <CardDescription>
                {results.filter(r => r.status === 'success').length} نجح من {results.length} صورة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الصورة</TableHead>
                      <TableHead>اسم الملف</TableHead>
                      <TableHead>رقم اللوحة</TableHead>
                      <TableHead>نسبة الثقة</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {result.imageUrl && (
                            <img
                              src={result.imageUrl}
                              alt={result.fileName}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {result.fileName}
                        </TableCell>
                        <TableCell>
                          {result.plateNumber || '-'}
                        </TableCell>
                        <TableCell>
                          {result.status === 'success' && (
                            <span className="text-sm">
                              {(result.confidence * 100).toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.status === 'success' ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              نجح
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <XCircle className="w-3 h-3 mr-1" />
                              فشل
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {result.imageUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedImage(result)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Image Preview Dialog */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedImage?.fileName}</DialogTitle>
              <DialogDescription>
                رقم اللوحة: {selectedImage?.plateNumber} | نسبة الثقة: {selectedImage?.confidence ? (selectedImage.confidence * 100).toFixed(1) : 0}%
              </DialogDescription>
            </DialogHeader>
            {selectedImage?.imageUrl && (
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.fileName}
                className="w-full h-auto rounded-lg"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
