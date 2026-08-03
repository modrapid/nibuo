export default function TermsPage() {
  return (
    <main className="min-h-screen py-16 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
        Terms of Service
      </h1>
      <div className="prose prose-slate dark:prose-invert text-sm text-slate-600 dark:text-slate-300 flex flex-col gap-4">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          By using Nibuo, you agree to these terms. Nibuo provides file
          sharing and hosting services. You are responsible for the content
          you upload and must not use the service for illegal, harmful, or
          abusive purposes.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Acceptable Use</h2>
        <p>
          You may not upload content that infringes copyright, contains
          malware, or violates applicable law. We reserve the right to
          remove content and suspend accounts that violate these terms.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">File Storage & Expiry</h2>
        <p>
          Files are stored according to the expiry option you select at
          upload time. Once expired, files are permanently deleted and
          cannot be recovered.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Limitation of Liability</h2>
        <p>
          Nibuo is provided "as is" without warranties of any kind. We are
          not liable for any loss of data or damages arising from use of
          the service.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Contact</h2>
        <p>For questions about these terms, contact support@nibuo.com.</p>
      </div>
    </main>
  );
}
