export default function PrivacyPage() {
  return (
    <main className="min-h-screen py-16 px-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
        Privacy Policy
      </h1>
      <div className="prose prose-slate dark:prose-invert text-sm text-slate-600 dark:text-slate-300 flex flex-col gap-4">
        <p>Last updated: {new Date().toLocaleDateString()}</p>
        <p>
          Nibuo respects your privacy. This policy explains what data we
          collect and how we use it.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Data We Collect</h2>
        <p>
          We collect your email address (for account creation), uploaded
          files and their metadata, and basic usage analytics such as
          views and download counts.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">How We Use Data</h2>
        <p>
          We use your data to operate the service, process payments, send
          account-related emails, and improve the platform. We do not sell
          your personal data to third parties.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Data Storage</h2>
        <p>
          Files are stored securely via Backblaze B2. Account data is
          stored via Supabase. Files are automatically deleted upon
          expiry.
        </p>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">Your Rights</h2>
        <p>
          You may request deletion of your account and associated data at
          any time by contacting support@nibuo.com.
        </p>
      </div>
    </main>
  );
}
