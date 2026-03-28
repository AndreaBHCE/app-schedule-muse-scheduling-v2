/* ================================================================
   MEETING-SETUP — SHARED TYPES
   Single source of truth for all type definitions used across
   the booking calendar builder tabs and main page.
   ================================================================ */

export type WeekDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type DayHours = { enabled: boolean; start: string; end: string };

export type LocationType = "video" | "phone" | "in-person";

export type FormField = {
  id: string;
  label: string;
  type: "text" | "textarea" | "single-select" | "multi-select" | "phone" | "file";
  required: boolean;
  options?: string[];
  isDefault?: boolean;
};

export type NotificationEvent =
  | "scheduled"
  | "reminder"
  | "rescheduled"
  | "reassigned"
  | "canceled";

export type NotificationConfig = {
  event: NotificationEvent;
  emailEnabled: boolean;
  smsEnabled: boolean;
  reminderMinutes?: number;
};

export type TabId = "settings" | "form" | "notifications" | "page" | "embed" | "phone";

export type BookingConfig = {
  /* Tab 1 — Booking Settings */
  meetingSubject: string;
  durations: number[];
  defaultDuration: number;
  hostName: string;
  hostEmail: string;
  availability: Record<WeekDay, DayHours>;
  timezone: string;
  location: { type: LocationType; details: string };
  sessionType: "one-on-one" | "group" | "concurrent";
  groupMaxSize: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  slotIntervalMinutes: number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes: number;
  paymentEnabled: boolean;
  paymentAmount: number;
  paymentCurrency: string;
  /* Tab 2 — Booking Form */
  formFields: FormField[];
  afterBookingRedirect: string;
  /* Tab 3 — Notifications */
  notifications: NotificationConfig[];
  /* Tab 4 — Page Designer */
  pageSlug: string;
  pagePublished: boolean;
  pageBackgroundType: "solid" | "gradient" | "image" | "video";
  pageBackground: string;
  pageBackgroundImage: string;
  pageLogo: string;
  pageProfileImage: string;
  pageHeading: string;
  pageSubheading: string;
  pageWelcomeMessage: string;
  pageHostName: string;
  pageHostTitle: string;
  pageCompanyName: string;
  pageInfoTextColor: string;
  pageInfoBgOpacity: number;
  pageButtonColor: string;
  pageSchedulingBgOpacity: number;
  pageAccentColor: string;
  pageFooter: string;
  /* Tab 5 — Embed Designer */
  embedMode: "inline" | "lightbox" | "email-signature";
  embedButtonText: string;
  embedButtonColor: string;
  embedSignatureText: string;
  embedSignatureStyle: "link" | "button";
  /* Tab 6 — Phone Settings */
  phoneNumber: string;
  phoneWelcomeMessage: string;
};

/**
 * Props shared by every tab component.
 * Each tab renders a slice of `BookingConfig` and calls `update()`
 * to mutate individual keys.
 */
export interface TabProps {
  config: BookingConfig;
  update: <K extends keyof BookingConfig>(key: K, value: BookingConfig[K]) => void;
}

/**
 * Extended props for tabs that need section expand/collapse
 * (currently only BookingSettingsTab).
 */
export interface SectionTabProps extends TabProps {
  isOpen: (section: string) => boolean;
  toggle: (section: string) => void;
}

/**
 * Extended props for tabs that need file upload + save.
 */
export interface DesignerTabProps extends TabProps {
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    configKey: keyof BookingConfig,
    maxMB: number,
  ) => void;
  handleSave: () => void;
}

/**
 * Props for the BookingFormTab which needs to do bulk config updates.
 */
export interface FormTabProps extends TabProps {
  setConfig: React.Dispatch<React.SetStateAction<BookingConfig>>;
}

/**
 * Merge-tag contact shape used in Page Designer preview.
 */
export interface SampleContact {
  firstName: string;
  lastName: string;
  email: string;
}
