import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  FileEdit, 
  Trash2, 
  Eye,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock Data
const vehicles = [
  { id: "VEH-001", plate: "أ ب ج 1234", owner: "محمد أحمد", type: "student", model: "Toyota Camry 2023", status: "active" },
  { id: "VEH-002", plate: "س ص ع 5678", owner: "د. خالد العمري", type: "faculty", model: "Lexus ES 2024", status: "active" },
  { id: "VEH-003", plate: "د ذ ر 9012", owner: "سارة العتيبي", type: "staff", model: "Hyundai Sonata 2022", status: "expired" },
  { id: "VEH-004", plate: "ك ل م 3456", owner: "شركة النقل", type: "visitor", model: "Ford Transit", status: "suspended" },
  { id: "VEH-005", plate: "هـ و ي 7890", owner: "عبدالله السبيعي", type: "student", model: "Mazda 6 2023", status: "active" },
];

export default function VehiclesDatabase() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">قاعدة بيانات المركبات</h1>
          <p className="text-muted-foreground mt-1">إدارة وتتبع جميع المركبات المسجلة في النظام</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير CSV
          </Button>
          <Button>
            <Plus className="h-4 w-4 ml-2" />
            إضافة مركبة
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="بحث برقم اللوحة، اسم المالك..." 
                className="pr-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">رقم اللوحة</TableHead>
                  <TableHead className="text-right">المالك</TableHead>
                  <TableHead className="text-right">نوع المالك</TableHead>
                  <TableHead className="text-right">الموديل</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium font-mono">{vehicle.plate}</TableCell>
                    <TableCell>{vehicle.owner}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        vehicle.type === 'student' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        vehicle.type === 'faculty' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                        vehicle.type === 'staff' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }>
                        {vehicle.type === 'student' ? 'طالب' :
                         vehicle.type === 'faculty' ? 'عضو هيئة تدريس' :
                         vehicle.type === 'staff' ? 'موظف' : 'زائر'}
                      </Badge>
                    </TableCell>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>
                      <Badge className={
                        vehicle.status === 'active' ? 'bg-emerald-500 hover:bg-emerald-600' :
                        vehicle.status === 'expired' ? 'bg-amber-500 hover:bg-amber-600' :
                        'bg-destructive hover:bg-destructive'
                      }>
                        {vehicle.status === 'active' ? 'نشط' :
                         vehicle.status === 'expired' ? 'منتهي' : 'معلق'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 ml-2" />
                            عرض التفاصيل
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FileEdit className="h-4 w-4 ml-2" />
                            تعديل البيانات
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 ml-2" />
                            حذف المركبة
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
