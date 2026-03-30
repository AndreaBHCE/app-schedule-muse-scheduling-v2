/* ================================================================
   MEETING-SETUP — CONSTANTS
   Lookup tables, presets, and default values used across tabs.
   ================================================================ */

import type {
  BookingConfig,
  LocationType,
  NotificationEvent,
  TabId,
  WeekDay,
} from "./types";

/* ── Week-day ordering & labels ── */

export const WEEK_DAYS: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export const DAY_LABELS: Record<WeekDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

/* ── Tab bar ── */

export const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "settings", label: "Booking Settings", icon: "⚙️" },
  { id: "form", label: "Booking Form", icon: "📋" },
  { id: "notifications", label: "Notifications", icon: "🔔" },
  { id: "page", label: "Page Designer", icon: "🎨" },
  { id: "embed", label: "Embed Designer", icon: "🖥️" },
  { id: "phone", label: "Phone Settings", icon: "📞" },
];

/* ── Booking Settings presets ── */

export const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];
export const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];

export const LOCATION_LABELS: Record<LocationType, string> = {
  video: "Video call",
  phone: "Phone call",
  "in-person": "In-person",
};

/* ── Notification presets ── */

export const REMINDER_OPTIONS = [
  { label: "15 min before", value: 15 },
  { label: "30 min before", value: 30 },
  { label: "1 hour before", value: 60 },
  { label: "2 hours before", value: 120 },
  { label: "24 hours before", value: 1440 },
];

export const NOTIFICATION_LABELS: Record<
  NotificationEvent,
  { title: string; desc: string }
> = {
  scheduled: {
    title: "Meeting Scheduled",
    desc: "Sent when you or a guest books or modifies a meeting",
  },
  reminder: {
    title: "Reminder",
    desc: "Sent before the meeting starts",
  },
  rescheduled: {
    title: "Rescheduled",
    desc: "Sent when a meeting is rescheduled",
  },
  reassigned: {
    title: "Reassigned",
    desc: "Sent when a meeting is reassigned to another host",
  },
  canceled: {
    title: "Canceled",
    desc: "Sent when a meeting is canceled",
  },
};

/* ── Helpers ── */

export function formatTime24to12(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24 || "--:--";
  const [h, m] = time24.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time24;
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${suffix}`;
}

/* ── Default booking config ── */

export function defaultConfig(): BookingConfig {
  return {
    meetingSubject: "",
    durations: [30],
    defaultDuration: 30,
    hostName: "",
    hostEmail: "",
    availability: {
      monday: { enabled: true, start: "09:00", end: "17:00" },
      tuesday: { enabled: true, start: "09:00", end: "17:00" },
      wednesday: { enabled: true, start: "09:00", end: "17:00" },
      thursday: { enabled: true, start: "09:00", end: "17:00" },
      friday: { enabled: true, start: "09:00", end: "17:00" },
      saturday: { enabled: false, start: "09:00", end: "17:00" },
      sunday: { enabled: false, start: "09:00", end: "17:00" },
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    location: { type: "video", details: "" },
    sessionType: "one-on-one",
    groupMaxSize: 10,
    minNoticeHours: 2,
    maxAdvanceDays: 3,
    slotIntervalMinutes: 15,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 5,
    paymentEnabled: false,
    paymentAmount: 0,
    paymentCurrency: "USD",
    formFields: [
      { id: "first_name", label: "First Name", type: "text", required: true, isDefault: true },
      { id: "last_name", label: "Last Name", type: "text", required: true, isDefault: true },
      { id: "email", label: "Email", type: "text", required: true, isDefault: true },
      { id: "phone", label: "Phone", type: "phone", required: false, isDefault: true },
      { id: "company", label: "Company", type: "text", required: false, isDefault: true },
    ],
    afterBookingRedirect: "",
    notifications: [
      { event: "scheduled", emailEnabled: true, smsEnabled: false },
      { event: "reminder", emailEnabled: true, smsEnabled: false, reminderMinutes: 60 },
      { event: "rescheduled", emailEnabled: true, smsEnabled: false },
      { event: "reassigned", emailEnabled: true, smsEnabled: false },
      { event: "canceled", emailEnabled: true, smsEnabled: false },
    ],
    pageSlug: "my-booking",
    pagePublished: true,
    pageBackgroundType: "solid",
    pageBackground: "#111934",
    pageBackgroundImage: "",
    pageLogo: "",
    pageProfileImage: "",
    pageHeading: "Schedule a Meeting",
    pageSubheading: "Select a convenient time from the available slots.",
    pageWelcomeMessage:
      "Thank you for your interest. Please select a convenient time for our meeting from the options on the right. I look forward to speaking with you.",
    pageHostName: "",
    pageHostTitle: "",
    pageCompanyName: "",
    pageInfoTextColor: "#333333",
    pageInfoBgOpacity: 90,
    pageButtonColor: "#111934",
    pageSchedulingBgOpacity: 100,
    pageAccentColor: "#6A8E8E",
    pageFooter:
      "If the times shown do not fit your schedule, please reach out via email.",
    embedMode: "inline",
    embedButtonText: "Book a meeting",
    embedButtonColor: "#6A8E8E",
    embedSignatureText: "Schedule a meeting with me",
    embedSignatureStyle: "link",
    phoneNumber: "",
    phoneWelcomeMessage:
      "Thanks for calling! Please book a meeting at your convenience.",
  };
}
