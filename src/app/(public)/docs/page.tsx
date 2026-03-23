import Link from "next/link";

export default function Documentation() {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">ScheduleMuse AI Documentation</h1>
            <p className="text-lg text-gray-600">
              Complete guide for Zoom integration and usage
            </p>
          </div>

          {/* Table of Contents */}
          <div className="bg-blue-50 p-6 rounded-lg mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Table of Contents</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Getting Started</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><a href="#adding-app" className="hover:text-blue-600">Adding ScheduleMuse AI</a></li>
                  <li><a href="#account-setup" className="hover:text-blue-600">Account Setup</a></li>
                  <li><a href="#zoom-connection" className="hover:text-blue-600">Connecting Zoom</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Using the App</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><a href="#creating-meetings" className="hover:text-blue-600">Creating Meetings</a></li>
                  <li><a href="#managing-schedules" className="hover:text-blue-600">Managing Schedules</a></li>
                  <li><a href="#troubleshooting" className="hover:text-blue-600">Troubleshooting</a></li>
                  <li><a href="#removing-app" className="hover:text-blue-600">Removing the App</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Adding the App */}
          <section id="adding-app" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">1. Adding ScheduleMuse AI to Your Zoom Account</h2>

            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Step 1: Find ScheduleMuse AI in Zoom Marketplace</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Open your Zoom desktop app or web portal</li>
                  <li>Click on your profile picture → "Zoom Apps" or visit <a href="https://marketplace.zoom.us" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">marketplace.zoom.us</a></li>
                  <li>Search for "ScheduleMuse AI" in the search bar</li>
                  <li>Click on the ScheduleMuse AI app from the results</li>
                </ol>
              </div>

              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Step 2: Install the App</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Click the "Install" or "Add" button</li>
                  <li>Review the permissions requested (meeting creation, user profile access)</li>
                  <li>Click "Authorize" to grant permissions</li>
                  <li>You'll be redirected to ScheduleMuse AI to complete setup</li>
                </ol>
              </div>

              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Step 3: Complete Account Setup</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Create your ScheduleMuse AI account or sign in</li>
                  <li>Verify your email address</li>
                  <li>Set up your basic profile information</li>
                  <li>You're now ready to start scheduling!</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Account Setup */}
          <section id="account-setup" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">2. Account Setup and Configuration</h2>

            <div className="bg-gray-50 p-6 rounded-lg mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Initial Configuration</h3>
              <p className="text-gray-700 mb-4">
                After installing the app, complete your account setup:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Profile Setup:</strong> Add your name, timezone, and professional information</li>
                <li><strong>Calendar Integration:</strong> Connect Google Calendar, Outlook, or other calendar providers</li>
                <li><strong>Availability Settings:</strong> Set your working hours and preferred meeting times</li>
                <li><strong>Meeting Preferences:</strong> Configure default meeting duration, buffer time, and reminders</li>
              </ul>
            </div>
          </section>

          {/* Zoom Connection */}
          <section id="zoom-connection" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">3. Connecting Your Zoom Account</h2>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Important:</strong> Ensure you have Zoom admin privileges or the app was pre-approved by your Zoom admin before connecting.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Step-by-Step Connection Process</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Log in to your ScheduleMuse AI dashboard</li>
                  <li>Navigate to "Integrations" in the sidebar</li>
                  <li>Find the Zoom integration card and click "Connect"</li>
                  <li>You'll be redirected to Zoom's authorization page</li>
                  <li>Review the permissions and click "Authorize"</li>
                  <li>Return to ScheduleMuse AI - your Zoom account is now connected!</li>
                </ol>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Required Zoom Permissions</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• View and manage your meetings</li>
                  <li>• Create new meetings on your behalf</li>
                  <li>• Access your user profile information</li>
                  <li>• Update meeting details when schedules change</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Creating Meetings */}
          <section id="creating-meetings" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">4. Creating and Managing Meetings</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Creating Your First Meeting</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Go to "Meeting Setup" in your dashboard</li>
                  <li>Click "Create New Meeting Type"</li>
                  <li>Set meeting duration, title, and description</li>
                  <li>Configure availability and booking settings</li>
                  <li>Save your meeting type</li>
                  <li>Share the booking link with potential attendees</li>
                </ol>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">How Automatic Zoom Meeting Creation Works</h3>
                <p className="text-gray-700 mb-3">
                  When someone books a meeting through your ScheduleMuse AI link:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>ScheduleMuse AI automatically creates a Zoom meeting</li>
                  <li>The meeting details are added to your connected calendar</li>
                  <li>An email invitation is sent to all participants</li>
                  <li>The Zoom meeting link is included in confirmations</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Meeting Management Features</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• Automatic Zoom meeting creation</li>
                  <li>• Calendar integration and sync</li>
                  <li>• Email reminders and confirmations</li>
                  <li>• Meeting rescheduling and cancellation</li>
                  <li>• Attendee management</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Managing Schedules */}
          <section id="managing-schedules" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">5. Managing Your Schedule</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Calendar Integration</h3>
                <p className="text-gray-700 mb-3">
                  Connect your existing calendars to avoid double-booking:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Google Calendar</li>
                  <li>Microsoft Outlook</li>
                  <li>Apple Calendar</li>
                  <li>Other CalDAV calendars</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Availability Settings</h3>
                <p className="text-gray-700 mb-3">
                  Control when people can book you:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                  <li>Set working hours</li>
                  <li>Add buffer time between meetings</li>
                  <li>Block specific dates</li>
                  <li>Create recurring availability</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Troubleshooting */}
          <section id="troubleshooting" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">6. Troubleshooting Common Issues</h2>

            <div className="space-y-6">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Zoom Meetings Not Creating</h3>
                <p className="text-gray-700 mb-2"><strong>Solution:</strong></p>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Verify your Zoom account is properly connected in Integrations</li>
                  <li>Check that you have Zoom admin permissions</li>
                  <li>Ensure the app has the required permissions</li>
                  <li>Try disconnecting and reconnecting Zoom</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Calendar Not Syncing</h3>
                <p className="text-gray-700 mb-2"><strong>Solution:</strong></p>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Reconnect your calendar integration</li>
                  <li>Check calendar permissions</li>
                  <li>Verify your calendar app is up to date</li>
                  <li>Clear browser cache and cookies</li>
                </ul>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Booking Page Not Loading</h3>
                <p className="text-gray-700 mb-2"><strong>Solution:</strong></p>
                <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                  <li>Try a different browser</li>
                  <li>Disable browser extensions temporarily</li>
                  <li>Check your internet connection</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Removing the App */}
          <section id="removing-app" className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">7. Removing ScheduleMuse AI</h2>

            <div className="space-y-6">
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">From Zoom Marketplace</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Open Zoom and go to your profile → "Zoom Apps"</li>
                  <li>Find ScheduleMuse AI in your installed apps</li>
                  <li>Click "Remove" or "Uninstall"</li>
                  <li>Confirm the removal</li>
                </ol>
              </div>

              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">From ScheduleMuse AI Dashboard</h3>
                <ol className="list-decimal list-inside text-gray-700 space-y-2">
                  <li>Go to Settings → Integrations</li>
                  <li>Find the Zoom integration</li>
                  <li>Click "Disconnect" or "Remove"</li>
                  <li>Your Zoom account will be disconnected</li>
                </ol>
              </div>

              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-medium text-red-900 mb-2">Data Removal</h4>
                <p className="text-sm text-red-800">
                  Removing the app will disconnect your Zoom integration, but your ScheduleMuse AI account and data will remain intact unless you delete your account separately.
                </p>
              </div>
            </div>
          </section>

          {/* Support */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Need Additional Help?</h2>
            <p className="text-gray-600 mb-4">
              If you can't find the answer you're looking for, our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/support"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Visit Support Center
              </Link>
              <a
                href="mailto:schedulemuseai@gmail.com?subject=ScheduleMuse AI Documentation Question"
                className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
              >
                Email Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}