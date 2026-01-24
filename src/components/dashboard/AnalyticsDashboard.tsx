import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { motion } from "framer-motion";

interface AnalyticsDashboardProps {
  profileId: string;
}

interface AnalyticsEvent {
  id: string;
  event_type: string;
  group_id: string;
  created_at: string;
}

interface ChartDataPoint {
  date: string;
  clicks: number;
}

export const AnalyticsDashboard = ({ profileId }: AnalyticsDashboardProps) => {
  const [stats, setStats] = useState({ views: 0, clicks: 0, ctr: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all events for this group
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase.from("analytics_events" as any) as any)
        .select("*")
        .eq("group_id", profileId);

      if (error) throw error;

      const events = (data || []) as AnalyticsEvent[];

      const views = events.filter((e) => e.event_type === "profile_view").length;
      const clicks = events.filter((e) => e.event_type === "ticket_click").length;
      const ctr = views > 0 ? (clicks / views) * 100 : 0;

      setStats({ views, clicks, ctr });

      // Process chart data (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const chartDataMap = last7Days.reduce((acc, date) => {
        acc[date] = 0;
        return acc;
      }, {} as Record<string, number>);

      events.forEach((e) => {
        if (e.event_type === "ticket_click") {
          const date = e.created_at.split("T")[0];
          if (chartDataMap[date] !== undefined) {
            chartDataMap[date]++;
          }
        }
      });

      const formattedChartData = last7Days.map(date => ({
        date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        clicks: chartDataMap[date]
      }));

      setChartData(formattedChartData);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    fetchData();

    // Realtime subscription
    const channel = supabase
      .channel('analytics_dashboard')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analytics_events',
          filter: `group_id=eq.${profileId}`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, fetchData]);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><BrandedLoader /></div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-card border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profile Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.views}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Ticket Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.clicks}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-secondary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Click-Through Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.ctr.toFixed(1)}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-secondary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Ticket Clicks (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="clicks"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
