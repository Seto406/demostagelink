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
import { SUBSCRIPTION_PRICE_DISPLAY, SUBSCRIPTION_PERIOD } from "@/config/pricing";

const plans = [
  {
    name: "BASIC TIER",
    price: "Free",
    goal: "Organic Visibility",
    description: "Best for: trying the platform and maintaining a simple presence",
    categories: [
      {
        title: "Exposure",
        features: [
          "Posts mainly reach followers only",
          "Regular chronological feed placement",
          "Appears occasionally in suggestions"
        ]
      },
      {
        title: "Discovery",
        features: [
          "Can search and browse shows and groups",
          "Standard listing order",
          "Limited join requests"
        ]
      },
      {
        title: "Engagement",
        features: [
          "Comment and review shows",
          "Limited notifications",
          "No seat tracking or ticket integration"
        ]
      },
      {
        title: "Management & Insights",
        features: [
          "View submission status only",
          "Limited member visibility",
          "Up to 2 show listings per month"
        ]
      }
    ],
    cta: "Get Started",
    popular: false,
    comingSoon: false,
    link: "/login",
    isExternal: false
  },
  {
    name: "PREMIUM TIER",
    price: SUBSCRIPTION_PRICE_DISPLAY,
    period: SUBSCRIPTION_PERIOD,
    goal: "Expanded Visibility",
    description: "Best for: producers and groups who want measurable reach and audience growth",
    categories: [
      {
        title: "Exposure",
        features: [
          "Posts reach followers + interested audiences",
          "Higher ranking in feeds and search",
          "Featured placements and highlighted posts"
        ]
      },
      {
        title: "Discovery",
        features: [
          "Priority search and category placement",
          "Unlimited join requests",
          "Appears in featured recommendations"
        ]
      },
      {
        title: "Engagement",
        features: [
          "Boosted reactions and interactions",
          "Unlimited notifications",
          "Seat commitment (attendance tracking)",
          "External ticket integration"
        ]
      },
      {
        title: "Management & Insights",
        features: [
          "Profile views, ticket clicks, CTR analytics",
          "Unlimited member profiles",
          "Unlimited show listings",
          "Collaboration notifications highlighted"
        ]
      }
    ],
    cta: "Subscribe Now",
    popular: true,
    comingSoon: false,
    link: "mailto:connect.stagelink@gmail.com?subject=Subscribe to Pro Producer",
    isExternal: true
  }
];

const PricingSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

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
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto justify-items-center items-start">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              className={`relative rounded-3xl p-8 w-full ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/20 to-card border-2 border-secondary shadow-2xl shadow-primary/20"
                  : "bg-card border border-secondary/20"
              }`}
            >
              {/* Popular/Coming Soon Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className={`flex items-center gap-1 px-4 py-1 rounded-full text-sm font-semibold whitespace-nowrap ${
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
              <div className="mb-8 text-center border-b border-border pb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1 mb-4">
                  <span className="text-4xl font-serif font-bold text-white">{plan.price}</span>
                  {plan.period && (
                    <span className="text-muted-foreground">
                      {plan.period}
                    </span>
                  )}
                </div>
                 <div className="mb-4 inline-block px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm font-medium">
                  Goal: {plan.goal}
                </div>
                <p className="text-sm text-muted-foreground italic">
                  {plan.description}
                </p>
              </div>

              {/* Features Categories */}
              <div className="space-y-6 mb-8">
                {plan.categories.map((category) => (
                  <div key={category.title}>
                    <h4 className="font-semibold text-foreground mb-3 text-sm uppercase tracking-wide opacity-80 border-l-2 border-secondary pl-2">
                      {category.title}
                    </h4>
                    <ul className="space-y-3">
                      {category.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3 text-sm">
                          <div className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded-full flex items-center justify-center ${
                            plan.popular ? "bg-secondary/20" : "bg-primary/20"
                          }`}>
                            <Check className={`w-3 h-3 ${plan.popular ? "text-secondary" : "text-primary"}`} />
                          </div>
                          <span className="text-muted-foreground leading-tight">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              {plan.comingSoon ? (
                <Button
                  disabled
                  className="w-full py-6 text-lg bg-muted text-muted-foreground cursor-not-allowed"
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
          className="text-center text-muted-foreground mt-12 text-sm"
        >
          All plans include our core features. No hidden fees. Cancel anytime.
        </motion.p>
      </div>
    </section>
  );
};

export default PricingSection;
