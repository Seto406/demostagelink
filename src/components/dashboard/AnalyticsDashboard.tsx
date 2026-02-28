import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BrandedLoader } from "@/components/ui/branded-loader";
import { motion } from "framer-motion";
import { HelpCircle, BarChart3, AlertTriangle } from "lucide-react";
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface AnalyticsDashboardProps {
  profileId: string;
  isPro?: boolean;
  onUpsell?: () => void;
}

interface ChartDataPoint {
  date: string;
  clicks: number;
}

interface ProducerShow {
  id: string;
  title: string;
}

export const AnalyticsDashboard = ({ profileId }: AnalyticsDashboardProps) => {
  const [stats, setStats] = useState({ views: 0, clicks: 0, reservations: 0, ctr: 0 });
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [shows, setShows] = useState<ProducerShow[]>([]);
  const [selectedShowId, setSelectedShowId] = useState<string>("all");
  const [rangeDays, setRangeDays] = useState<7 | 30>(7);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - rangeDays + 1);
      sinceDate.setHours(0, 0, 0, 0);

      const [showsResponse, pendingTicketsResponse, reservationsResponse, eventsResponse] = await Promise.all([
        supabase
          .from("shows")
          .select("id, title")
          .eq("producer_id", profileId)
          .order("created_at", { ascending: false }),
        supabase
          .from("tickets")
          .select("id, shows!inner(producer_id)", { count: "exact", head: true })
          .eq("status", "pending")
          .eq("shows.producer_id", profileId),
        supabase
          .from("tickets")
          .select("id, show_id, created_at, shows!inner(producer_id)")
          .eq("shows.producer_id", profileId)
          .gte("created_at", sinceDate.toISOString()),
        (supabase.from("analytics_events" as never) as never)
          .select("event_type, show_id, created_at")
          .eq("group_id", profileId)
          .gte("created_at", sinceDate.toISOString())
          .order("created_at", { ascending: true }),
      ]);

      if (showsResponse.data) setShows(showsResponse.data as ProducerShow[]);
      setPendingCount(pendingTicketsResponse.count || 0);

      const rawEvents = (eventsResponse.data || []) as Array<{ event_type: string; show_id: string | null; created_at: string }>;
      const rawReservations = (reservationsResponse.data || []) as Array<{ show_id: string | null; created_at: string }>;

      const events = selectedShowId === "all" ? rawEvents : rawEvents.filter((e) => e.show_id === selectedShowId);
      const reservations = selectedShowId === "all" ? rawReservations : rawReservations.filter((r) => r.show_id === selectedShowId);

      const views = events.filter((e) => e.event_type === "profile_view").length;
      const clicks = events.filter((e) => e.event_type === "ticket_click").length;
      const reservationCount = reservations.length;
      const ctr = views > 0 ? (clicks / views) * 100 : 0;
      setStats({ views, clicks, reservations: reservationCount, ctr });

      const dayBuckets: Record<string, number> = {};
      for (let i = rangeDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayBuckets[key] = 0;
      }

      events.forEach((event) => {
        if (event.event_type !== "ticket_click") return;
        const key = event.created_at.slice(0, 10);
        if (key in dayBuckets) dayBuckets[key] += 1;
      });

      setChartData(
        Object.entries(dayBuckets).map(([key, value]) => ({
          date: new Date(`${key}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          clicks: value,
        }))
      );
    } catch {
      setStats({ views: 0, clicks: 0, reservations: 0, ctr: 0 });
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, rangeDays, selectedShowId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <div className="h-96 flex items-center justify-center"><BrandedLoader /></div>;

  const hasData = stats.views > 0 || stats.clicks > 0 || stats.reservations > 0 || pendingCount > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-6">
      {pendingCount > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-full"><AlertTriangle className="w-5 h-5 text-yellow-500" /></div>
            <div><p className="font-semibold text-foreground">Pending Ticket Verifications</p><p className="text-sm text-muted-foreground">You have {pendingCount} ticket{pendingCount !== 1 && "s"} awaiting admin payment approval.</p></div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-secondary/20 bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          <Button size="sm" variant={rangeDays === 7 ? "default" : "outline"} onClick={() => setRangeDays(7)}>Last 7 days</Button>
          <Button size="sm" variant={rangeDays === 30 ? "default" : "outline"} onClick={() => setRangeDays(30)}>Last 30 days</Button>
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={selectedShowId} onChange={(e) => setSelectedShowId(e.target.value)}>
          <option value="all">All shows</option>
          {shows.map((show) => <option key={show.id} value={show.id}>{show.title}</option>)}
        </select>
      </div>

      {!hasData ? <Card className="bg-card border-secondary/20"><CardContent className="py-16 text-center"><BarChart3 className="w-8 h-8 text-secondary/50 mx-auto mb-3" /><p className="text-muted-foreground">No analytics yet for the selected filters.</p></CardContent></Card> : <>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-secondary/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Profile Views</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.views}</div></CardContent></Card>
        <Card className="bg-card border-secondary/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Ticket Clicks</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.clicks}</div></CardContent></Card>
        <Card className="bg-card border-secondary/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Reservations</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.reservations}</div></CardContent></Card>
        <Card className="bg-card border-secondary/20"><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">Click-Through Rate<UiTooltip><TooltipTrigger asChild><HelpCircle className="w-4 h-4 cursor-help" /></TooltipTrigger><TooltipContent><p className="max-w-xs">CTR = ticket clicks divided by profile views, within the selected show and time range.</p></TooltipContent></UiTooltip></CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-foreground">{stats.ctr.toFixed(1)}%</div></CardContent></Card>
      </div>

      <Card className="bg-card border-secondary/20"><CardHeader><CardTitle className="text-foreground">Ticket Clicks Trend ({rangeDays} Days)</CardTitle></CardHeader><CardContent className="pl-2"><div className="h-[300px] w-full"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" /><XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} /><YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} /><Line type="monotone" dataKey="clicks" stroke="#fbbf24" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer></div></CardContent></Card>
      </>}
    </motion.div>
  );
};
