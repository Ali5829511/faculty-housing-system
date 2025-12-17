import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Camera, Loader2, CheckCircle2, AlertCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface RecognizedPlate {
  plateNumber: string;
  plateImage: string;
  confidence: number;
  vehicleInfo: {
    plateNumber: string;
    plateScore: number;
    region: string;
    vehicleType: string;
    vehicleColor: string | null;
    vehicleMake: string | null;
    vehicleModel: string | null;
    confidence: number;
  } | null;
}

export default function PlateRecognition() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recognizedPlates, setRecognizedPlates] = useState<RecognizedPlate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImageMutation = trpc.parkpow.processAndExtract.useMutation({
    onSuccess: (data) => {
      setRecognizedPlates(data.plates);
      toast.success(`تم التعرف على ${data.count} لوحة بنجاح`);
      setIsProcessing(false);
    },
    onError: (error) => {
      toast.error(`فشل التعرف على اللوحة: ${error.message}`);
      setIsProcessing(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('يرجى اختيار ملف صورة');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      setRecognizedPlates([]);
    };
    reader.readAsDataURL(file);
  };

  const handleProcessImage = async (saveToDatabase: boolean = false) => {
    if (!selectedImage) {
      toast.error('يرجى اختيار صورة أولاً');
      return;
    }

    setIsProcessing(true);
    
    // Remove data:image/...;base64, prefix
    const base64Data = selectedImage.split(',')[1];
    
    processImageMutation.mutate({
      imageData: base64Data,
      saveToDatabase,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <Camera className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">التعرف على لوحات المركبات</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            استخدم تقنية الذكاء الاصطناعي للتعرف التلقائي على لوحات المركبات واستخراج معلوماتها
          </p>
        </div>

        {/* Upload Section */}
        <Card className="border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              تحميل الصورة
            </CardTitle>
            <CardDescription>
              اختر صورة تحتوي على لوحة مركبة للتعرف عليها
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!selectedImage ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              >
                <ImageIcon className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">انقر لاختيار صورة</p>
                <p className="text-sm text-muted-foreground mt-2">أو اسحب الصورة وأفلتها هنا</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border-2 border-border">
                  <img
                    src={selectedImage}
                    alt="Selected"
                    className="w-full h-auto max-h-96 object-contain bg-black/5"
                  />
                </div>
                
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleProcessImage(false)}
                    disabled={isProcessing}
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <Camera className="w-5 h-5 ml-2" />
                        التعرف على اللوحة
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => handleProcessImage(true)}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 ml-2" />
                        التعرف والحفظ
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setSelectedImage(null);
                      setRecognizedPlates([]);
                    }}
                    variant="ghost"
                    size="lg"
                  >
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results Section */}
        {recognizedPlates.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">النتائج ({recognizedPlates.length})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recognizedPlates.map((plate, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-center text-2xl font-bold text-primary">
                      {plate.plateNumber}
                    </CardTitle>
                    <CardDescription className="text-center">
                      دقة التعرف: {(plate.confidence * 100).toFixed(1)}%
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="pt-6 space-y-4">
                    {plate.vehicleInfo && (
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-accent/50 rounded">
                          <span className="text-muted-foreground">المنطقة:</span>
                          <span className="font-medium">{plate.vehicleInfo.region}</span>
                        </div>
                        
                        <div className="flex justify-between items-center p-2 bg-accent/50 rounded">
                          <span className="text-muted-foreground">نوع المركبة:</span>
                          <span className="font-medium">{plate.vehicleInfo.vehicleType}</span>
                        </div>
                        
                        {plate.vehicleInfo.vehicleColor && (
                          <div className="flex justify-between items-center p-2 bg-accent/50 rounded">
                            <span className="text-muted-foreground">اللون:</span>
                            <span className="font-medium">{plate.vehicleInfo.vehicleColor}</span>
                          </div>
                        )}
                        
                        {plate.vehicleInfo.vehicleMake && (
                          <div className="flex justify-between items-center p-2 bg-accent/50 rounded">
                            <span className="text-muted-foreground">الصانع:</span>
                            <span className="font-medium">{plate.vehicleInfo.vehicleMake}</span>
                          </div>
                        )}
                        
                        {plate.vehicleInfo.vehicleModel && (
                          <div className="flex justify-between items-center p-2 bg-accent/50 rounded">
                            <span className="text-muted-foreground">الموديل:</span>
                            <span className="font-medium">{plate.vehicleInfo.vehicleModel}</span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {!plate.vehicleInfo && (
                      <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">لم يتم العثور على معلومات إضافية</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
