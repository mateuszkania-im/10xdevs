import { useState, useEffect } from "react";
import { usePlans, useComparePlans } from "@/lib/queries/plans";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ActivityItem } from "./ActivityItem";
import { ChevronLeft } from "lucide-react";

interface PlanCompareViewProps {
  projectId: string;
}

function PlanCompareView({ projectId }: PlanCompareViewProps) {
  // Parse URL to get plan1 and plan2 from query params
  const [plan1Id, setPlan1Id] = useState<string>("");
  const [plan2Id, setPlan2Id] = useState<string>("");
  const [isInitialized, setIsInitialized] = useState(false);

  const { data: plansData, isLoading: plansLoading } = usePlans(projectId, {
    sortBy: "created_at",
    order: "desc",
  });

  const { data: comparisonData, isLoading: comparisonLoading } = useComparePlans(projectId, plan1Id, plan2Id);

  // Initialize plan IDs from URL query params
  useEffect(() => {
    if (typeof window !== "undefined" && !isInitialized) {
      const params = new URLSearchParams(window.location.search);
      const plan1Param = params.get("plan1");
      const plan2Param = params.get("plan2");

      if (plan1Param) setPlan1Id(plan1Param);
      if (plan2Param) setPlan2Id(plan2Param);

      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Update URL when plan selection changes
  useEffect(() => {
    if (typeof window !== "undefined" && isInitialized && plan1Id && plan2Id) {
      const url = new URL(window.location.href);
      url.searchParams.set("plan1", plan1Id);
      url.searchParams.set("plan2", plan2Id);
      window.history.replaceState({}, "", url.toString());
    }
  }, [plan1Id, plan2Id, isInitialized]);

  const handlePlan1Change = (value: string) => {
    setPlan1Id(value);
  };

  const handlePlan2Change = (value: string) => {
    setPlan2Id(value);
  };

  const navigateBack = () => {
    window.location.href = `/app/projects/${projectId}`;
  };

  if (plansLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const plans = plansData?.data || [];

  if (plans.length < 2) {
    return (
      <div className="rounded-md border p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Za mało planów do porównania</h2>
        <p className="text-muted-foreground mb-4">Musisz mieć przynajmniej dwa plany, aby móc je porównać.</p>
        <Button onClick={navigateBack}>Powrót do projektu</Button>
      </div>
    );
  }

  // Get plan names for display
  const getPlanName = (id: string) => {
    const plan = plans.find((p) => p.id === id);
    return plan ? plan.version_name : "Wybierz plan";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Button variant="outline" onClick={navigateBack} className="flex items-center gap-2">
          <ChevronLeft className="h-4 w-4" />
          Powrót do projektu
        </Button>

        <h1 className="text-2xl font-bold">Porównanie planów</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 border rounded-md bg-accent/10">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Plan 1</label>
          <Select value={plan1Id} onValueChange={handlePlan1Change}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz pierwszy plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.version_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-2">Plan 2</label>
          <Select value={plan2Id} onValueChange={handlePlan2Change}>
            <SelectTrigger>
              <SelectValue placeholder="Wybierz drugi plan" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.version_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {comparisonLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      )}

      {!comparisonLoading && comparisonData && (
        <div className="space-y-8">
          {comparisonData.days.map((dayComparison, index) => (
            <div key={index} className="border rounded-md p-4">
              <h3 className="text-lg font-medium mb-4">Dzień {index + 1}</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium mb-3 text-center">{getPlanName(plan1Id)}</h4>
                  <div className="space-y-4">
                    {dayComparison.plan1_activities.map((activity, activityIndex) => (
                      <ActivityItem key={activityIndex} activity={activity} />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-3 text-center">{getPlanName(plan2Id)}</h4>
                  <div className="space-y-4">
                    {dayComparison.plan2_activities.map((activity, activityIndex) => (
                      <ActivityItem key={activityIndex} activity={activity} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!comparisonLoading && !comparisonData && plan1Id && plan2Id && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 p-6 text-center">
          <h2 className="text-xl font-bold text-amber-700 dark:text-amber-400">Nie można porównać planów</h2>
          <p className="text-amber-600 dark:text-amber-300 mt-2">
            Wystąpił problem podczas porównywania wybranych planów. Spróbuj wybrać inne plany.
          </p>
        </div>
      )}

      {!plan1Id || !plan2Id ? (
        <div className="rounded-md border p-6 text-center">
          <p className="text-muted-foreground">Wybierz dwa plany powyżej, aby zobaczyć porównanie.</p>
        </div>
      ) : null}
    </div>
  );
}

export default PlanCompareView;
