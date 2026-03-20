import { NextResponse } from "next/server";

export type Booking = {
  id: string;
  title: string;
  durationMinutes: number;
  bufferMinutes: number;
  createdAt: string;
};

let bookings: Booking[] = [];

function isBookingInput(value: any): value is { title: string; durationMinutes: number; bufferMinutes: number } {
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

    const newBooking: Booking = {
      id: `${Date.now()}-${Math.round(Math.random() * 100000)}`,
      title: payload.title.trim(),
      durationMinutes: payload.durationMinutes,
      bufferMinutes: payload.bufferMinutes,
      createdAt: new Date().toISOString(),
    };

    bookings.push(newBooking);

    return NextResponse.json({ booking: newBooking }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
