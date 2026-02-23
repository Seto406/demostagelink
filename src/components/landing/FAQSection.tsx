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
    question: "What does StageLink do?",
    answer: "StageLink is a visibility tool for theatre productions and groups. It helps producers share updates and showcase their shows while allowing audiences to discover productions, follow their favorite groups, and interact with shows all in one platform."
  },
  {
    question: "How do I sign up?",
    answer: (
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>If you are a producer:</strong> Click I’m a theater group button. Fill out the signup form or use your Google account, then wait for email confirmation.</li>
        <li><strong>If you are an audience member:</strong> Click I’m an audience member button. Fill out the signup form or sign in with Google, then wait for email confirmation.</li>
        <li>Once signed up, you get a 1-month free Premium trial to explore full features.</li>
      </ul>
    )
  },
  {
    question: "Is StageLink free?",
    answer: (
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Audiences:</strong> Free access to Premium features.</li>
        <li><strong>Producers:</strong> 1-month free Premium trial included. After the trial, you can subscribe for P399/month to keep Premium features. If you don’t wish to subscribe, your account will continue as Basic (free tier) with limited visibility tools.</li>
      </ul>
    )
  },
  {
    question: "Who can use StageLink?",
    answer: (
      <ul className="list-disc pl-5 space-y-2">
        <li><strong>Producers:</strong> Local, community, and university theatre groups within Metro Manila, with potential to expand reach in the future.</li>
        <li><strong>Audiences:</strong> Theatre-goers, enthusiasts, and anyone interested in discovering productions and shows.</li>
      </ul>
    )
  },
  {
    question: "How do producers benefit from StageLink?",
    answer: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Showcase productions and updates to followers and new audiences.</li>
        <li>Gain automatic exposure through Suggested Groups, search filters, and engagement tools.</li>
        <li>Track audience interest and interactions with your productions using analytics and dashboard insights.</li>
        <li>Connect with other producers for collaborations.</li>
      </ul>
    )
  },
  {
    question: "How do audiences benefit from StageLink?",
    answer: (
      <ul className="list-disc pl-5 space-y-2">
        <li>Discover productions and theatre groups without needing prior knowledge.</li>
        <li>Follow shows and groups, receive notifications, and add shows to personal calendars.</li>
        <li>Comment, review, and rate productions to engage with the community.</li>
        <li>Reserve seats or buy tickets directly for ticketed shows (Premium feature).</li>
        <li>Explore local and university theatre groups in one place.</li>
      </ul>
    )
  },
  {
    question: "Can I use StageLink on mobile devices?",
    answer: "Yes! StageLink is mobile-friendly and works on laptops, phones, and tablets."
  },
  {
    question: "Does StageLink have an application?",
    answer: "Currently, StageLink operates as a website, but in the future, it may evolve into a mobile app for both iOS and Android, allowing users to access all features on the go."
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
