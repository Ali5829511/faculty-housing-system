import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  TrendingUp,
  Calendar,
  Clock,
  Car
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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function FrequencyReport() {
  const [dateRange, setDateRange] = useState<{
    startDate?: string;
    endDate?: string;
  }>({});

  // Fetch top vehicles
  const { data: topVehicles, isLoading: loadingVehicles } = trpc.analytics.topVehicles.useQuery({
    limit: 10,
    ...dateRange,
  });

  // Fetch visits by hour
  const { data: visitsByHour, isLoading: loadingHours } = trpc.analytics.visitsByHour.useQuery(dateRange);

  // Fetch visits by day of week
  const { data: visitsByDayOfWeek, isLoading: loadingDays } = trpc.analytics.visitsByDayOfWeek.useQuery(dateRange);

  // Fetch visits by date
  const { data: visitsByDate, isLoading: loadingDates } = trpc.analytics.visitsByDate.useQuery(dateRange);

  // Transform data for charts
  const hourlyData = visitsByHour?.map((item: any) => ({
    hour: `${item.hour}:00`,
    visits: Number(item.count),
  })) || [];

  const dayOfWeekData = visitsByDayOfWeek?.map((item: any) => {
    const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
    return {
      day: dayNames[item.dayOfWeek - 1] || "غير معروف",
      visits: Number(item.count),
    };
  }) || [];

  const dateData = visitsByDate?.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
    visits: Number(item.count),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          تقرير التكرار والإحصائيات
        </h1>
        <p className="text-muted-foreground mt-2">
          تحليل شامل للمركبات الأكثر زيارة وتوزيع الزيارات حسب الوقت
        </p>
      </div>

      {/* Top Vehicles Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            المركبات الأكثر تكراراً
          </CardTitle>
          <CardDescription>
            أعلى 10 مركبات من حيث عدد الزيارات المسجلة
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingVehicles ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : topVehicles && topVehicles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">الترتيب</TableHead>
                  <TableHead className="text-right">رقم اللوحة</TableHead>
                  <TableHead className="text-right">اسم المالك</TableHead>
                  <TableHead className="text-right">نوع المالك</TableHead>
                  <TableHead className="text-right">نوع المركبة</TableHead>
                  <TableHead className="text-right">عدد الزيارات</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topVehicles.map((vehicle: any, index: number) => (
                  <TableRow key={vehicle.id}>
                    <TableCell className="font-medium">
                      <Badge variant={index === 0 ? "default" : "outline"}>
                        #{index + 1}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono font-bold">{vehicle.plateNumber}</TableCell>
                    <TableCell>{vehicle.ownerName}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {vehicle.ownerType === "student" ? "طالب" :
                         vehicle.ownerType === "faculty" ? "عضو هيئة تدريس" :
                         vehicle.ownerType === "staff" ? "موظف" : "زائر"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {vehicle.vehicleType === "sedan" ? "سيدان" :
                       vehicle.vehicleType === "suv" ? "دفع رباعي" :
                       vehicle.vehicleType === "truck" ? "شاحنة" :
                       vehicle.vehicleType === "van" ? "فان" :
                       vehicle.vehicleType === "motorcycle" ? "دراجة نارية" : "أخرى"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Car className="w-4 h-4 text-muted-foreground" />
                        <span className="font-bold text-lg">{vehicle.visitCount || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={vehicle.status === "active" ? "default" : 
                                vehicle.status === "suspended" ? "destructive" : "secondary"}
                      >
                        {vehicle.status === "active" ? "نشط" :
                         vehicle.status === "suspended" ? "موقوف" : "منتهي"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hourly Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            توزيع الزيارات حسب الساعة
          </CardTitle>
          <CardDescription>
            عدد الزيارات المسجلة لكل ساعة من اليوم
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingHours ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : hourlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                />
                <Legend />
                <Bar dataKey="visits" fill="hsl(var(--primary))" name="عدد الزيارات" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Day of Week Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            توزيع الزيارات حسب أيام الأسبوع
          </CardTitle>
          <CardDescription>
            عدد الزيارات المسجلة لكل يوم من أيام الأسبوع
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDays ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : dayOfWeekData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                />
                <Legend />
                <Bar dataKey="visits" fill="hsl(var(--chart-2))" name="عدد الزيارات" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            اتجاه الزيارات حسب التاريخ (آخر 30 يوم)
          </CardTitle>
          <CardDescription>
            تطور عدد الزيارات المسجلة خلال الأيام الماضية
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDates ? (
            <div className="text-center py-8 text-muted-foreground">جاري التحميل...</div>
          ) : dateData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dateData.reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--background))", 
                    border: "1px solid hsl(var(--border))" 
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="visits" 
                  stroke="hsl(var(--chart-3))" 
                  strokeWidth={2}
                  name="عدد الزيارات" 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              لا توجد بيانات متاحة
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي المركبات المسجلة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {topVehicles?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              في قاعدة البيانات
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              إجمالي الزيارات
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {topVehicles?.reduce((sum: number, v: any) => sum + (v.visitCount || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              زيارة مسجلة
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              متوسط الزيارات لكل مركبة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {topVehicles && topVehicles.length > 0
                ? Math.round(
                    topVehicles.reduce((sum: number, v: any) => sum + (v.visitCount || 0), 0) /
                      topVehicles.length
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              زيارة / مركبة
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
