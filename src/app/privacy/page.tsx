import React from 'react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <section>
          <h2 className="text-xl font-semibold mb-4">1. Information Collection</h2>
          <p>We collect information that you provide directly to us when using our services:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>User inputs and prompts</li>
            <li>Usage patterns and preferences</li>
            <li>Technical information about your device and connection</li>
            <li>Feedback and communications</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
          <p>We use collected information to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Provide and improve our services</li>
            <li>Personalize your experience</li>
            <li>Monitor and analyze usage patterns</li>
            <li>Protect against misuse</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">3. Data Sharing</h2>
          <p>We don&apos;t sell your data or share it with third parties unless:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Required by law or legal process</li>
            <li>Necessary to protect our rights or safety</li>
            <li>You&apos;ve given explicit consent</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">4. Data Security</h2>
          <p>We implement appropriate security measures to protect your information:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Encryption of data in transit</li>
            <li>Regular security assessments</li>
            <li>Access controls and monitoring</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">5. Your Rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Access your personal data</li>
            <li>Request correction or deletion</li>
            <li>Opt-out of certain data collection</li>
            <li>Withdraw consent at any time</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">6. Changes to Privacy Policy</h2>
          <p>We may update this policy periodically. We&apos;ll notify you of significant changes via email or through our service.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">7. Contact Us</h2>
          <p>If you have questions about this Privacy Policy, please contact us at support@manyai.com</p>
        </section>
      </div>
    </div>
  );
}
