export default function TermsOfService() {
  return (
    <>
      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none" style={{ color: 'var(--text-secondary)' }}>
            <p className="text-lg mb-6">
              Last updated: January 2025
            </p>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Best Effort Service
                </h2>
                <p>
                  This service is provided on a best-effort basis. We make no guarantees regarding uptime, 
                  availability, or performance. The service may experience downtime, interruptions, or 
                  performance issues without notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  No Warranties
                </h2>
                <p>
                  The service is provided "as is" without any warranties, express or implied, including but 
                  not limited to merchantability or fitness for a particular purpose. We do not warrant that 
                  the service will be uninterrupted, error-free, or free of viruses or other harmful components.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  No Liability
                </h2>
                <p>
                  We shall not be liable for any damages, losses, or issues arising from the use of this service, 
                  including but not limited to direct, indirect, incidental, special, or consequential damages. 
                  This includes any loss of data, profits, or business opportunities.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Service Changes
                </h2>
                <p>
                  We reserve the right to modify, suspend, or discontinue the service at any time without notice. 
                  We may also change the terms of service at any time. Continued use of the service after such 
                  changes constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Acceptable Use
                </h2>
                <p>
                  You agree to use the service only for lawful purposes and in accordance with these terms. 
                  You may not use the service in any way that could damage, disable, overburden, or impair 
                  the service or interfere with any other party's use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                  Contact Information
                </h2>
                <p>
                  If you have any questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:help@sso.broker" className="text-blue-600 hover:text-blue-700">
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
