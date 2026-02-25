import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandedLoader } from "@/components/ui/branded-loader";

interface AnalyticsTabProps {
  stats: {
    pendingShows: number;
    approvedShows: number;
    rejectedShows: number;
    deletedShows: number;
    totalUsers: number;
    activeProducers: number;
  };
}

const COLORS = ['#eab308', '#22c55e', '#ef4444', '#f97316']; // Pending, Approved, Rejected, Deleted

export const AnalyticsTab = ({ stats }: AnalyticsTabProps) => {
  const [nicheData, setNicheData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNicheData = async () => {
      // Fetch all shows (ignoring deleted for category analysis to show current landscape, or include them?)
      // Let's include everything except deleted to see what's actually been submitted and kept.
      const { data, error } = await supabase
        .from('shows')
        .select('niche')
        .is('deleted_at', null);

      if (data) {
        const counts = data.reduce((acc: any, show: any) => {
          const niche = show.niche || 'Unspecified';
          acc[niche] = (acc[niche] || 0) + 1;
          return acc;
        }, {});

        setNicheData(Object.entries(counts).map(([name, value]) => ({
          name: name === 'local' ? 'Local/Community' : name === 'university' ? 'University' : name,
          value: value as number
        })));
      }
      setLoading(false);
    };

    fetchNicheData();
  }, []);

  const statusData = [
    { name: 'Pending', value: stats.pendingShows },
    { name: 'Approved', value: stats.approvedShows },
    { name: 'Rejected', value: stats.rejectedShows },
    { name: 'Deleted', value: stats.deletedShows },
  ].filter(d => d.value > 0);

  const roleData = [
    { name: 'Audience', value: stats.totalUsers - stats.activeProducers },
    { name: 'Producers', value: stats.activeProducers },
  ];

  return (
     <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Shows Status Pie Chart */}
           <Card className="bg-card/50 backdrop-blur-sm border-secondary/20">
              <CardHeader><CardTitle>Production Status Distribution</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                       >
                          {statusData.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                       </Pie>
                       <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                       <Legend />
                    </PieChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>

           {/* User Roles Pie Chart */}
           <Card className="bg-card/50 backdrop-blur-sm border-secondary/20">
              <CardHeader><CardTitle>User Demographics</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie
                          data={roleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                       >
                          <Cell fill="#3b82f6" name="Audience" />
                          <Cell fill="#a855f7" name="Producers" />
                       </Pie>
                       <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                       <Legend />
                       <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-foreground font-bold text-2xl">
                          {stats.totalUsers}
                       </text>
                       <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground text-sm">
                          Total Users
                       </text>
                    </PieChart>
                 </ResponsiveContainer>
              </CardContent>
           </Card>

           {/* Niche Bar Chart */}
           <Card className="bg-card/50 backdrop-blur-sm border-secondary/20 md:col-span-2">
              <CardHeader><CardTitle>Active Productions by Category</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                 {loading ? <BrandedLoader size="sm" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={nicheData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
                          <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={50} />
                       </BarChart>
                    </ResponsiveContainer>
                 )}
              </CardContent>
           </Card>
        </div>
     </div>
  );
};
