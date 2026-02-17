import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { motion } from "framer-motion";
import { HelpCircle, Lock, BarChart3 } from "lucide-react";
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface AnalyticsDashboardProps {
  profileId: string;
  isPro?: boolean;
  onUpsell?: () => void;
}

interface ChartDataPoint {
  date: string;
  clicks: number;
}

interface AnalyticsSummary {
  views: number;
  clicks: number;
  ctr: number;
  chartData: { date: string; clicks: number }[];
}

export const AnalyticsDashboard = ({ profileId, isPro = false, onUpsell }: AnalyticsDashboardProps) => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ views: 0, clicks: 0, ctr: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!isPro) {
      setLoading(false);
      return;
    }

    try {
      // Use RPC function for server-side aggregation
      // This is much faster than fetching thousands of rows to the client
      const { data, error } = await supabase.rpc('get_analytics_summary', { target_group_id: profileId });

      if (error) throw error;

      if (data) {
        const result = data as unknown as AnalyticsSummary;

        setStats({
          views: result.views,
          clicks: result.clicks,
          ctr: result.ctr
        });

        const formattedChartData = (result.chartData || []).map((item) => ({
          // Format date from YYYY-MM-DD to "Mon DD"
          date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          clicks: item.clicks
        }));

        setChartData(formattedChartData);
      }
    } catch (error) {
      // Safe Mode: Default to 0 on error (including 404/No Data) and suppress console error
      setStats({ views: 0, clicks: 0, ctr: 0 });
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, isPro]);

  useEffect(() => {
    fetchData();

    if (!isPro) return;

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
  }, [profileId, fetchData, isPro]);

  if (!isPro) {
    return (
      <Card className="bg-card border-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-secondary/10 p-4 rounded-full mb-4">
            <Lock className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="font-serif text-2xl font-bold mb-2">Detailed Analytics Locked</h3>
          <p className="text-muted-foreground max-w-md mb-6">
            Upgrade to Pro to see detailed profile views, ticket clicks, and click-through rates. Track your production's performance in real-time.
          </p>
          <Button onClick={() => onUpsell ? onUpsell() : navigate("/settings")} variant="default" size="lg">
            Upgrade to Pro
          </Button>
        </div>

        {/* Placeholder Content behind blur */}
        <div className="p-6 opacity-20 filter blur-sm select-none pointer-events-none">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
             <div className="h-24 bg-secondary/20 rounded-xl"></div>
             <div className="h-24 bg-secondary/20 rounded-xl"></div>
             <div className="h-24 bg-secondary/20 rounded-xl"></div>
          </div>
          <div className="h-64 bg-secondary/20 rounded-xl"></div>
        </div>
      </Card>
    );
  }

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><BrandedLoader /></div>;
  }

  const hasData = stats.views > 0 || stats.clicks > 0 || stats.ctr > 0;

  if (!hasData) {
    return (
      <Card className="bg-card border-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-secondary/10 p-4 rounded-full mb-4">
            <BarChart3 className="w-8 h-8 text-secondary opacity-50" />
          </div>
          <p className="text-muted-foreground max-w-sm">
            Your stats will appear once your first show goes live.
          </p>
        </div>

        {/* Ghost Content */}
        <div className="p-6 opacity-10 filter blur-sm select-none pointer-events-none grayscale">
          <div className="grid md:grid-cols-3 gap-6 mb-6">
             <div className="h-24 bg-secondary/20 rounded-xl border border-secondary/30 flex flex-col justify-between p-4">
                <div className="h-4 w-1/2 bg-secondary/40 rounded"></div>
                <div className="h-8 w-1/3 bg-secondary/40 rounded"></div>
             </div>
             <div className="h-24 bg-secondary/20 rounded-xl border border-secondary/30 flex flex-col justify-between p-4">
                <div className="h-4 w-1/2 bg-secondary/40 rounded"></div>
                <div className="h-8 w-1/3 bg-secondary/40 rounded"></div>
             </div>
             <div className="h-24 bg-secondary/20 rounded-xl border border-secondary/30 flex flex-col justify-between p-4">
                <div className="h-4 w-1/2 bg-secondary/40 rounded"></div>
                <div className="h-8 w-1/3 bg-secondary/40 rounded"></div>
             </div>
          </div>
          <div className="h-64 bg-secondary/20 rounded-xl border border-secondary/30 flex items-end justify-between p-8 gap-4">
             {[40, 60, 30, 80, 50, 70, 45].map((h, i) => (
               <div key={i} className="w-full bg-secondary/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
             ))}
          </div>
        </div>
      </Card>
    );
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
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              Click-Through Rate
              <UiTooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="w-4 h-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">This shows the percentage of visitors who clicked your ticket link. Higher CTR means your show description is working!</p>
                </TooltipContent>
              </UiTooltip>
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
