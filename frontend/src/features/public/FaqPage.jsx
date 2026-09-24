import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  HelpCircle,
  Calculator,
  Package,
  Truck,
  RotateCcw,
  Users,
  ChevronDown,
  MapPin,
  Search,
  ShieldCheck,
  Clock,
} from 'lucide-react';

const FAQ_DATA = [
  {
    id: 'pricing',
    title: 'How is my price calculated?',
    subtitle: 'Plain and simple — no hidden charges',
    icon: <Calculator className="w-5 h-5" />,
    color: 'text-primary',
    bg: 'bg-primary/10',
    faqs: [
      {
        q: 'How do you decide my delivery price?',
        a: 'We look at two things: how heavy your box is on a scale, and how much space it takes. Space weight = (Length × Breadth × Height) / 5000. Your billable weight is whichever is bigger — real weight or space weight. Then: Price = Base Rate (covers first 0.5 kg for normal parcels, 1 kg for business parcels) + extra per-kg charge for weight above that + COD charge only if you choose Cash on Delivery. Going inside the same zone is cheaper, across zones costs a bit more.',
      },
      {
        q: 'Give me a real example?',
        a: 'You send 1.5 kg, box 20×15×10 cm, inside Gurugram. Space weight = 0.6 kg. Billable = 1.5 kg (bigger wins). If base is 0.5 kg / Rs 40 and per-kg is Rs 15, extra = 1.0 kg → Rs 15. Total Rs 55 for prepaid. If COD with Rs 1000 declared value and COD is Rs 30 + 1.5%, add Rs 45 → total Rs 100.',
      },
      {
        q: 'Can I check price before booking?',
        a: 'Yes! Go to /quote. Enter pickup pincode, drop pincode, weight, box size, COD or prepaid — you get the full breakdown instantly. No login needed. This price is calculated live from our 4 rate cards and saved with your order so it never changes later even if prices update.',
      },
    ],
  },
  {
    id: 'booking',
    title: 'How do I book? What about payment?',
    subtitle: '3 steps and you get your tracking number',
    icon: <Package className="w-5 h-5" />,
    color: 'text-accent',
    bg: 'bg-accent/10',
    faqs: [
      {
        q: 'How do I book a parcel?',
        a: 'Step 1 — Where: pickup pincode + address + sender name/phone, drop pincode + address + receiver name/email/phone. For business (B2B) add company name and GSTIN both sides. Step 2 — What: real weight, box size, B2C or B2B, COD or prepaid, declared value if COD. Step 3 — When: pick your delivery date, check live price, submit. You get a tracking number like LM-2026-000001.',
      },
      {
        q: 'COD vs Prepaid — what is the difference?',
        a: 'COD means the receiver pays cash at the door. No online payment needed. Prepaid means you pay online right after booking via Razorpay (test mode). Prepaid orders start as PENDING and only get a delivery person after payment shows PAID. Unpaid prepaid orders are never assigned to a courier — they wait.',
      },
      {
        q: 'Where do you deliver?',
        a: 'Only inside Delhi-NCR — 726 pincodes across 6 zones: Delhi Central, Gurugram-Faridabad, Noida-Ghaziabad, Outer NCR Haryana, Outer NCR Rajasthan, Outer NCR UP. If a pincode is not in our list, you will see “not serviceable” when you try to quote.',
      },
    ],
  },
  {
    id: 'tracking',
    title: 'Tracking & OTP delivery — how does it work?',
    subtitle: 'Know exactly where your parcel is',
    icon: <Truck className="w-5 h-5" />,
    color: 'text-success',
    bg: 'bg-success-soft',
    faqs: [
      {
        q: 'What are the tracking steps I will see?',
        a: 'Like levels in a game: CREATED (you booked it) → ASSIGNED (we gave it to a delivery person) → PICKED_UP (he picked it) → IN_TRANSIT (it is moving) → OUT_FOR_DELIVERY (coming to your door today) → DELIVERED or FAILED or RETURN_TO_ORIGIN. See this on /app/orders/:id with a stepper and full history. Each step also sends you an email.',
      },
      {
        q: 'What is the 6-digit OTP? Where do I get it?',
        a: 'When parcel goes “Out for Delivery”, we create a secret 6-digit code and email it to the receiver (the person you entered at booking). The delivery person must type that exact code on his phone to mark DELIVERED. No code = no delivery. It is like UPI OTP. If you lost the email, check spam/junk or open your order detail page — the notice is there.',
      },
      {
        q: 'Can the code be reused or guessed?',
        a: 'No. The code is random, hashed safely, expires in 24 hours, and is deleted after first successful use. So the same code can never deliver twice. Wrong or expired code shows an error.',
      },
    ],
  },
  {
    id: 'failed',
    title: 'What if delivery fails? Can I reschedule?',
    subtitle: 'We give you a second chance — but not forever',
    icon: <RotateCcw className="w-5 h-5" />,
    color: 'text-warning',
    bg: 'bg-warning-soft',
    faqs: [
      {
        q: 'Why did my order show FAILED?',
        a: 'The delivery person must pick a reason: Customer Unavailable, Incorrect Address, Customer Refused, or Package Damaged. You will get an email explaining it and the history will show the reason + note.',
      },
      {
        q: 'Can I reschedule a failed order?',
        a: 'Only if the reason was “Customer Unavailable”. Then you see a Reschedule button. Pick any future date and submit — your order goes back to CREATED, we clear the old courier, and you re-enter the queue. But we remember you already failed once. Other reasons (wrong address, refused, damaged) go directly to RETURN_TO_ORIGIN — parcel returns to sender, no reschedule.',
      },
      {
        q: 'How many times can I reschedule? What is RTO?',
        a: 'Maximum 2 failed attempts total. First Customer Unavailable → you can reschedule once. If you miss again, the next failure automatically becomes RTO (Return To Origin) — meaning we send it back and close it. No more chances after that. This is to stop drivers roaming forever.',
      },
    ],
  },
  {
    id: 'courier',
    title: 'Couriers, admins & why my order is still CREATED',
    subtitle: 'Who does what behind the scenes',
    icon: <Users className="w-5 h-5" />,
    color: 'text-ink',
    bg: 'bg-container-low',
    faqs: [
      {
        q: 'How do you pick which courier gets my parcel?',
        a: 'We do not pick randomly. We look only in your pickup zone, only at couriers marked Available with free space (current parcels < max capacity), and we give it to the least-loaded one — the person with fewest active deliveries. It is done atomically so two orders never grab the same last slot.',
      },
      {
        q: 'Why is my order stuck at CREATED?',
        a: 'That means no courier was free in your pickup zone yet. Our auto sweep tries every 5 minutes. If it fails 3 times, we mark “needs manual attention” so an admin can assign it by hand on /admin/dispatch. Also, prepaid orders stuck at PENDING mean payment is not done yet — we never assign until PAID.',
      },
      {
        q: 'Who can do what in the system?',
        a: 'Customer: creates orders for themselves, sees only their own, can reschedule only FAILED. Courier: sees only assigned orders, moves them step-by-step, needs OTP to deliver. Admin: sees everything, creates couriers, toggles availability, dispatches orders, and can change price cards (base, per-kg, COD) without redeploying. Couriers are tied to one zone with a max capacity set by admin.',
      },
    ],
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="hairline rounded-lg bg-container-lowest overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-4 sm:px-5 py-4 text-left cursor-pointer hover:bg-container-low/50 transition-colors"
      >
        <span className="text-sm font-semibold text-ink leading-snug">{q}</span>
        <ChevronDown
          className={`w-4 h-4 text-ink-variant shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 pt-0">
          <p className="text-sm text-ink-variant leading-relaxed bg-surface rounded-lg px-3.5 py-3 hairline">
            {a}
          </p>
        </div>
      )}
    </div>
  );
}

export function FaqPage() {
  return (
    <div className="flex flex-col bg-surface">
      {/* Hero */}
      <section className="border-b border-hairline bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <div className="flex items-start gap-4 max-w-3xl">
            <div className="hidden sm:flex w-12 h-12 rounded-xl bg-primary text-on-primary items-center justify-center shrink-0">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight leading-tight">
                How DispatchPro works
              </h1>
              <p className="text-sm sm:text-base text-ink-variant leading-relaxed mt-3 max-w-2xl">
                Simple answers, real rules. No jargon. Everything below is true to how the system actually
                works — pricing, tracking, OTP, rescheduling. Search-friendly for our AI helper too.
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-container-lowest hairline px-2.5 py-1 rounded-full text-ink-variant">
                  <MapPin className="w-3.5 h-3.5" /> 6 zones · 726 pincodes
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-container-lowest hairline px-2.5 py-1 rounded-full text-ink-variant">
                  <ShieldCheck className="w-3.5 h-3.5" /> OTP verified
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-container-lowest hairline px-2.5 py-1 rounded-full text-ink-variant">
                  <Clock className="w-3.5 h-3.5" /> Sweep every 5 min
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick jump */}
      <div className="bg-container-lowest border-b border-hairline sticky top-[60px] z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-3">
            <span className="text-xs font-bold text-ink-variant shrink-0 hidden sm:inline">Jump to:</span>
            {FAQ_DATA.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full hairline bg-surface hover:bg-container-low text-ink-variant hover:text-ink transition-colors shrink-0"
              >
                {s.icon}
                {s.title.split('—')[0].split('?')[0].trim().slice(0, 22)}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ sections */}
      <section className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10 sm:gap-14">
          {FAQ_DATA.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-28">
              <div className="flex items-start gap-3 mb-5">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${section.bg} ${section.color}`}
                >
                  {section.icon}
                </div>
                <div>
                  <h2 className="font-display text-xl sm:text-2xl font-bold text-ink leading-tight">
                    {section.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-variant mt-1">{section.subtitle}</p>
                </div>
              </div>

              <div className="grid gap-3">
                {section.faqs.map((f) => (
                  <FaqItem key={f.q} q={f.q} a={f.a} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-container-lowest hairline rounded-xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="font-display text-lg font-bold text-ink">Still confused?</h3>
              <p className="text-sm text-ink-variant mt-1 max-w-xl">
                Try the instant quote calculator or track your order with its ID. No need to email — everything is
                on your dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <Link
                to="/quote"
                className="inline-flex items-center gap-2 bg-primary text-on-primary text-sm font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
              >
                <Calculator className="w-4 h-4" /> Check Price
              </Link>
              <Link
                to="/app"
                className="inline-flex items-center gap-2 bg-surface hairline text-ink text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-container-low transition-colors"
              >
                <Search className="w-4 h-4" /> Track Order
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
