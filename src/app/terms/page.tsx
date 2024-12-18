import React from 'react';

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        
        <section>
          <h2 className="text-xl font-semibold mb-4">1. User Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>You must use the service in compliance with all applicable laws and regulations.</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
            <li>You agree to use ManyAI&apos;s services in compliance with these terms and applicable laws.</li>
            <li>You won&apos;t attempt to reverse engineer or bypass any security measures of the service.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">2. Service Usage</h2>
          <p>The term &ldquo;Services&rdquo; refers to all features, products, and services provided by ManyAI.</p>
          <p>We reserve the right to modify, suspend, or discontinue any part of our service with reasonable notice.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">3. Service Limitations</h2>
          <p>Our service isn&apos;t available in certain jurisdictions due to regulatory requirements. We reserve the right to modify or discontinue any aspect of the service at any time.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">4. Privacy and Data Protection</h2>
          <p>We handle your data in accordance with our Privacy Policy. By using our service, you agree to our data handling practices.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">5. Disclaimer</h2>
          <p>The service is provided &ldquo;as is&rdquo; without warranties of any kind. We do not guarantee the accuracy, completeness, or reliability of AI-generated responses.</p>
          <p>We employ industry-standard security measures to protect your data, including encryption of data in transit and secure handling of all user interactions.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold mb-4">6. Changes to Terms</h2>
          <p>We may update these terms from time to time. We&apos;ll notify you of any material changes before they become effective.</p>
        </section>
      </div>
    </div>
  );
}
