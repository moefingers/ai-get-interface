export const metadata = {
  title: 'Privacy Policy | AI Get Interface',
}

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: January 8, 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-3">Overview</h2>
          <p className="text-gray-700">
            AI Get Interface (&quot;we&quot;, &quot;our&quot;, &quot;the app&quot;) is a list management 
            service that allows users to add items to their lists via AI assistants. This policy 
            explains how we collect, use, and protect your information.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Email address:</strong> Used to identify your account and associate lists with you.</li>
            <li><strong>Display name:</strong> Optional, shown in the app interface.</li>
            <li><strong>List data:</strong> The lists you create and items added to them.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>To authenticate you and provide access to your lists</li>
            <li>To process requests from AI assistants to add items to your lists</li>
            <li>To display your lists and items in the web interface</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Google User Data</h2>
          <p className="text-gray-700">
            When you use our Google Apps Script relay, we access your Google email address solely 
            to identify which user account the request belongs to. We do not access any other 
            Google data, and we do not store your Google credentials.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Data Storage & Security</h2>
          <p className="text-gray-700">
            Your data is stored securely in a PostgreSQL database hosted on Neon. We use 
            industry-standard encryption for data in transit (HTTPS/TLS). We do not sell 
            or share your data with third parties.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
          <p className="text-gray-700">
            Your data is retained as long as your account is active. You may request deletion 
            of your account and all associated data by contacting us.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-3">Contact</h2>
          <p className="text-gray-700">
            For privacy-related questions, contact: mbzuiter@gmail.com
          </p>
        </div>
      </section>
    </main>
  )
}
