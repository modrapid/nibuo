import { Lock, Clock, QrCode, BarChart3, Zap, ShieldCheck } from "lucide-react";

const features = [
  { icon: Zap, title: "Instant Uploads", desc: "Drag & drop with real-time progress, multiple files at once." },
  { icon: Lock, title: "Password Protection", desc: "Add an optional password so only intended recipients can access a file." },
  { icon: Clock, title: "Auto-Expiry", desc: "Choose 1, 3, 7, or 14 days — files are deleted automatically, no cleanup needed." },
  { icon: QrCode, title: "QR Code Sharing", desc: "Every file gets a scannable QR code for instant mobile sharing." },
  { icon: BarChart3, title: "View & Download Stats", desc: "Track exactly how many times your file was viewed and downloaded." },
  { icon: ShieldCheck, title: "Private by Default", desc: "Files are stored securely and are never publicly listed or indexed." },
];

export function FeatureSection() {
  return (
    <section className="py-20 px-4 max-w-5xl mx-auto" id="features">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
          Everything you need, nothing you don&apos;t
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Built to be faster and simpler than the alternatives.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="glass-card rounded-xl2 shadow-soft p-6">
            <div className="bg-brand/10 text-brand rounded-xl p-3 inline-flex mb-4">
              <Icon size={20} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
