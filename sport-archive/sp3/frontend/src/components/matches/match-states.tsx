import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Calendar, Target } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-6">
      {[...Array(5)].map((_, i) => (
        <Card key={i} className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48 bg-slate-700" />
              <Skeleton className="h-4 w-20 bg-slate-700" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                <Skeleton className="h-8 w-64 bg-slate-700" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-12 bg-slate-700" />
                  <Skeleton className="h-8 w-12 bg-slate-700" />
                  <Skeleton className="h-8 w-12 bg-slate-700" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

interface ErrorStateProps {
  error: string;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <Card className="bg-red-900/20 border-red-500/30">
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Target className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-medium">{error}</p>
          <p className="text-slate-400 text-sm mt-2">Próbáld újra egy kicsit később</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function EmptyState() {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50">
      <CardContent className="flex items-center justify-center py-12">
        <div className="text-center">
          <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Nincs meccs ezen a napon</p>
          <p className="text-slate-500 text-sm mt-2">Válassz másik dátumot vagy bajnokságot</p>
        </div>
      </CardContent>
    </Card>
  );
}
