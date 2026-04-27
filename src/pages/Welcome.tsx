import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgePercent,
  CheckCircle,
  HandCoins,
  Heart,
  KeyRound,
  PiggyBank,
  Shield,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

const features = [
  {
    icon: PiggyBank,
    title: 'Savings Plans',
    desc: 'Flexible, locked, and goal-based savings.',
  },
  {
    icon: Users,
    title: 'Circles (Ajo)',
    desc: 'Rotational, random, and bidding circles.',
  },
  {
    icon: Target,
    title: 'Group Goals',
    desc: 'Shared goals for families, teams, and groups.',
  },
  {
    icon: Heart,
    title: 'Campaigns',
    desc: 'Fundraising campaigns with sharing and donor support.',
  },
  {
    icon: Wallet,
    title: 'Wallet & Transfers',
    desc: 'Fund and transfer from one wallet.',
  },
  {
    icon: KeyRound,
    title: 'Agent Access',
    desc: 'One-time codes for assisted transactions.',
  },
];

const userBenefits = [
  'Save, transfer, and pay bills in one place.',
  'Join circles, group goals, and campaigns easily.',
  'See fees before you confirm a transaction.',
];

const agentBenefits = [
  'Handle assisted transactions with access codes.',
  'Track commissions, ledger entries, and settlements.',
  'Register customers and grow your local network.',
];

const pricingCards = [
  {
    icon: BadgePercent,
    title: 'Transfers',
    summary: 'N20 / N40 / N85',
    lines: ['Up to N4,999', 'N5,000 to N9,999', 'N10,000 and above', 'N50 stamp duty from N10,000'],
  },
  {
    icon: HandCoins,
    title: 'Agent Services',
    summary: '0.5% to 1.0%',
    lines: ['Cash-in: 0.5%', 'Cash-out: 0.5%', 'Assisted transfer: 1.0%', 'Enquiry N20 / Statement N50'],
  },
  {
    icon: TrendingUp,
    title: 'Campaigns & Funding',
    summary: '7% / 0.5%',
    lines: ['Default donor tip: 7%', 'Withdrawal fee: 0.5%', 'Withdrawal cap: N2,000', 'Wallet funding: absorb'],
  },
];

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden px-6 pt-12 pb-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.16),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(2,132,199,0.12),transparent_35%)]" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mx-auto flex max-w-xl flex-col items-center text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-accent">Live features</span>
            Savings, circles, campaigns, wallet, transfers, and agents
          </div>

          <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
            <Shield className="h-10 w-10 text-primary-foreground" />
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground">
            AjoVault
          </h1>
          <p className="mt-2 text-lg font-medium text-accent">
            Save Together. Safe Together.
          </p>
          <p className="mt-4 max-w-lg leading-relaxed text-muted-foreground">
            AjoVault brings personal savings, circles (Ajo), shared goals, fundraising campaigns,
            wallet transfers and agent-assisted transactions into one platform with
            transparent in-app pricing.
          </p>

          <div className="mt-8 w-full max-w-sm space-y-3">
            <Button className="h-12 w-full text-base font-semibold" onClick={() => navigate('/signup')}>
              Create Account <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
            <Button variant="outline" className="h-12 w-full text-base" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="px-6 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-3 text-center font-display text-2xl font-bold text-foreground"
        >
          What you can do
        </motion.h2>
        <p className="mx-auto mb-8 max-w-lg text-center text-sm leading-relaxed text-muted-foreground">
        </p>
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
                <feature.icon className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mt-4 text-base font-bold text-foreground">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/30 px-6 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center font-display text-2xl font-bold text-foreground"
        >
          Pricing
        </motion.h2>
        <div className="mx-auto max-w-3xl space-y-4">
          {pricingCards.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-col items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display text-lg font-bold text-foreground">{card.title}</h3>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                  {card.summary}
                </span>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {card.lines.map(line => (
                  <div key={line} className="rounded-2xl bg-muted/60 px-3 py-2 text-xs font-medium text-foreground">
                    {line}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 py-12">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center font-display text-2xl font-bold text-foreground"
        >
          Short benefits
        </motion.h2>
        <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
          {[
            { title: 'For users', items: userBenefits },
            { title: 'For agents', items: agentBenefits },
          ].map((group, index) => (
            <motion.div
              key={group.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-3xl border border-border bg-card p-5 shadow-sm"
            >
              <h3 className="font-display text-lg font-bold text-foreground">{group.title}</h3>
              <div className="mt-4 space-y-3">
                {group.items.map(item => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-sm font-medium text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-md rounded-3xl border border-border bg-primary/5 p-6 text-center"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-display text-lg font-bold text-foreground">Are you an Agent?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Join the AjoVault agent network, help customers perform assisted transactions, and earn
            your current 50% share of supported service fees.
          </p>
          <div className="mt-5 space-y-3">
            <Button variant="secondary" className="h-11 w-full" onClick={() => navigate('/agent/apply')}>
              Become an Agent
            </Button>
            <Button variant="outline" className="h-11 w-full" onClick={() => navigate('/agent/login')}>
              Agent Login
            </Button>
          </div>
        </motion.div>
      </section>

      <section className="px-6 py-12 text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          Ready to start saving, sending, contributing, or launching a campaign?
        </p>
        <Button className="h-12 px-8 text-base font-semibold" onClick={() => navigate('/signup')}>
          Get Started <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </section>

      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted-foreground">© 2026 AjoVault. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Welcome;
