import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ShowPerformanceProps {
  showId: string;
}

interface AnalyticsData {
  date: string;
  views: number;
  clicks: number;
}

export const ShowPerformance = ({ showId }: ShowPerformanceProps) => {
  const [data, setData] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!showId) return;

      setLoading(true);
      const { data: analytics, error } = await supabase
        .from("show_analytics")
        .select("date, views, clicks")
        .eq("show_id", showId)
        .order("date", { ascending: true })
        .limit(30); // Last 30 days

      if (error) {
        console.error("Error fetching analytics:", error);
      } else if (analytics) {
        // Format date
        const formattedData = analytics.map(item => ({
          ...item,
          date: new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        }));
        setData(formattedData);
      }
      setLoading(false);
    };

    fetchData();
  }, [showId]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="border-secondary/20 bg-card">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Performance Insights</CardTitle>
          <CardDescription>Views vs. Ticket Clicks over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-secondary/30 rounded-lg">
            <p>No data available yet.</p>
            <p className="text-sm">Views and clicks will appear here once your show starts getting traffic.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-secondary/20 bg-card">
      <CardHeader>
        <CardTitle className="font-serif text-xl">Performance Insights</CardTitle>
        <CardDescription>Views vs. Ticket Clicks (Last 30 Days)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  borderColor: 'hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                  borderRadius: '0.5rem'
                }}
                itemStyle={{ color: 'hsl(var(--foreground))' }}
                cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="views" name="Page Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
              <Bar dataKey="clicks" name="Ticket Clicks" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
