import { NextResponse } from "next/server";

export type Booking = {
  id: string;
  title: string;
  durationMinutes: number;
  bufferMinutes: number;
  status: "Published" | "Draft" | "Paused";
  updatedAt: string;
  createdAt: string;
  bookingsLast7Days: number;
  conversionDeltaPercent: number;
  config?: Record<string, unknown>;
};

let bookings: Booking[] = [];

function isBookingInput(value: any): value is { title: string; durationMinutes: number; bufferMinutes: number; config?: Record<string, unknown> } {
  return (
    value &&
    typeof value.title === "string" &&
    value.title.trim().length > 0 &&
    Number.isFinite(value.durationMinutes) &&
    value.durationMinutes > 0 &&
    Number.isFinite(value.bufferMinutes) &&
    value.bufferMinutes >= 0
  );
}

export async function GET() {
  return NextResponse.json({ bookings });
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    if (!isBookingInput(payload)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newBooking: Booking = {
      id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
      title: payload.title.trim(),
      durationMinutes: payload.durationMinutes,
      bufferMinutes: payload.bufferMinutes,
      status: "Published",
      createdAt: now,
      updatedAt: now,
      bookingsLast7Days: Math.floor(Math.random() * 12),
      conversionDeltaPercent: Math.floor(Math.random() * 21) - 10,
      config: payload.config || undefined,
    };

    bookings.unshift(newBooking); // most recent first

    return NextResponse.json({ booking: newBooking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
