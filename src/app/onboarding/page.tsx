"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

/* ================================================================
   TYPES
   ================================================================ */
type OnboardingData = {
  usage: "solo" | "team" | null;
  useCases: string[];
  role: string | null;
  availability: Record<string, { enabled: boolean; start: string; end: string }>;
  meetingLocation: string | null;
  aiSummary: boolean;
};

const TOTAL_STEPS = 5;

const DAY_LABELS = [
  { key: "sun", short: "S", full: "Sunday" },
  { key: "mon", short: "M", full: "Monday" },
  { key: "tue", short: "T", full: "Tuesday" },
  { key: "wed", short: "W", full: "Wednesday" },
  { key: "thu", short: "T", full: "Thursday" },
  { key: "fri", short: "F", full: "Friday" },
  { key: "sat", short: "S", full: "Saturday" },
];

const USE_CASES = [
  { id: "schedule-clients", icon: "📅", label: "Schedule client meetings" },
  { id: "reduce-emails", icon: "🔄", label: "Reduce back-and-forth emails" },
  { id: "paid-consults", icon: "💰", label: "Book paid consultations" },
  { id: "team-availability", icon: "👥", label: "Coordinate team availability" },
  { id: "analytics", icon: "📊", label: "Track meeting analytics" },
  { id: "ai-prep", icon: "🤖", label: "AI-powered meeting prep" },
];

const ROLES = [
  { id: "sales", icon: "📈", label: "Sales" },
  { id: "finance", icon: "💼", label: "Finance" },
  { id: "marketing", icon: "🚀", label: "Marketing" },
  { id: "customer-success", icon: "🎯", label: "Customer success" },
  { id: "recruiting", icon: "🧑‍💼", label: "Recruiting" },
  { id: "education", icon: "🎓", label: "Education" },
  { id: "consulting", icon: "🏛️", label: "Consulting" },
  { id: "healthcare", icon: "🏥", label: "Healthcare / Wellness" },
  { id: "legal", icon: "⚖️", label: "Legal / Law" },
  { id: "real-estate", icon: "🏠", label: "Real estate" },
  { id: "freelance", icon: "🎨", label: "Freelance / Creative" },
  { id: "coaching", icon: "🧭", label: "Coaching / Mentoring" },
  { id: "tech", icon: "💻", label: "Tech / Engineering" },
  { id: "hr", icon: "🤝", label: "HR / People ops" },
  { id: "executive", icon: "👔", label: "Executive / C-suite" },
  { id: "other", icon: "🔹", label: "Other" },
];

const LOCATIONS = [
  { id: "zoom", icon: "🎥", label: "Zoom" },
  { id: "google-meet", icon: "📹", label: "Google Meet" },
  { id: "ms-teams", icon: "💬", label: "Microsoft Teams" },
  { id: "phone", icon: "📞", label: "Phone call" },
  { id: "in-person", icon: "📍", label: "In-person" },
];

function defaultAvailability(): OnboardingData["availability"] {
  const avail: OnboardingData["availability"] = {};
  DAY_LABELS.forEach((d) => {
    const isWeekday = !["sun", "sat"].includes(d.key);
    avail[d.key] = { enabled: isWeekday, start: "9:00am", end: "5:00pm" };
  });
  return avail;
}

/* ================================================================
   COMPONENT
   ================================================================ */
export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    usage: null,
    useCases: [],
    role: null,
    availability: defaultAvailability(),
    meetingLocation: null,
    aiSummary: true,
  });

  const progress = (step / TOTAL_STEPS) * 100;

  const goNext = useCallback(() => {
    if (step < TOTAL_STEPS) setStep((s) => s + 1);
    else router.push("/dashboard");
  }, [step, router]);

  const goBack = useCallback(() => {
    if (step > 1) setStep((s) => s - 1);
  }, [step]);

  const skip = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  /* ---------- helpers ---------- */
  function toggleUseCase(id: string) {
    setData((prev) => ({
      ...prev,
      useCases: prev.useCases.includes(id)
        ? prev.useCases.filter((c) => c !== id)
        : [...prev.useCases, id],
    }));
  }

  function toggleDay(key: string) {
    setData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: { ...prev.availability[key], enabled: !prev.availability[key].enabled },
      },
    }));
  }

  function updateTime(key: string, field: "start" | "end", value: string) {
    setData((prev) => ({
      ...prev,
      availability: {
        ...prev.availability,
        [key]: { ...prev.availability[key], [field]: value },
      },
    }));
  }

  /* ================================================================
     STEP RENDERERS
     ================================================================ */

  /* ----- Step 1: Usage ----- */
  function renderStep1() {
    return (
      <>
        <p className="ob-welcome">Welcome to ScheduleMuseAI!</p>
        <h2 className="ob-heading">How will ScheduleMuse AI help you with scheduling?</h2>
        <p className="ob-sub">Your responses will help us tailor your experience to your needs.</p>

        <div className="ob-card-grid ob-card-grid--2">
          {[
            { id: "solo" as const, icon: "👤", label: "On my own", desc: "Personal scheduling for one person" },
            { id: "team" as const, icon: "👥", label: "With my team", desc: "Coordinate scheduling across a team" },
          ].map((opt) => (
            <button
              key={opt.id}
              className={`ob-card ${data.usage === opt.id ? "ob-card--selected" : ""}`}
              onClick={() => setData((p) => ({ ...p, usage: opt.id }))}
            >
              <span className="ob-card__icon">{opt.icon}</span>
              <span className="ob-card__label">{opt.label}</span>
              <span className="ob-card__desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  /* ----- Step 1 Preview ----- */
  function renderStep1Preview() {
    return (
      <div className="ob-preview-card">
        <div className="ob-preview-cal">
          <div className="ob-preview-cal__header">
            <div className="ob-preview-cal__avatar" />
            <div>
              <div className="ob-preview-cal__title">Select a Date &amp; Time</div>
            </div>
          </div>
          <div className="ob-preview-cal__month">
            <span style={{ color: "var(--cal-primary)" }}>‹</span>
            <span>MARCH 2026</span>
            <span style={{ color: "var(--cal-primary)" }}>›</span>
          </div>
          <div className="ob-preview-cal__grid">
            {["S","M","T","W","T","F","S"].map((d,i) => (
              <div key={i} className="ob-preview-cal__day-label">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <div
                key={d}
                className={`ob-preview-cal__day ${d === 20 ? "ob-preview-cal__day--today" : ""} ${d === 22 ? "ob-preview-cal__day--selected" : ""}`}
              >
                {d}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ----- Step 2: Use Cases ----- */
  function renderStep2() {
    return (
      <>
        <h2 className="ob-heading">What ScheduleMuse AI uses are you most excited about?</h2>
        <p className="ob-sub">Select all that apply:</p>

        <div className="ob-card-grid ob-card-grid--2">
          {USE_CASES.map((uc) => (
            <button
              key={uc.id}
              className={`ob-card ob-card--compact ${data.useCases.includes(uc.id) ? "ob-card--selected" : ""}`}
              onClick={() => toggleUseCase(uc.id)}
            >
              <span className="ob-card__icon">{uc.icon}</span>
              <span className="ob-card__label">{uc.label}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  /* ----- Step 2 Preview ----- */
  function renderStep2Preview() {
    const selected = USE_CASES.filter((u) => data.useCases.includes(u.id));
    return (
      <div className="ob-preview-card">
        <div className="ob-preview-features">
          <h4 className="ob-preview-features__title">Your toolkit</h4>
          {selected.length === 0 ? (
            <p className="ob-preview-features__empty">Select features to see your personalized toolkit</p>
          ) : (
            <div className="ob-preview-features__list">
              {selected.map((f) => (
                <div key={f.id} className="ob-preview-features__item">
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ----- Step 3: Role ----- */
  function renderStep3() {
    return (
      <>
        <h2 className="ob-heading">What role will we be scheduling for?</h2>
        <p className="ob-sub">Understanding your role will help us set up your first scheduling link.</p>

        <div className="ob-card-grid ob-card-grid--2">
          {ROLES.map((r) => (
            <button
              key={r.id}
              className={`ob-card ob-card--compact ${data.role === r.id ? "ob-card--selected" : ""}`}
              onClick={() => setData((p) => ({ ...p, role: r.id }))}
            >
              <span className="ob-card__icon">{r.icon}</span>
              <span className="ob-card__label">{r.label}</span>
            </button>
          ))}
        </div>
      </>
    );
  }

  /* ----- Step 3 Preview ----- */
  function renderStep3Preview() {
    const selected = ROLES.find((r) => r.id === data.role);
    return (
      <div className="ob-preview-card">
        <div className="ob-preview-role">
          {selected ? (
            <>
              <div className="ob-preview-role__icon">{selected.icon}</div>
              <div className="ob-preview-role__label">{selected.label}</div>
              <div className="ob-preview-role__desc">
                We&apos;ll tailor your booking page templates and notification defaults for {selected.label.toLowerCase()} workflows.
              </div>
            </>
          ) : (
            <>
              <div className="ob-preview-role__icon">🔹</div>
              <div className="ob-preview-role__label">Select your role</div>
              <div className="ob-preview-role__desc">
                Pick a role to see how we&apos;ll customize your experience.
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  /* ----- Step 4: Availability ----- */
  function renderStep4() {
    return (
      <>
        <h2 className="ob-heading">Let&apos;s get your scheduling hours set up:</h2>
        <p className="ob-sub">
          You&apos;ll only be booked during these times (you can change these times and add other schedules later).
        </p>

        <div className="ob-avail">
          <div className="ob-avail__header">
            <span className="ob-avail__header-icon">🔄</span>
            <span className="ob-avail__header-text">Weekly hours</span>
          </div>

          {DAY_LABELS.map((day) => {
            const a = data.availability[day.key];
            return (
              <div key={day.key} className="ob-avail__row">
                <button
                  className={`ob-avail__day-btn ${a.enabled ? "ob-avail__day-btn--active" : ""}`}
                  onClick={() => toggleDay(day.key)}
                >
                  {day.short}
                </button>
                {a.enabled ? (
                  <div className="ob-avail__times">
                    <input
                      className="ob-avail__time-input"
                      value={a.start}
                      onChange={(e) => updateTime(day.key, "start", e.target.value)}
                    />
                    <span className="ob-avail__dash">—</span>
                    <input
                      className="ob-avail__time-input"
                      value={a.end}
                      onChange={(e) => updateTime(day.key, "end", e.target.value)}
                    />
                    <button className="ob-avail__action" onClick={() => toggleDay(day.key)} title="Remove">✕</button>
                  </div>
                ) : (
                  <div className="ob-avail__unavailable">
                    Unavailable
                    <button className="ob-avail__action" onClick={() => toggleDay(day.key)} title="Add hours">⊕</button>
                  </div>
                )}
              </div>
            );
          })}

          <div className="ob-avail__tz">
            <span>🌐</span>
            <span>
              {Intl.DateTimeFormat().resolvedOptions().timeZone} ({new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})
            </span>
          </div>
        </div>
      </>
    );
  }

  /* ----- Step 4 Preview ----- */
  function renderStep4Preview() {
    const enabledDays = DAY_LABELS.filter((d) => data.availability[d.key].enabled);
    return (
      <div className="ob-preview-card">
        <div className="ob-preview-cal">
          <div className="ob-preview-cal__header">
            <div className="ob-preview-cal__title" style={{ fontSize: 14, fontWeight: 700 }}>Select a Date &amp; Time</div>
          </div>
          <div className="ob-preview-cal__month">
            <span style={{ color: "var(--cal-primary)" }}>‹</span>
            <span>MARCH</span>
            <span style={{ color: "var(--cal-primary)" }}>›</span>
          </div>
          <div className="ob-preview-cal__grid">
            {DAY_LABELS.map((d, i) => (
              <div key={i} className="ob-preview-cal__day-label">{d.short}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const dow = new Date(2026, 2, dayNum).getDay();
              const dayKey = DAY_LABELS[dow].key;
              const isEnabled = data.availability[dayKey]?.enabled;
              const isToday = dayNum === 20;
              return (
                <div
                  key={dayNum}
                  className={`ob-preview-cal__day ${isToday ? "ob-preview-cal__day--today" : ""} ${isEnabled && !isToday ? "ob-preview-cal__day--available" : ""} ${!isEnabled ? "ob-preview-cal__day--disabled" : ""}`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
          {/* Time slots */}
          {enabledDays.length > 0 && (
            <div className="ob-preview-cal__slots">
              <div className="ob-preview-cal__slots-title">Available times</div>
              {["10:00am", "10:30am", "11:00am", "11:30am"].map((t) => (
                <div key={t} className="ob-preview-cal__slot">{t}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ----- Step 5: Location + AI ----- */
  function renderStep5() {
    return (
      <>
        <h2 className="ob-heading">What is your preferred way to meet with people?</h2>
        <p className="ob-sub">Set a meeting location for your first scheduling link. You can always change this later.</p>

        <div className="ob-card-grid ob-card-grid--2">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.id}
              className={`ob-card ob-card--compact ${data.meetingLocation === loc.id ? "ob-card--selected" : ""}`}
              onClick={() => setData((p) => ({ ...p, meetingLocation: loc.id }))}
            >
              <span className="ob-card__icon">{loc.icon}</span>
              <span className="ob-card__label">{loc.label}</span>
            </button>
          ))}
        </div>

        {/* AI Summary toggle */}
        <div className="ob-ai-toggle">
          <label className="ob-ai-toggle__label">
            <input
              type="checkbox"
              checked={data.aiSummary}
              onChange={(e) => setData((p) => ({ ...p, aiSummary: e.target.checked }))}
              className="ob-ai-toggle__checkbox"
            />
            <span className="ob-ai-toggle__check">
              {data.aiSummary && (
                <svg viewBox="0 0 16 16" fill="none" className="ob-ai-toggle__checkmark">
                  <path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            <div>
              <span className="ob-ai-toggle__title">Include ScheduleMuse AI Summary to your meetings</span>
              <span className="ob-ai-toggle__desc">
                After meetings, you will receive a private summary of key points, topics covered and next steps.
              </span>
            </div>
          </label>
        </div>
      </>
    );
  }

  /* ----- Step 5 Preview ----- */
  function renderStep5Preview() {
    const loc = LOCATIONS.find((l) => l.id === data.meetingLocation);
    return (
      <div className="ob-preview-card">
        {/* Meeting summary preview */}
        <div className="ob-preview-meeting">
          <div className="ob-preview-meeting__location">
            <span className="ob-preview-meeting__loc-icon">{loc?.icon || "📍"}</span>
            <span className="ob-preview-meeting__loc-label">{loc?.label || "Select a location"}</span>
          </div>

          {data.aiSummary && (
            <div className="ob-preview-meeting__ai">
              <div className="ob-preview-meeting__ai-title">Summary ✨</div>
              <div className="ob-preview-meeting__ai-line" style={{ width: "90%" }} />
              <div className="ob-preview-meeting__ai-line" style={{ width: "75%" }} />
              <div className="ob-preview-meeting__ai-title" style={{ marginTop: 12 }}>Action items ✨</div>
              <div className="ob-preview-meeting__ai-item">
                <span className="ob-preview-meeting__ai-check">✓</span>
                <div className="ob-preview-meeting__ai-line" style={{ width: "80%" }} />
              </div>
              <div className="ob-preview-meeting__ai-item">
                <span className="ob-preview-meeting__ai-circle" />
                <div className="ob-preview-meeting__ai-line" style={{ width: "65%" }} />
              </div>
              <div className="ob-preview-meeting__ai-title" style={{ marginTop: 12 }}>Next steps ✨</div>
              <div className="ob-preview-meeting__ai-line" style={{ width: "85%" }} />
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================
     RENDER MAP
     ================================================================ */
  const steps: Record<number, { content: () => React.ReactNode; preview: () => React.ReactNode }> = {
    1: { content: renderStep1, preview: renderStep1Preview },
    2: { content: renderStep2, preview: renderStep2Preview },
    3: { content: renderStep3, preview: renderStep3Preview },
    4: { content: renderStep4, preview: renderStep4Preview },
    5: { content: renderStep5, preview: renderStep5Preview },
  };

  return (
    <div className="ob-layout">
      {/* Top bar */}
      <header className="ob-topbar">
        <div className="ob-topbar__logo">
          <img src="/schedulemuseai-logo-transparent-01.png" alt="ScheduleMuseAI" style={{ height: 40 }} />
          <span className="ob-topbar__brand">ScheduleMuseAI</span>
        </div>
        <div className="ob-topbar__progress-wrap">
          <div className="ob-topbar__progress-bar">
            <div
              className="ob-topbar__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <button className="ob-topbar__skip" onClick={skip}>
          Skip for now
        </button>
      </header>

      {/* Content */}
      <div className="ob-content">
        {/* Left: Form */}
        <div className="ob-form">
          <div className="ob-form__inner">
            {steps[step].content()}
          </div>

          {/* Nav buttons */}
          <div className="ob-form__nav">
            {step > 1 && (
              <button className="ob-btn ob-btn--back" onClick={goBack}>
                ‹ Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            <button className="ob-btn ob-btn--next" onClick={goNext}>
              {step === TOTAL_STEPS ? "Get started" : "Next"}
            </button>
          </div>
        </div>

        {/* Right: Preview */}
        <div className="ob-preview">
          {steps[step].preview()}
        </div>
      </div>
    </div>
  );
}
