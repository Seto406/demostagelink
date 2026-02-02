import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-8">Privacy Policy</h1>
          <div className="prose prose-invert max-w-none text-muted-foreground">
            <p className="mb-4">Last updated: February 2026</p>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">1. Introduction</h2>
              <p className="mb-4">
                StageLink ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website stagelink.show (the "Site") or use our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">2. Collection of Information</h2>
              <p className="mb-4">
                We may collect information about you in a variety of ways. The information we may collect on the Site includes:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>Personal Data:</strong> Personally identifiable information, such as your name, email address, and demographic information that you voluntarily give to us when you register with the Site or choose to participate in various activities related to the Site.</li>
                <li><strong>Google User Data:</strong> If you choose to log in using your Google account, we access your Google profile information, specifically your name, email address, and profile picture, to create and manage your account. We do not access your contacts, calendar, or other personal data. We do not sell or share your Google user data with third parties.</li>
                <li><strong>Derivative Data:</strong> Information our servers automatically collect when you access the Site, such as your IP address, your browser type, your operating system, your access times, and the pages you have viewed directly before and after accessing the Site.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">3. Use of Your Information</h2>
              <p className="mb-4">
                Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. We may use information collected about you via the Site to:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li>Create and manage your account.</li>
                <li>Email you regarding your account or order.</li>
                <li>Fulfill and manage purchases, orders, payments, and other transactions related to the Site.</li>
                <li>Generate a personal profile about you to make future visits to the Site more personalized.</li>
                <li>Increase the efficiency and operation of the Site.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">4. Disclosure of Your Information</h2>
              <p className="mb-4">
                We may share information we have collected about you in certain situations. Your information may be disclosed as follows:
              </p>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong>By Law or to Protect Rights:</strong> If we believe the release of information about you is necessary to respond to legal process, to investigate or remedy potential violations of our policies, or to protect the rights, property, and safety of others, we may share your information as permitted or required by any applicable law, rule, or regulation.</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">5. Data Deletion</h2>
              <p className="mb-4">
                You have the right to request the deletion of your personal data. To request data deletion, please contact us at <a href="mailto:hello@stagelink.show" className="text-secondary">hello@stagelink.show</a>. We will process your request within 30 days.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">6. Contact Us</h2>
              <p className="mb-4">
                If you have questions or comments about this Privacy Policy, please contact us at:
              </p>
              <p className="text-secondary">hello@stagelink.show</p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
