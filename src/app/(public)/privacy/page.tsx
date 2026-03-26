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
          <p className="text-sm text-gray-600 mb-8">Last updated: March 26, 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered scheduling platform.
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
                <li>Email integration (Gmail) — used to send meeting-related emails on your behalf</li>
                <li>Video conferencing data (Zoom, Microsoft Teams)</li>
                <li>CRM and contact management system data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Scheduling Services:</strong> To create, manage, and optimize your appointments</li>
                <li><strong>Communication:</strong> To send meeting invitations, reminders, and updates</li>
                <li><strong>Integration:</strong> To sync with your calendar and video conferencing tools</li>
                <li><strong>Analytics:</strong> To improve our AI algorithms and service quality</li>
                <li><strong>Customer Support:</strong> To assist you with technical issues and questions</li>
                <li><strong>Legal Compliance:</strong> To meet legal obligations and protect our rights</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Third-Party Integrations</h3>
              <p className="text-gray-700 mb-4">
                We share necessary information with integrated services:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Zoom:</strong> Meeting details to create video conferences</li>
                <li><strong>Calendar Providers:</strong> Appointment data for calendar syncing</li>
                <li><strong>Gmail:</strong> When you connect your Gmail account, we use Google&apos;s Gmail API to send meeting invitations, confirmations, and reminders on your behalf. We access only the send capability and your email address for identification — we do not read, scan, or store the content of your emails.</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required by law, court order, or to protect our rights and safety.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement industry-standard security measures:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>End-to-end encryption for data transmission</li>
                <li>Secure cloud storage with encryption at rest</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and authentication requirements</li>
                <li>Employee training on data protection</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your information for as long as necessary to provide our services and comply with legal obligations:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Meeting History:</strong> Retained for 7 years for legal and tax purposes</li>
                <li><strong>Analytics Data:</strong> Anonymized and retained indefinitely</li>
                <li><strong>Deleted Accounts:</strong> Data deleted within 30 days of account closure</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                <li><strong>Portability:</strong> Receive your data in a structured format</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
                <li><strong>Restriction:</strong> Limit how we process your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar technologies to enhance your experience:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                <li><strong>Analytics Cookies:</strong> Help us improve our services</li>
                <li><strong>Preference Cookies:</strong> Remember your settings</li>
              </ul>
              <p className="text-gray-700">
                You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for international transfers, including standard contractual clauses and adequacy decisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700 mb-4">
                Our services are not intended for children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will delete the information promptly.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
              <p className="text-gray-700 mb-4">
                We may update this Privacy Policy periodically. We will notify you of material changes via email or platform notification. Your continued use of our services after changes take effect constitutes acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about this Privacy Policy or our data practices:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> privacy@schedulemuse.ai</p>
                <p className="text-gray-700"><strong>Address:</strong> ScheduleMuse AI, Privacy Team</p>
                <p className="text-gray-700"><strong>Response Time:</strong> We aim to respond within 30 days</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Google API Services — User Data Disclosure</h2>
              <p className="text-gray-700 mb-4">
                When you connect your Google account to ScheduleMuse AI, we request access to specific Google services. This section describes exactly what data we access, why, and how it is handled.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.1 Scopes and Data Accessed</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Gmail Send (gmail.send):</strong> We use this permission solely to send meeting invitations, confirmations, cancellations, and reminders from your Gmail account on your behalf. We do not read, scan, index, or store any of your existing emails or inbox content.</li>
                <li><strong>Email Address (userinfo.email):</strong> We retrieve your Google email address to identify your connected account and display it in your integration settings.</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.2 How Google Data Is Used</h3>
              <p className="text-gray-700 mb-4">
                Google user data is used exclusively to provide the scheduling features you have requested — specifically, sending meeting-related emails through your connected Gmail account. We do not use Google data for any other purpose.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.3 Storage and Protection of Google Data</h3>
              <p className="text-gray-700 mb-4">
                OAuth tokens (access tokens and refresh tokens) obtained through the Google authorization process are encrypted using AES-256-GCM with unique initialization vectors before being stored in our database. Tokens are decrypted only at the moment they are needed to perform an authorized action (such as sending an email) and are never logged, cached in plaintext, or exposed to client-side code.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.4 Revocation and Deletion</h3>
              <p className="text-gray-700 mb-4">
                You may disconnect your Google account at any time from your ScheduleMuse AI integration settings. When you disconnect, all stored OAuth tokens (access token and refresh token) are immediately and permanently deleted from our database. If you revoke access from your Google Account security settings, the tokens stored on our side become invalid and are deleted upon the next synchronization check or when you visit your integrations page.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.5 Limited Use Disclosure</h3>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{" "}
                <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
                  Google API Services User Data Policy
                </a>
                , including the Limited Use requirements. Specifically:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>We only use Google user data to provide and improve the user-facing scheduling features described in this policy.</li>
                <li>We do not transfer Google user data to third parties unless necessary to provide or improve the Service, to comply with applicable laws, or as part of a merger or acquisition with adequate data protection obligations.</li>
                <li>We do not use Google user data for serving advertisements.</li>
                <li>We do not allow humans to read Google user data unless: (a) we have your explicit consent, (b) it is necessary for security purposes (e.g., investigating abuse), (c) it is necessary to comply with applicable law, or (d) the data has been aggregated and anonymized for internal operations.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Compliance</h2>
              <p className="text-gray-700 mb-4">
                This Privacy Policy complies with applicable data protection laws including:
              </p>
              <ul className="list-disc pl-6 text-gray-700">
                <li>General Data Protection Regulation (GDPR)</li>
                <li>California Consumer Privacy Act (CCPA)</li>
                <li>Google API Services User Data Policy, including Limited Use requirements</li>
                <li>Other applicable privacy regulations</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}