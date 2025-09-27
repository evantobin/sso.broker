export default function PrivacyPolicy() {
  return (
    <>
      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-primary">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none text-secondary">
            <p className="text-lg mb-6">
              Last updated: January 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  No Data Storage
                </h2>
                <p>
                  This service does not store any personal information, user data, or authentication details. 
                  We do not have a database and do not retain any information about users or their authentication 
                  activities. All data is processed in real-time and immediately discarded.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  Stateless Operation
                </h2>
                <p>
                  All authentication flows are stateless and processed in real-time without persistent storage. 
                  Each request is handled independently, and no session data or user information is retained 
                  between requests.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  No Tracking
                </h2>
                <p>
                  We do not track users, collect analytics, or store any information about your usage of this 
                  service. We do not use cookies for tracking purposes, and we do not collect any personal 
                  identifiers or behavioral data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  Transparent Operation
                </h2>
                <p>
                  The service operates as a pass-through authentication broker without retaining any user 
                  information. We act solely as an intermediary between your application and the identity 
                  providers (Apple, Google, GitHub), facilitating the authentication process without storing 
                  any data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  Third-Party Services
                </h2>
                <p>
                  This service integrates with third-party identity providers (Apple, Google, GitHub). 
                  When you authenticate through these providers, you are subject to their respective 
                  privacy policies. We do not control or have access to the data these providers collect.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  Logs and Monitoring
                </h2>
                <p>
                  We may maintain basic server logs for operational purposes, but these logs do not contain 
                  personal information or authentication details. Any logs are used solely for system 
                  maintenance and security purposes.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  Data Security
                </h2>
                <p>
                  While we do not store personal data, we implement appropriate security measures to protect 
                  the service infrastructure. All communications are encrypted using industry-standard protocols.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  Changes to This Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. Any changes will be posted on this page 
                  with an updated revision date. Since we do not collect personal information, we do not need 
                  to notify users of changes to this policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-primary">
                  Contact Information
                </h2>
                <p>
                  If you have any questions about this Privacy Policy, please contact us at{' '}
                  <a href="mailto:help@sso.broker">
                    help@sso.broker
                  </a>.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
