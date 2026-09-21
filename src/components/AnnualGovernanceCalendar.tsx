"use client";
import { useState, useEffect } from "react";

type MaintenanceItem = {
  id: string;
  discipline: string;
  frequency: string;
  status: "On Time" | "Upcoming" | "Overdue";
  dueDate: string | null;
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

// The API sets status from the last completion and the discipline's
// frequency. It was being calculated and then thrown away, so a client
// could not tell an overdue discipline from one that is months out.
const STATUS_STYLE: Record<MaintenanceItem["status"], string> = {
  Overdue: "text-red-400",
  Upcoming: "text-amber-400",
  "On Time": "text-zy-chrome",
};

export default function AnnualGovernanceCalendar() {
  const [items, setItems] = useState<MaintenanceItem[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/maintenance/dashboard")
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json();
      })
      .then((data) => setItems(data.items ?? []))
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return (
      <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
        <p className="text-white font-semibold mb-2">Annual Governance Calendar</p>
        <p className="text-sm text-zy-chrome">
          The calendar could not load just now. Refresh the page to try again.
        </p>
      </div>
    );
  }

  if (!items) {
    return <p className="text-sm text-zy-chrome">Loading...</p>;
  }

  const currentMonth = new Date().getMonth();

  // A discipline has a due date only once it has been completed at least
  // once, because the due date is calculated from the last completion.
  // A null due date therefore means "never logged", not "due now".
  //
  // These used to be dropped into the current month, which meant a client
  // opening this on their first day saw every discipline they owned piled
  // into one month and eleven months reading "Nothing due". The calendar
  // was least useful on the day it was first seen. They now sit in a
  // group of their own that says what they actually are.
  const scheduled = items.filter((i) => i.dueDate);
  const notStarted = items.filter((i) => !i.dueDate);

  const byMonth = MONTHS.map((monthName, idx) => ({
    monthName,
    monthIdx: idx,
    items: scheduled
      .filter((i) => new Date(i.dueDate as string).getMonth() === idx)
      .sort(
        (a, b) =>
          new Date(a.dueDate as string).getDate() -
          new Date(b.dueDate as string).getDate()
      ),
  }));

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      <p className="text-white font-semibold mb-4">Annual Governance Calendar</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {byMonth.map(({ monthName, monthIdx, items: monthItems }) => (
          <div
            key={monthName}
            className={`border rounded-md p-3 ${
              monthIdx === currentMonth
                ? "border-zy-electric/40 bg-zy-electric/5"
                : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <p className="text-xs text-white font-medium uppercase tracking-wide mb-2">
              {monthName}
            </p>
            {monthItems.length === 0 ? (
              <p className="text-xs text-zy-chrome/50">Nothing due</p>
            ) : (
              <div className="space-y-1">
                {monthItems.map((item) => (
                  <p key={item.id} className={`text-xs ${STATUS_STYLE[item.status]}`}>
                    {new Date(item.dueDate as string).getDate()}. {item.discipline}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {notStarted.length > 0 && (
        <div className="mt-6 border border-white/10 rounded-md p-4 bg-white/[0.02]">
          <p className="text-xs text-white font-medium uppercase tracking-wide mb-1">
            Not yet started
          </p>
          <p className="text-xs text-zy-chrome/70 mb-3">
            These disciplines enter the calendar once you log them for the
            first time. The due date is set from that first entry and repeats
            on the discipline&apos;s own frequency.
          </p>
          <div className="space-y-1">
            {notStarted.map((item) => (
              <p key={item.id} className="text-xs text-zy-chrome">
                {item.discipline}
                <span className="text-zy-chrome/50">
                  {" "}
                  &middot; {item.frequency.replace(/_/g, " ")}
                </span>
              </p>
            ))}
          </div>
        </div>
      )}

      {scheduled.length > 0 && (
        <p className="mt-4 text-xs text-zy-chrome/50">
          Red is overdue, amber is due within a week.
        </p>
      )}
    </div>
  );
}
