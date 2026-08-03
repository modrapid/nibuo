"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "How long are my files stored?",
    a: "You choose the expiry when uploading — 1, 3, 7, or 14 days. After that, files are automatically and permanently deleted.",
  },
  {
    q: "Is there a file size limit?",
    a: "Free accounts can upload files up to 1GB. Pro and Business plans support larger files.",
  },
  {
    q: "Can I password-protect a file?",
    a: "Yes. When uploading, you can set an optional password that recipients must enter before downloading.",
  },
  {
    q: "Which payment methods are supported?",
    a: "We support bKash, Nagad, and Rocket via SSLCommerz, as well as international cards via Stripe.",
  },
  {
    q: "Do you keep a copy of my files after they expire?",
    a: "No. Once a file expires, it's permanently removed from our storage and database — there is no recovery after that.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 px-4 max-w-2xl mx-auto" id="faq">
      <h2 className="text-3xl font-extrabold text-center text-slate-900 dark:text-white mb-10">
        Frequently Asked Questions
      </h2>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, i) => (
          <div key={faq.q} className="glass-card rounded-xl2 shadow-soft overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left"
            >
              <span className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                {faq.q}
              </span>
              <ChevronDown
                size={18}
                className={`text-slate-400 shrink-0 transition-transform ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === i && (
              <p className="px-5 pb-4 text-sm text-slate-500 dark:text-slate-400">{faq.a}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
