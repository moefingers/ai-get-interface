export const metadata = {
  title: 'Terms of Service | AI Get Interface',
}

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: January 8, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Acceptance of Terms</h2>
          <p className="text-gray-700">
            By using AI Get Interface (&quot;the app&quot;), you agree to these terms. If you 
            do not agree, do not use the app.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Service Description</h2>
          <p className="text-gray-700">
            AI Get Interface is a list management service that allows you to create lists 
            and add items to them via web interface or AI assistant integrations. The service 
            is provided &quot;as is&quot; without warranties of any kind.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">User Responsibilities</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>You are responsible for maintaining the security of your account</li>
            <li>You agree not to use the service for illegal purposes</li>
            <li>You agree not to abuse the API or attempt to overwhelm our servers</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Intellectual Property</h2>
          <p className="text-gray-700">
            You retain ownership of the content you add to your lists. We claim no 
            intellectual property rights over your list data.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Limitation of Liability</h2>
          <p className="text-gray-700">
            We are not liable for any damages arising from your use of the service, 
            including but not limited to data loss, service interruptions, or unauthorized 
            access to your account.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Termination</h2>
          <p className="text-gray-700">
            We reserve the right to terminate or suspend accounts that violate these terms 
            or abuse the service.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Changes to Terms</h2>
          <p className="text-gray-700">
            We may update these terms at any time. Continued use of the service after 
            changes constitutes acceptance of the new terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-gray-700">
            For questions about these terms, contact: mbzuiter@gmail.com
          </p>
        </div>
      </section>
    </main>
  )
}
