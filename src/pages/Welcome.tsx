import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Users, PiggyBank, Wallet, TrendingUp, ArrowRight, CheckCircle } from 'lucide-react';

const features = [
  { icon: PiggyBank, title: 'Smart Savings', desc: 'Automated savings plans with competitive returns' },
  { icon: Users, title: 'Ajo Circles', desc: 'Join trusted contribution groups with friends & family' },
  { icon: Wallet, title: 'Digital Wallet', desc: 'Send, receive & pay bills instantly' },
  { icon: TrendingUp, title: 'Credit Passport', desc: 'Build your credit score as you save' },
];

const benefits = [
  'No hidden fees or charges',
  'Bank-grade security & encryption',
  'Instant transfers & settlements',
  'Earn rewards on every transaction',
];

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden px-6 pt-12 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative flex flex-col items-center text-center"
        >
          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            AjoVault
          </h1>
          <p className="mt-2 text-lg font-medium text-accent">
            Save Together. Safe Together.
          </p>
          <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
            The modern platform for community savings, digital wallets, and financial growth. Join thousands building wealth together.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 w-full max-w-sm space-y-3">
            <Button className="w-full h-12 text-base font-semibold" onClick={() => navigate('/signup')}>
              Create Free Account <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full h-12 text-base" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="px-6 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-2xl font-bold text-foreground mb-8"
        >
          Everything you need
        </motion.h2>
        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-5 text-center shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <f.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-sm font-bold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-12 bg-secondary/30">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display text-2xl font-bold text-foreground mb-8"
        >
          Why AjoVault?
        </motion.h2>
        <div className="max-w-sm mx-auto space-y-4">
          {benefits.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-sm border border-border"
            >
              <CheckCircle className="h-5 w-5 shrink-0 text-success" />
              <span className="text-sm font-medium text-foreground">{b}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Agent Section */}
      <section className="px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-2xl border border-border bg-primary/5 p-6 text-center max-w-sm mx-auto"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">Are you an Agent?</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Earn commissions by helping communities save. Register or log in to your agent portal.
          </p>
          <div className="mt-5 space-y-3">
            <Button variant="secondary" className="w-full h-11" onClick={() => navigate('/agent/apply')}>
              Become an Agent
            </Button>
            <Button variant="outline" className="w-full h-11" onClick={() => navigate('/agent/login')}>
              Agent Login
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Ready to start your financial journey?
        </p>
        <Button className="h-12 px-8 text-base font-semibold" onClick={() => navigate('/signup')}>
          Get Started Free <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 AjoVault. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Welcome;
