import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

interface RankCardProps {
  rank: string;
  xp: number;
}

export const RankCard = ({ rank, xp }: RankCardProps) => {
  // Simple level calculation: Level = floor(XP / 100) + 1
  // Progress to next level = XP % 100
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  const nextLevelXp = level * 100;

  return (
    <Card className="border-secondary/20 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif flex items-center gap-2">
          <Trophy className="w-5 h-5 text-secondary" />
          Rank & Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-2xl font-bold text-foreground">{rank}</p>
            <p className="text-sm text-muted-foreground">Level {level}</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-secondary">{xp} XP</span>
            <span className="text-xs text-muted-foreground block">/ {nextLevelXp} XP</span>
          </div>
        </div>
        <Progress value={progress} className="h-2 bg-secondary/10" indicatorClassName="bg-secondary" />
        <p className="text-xs text-muted-foreground mt-2 text-right">
          {100 - progress} XP to next level
        </p>
      </CardContent>
    </Card>
  );
};
