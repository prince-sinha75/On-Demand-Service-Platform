import { motion } from 'framer-motion';
import { ShieldCheck, DollarSign, FileText, LifeBuoy } from 'lucide-react';

const easeOut = [0.22, 1, 0.36, 1] as const;

const trustItems = [
  {
    icon: ShieldCheck,
    title: 'Provider verification',
    description:
      'Providers are intended to go through identity checks and qualification review before listing.',
  },
  {
    icon: DollarSign,
    title: 'Transparent pricing',
    description:
      'Hourly rates shown upfront before you confirm. No surprise charges after the work is done.',
  },
  {
    icon: FileText,
    title: 'Clear service details',
    description:
      'You see what is included, the expected duration, and service expectations before booking.',
  },
  {
    icon: LifeBuoy,
    title: 'Support and reporting',
    description:
      'A support channel and reporting option are planned for every booking, so help is always reachable.',
  },
];

export default function TrustSection() {
  return (
    <section id="trust" className="relative py-20 md:py-28 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: easeOut }}
          className="mb-12 md:mb-16 max-w-2xl"
        >
          <span className="text-xs uppercase tracking-[0.2em] text-lime">
            Built on trust
          </span>
          <h2 className="font-display text-4xl md:text-5xl text-ivory mt-4 text-balance">
            Safety and clarity,{' '}
            <span className="text-ivory-muted italic font-editorial font-light">
              by design
            </span>
          </h2>
        </motion.div>

        {/* Trust items — horizontal refined layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-charcoal-border rounded-2xl overflow-hidden border border-charcoal-border">
          {trustItems.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, ease: easeOut, delay: i * 0.1 }}
              className="group relative bg-charcoal p-6 md:p-8 hover:bg-charcoal-light transition-colors duration-500"
            >
              {/* Icon */}
              <div className="relative w-12 h-12 mb-5">
                <div className="absolute inset-0 rounded-xl glass-light border border-charcoal-border group-hover:border-lime/30 transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon className="w-5 h-5 text-lime" />
                  </motion.div>
                </div>
              </div>

              <h3 className="text-base font-medium text-ivory mb-2">{item.title}</h3>
              <p className="text-sm text-ivory-dim leading-relaxed">
                {item.description}
              </p>

              {/* Bottom indicator line */}
              <div className="absolute bottom-0 left-0 h-px w-0 bg-lime group-hover:w-full transition-all duration-700 ease-smooth" />
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-6 text-xs text-ivory-muted leading-relaxed max-w-2xl"
        >
          These are product principles we are building toward. Verification, support
          infrastructure, and pricing systems are under development and not yet fully
          operational.
        </motion.p>
      </div>
    </section>
  );
}
