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

function buildEvents(): MeetingEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function at(dayOffset: number, hour: number, minute = 0): string {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  }

  return [
    { id: "ev-1",  startTime: at(0, 9, 0),   guestName: "Jordan Blake",   guestEmail: "jordan.blake@example.com",   meetingType: "30-min strategy session", status: "confirmed", location: "virtual",    locationDetails: "https://meet.schedulemuseai.com/abc123" },
    { id: "ev-2",  startTime: at(0, 11, 0),  guestName: "Skyler Reeves",  guestEmail: "skyler.reeves@example.com",  meetingType: "Coffee chat",             status: "confirmed", location: "in-person",  locationDetails: "Café Luma, Downtown" },
    { id: "ev-3",  startTime: at(0, 14, 30), guestName: "Taylor Morgan",  guestEmail: "taylor.morgan@example.com",  meetingType: "60-min coaching",          status: "pending",   location: "phone",      locationDetails: "+1-555-0100" },
    { id: "ev-4",  startTime: at(1, 10, 0),  guestName: "Sam Rivera",     guestEmail: "sam.rivera@example.com",     meetingType: "Team onboarding",         status: "confirmed", location: "in-person",  locationDetails: "Office 42, 123 Main St" },
    { id: "ev-5",  startTime: at(1, 15, 0),  guestName: "Alex Chen",      guestEmail: "alex.chen@example.com",      meetingType: "15-min check-in",         status: "confirmed", location: "virtual",    locationDetails: "https://meet.schedulemuseai.com/xyz789" },
    { id: "ev-6",  startTime: at(2, 11, 0),  guestName: "Morgan Lee",     guestEmail: "morgan.lee@example.com",     meetingType: "Product demo",            status: "confirmed", location: "virtual",    locationDetails: "https://meet.schedulemuseai.com/demo456" },
    { id: "ev-7",  startTime: at(4, 9, 30),  guestName: "Casey Nguyen",   guestEmail: "casey.nguyen@example.com",   meetingType: "Quarterly review",        status: "pending",   location: "in-person",  locationDetails: "Conference Room B" },
    { id: "ev-8",  startTime: at(7, 13, 0),  guestName: "Riley Patel",    guestEmail: "riley.patel@example.com",    meetingType: "Client kickoff",          status: "confirmed", location: "virtual",    locationDetails: "https://meet.schedulemuseai.com/kick001" },
    { id: "ev-9",  startTime: at(10, 10, 30),guestName: "Jamie Foster",   guestEmail: "jamie.foster@example.com",   meetingType: "Design review",           status: "confirmed", location: "virtual",    locationDetails: "https://meet.schedulemuseai.com/design88" },
    { id: "ev-10", startTime: at(14, 16, 0), guestName: "Drew Simmons",   guestEmail: "drew.simmons@example.com",   meetingType: "Sprint retrospective",    status: "pending",   location: "virtual",    locationDetails: "https://meet.schedulemuseai.com/retro22" },
    { id: "ev-11", startTime: at(21, 11, 0), guestName: "Avery Kim",      guestEmail: "avery.kim@example.com",      meetingType: "1-on-1 sync",             status: "confirmed", location: "phone",      locationDetails: "+1-555-0200" },
    { id: "ev-12", startTime: at(28, 14, 0), guestName: "Quinn Ortiz",    guestEmail: "quinn.ortiz@example.com",    meetingType: "End-of-month wrap-up",    status: "confirmed", location: "in-person",  locationDetails: "Board Room, Floor 3" },
  ];
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const range = url.searchParams.get("range") || "day";
  const dateParam = url.searchParams.get("date");

  const anchor = dateParam ? new Date(dateParam + "T00:00:00") : new Date();
  anchor.setHours(0, 0, 0, 0);

  let rangeStart: Date;
  let rangeEnd: Date;

  if (range === "day") {
    rangeStart = new Date(anchor);
    rangeEnd = new Date(anchor);
    rangeEnd.setDate(rangeEnd.getDate() + 1);
  } else if (range === "week") {
    rangeStart = new Date(anchor);
    rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay());
    rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 7);
  } else {
    rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1);
  }

  const events = buildEvents()
    .filter((e) => {
      const t = new Date(e.startTime).getTime();
      return t >= rangeStart.getTime() && t < rangeEnd.getTime();
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return NextResponse.json({ events });
}
