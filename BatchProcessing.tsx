import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessedImage {
  filename: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  data?: {
    plateNumber: string;
    plateNumberArabic: string;
    confidence: number;
    region: string;
    vehicleType: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleYear: number | null;
    imageUrl: string;
    visitCount: number;
  };
  error?: string;
}

export default function BatchProcessing() {
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processImageMutation = trpc.batchProcessing.processImage.useMutation();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Initialize images array
    const newImages: ProcessedImage[] = files.map(file => ({
      filename: file.name,
      status: 'pending',
    }));
    setImages(newImages);
    setIsProcessing(true);
    setProgress(0);

    // Process each image
    let completed = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Update status to processing
      setImages(prev => prev.map((img, idx) => 
        idx === i ? { ...img, status: 'processing' } : img
      ));

      try {
        // Convert file to base64
        const base64 = await fileToBase64(file);
        
        // Call API
        const result = await processImageMutation.mutateAsync({
          imageData: base64,
          filename: file.name,
        });

        if (result.success && result.data) {
          // Update with success data
          setImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, status: 'success', data: result.data } : img
          ));
        } else {
          // Update with error
          setImages(prev => prev.map((img, idx) => 
            idx === i ? { ...img, status: 'error', error: result.error || 'فشلت المعالجة' } : img
          ));
        }
      } catch (error: any) {
        setImages(prev => prev.map((img, idx) => 
          idx === i ? { ...img, status: 'error', error: error.message || 'حدث خطأ' } : img
        ));
      }

      completed++;
      setProgress((completed / files.length) * 100);
    }

    setIsProcessing(false);
    toast.success(`تمت معالجة ${completed} صورة`);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const getStatusIcon = (status: ProcessedImage['status']) => {
    switch (status) {
      case 'pending':
        return <FileImage className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ProcessedImage['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">قيد الانتظار</Badge>;
      case 'processing':
        return <Badge className="bg-blue-500">جاري المعالجة...</Badge>;
      case 'success':
        return <Badge className="bg-green-500">نجح</Badge>;
      case 'error':
        return <Badge variant="destructive">فشل</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">معالجة صور المركبات</h1>
          <p className="text-muted-foreground mt-2">
            قم بتحميل صور المركبات لتحليلها تلقائياً باستخدام Plate Recognizer
          </p>
        </div>
      </div>

      {/* Upload Section */}
      <Card className="p-8">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Upload className="w-10 h-10 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold">تحميل صور المركبات</h3>
            <p className="text-sm text-muted-foreground">
              اختر صورة واحدة أو عدة صور لمعالجتها
            </p>
          </div>
          <label htmlFor="file-upload">
            <Button disabled={isProcessing} asChild>
              <span className="cursor-pointer">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    اختر الصور
                  </>
                )}
              </span>
            </Button>
          </label>
          <input
            id="file-upload"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isProcessing}
          />
        </div>

        {isProcessing && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">التقدم</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}
      </Card>

      {/* Results Table */}
      {images.length > 0 && (
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">النتائج</h2>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الصورة</TableHead>
                    <TableHead className="text-right">رقم اللوحة (إنجليزي)</TableHead>
                    <TableHead className="text-right">رقم اللوحة (عربي)</TableHead>
                    <TableHead className="text-right">الدقة</TableHead>
                    <TableHead className="text-right">نوع المركبة</TableHead>
                    <TableHead className="text-right">الصانع</TableHead>
                    <TableHead className="text-right">الموديل</TableHead>
                    <TableHead className="text-right">اللون</TableHead>
                    <TableHead className="text-right">السنة</TableHead>
                    <TableHead className="text-right">عدد التكرار</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {images.map((image, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(image.status)}
                          {getStatusBadge(image.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {image.data?.imageUrl ? (
                            <img
                              src={image.data.imageUrl}
                              alt={image.filename}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                              <FileImage className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <span className="text-sm">{image.filename}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {image.data ? (
                          <span className="font-mono font-bold text-lg">{image.data.plateNumber}</span>
                        ) : image.status === 'error' ? (
                          <span className="text-red-500 text-sm">{image.error}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {image.data ? (
                          <span className="font-bold text-lg">{image.data.plateNumberArabic}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {image.data ? (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{image.data.confidence}%</span>
                            {image.data.confidence >= 90 ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <span className="text-yellow-500">⚠</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{image.data?.vehicleType || '-'}</TableCell>
                      <TableCell>{image.data?.vehicleMake || '-'}</TableCell>
                      <TableCell>{image.data?.vehicleModel || '-'}</TableCell>
                      <TableCell>{image.data?.vehicleColor || '-'}</TableCell>
                      <TableCell>{image.data?.vehicleYear || '-'}</TableCell>
                      <TableCell>
                        {image.data ? (
                          <Badge variant="outline" className="font-bold">
                            {image.data.visitCount}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </Card>
      )}

      {/* Statistics */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">إجمالي الصور</div>
            <div className="text-2xl font-bold mt-1">{images.length}</div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">نجح</div>
            <div className="text-2xl font-bold mt-1 text-green-500">
              {images.filter(img => img.status === 'success').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">فشل</div>
            <div className="text-2xl font-bold mt-1 text-red-500">
              {images.filter(img => img.status === 'error').length}
            </div>
          </Card>
          <Card className="p-4">
            <div className="text-sm text-muted-foreground">قيد المعالجة</div>
            <div className="text-2xl font-bold mt-1 text-blue-500">
              {images.filter(img => img.status === 'processing' || img.status === 'pending').length}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
