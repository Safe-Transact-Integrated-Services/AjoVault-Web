import React, { useState } from 'react';
import { X, Phone } from 'lucide-react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    topic: 'General Inquiry',
    message: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle submission logic here
    console.log('Form submitted:', formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-[#08152b]/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-8 py-6 backdrop-blur-sm">
          <div>
            <p className="mb-1 text-xs font-black uppercase text-[#3B82F6]">Get in touch</p>
            <h2 className="font-display text-3xl font-black text-[#102A56]">Contact Us</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">Our team typically responds within 1-2 business days.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-slate-800 outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/20"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Phone <span className="font-medium normal-case text-slate-400">(optional)</span>
              </label>
              <input
                type="tel"
                placeholder="+234 800 000 0000"
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-slate-800 outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/20"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Email</label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-slate-800 outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/20"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Topic</label>
            <div className="relative">
              <select
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white p-4 pr-10 text-slate-800 outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/20"
                value={formData.topic}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              >
                <option>General Inquiry</option>
                <option>Support</option>
                <option>Partnership</option>
                <option>Feedback</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Message</label>
            <textarea
              required
              rows={4}
              placeholder="How can we help you?"
              className="w-full resize-none rounded-xl border border-slate-200 bg-white p-4 text-slate-800 outline-none transition-all focus:border-[#3B82F6] focus:ring-2 focus:ring-blue-500/20"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-xl bg-[#3B82F6] py-4 text-sm font-black text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-600 active:scale-[0.98]"
          >
            Send Message
          </button>
        </form>

        <div className="border-t border-slate-100 bg-white px-8 py-5">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Phone className="h-4 w-4 text-red-600 fill-current" />
              <span className="text-slate-500">Toll Free:</span>
              <a href="tel:+23416283888" className="font-bold text-slate-700 hover:text-[#3B82F6]">
                +234 1 628 3888
              </a>
            </div>
            <div className="text-sm font-medium text-slate-400">
              Lagos - Abuja
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;
