import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-8">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: March 27, 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our scheduling platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Name and email address</li>
                <li>Phone number (optional)</li>
                <li>Professional information (job title, company)</li>
                <li>Profile pictures or avatars</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Scheduling Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Meeting preferences and availability</li>
                <li>Appointment details (date, time, duration)</li>
                <li>Meeting notes and descriptions</li>
                <li>Participant information for scheduled meetings</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Integration Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Calendar access (Google Calendar, Outlook)</li>
                <li>Gmail: When you connect your Gmail account, we use Google&apos;s Gmail API solely to send meeting invitations, confirmations, cancellations, and reminders on your behalf. We access only the gmail.send scope and your email address for identification. We do not read, scan, index, or store the content of your emails.</li>
                <li>Video conferencing data (Zoom, Microsoft Teams)</li>
                <li>CRM and contact management system data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>To provide scheduling services: create, manage, and optimize your appointments</li>
                <li>To send meeting invitations, reminders, and updates</li>
                <li>To sync with your calendar and video conferencing tools</li>
                <li>To provide customer support</li>
                <li>To meet legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Third-Party Integrations</h3>
              <p className="text-gray-700 mb-4">
                We share necessary information with integrated services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Zoom: Meeting details to create video conferences</li>
                <li>Calendar Providers: Appointment data for calendar syncing</li>
                <li>Gmail: When you connect your Gmail account, we use Google&apos;s Gmail API solely to send meeting invitations, confirmations, cancellations, and reminders on your behalf. We access only the gmail.send scope and your email address for identification. We do not read, scan, index, or store the content of your emails.</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law, court order, or to protect our rights and safety.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures, including encryption for data in transit and at rest, access controls, and regular security updates.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for up to 2 years, or as long as necessary to provide our services and comply with legal obligations.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Account Data: Retained while your account is active (up to 2 years after inactivity)</li>
                <li>Meeting History: Retained for up to 2 years</li>
                <li>Deleted Accounts: Data deleted within 30 days of account closure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may request access, correction, deletion, or portability of your personal data by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use essential cookies for platform functionality and analytics/preference cookies to improve your experience. You can manage cookie preferences in your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your data may be transferred to and processed in countries other than your own. We use appropriate safeguards such as standard contractual clauses.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children&apos;s Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13 and will delete such data if discovered.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy. We will notify you of material changes via email or in-app notification. Continued use after changes constitutes acceptance.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                Email: privacy@schedulemuse.ai
              </p>
              <p className="text-gray-700 mb-4">
                We aim to respond within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Google API Services — User Data Disclosure</h2>
              <p className="text-gray-700 mb-4">
                When you connect your Google account to ScheduleMuse AI, we request access to specific Google services. This section describes exactly what data we access, why, and how it is handled.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.1 Scopes and Data Accessed</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Gmail Send (gmail.send): Used solely to send meeting invitations, confirmations, cancellations, and reminders from your Gmail account on your behalf. We do not read, scan, index, or store any of your existing emails or inbox content.</li>
                <li>Email Address (userinfo.email): Retrieved to identify your connected account and display it in your integration settings.</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.2 How Google Data Is Used</h3>
              <p className="text-gray-700 mb-4">
                Google user data is used exclusively to provide the scheduling features you requested — specifically, sending meeting-related communications through your connected Gmail account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.3 Storage and Protection of Google Data</h3>
              <p className="text-gray-700 mb-4">
                OAuth tokens are encrypted and stored securely. They are decrypted only when needed to send an email and are never logged in plaintext or exposed to client-side code.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.4 Revocation and Deletion</h3>
              <p className="text-gray-700 mb-4">
                You may disconnect your Google account at any time from your integration settings. Upon disconnection, all stored OAuth tokens are immediately and permanently deleted. Revocation via Google Account settings also invalidates and leads to deletion of tokens on our side.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.5 Limited Use Disclosure</h3>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements.
              </p>
              <p className="text-gray-700 mb-4">
                Specifically, ScheduleMuse AI will:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Limit its use of data to providing or improving user-facing features that are prominent in the requesting application&apos;s user interface.</li>
                <li>Transfers of data are not allowed, except:
                  <ul className="list-disc pl-6 mt-2">
                    <li>To provide or improve user-facing features that are visible and prominent in the requesting application&apos;s user interface and only with the user&apos;s consent;</li>
                    <li>For security purposes (for example, investigating abuse);</li>
                    <li>To comply with applicable laws; or</li>
                    <li>As part of a merger, acquisition, or sale of assets of the developer after obtaining explicit prior consent from the user.</li>
                  </ul>
                </li>
                <li>Not use Google user data for serving advertisements.</li>
                <li>Not allow humans to read Google user data unless the user has given explicit consent to view specific messages, files, or other data, or it is necessary for security purposes (such as investigating abuse), to comply with applicable law, or the data has been aggregated and anonymized for internal operations.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Compliance</h2>
              <p className="text-gray-700 mb-4">
                This Privacy Policy is designed to comply with applicable laws including GDPR, CCPA, and the Google API Services User Data Policy.
              </p>
            </section>

            <p className="text-gray-600 text-sm mt-8">© 2026 ScheduleMuse AI</p>
          </div>
        </div>
      </div>
    </div>
  );
}