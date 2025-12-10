import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    price: "Free",
    description: "Perfect for new theater groups just getting started",
    features: [
      "Up to 3 show listings",
      "Basic group profile",
      "Ticket link integration",
      "Community support",
      "Standard visibility"
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro Producer",
    price: "₱499",
    period: "/month",
    description: "For established groups ready to grow their audience",
    features: [
      "Unlimited show listings",
      "Enhanced group profile",
      "Priority placement in search",
      "Real-time analytics dashboard",
      "Email notifications",
      "Priority support",
      "Featured productions badge"
    ],
    cta: "Start Free Trial",
    popular: true
  }
];

const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="pricing" ref={ref} className="py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-landing-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-landing-text mb-6">
            Simple, Transparent{" "}
            <span className="text-landing-primary">Pricing</span>
          </h2>
          <p className="text-lg text-landing-muted">
            Choose the plan that works best for your theater group. Start free, upgrade when you're ready.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? "bg-landing-text text-white border-2 border-landing-gold shadow-2xl"
                  : "bg-landing-surface border border-landing-border"
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-landing-gold text-landing-text px-4 py-1 rounded-full text-sm font-semibold">
                    <Star className="w-4 h-4" />
                    Recommended
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-5 h-5 ${plan.popular ? "text-landing-gold" : "text-landing-primary"}`} />
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-serif font-bold">{plan.price}</span>
                  {plan.period && (
                    <span className={plan.popular ? "text-white/60" : "text-landing-muted"}>
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className={plan.popular ? "text-white/80" : "text-landing-muted"}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-landing-gold" : "bg-landing-primary"
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-landing-text" : "text-white"}`} />
                    </div>
                    <span className={plan.popular ? "text-white/90" : "text-landing-muted"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link to="/login">
                <Button
                  className={`w-full rounded-full py-6 text-lg ${
                    plan.popular
                      ? "bg-landing-gold text-landing-text hover:bg-landing-gold/90"
                      : "bg-landing-primary text-white hover:bg-landing-primary/90"
                  }`}
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-landing-muted mt-8"
        >
          All plans include our core features. No hidden fees. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
