import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Check, Star, Zap, Info } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";

const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const { user } = useAuth();
  const { subscribe, isPro, manageSubscription } = useSubscription();

  const plans = [
    {
      name: "Starter",
      price: "Free",
      description: "Perfect for new theater groups just getting started",
      features: [
        "Group profile with social links",
        "Show listings with ticket links",
        "Team member showcase",
        "Included in Theater Directory",
        "City-based discovery",
        "Audience favorites & watchlist"
      ],
      cta: user ? "Go to Dashboard" : "Get Started",
      popular: false,
      comingSoon: false,
      link: user ? "/dashboard" : "/login",
      isExternal: false
    },
    {
      name: "Pro Producer",
      price: "₱399",
      period: "/month",
      description: "For established groups ready to grow their audience",
      features: [
        "Everything in Free, plus:",
        "Real-time analytics dashboard",
        "Email & SMS notifications",
        "Priority search placement",
        "Featured productions badge",
        "Rich media gallery",
        "Audience engagement insights"
      ],
      cta: isPro ? "Manage Subscription" : "Upgrade to Pro",
      popular: true,
      comingSoon: false,
      // If no link is provided, we use the action
      action: isPro ? manageSubscription : () => subscribe("price_pro_monthly"),
      isExternal: false
    }
  ];

  return (
    <section id="pricing" ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Simple, Transparent{" "}
            <span className="text-secondary">Pricing</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Choose the plan that works best for your theater group. Start free, upgrade when you're ready.
          </p>
        </motion.div>

        {/* Pricing Cards - Centered */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto justify-items-center">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/20 to-card border-2 border-secondary shadow-2xl shadow-primary/20"
                  : "bg-card border border-secondary/20"
              }`}
            >
              {/* Popular/Coming Soon Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className={`flex items-center gap-1 px-4 py-1 rounded-full text-sm font-semibold ${
                    plan.comingSoon 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-secondary text-secondary-foreground"
                  }`}>
                    <Star className="w-4 h-4" />
                    {plan.comingSoon ? "Coming Soon" : "Recommended"}
                    {plan.comingSoon && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3.5 h-3.5 ml-1 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[200px] text-center">
                          <p>Phase 2 features launching after domain purchase and full platform rollout.</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              )}

              {/* Plan Header */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={`w-5 h-5 ${plan.popular ? "text-secondary" : "text-primary"}`} />
                  <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-serif font-bold text-foreground">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground">
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                      plan.popular ? "bg-secondary" : "bg-primary"
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-secondary-foreground" : "text-primary-foreground"}`} />
                    </div>
                    <span className="text-muted-foreground">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {plan.comingSoon ? (
                <Button
                  disabled
                  className="w-full py-6 text-lg bg-muted text-muted-foreground cursor-not-allowed"
                >
                  {plan.cta}
                </Button>
              ) : plan.action ? (
                <Button
                  onClick={plan.action}
                  className={`w-full py-6 text-lg ${
                    plan.popular
                      ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {plan.cta}
                </Button>
              ) : plan.isExternal ? (
                <a href={plan.link}>
                  <Button
                    className={`w-full py-6 text-lg ${
                      plan.popular
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </a>
              ) : (
                <Link to={plan.link || "/login"}>
                  <Button
                    className={`w-full py-6 text-lg ${
                      plan.popular
                        ? "bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              )}
            </motion.div>
          ))}
        </div>

        {/* Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-muted-foreground mt-8"
        >
          All plans include our core features. No hidden fees. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
