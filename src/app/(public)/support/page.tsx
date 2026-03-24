import Link from "next/link";

export default function Support() {
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

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Support Center</h1>
            <p className="text-lg text-gray-600">
              Get help with ScheduleMuse AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Contact Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Us</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-800">Email Support</h3>
                  <a
                    href="mailto:contact@schedulemuseai.com"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    contact@schedulemuseai.com
                  </a>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Response Time</h3>
                  <p className="text-gray-600">We typically respond within 24-48 hours</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Support Hours</h3>
                  <p className="text-gray-600">Monday - Friday, 9 AM - 6 PM CST</p>
                </div>
              </div>
            </div>

            {/* Quick Help */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Help</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium text-gray-800">Getting Started</h3>
                  <p className="text-sm text-gray-600">New to ScheduleMuse AI? Check our setup guides.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Integration Issues</h3>
                  <p className="text-sm text-gray-600">Having trouble with Zoom, Google Calendar, or Outlook?</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Billing Questions</h3>
                  <p className="text-sm text-gray-600">Need help with subscriptions or payments?</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  How do I connect my calendar to ScheduleMuse AI?
                </h3>
                <p className="text-gray-600">
                  Go to Settings → Integrations and follow the prompts to connect your Google Calendar, Outlook, or other calendar providers.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Why aren't my Zoom meetings being created?
                </h3>
                <p className="text-gray-600">
                  Check that your Zoom integration is properly connected in Settings → Integrations. Ensure you have granted the necessary permissions during the OAuth process.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  How do I cancel my subscription?
                </h3>
                <p className="text-gray-600">
                  Visit Settings → Billing to manage your subscription. You can cancel at any time, and your account will remain active until the end of your billing period.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Can I import my existing contacts?
                </h3>
                <p className="text-gray-600">
                  Yes! Go to Contacts → Import to upload your contact list from CSV files or connect with CRM systems like HubSpot, Salesforce, or Pipedrive.
                </p>
              </div>

              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Is my data secure?
                </h3>
                <p className="text-gray-600">
                  Absolutely. We use industry-standard encryption, secure cloud storage, and follow strict privacy practices. Review our Privacy Policy for detailed information about data security.
                </p>
              </div>
            </div>
          </div>

          {/* Contact Form Alternative */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need More Help?</h2>
            <p className="text-gray-600 mb-4">
              Can't find what you're looking for? Send us a detailed message about your issue and we'll get back to you as soon as possible.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="mailto:contact@schedulemuseai.com?subject=ScheduleMuse AI Support Request"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Email Us
              </a>
              <Link
                href="/docs"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                View Documentation
              </Link>
              <Link
                href="/privacy"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-use"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}