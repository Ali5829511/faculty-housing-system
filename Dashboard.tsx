import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Car, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trpc } from "@/lib/trpc";

const data = [
  { name: 'السبت', violations: 40, entries: 240 },
  { name: 'الأحد', violations: 30, entries: 139 },
  { name: 'الاثنين', violations: 20, entries: 980 },
  { name: 'الثلاثاء', violations: 27, entries: 390 },
  { name: 'الأربعاء', violations: 18, entries: 480 },
  { name: 'الخميس', violations: 23, entries: 380 },
  { name: 'الجمعة', violations: 34, entries: 430 },
];

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.dashboard.stats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">جاري تحميل لوحة التحكم...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">نظرة عامة على حركة المرور والمخالفات في الحرم الجامعي</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">تصدير التقرير</Button>
          <Button>إضافة مخالفة جديدة</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المركبات</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.vehicles?.total?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-emerald-500 flex items-center ml-1">
                <ArrowUpRight className="h-3 w-3 ml-0.5" />
                +2.5%
              </span>
              من الشهر الماضي
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">المخالفات النشطة</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.violations?.pending?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-destructive flex items-center ml-1">
                <ArrowUpRight className="h-3 w-3 ml-0.5" />
                +12%
              </span>
              من الأسبوع الماضي
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">نسبة التحصيل</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.violations?.total ? 
                ((stats.violations.paid / stats.violations.total) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-emerald-500 flex items-center ml-1">
                <ArrowUpRight className="h-3 w-3 ml-0.5" />
                +4.1%
              </span>
              مقارنة بالربع السابق
            </p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حركة الدخول اليوم</CardTitle>
            <Clock className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recentEntries?.length?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className="text-muted-foreground flex items-center ml-1">
                <ArrowDownRight className="h-3 w-3 ml-0.5" />
                -1.2%
              </span>
              عن يوم أمس
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader>
            <CardTitle>إحصائيات الحركة والمخالفات</CardTitle>
            <CardDescription>مقارنة بين عدد المركبات الداخلة والمخالفات المسجلة خلال الأسبوع</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#045D84" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#045D84" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#B7A362" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#B7A362" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <Area type="monotone" dataKey="entries" stroke="#045D84" fillOpacity={1} fill="url(#colorEntries)" name="الدخول" />
                  <Area type="monotone" dataKey="violations" stroke="#B7A362" fillOpacity={1} fill="url(#colorViolations)" name="المخالفات" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Violations */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>أحدث المخالفات</CardTitle>
            <CardDescription>آخر المخالفات المسجلة في النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { plate: "أ ب ج 1234", type: "وقوف خاطئ", time: "منذ 15 دقيقة", status: "pending" },
                { plate: "س ص ع 5678", type: "تجاوز سرعة", time: "منذ 32 دقيقة", status: "paid" },
                { plate: "د ذ ر 9012", type: "دخول ممنوع", time: "منذ ساعة", status: "pending" },
                { plate: "ك ل م 3456", type: "عدم وجود ملصق", time: "منذ ساعتين", status: "appealed" },
                { plate: "هـ و ي 7890", type: "وقوف خاطئ", time: "منذ 3 ساعات", status: "paid" },
              ].map((violation, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      violation.status === 'pending' ? 'bg-destructive' : 
                      violation.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{violation.plate}</p>
                      <p className="text-xs text-muted-foreground">{violation.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{violation.time}</p>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full mt-4 text-primary text-sm">عرض الكل</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
