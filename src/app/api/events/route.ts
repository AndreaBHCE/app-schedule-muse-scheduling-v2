import { NextResponse } from "next/server";

type MeetingEvent = {
  id: string;
  startTime: string;
  guestName: string;
  guestEmail: string;
  meetingType: string;
  status: "confirmed" | "pending" | "canceled";
  location: "virtual" | "phone" | "in-person";
  locationDetails: string;
};

const now = new Date();

function addMinutes(date: Date, minutes: number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}

const baseEvents: MeetingEvent[] = [
  {
    id: "ev-1",
    startTime: addMinutes(now, 30).toISOString(),
    guestName: "Jordan Blake",
    guestEmail: "jordan.blake@example.com",
    meetingType: "30-minute strategy session",
    status: "confirmed",
    location: "virtual",
    locationDetails: "https://meet.schedulemuseai.com/abc123",
  },
  {
    id: "ev-2",
    startTime: addMinutes(now, 90).toISOString(),
    guestName: "Taylor Morgan",
    guestEmail: "taylor.morgan@example.com",
    meetingType: "60-minute coaching",
    status: "pending",
    location: "phone",
    locationDetails: "+1-555-0100",
  },
  {
    id: "ev-3",
    startTime: addMinutes(now, 210).toISOString(),
    guestName: "Sam Rivera",
    guestEmail: "sam.rivera@example.com",
    meetingType: "Team onboarding",
    status: "confirmed",
    location: "in-person",
    locationDetails: "Office 42, 123 Main St",
  },
  {
    id: "ev-4",
    startTime: addMinutes(now, 1440).toISOString(),
    guestName: "Alex Chen",
    guestEmail: "alex.chen@example.com",
    meetingType: "15-minute check-in",
    status: "confirmed",
    location: "virtual",
    locationDetails: "https://meet.schedulemuseai.com/xyz789",
  },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "day";

  const nowTime = Date.now();
  let rangeMillis = 24 * 60 * 60 * 1000;

  if (range === "week") {
    rangeMillis = 7 * 24 * 60 * 60 * 1000;
  } else if (range === "month") {
    rangeMillis = 30 * 24 * 60 * 60 * 1000;
  }

  const events = baseEvents
    .filter((event) => {
      const eventTime = new Date(event.startTime).getTime();
      return eventTime >= nowTime && eventTime <= nowTime + rangeMillis;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return NextResponse.json({ events });
}
