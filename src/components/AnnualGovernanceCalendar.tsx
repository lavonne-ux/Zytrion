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

export default function AnnualGovernanceCalendar() {
  const [items, setItems] = useState<MaintenanceItem[] | null>(null);

  useEffect(() => {
    fetch("/api/maintenance/dashboard")
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []));
  }, []);

  if (!items) {
    return <p className="text-sm text-zy-chrome">Loading...</p>;
  }

  const currentMonth = new Date().getMonth();

  const byMonth = MONTHS.map((monthName, idx) => {
    const itemsThisMonth = items.filter((i) => {
      if (!i.dueDate) return idx === currentMonth;
      return new Date(i.dueDate).getMonth() === idx;
    });
    return { monthName, monthIdx: idx, items: itemsThisMonth };
  });

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      <p className="text-white font-semibold mb-4">Annual Governance Calendar</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {byMonth.map(({ monthName, monthIdx, items: monthItems }) => (
          <div
            key={monthName}
            className={`border rounded-md p-3 ${
              monthIdx === currentMonth ? "border-zy-electric/40 bg-zy-electric/5" : "border-white/10 bg-white/[0.02]"
            }`}
          >
            <p className="text-xs text-white font-medium uppercase tracking-wide mb-2">{monthName}</p>
            {monthItems.length === 0 ? (
              <p className="text-xs text-zy-chrome/50">Nothing due</p>
            ) : (
              <div className="space-y-1">
                {monthItems.map((item) => (
                  <p key={item.id} className="text-xs text-zy-chrome">
                    {item.discipline}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
