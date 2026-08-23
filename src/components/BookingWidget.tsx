"use client";
import { useState, useEffect } from "react";

export default function BookingWidget({
  enrollmentId,
  kind,
  label,
}: {
  enrollmentId: string;
  kind: "sprint" | "consultation";
  label: string;
}) {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/booking/available-slots?kind=${kind}`)
      .then((res) => res.json())
      .then((data) => setSlots(data.slots ?? []))
      .catch(() => setError("Could not load available times."))
      .finally(() => setLoading(false));
  }, [kind]);

  async function bookSlot(slot: string) {
    setBooking(true);
    setError(null);
    try {
      const res = await fetch("/api/booking/create-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentId, slotStart: slot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not book that time.");
        setBooking(false);
        return;
      }
      setConfirmed(slot);
    } catch {
      setError("Could not reach the server. Please try again.");
      setBooking(false);
    }
  }

  if (confirmed) {
    return (
      <div className="border border-zy-electric rounded-lg p-6 bg-zy-electric/10">
        <p className="text-white font-medium">{label} confirmed.</p>
        <p className="text-sm text-zy-chrome mt-1">
          {new Date(confirmed).toLocaleString(undefined, {
            weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
          })}
        </p>
        <p className="text-sm text-zy-chrome mt-2">A confirmation has been sent to your email.</p>
      </div>
    );
  }

  return (
    <div className="border border-white/10 rounded-lg p-6 bg-white/[0.02]">
      <p className="text-white font-semibold mb-1">Schedule Your {label}</p>
      <p className="text-sm text-zy-chrome mb-4">Tuesdays and Thursdays, 30 minutes.</p>
      {loading && <p className="text-sm text-zy-chrome">Loading available times...</p>}
      {error && <p className="text-sm text-red-400 mb-3">{error}</p>}
      {!loading && slots.length === 0 && (
        <p className="text-sm text-zy-chrome">No times available right now. Contact info@getzytrion.com.</p>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
        {slots.map((slot) => (
          <button
            key={slot}
            onClick={() => bookSlot(slot)}
            disabled={booking}
            className="text-xs border border-white/10 rounded-md px-3 py-2 hover:border-zy-electric hover:bg-zy-electric/10 transition-colors disabled:opacity-50"
          >
            {new Date(slot).toLocaleString(undefined, {
              weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
            })}
          </button>
        ))}
      </div>
    </div>
  );
}
