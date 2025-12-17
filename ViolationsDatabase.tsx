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
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Download,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const violations = [
  { id: "VIO-001", plate: "أ ب ج 1234", type: "وقوف خاطئ", amount: 150, date: "2025-11-20", status: "pending" },
  { id: "VIO-002", plate: "س ص ع 5678", type: "تجاوز سرعة", amount: 500, date: "2025-11-19", status: "paid" },
  { id: "VIO-003", plate: "د ذ ر 9012", type: "دخول ممنوع", amount: 400, date: "2025-11-18", status: "appealed" },
  { id: "VIO-004", plate: "ك ل م 3456", type: "عدم وجود ملصق", amount: 300, date: "2025-11-17", status: "pending" },
  { id: "VIO-005", plate: "هـ و ي 7890", type: "قيادة متهورة", amount: 1000, date: "2025-11-16", status: "cancelled" },
];

export default function ViolationsDatabase() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">المخالفات المرورية</h1>
          <p className="text-muted-foreground mt-1">سجل المخالفات والغرامات والاعتراضات</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 ml-2" />
            تصدير التقرير
          </Button>
          <Button variant="destructive">
            <AlertCircle className="h-4 w-4 ml-2" />
            تسجيل مخالفة
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="بحث برقم المخالفة أو اللوحة..." 
                className="pr-9"
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
                  <TableHead className="text-right">رقم المخالفة</TableHead>
                  <TableHead className="text-right">رقم اللوحة</TableHead>
                  <TableHead className="text-right">نوع المخالفة</TableHead>
                  <TableHead className="text-right">الغرامة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation.id}>
                    <TableCell className="font-mono">{violation.id}</TableCell>
                    <TableCell className="font-mono">{violation.plate}</TableCell>
                    <TableCell>{violation.type}</TableCell>
                    <TableCell className="font-bold">{violation.amount} ر.س</TableCell>
                    <TableCell>{violation.date}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={
                        violation.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        violation.status === 'pending' ? 'bg-red-50 text-red-700 border-red-200' :
                        violation.status === 'appealed' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }>
                        {violation.status === 'paid' ? 'مدفوعة' :
                         violation.status === 'pending' ? 'غير مدفوعة' :
                         violation.status === 'appealed' ? 'تحت الاعتراض' : 'ملغاة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
