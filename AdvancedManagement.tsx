import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  Tag, 
  Activity,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Clock
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdvancedManagement() {
  const [activeTab, setActiveTab] = useState("cameras");
  const [cameraDialogOpen, setCameraDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);

  // Fetch data
  const { data: cameras, isLoading: camerasLoading, refetch: refetchCameras } = trpc.cameras.list.useQuery();
  const { data: visits, isLoading: visitsLoading } = trpc.visits.list.useQuery();
  const { data: tags, isLoading: tagsLoading, refetch: refetchTags } = trpc.tags.list.useQuery();

  // Camera form state
  const [cameraForm, setCameraForm] = useState({
    code: "",
    name: "",
    type: "entrance" as "entrance" | "exit" | "both",
    location: "",
    latitude: "",
    longitude: "",
    notes: "",
  });

  // Tag form state
  const [tagForm, setTagForm] = useState({
    name: "",
    nameAr: "",
    color: "#045D84",
    description: "",
    category: "custom" as "authorization" | "status" | "priority" | "custom",
  });

  // Mutations
  const createCameraMutation = trpc.cameras.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الكاميرا بنجاح");
      setCameraDialogOpen(false);
      refetchCameras();
      setCameraForm({
        code: "",
        name: "",
        type: "entrance",
        location: "",
        latitude: "",
        longitude: "",
        notes: "",
      });
    },
    onError: (error) => {
      toast.error(`فشل في إضافة الكاميرا: ${error.message}`);
    },
  });

  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة التاج بنجاح");
      setTagDialogOpen(false);
      refetchTags();
      setTagForm({
        name: "",
        nameAr: "",
        color: "#045D84",
        description: "",
        category: "custom",
      });
    },
    onError: (error) => {
      toast.error(`فشل في إضافة التاج: ${error.message}`);
    },
  });

  const deleteCameraMutation = trpc.cameras.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الكاميرا بنجاح");
      refetchCameras();
    },
    onError: (error) => {
      toast.error(`فشل في حذف الكاميرا: ${error.message}`);
    },
  });

  const deleteTagMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف التاج بنجاح");
      refetchTags();
    },
    onError: (error) => {
      toast.error(`فشل في حذف التاج: ${error.message}`);
    },
  });

  const handleCreateCamera = () => {
    createCameraMutation.mutate(cameraForm);
  };

  const handleCreateTag = () => {
    createTagMutation.mutate(tagForm);
  };

  const handleDeleteCamera = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الكاميرا؟")) {
      deleteCameraMutation.mutate({ id });
    }
  };

  const handleDeleteTag = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا التاج؟")) {
      deleteTagMutation.mutate({ id });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      maintenance: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      entrance: "bg-green-500",
      exit: "bg-red-500",
      both: "bg-blue-500",
    };
    return (
      <Badge className={colors[type] || "bg-gray-500"}>
        {type === "entrance" ? "دخول" : type === "exit" ? "خروج" : "دخول/خروج"}
      </Badge>
    );
  };

  const getVisitTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      entry: "bg-green-500",
      exit: "bg-red-500",
      pass_through: "bg-yellow-500",
    };
    return (
      <Badge className={colors[type] || "bg-gray-500"}>
        {type === "entry" ? "دخول" : type === "exit" ? "خروج" : "مرور"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <Activity className="w-8 h-8 text-primary" />
          الإدارة المتقدمة
        </h1>
        <p className="text-muted-foreground mt-2">
          إدارة الكاميرات، الزيارات، والتاجات في نظام المرور الجامعي
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cameras">
            <Camera className="w-4 h-4 ml-2" />
            الكاميرات
          </TabsTrigger>
          <TabsTrigger value="visits">
            <Clock className="w-4 h-4 ml-2" />
            الزيارات
          </TabsTrigger>
          <TabsTrigger value="tags">
            <Tag className="w-4 h-4 ml-2" />
            التاجات
          </TabsTrigger>
        </TabsList>

        {/* Cameras Tab */}
        <TabsContent value="cameras" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>إدارة الكاميرات</CardTitle>
                <CardDescription>
                  عرض وإدارة الكاميرات المتصلة بنظام ParkPow
                </CardDescription>
              </div>
              <Dialog open={cameraDialogOpen} onOpenChange={setCameraDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة كاميرا
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>إضافة كاميرا جديدة</DialogTitle>
                    <DialogDescription>
                      أدخل معلومات الكاميرا الجديدة
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">رمز الكاميرا *</Label>
                        <Input
                          id="code"
                          value={cameraForm.code}
                          onChange={(e) => setCameraForm({ ...cameraForm, code: e.target.value })}
                          placeholder="CAM001"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="name">اسم الكاميرا *</Label>
                        <Input
                          id="name"
                          value={cameraForm.name}
                          onChange={(e) => setCameraForm({ ...cameraForm, name: e.target.value })}
                          placeholder="البوابة الرئيسية"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">نوع الكاميرا *</Label>
                        <Select
                          value={cameraForm.type}
                          onValueChange={(value: any) => setCameraForm({ ...cameraForm, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="entrance">دخول</SelectItem>
                            <SelectItem value="exit">خروج</SelectItem>
                            <SelectItem value="both">دخول/خروج</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">الموقع</Label>
                        <Input
                          id="location"
                          value={cameraForm.location}
                          onChange={(e) => setCameraForm({ ...cameraForm, location: e.target.value })}
                          placeholder="البوابة الشمالية"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="latitude">خط العرض</Label>
                        <Input
                          id="latitude"
                          value={cameraForm.latitude}
                          onChange={(e) => setCameraForm({ ...cameraForm, latitude: e.target.value })}
                          placeholder="24.7136"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="longitude">خط الطول</Label>
                        <Input
                          id="longitude"
                          value={cameraForm.longitude}
                          onChange={(e) => setCameraForm({ ...cameraForm, longitude: e.target.value })}
                          placeholder="46.6753"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">ملاحظات</Label>
                      <Textarea
                        id="notes"
                        value={cameraForm.notes}
                        onChange={(e) => setCameraForm({ ...cameraForm, notes: e.target.value })}
                        placeholder="ملاحظات إضافية..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCameraDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleCreateCamera} disabled={!cameraForm.code || !cameraForm.name}>
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {camerasLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : cameras && cameras.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الرمز</TableHead>
                      <TableHead>الاسم</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الموقع</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cameras.map((camera: any) => (
                      <TableRow key={camera.id}>
                        <TableCell className="font-mono">{camera.code}</TableCell>
                        <TableCell>{camera.name}</TableCell>
                        <TableCell>{getTypeBadge(camera.type)}</TableCell>
                        <TableCell>
                          {camera.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {camera.location}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(camera.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteCamera(camera.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد كاميرات مسجلة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visits Tab */}
        <TabsContent value="visits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل الزيارات</CardTitle>
              <CardDescription>
                عرض جميع الزيارات المسجلة من نظام ParkPow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {visitsLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : visits && visits.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم اللوحة</TableHead>
                      <TableHead>الكاميرا</TableHead>
                      <TableHead>النوع</TableHead>
                      <TableHead>الثقة</TableHead>
                      <TableHead>الوقت</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visits.slice(0, 50).map((visit: any) => (
                      <TableRow key={visit.id}>
                        <TableCell className="font-mono font-bold">{visit.plateNumber}</TableCell>
                        <TableCell>{visit.cameraCode || "-"}</TableCell>
                        <TableCell>{getVisitTypeBadge(visit.visitType)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{visit.confidence}%</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(visit.timestamp).toLocaleString("ar-SA")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد زيارات مسجلة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>إدارة التاجات</CardTitle>
                <CardDescription>
                  إنشاء وإدارة تاجات تصنيف المركبات
                </CardDescription>
              </div>
              <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة تاج
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>إضافة تاج جديد</DialogTitle>
                    <DialogDescription>
                      أدخل معلومات التاج الجديد
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="tag-name">الاسم بالإنجليزية *</Label>
                      <Input
                        id="tag-name"
                        value={tagForm.name}
                        onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
                        placeholder="Authorized"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tag-nameAr">الاسم بالعربية</Label>
                      <Input
                        id="tag-nameAr"
                        value={tagForm.nameAr}
                        onChange={(e) => setTagForm({ ...tagForm, nameAr: e.target.value })}
                        placeholder="مصرح"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tag-color">اللون</Label>
                        <Input
                          id="tag-color"
                          type="color"
                          value={tagForm.color}
                          onChange={(e) => setTagForm({ ...tagForm, color: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tag-category">الفئة</Label>
                        <Select
                          value={tagForm.category}
                          onValueChange={(value: any) => setTagForm({ ...tagForm, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="authorization">تصريح</SelectItem>
                            <SelectItem value="status">حالة</SelectItem>
                            <SelectItem value="priority">أولوية</SelectItem>
                            <SelectItem value="custom">مخصص</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tag-description">الوصف</Label>
                      <Textarea
                        id="tag-description"
                        value={tagForm.description}
                        onChange={(e) => setTagForm({ ...tagForm, description: e.target.value })}
                        placeholder="وصف التاج..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTagDialogOpen(false)}>
                      إلغاء
                    </Button>
                    <Button onClick={handleCreateTag} disabled={!tagForm.name}>
                      إضافة
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {tagsLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : tags && tags.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tags.map((tag: any) => (
                    <Card key={tag.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge style={{ backgroundColor: tag.color }}>
                            {tag.nameAr || tag.name}
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTag(tag.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {tag.description || "لا يوجد وصف"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          الفئة: {tag.category}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد تاجات مسجلة
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
