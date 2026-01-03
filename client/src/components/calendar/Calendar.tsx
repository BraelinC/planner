import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths, addWeeks, subWeeks } from "date-fns";
import MonthView from "./MonthView";
import WeekView from "./WeekView";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week">("month");

  const navigatePrev = () => {
    if (view === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const navigateNext = () => {
    if (view === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2 md:mb-4">
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="outline" size="icon" onClick={navigatePrev} className="h-8 w-8 md:h-10 md:w-10">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={navigateNext} className="h-8 w-8 md:h-10 md:w-10">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday} className="h-8 md:h-10 text-xs md:text-sm px-2 md:px-4">
            Today
          </Button>
          <h2 className="text-sm md:text-xl font-semibold ml-1 md:ml-4">
            {format(currentDate, view === "month" ? "MMMM yyyy" : "'Week of' MMM d")}
          </h2>
        </div>

        <Tabs value={view} onValueChange={(v) => setView(v as "month" | "week")}>
          <TabsList className="h-8 md:h-10">
            <TabsTrigger value="month" className="text-xs md:text-sm px-2 md:px-3">Month</TabsTrigger>
            <TabsTrigger value="week" className="text-xs md:text-sm px-2 md:px-3">Week</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="flex-1 overflow-auto">
        {view === "month" ? (
          <MonthView currentDate={currentDate} />
        ) : (
          <WeekView currentDate={currentDate} />
        )}
      </div>
    </div>
  );
}
