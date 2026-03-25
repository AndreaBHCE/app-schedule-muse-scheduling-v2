import Link from "next/link";

export default function TermsOfUse() {
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

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Use</h1>
          <p className="text-sm text-gray-600 mb-8">Last updated: March 1, 2026</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                Welcome to ScheduleMuse AI. These Terms of Use ("Terms") govern your access to and use of our AI-powered scheduling platform, including all related services, features, and integrations (collectively, the "Service").
              </p>
              <p className="text-gray-700 mb-4">
                By accessing or using ScheduleMuse AI, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI is an intelligent scheduling platform that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>AI-powered appointment scheduling and management</li>
                <li>Calendar integration with Google Calendar, Outlook, and other providers</li>
                <li>Video conferencing integration with Zoom, Microsoft Teams, and Google Meet</li>
                <li>Automated meeting invitations and reminders</li>
                <li>Analytics and reporting on scheduling performance</li>
                <li>Team collaboration and multi-user features</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To use ScheduleMuse AI, you must create an account by providing accurate and complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Account Responsibilities</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>You must be at least 18 years old to create an account</li>
                <li>You must provide accurate and current information</li>
                <li>You are responsible for all activities under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>You may not share your account credentials with others</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Permitted Use</h3>
              <p className="text-gray-700 mb-4">
                You may use ScheduleMuse AI only for lawful purposes and in accordance with these Terms. You agree not to:
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Prohibited Activities</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the Service to spam or harass others</li>
                <li>Reverse engineer or copy our technology</li>
                <li>Exceed reasonable usage limits</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Third-Party Integrations</h2>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI integrates with various third-party services including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Zoom</strong> - Video conferencing and meeting management</li>
                <li><strong>Google Calendar</strong> - Calendar synchronization</li>
                <li><strong>Microsoft Outlook</strong> - Email and calendar integration</li>
                <li><strong>Payment processors</strong> - Subscription and billing</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Your use of these integrations is subject to the respective third-party terms of service. We are not responsible for the availability or functionality of third-party services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscription and Billing</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Subscription Plans</h3>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI offers various subscription plans. Pricing and features are subject to change with notice. Your subscription will automatically renew unless cancelled.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Payment Terms</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>All fees are non-refundable except as required by law</li>
                <li>You authorize us to charge your payment method automatically</li>
                <li>Late payments may result in service suspension</li>
                <li>Price changes will be communicated 30 days in advance</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Our Intellectual Property</h3>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI and its original content, features, and functionality are owned by us and are protected by copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain ownership of content you create or upload. By using our Service, you grant us a limited license to use, store, and process your content to provide the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Privacy and Security</h2>
              <p className="text-gray-700 mb-4">
                Your privacy is important to us. Please review our Privacy Policy, which explains how we collect, use, and protect your information. By using ScheduleMuse AI, you consent to our data practices as described in the Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Service Availability and Modifications</h2>
              <p className="text-gray-700 mb-4">
                We strive to provide continuous service but cannot guarantee 100% uptime. We reserve the right to modify, suspend, or discontinue the Service with reasonable notice. We will not be liable for any service interruptions or modifications.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Termination</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.1 Termination by You</h3>
              <p className="text-gray-700 mb-4">
                You may terminate your account at any time through your account settings. Termination will take effect immediately, but you remain responsible for charges incurred before termination.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.2 Termination by Us</h3>
              <p className="text-gray-700 mb-4">
                We may terminate or suspend your account for violations of these Terms. We will provide notice and an opportunity to cure where appropriate.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Disclaimers and Limitations of Liability</h2>

              <h3 className="text-xl font-medium text-gray-800 mb-3">11.1 Service Disclaimer</h3>
              <p className="text-gray-700 mb-4">
                ScheduleMuse AI is provided "as is" without warranties of any kind. We do not guarantee that the Service will be error-free, uninterrupted, or meet your specific requirements.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">11.2 Limitation of Liability</h3>
              <p className="text-gray-700 mb-4">
                To the maximum extent permitted by law, our total liability for any claims arising from your use of the Service shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-700 mb-4">
                You agree to indemnify and hold harmless ScheduleMuse AI, its officers, directors, employees, and agents from any claims, damages, losses, or expenses arising from your use of the Service or violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law and Dispute Resolution</h2>
              <p className="text-gray-700 mb-4">
                These Terms are governed by the laws of the jurisdiction where ScheduleMuse AI is incorporated. Any disputes will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700 mb-4">
                We may update these Terms periodically. We will notify you of material changes via email or through the Service. Your continued use of ScheduleMuse AI after changes take effect constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700"><strong>Email:</strong> legal@schedulemuse.ai</p>
                <p className="text-gray-700"><strong>Address:</strong> ScheduleMuse AI, Legal Department</p>
                <p className="text-gray-700"><strong>Response Time:</strong> We aim to respond within 5 business days</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Severability</h2>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Entire Agreement</h2>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy, constitute the entire agreement between you and ScheduleMuse AI regarding your use of the Service.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}