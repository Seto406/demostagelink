import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "What is StageLink?",
    answer: "StageLink is a digital platform that connects audiences with local and university theater productions in Metro Manila. We help theater groups gain visibility and make it easier for audiences to discover live performances."
  },
  {
    question: "Is StageLink free to use?",
    answer: "Yes! Our Starter plan is completely free for theater groups. You can create a group profile, list your shows, and be included in our Theater Directory at no cost. We'll introduce premium features in the future for groups who want additional tools."
  },
  {
    question: "How do I register my theater group?",
    answer: "Simply sign up for an account and request to become a Producer. You'll need to provide your group name and a link to your portfolio or social media. Once approved by our team, you can start adding your productions."
  },
  {
    question: "How does the approval process work?",
    answer: "All show submissions go through a quick review by our admin team to ensure quality listings. This helps maintain a curated directory that audiences can trust. Most submissions are reviewed within 24-48 hours."
  },
  {
    question: "Can audiences create accounts?",
    answer: "Absolutely! Audiences can sign up to save their favorite shows, build a personal watchlist, and stay updated on upcoming productions from their favorite theater groups."
  },
  {
    question: "What areas does StageLink cover?",
    answer: "We currently focus on Metro Manila, including cities like Manila, Quezon City, Makati, Pasay, Mandaluyong, and Taguig. We plan to expand to other regions in future phases."
  },
  {
    question: "How can I contact StageLink?",
    answer: "You can reach us at connect.stagelink@gmail.com or follow us on Facebook, Instagram, TikTok, and X (Twitter) for updates and announcements."
  }
];

const FAQSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="faq" ref={ref} className="py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-6">
            Frequently Asked{" "}
            <span className="text-secondary">Questions</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about StageLink.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-secondary/20 rounded-xl px-6 data-[state=open]:border-secondary/40"
              >
                <AccordionTrigger className="text-left text-foreground hover:text-secondary hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Additional Help */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-muted-foreground mt-10"
        >
          Still have questions?{" "}
          <a 
            href="mailto:connect.stagelink@gmail.com" 
            className="text-secondary hover:underline"
          >
            Contact us
          </a>
        </motion.p>
      </div>
    </section>
  );
};

export default FAQSection;
