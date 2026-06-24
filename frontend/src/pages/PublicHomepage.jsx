import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ceoImage from '../assets/ceo.jpg';

const PublicHomepage = () => {
  const { t, i18n } = useTranslation();

  // Debug: Log current language
  useEffect(() => {
    console.log('Current language:', i18n.language);
  }, [i18n.language]);

  // Language toggle function
  const toggleLanguage = () => {
    const newLang = i18n.language === 'sw' ? 'en' : 'sw';
    console.log('Switching to:', newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  // Get current language button text
  const getLanguageLabel = () => {
    return i18n.language === 'sw' ? 'English' : 'Kiswahili';
  };

  return (
    <div className="public-homepage">
      {/* Navigation Bar */}
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>M</span>
            <span style={styles.logoText}>MicroFinance</span>
          </div>
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>{t('Features') || 'Features'}</a>
            <a href="#about" style={styles.navLink}>{t('About') || 'About'}</a>
            <a href="#testimonials" style={styles.navLink}>{t('Testimonials') || 'Testimonials'}</a>
            
            
            
            <Link to="/login" style={styles.loginBtn}>{t('Sign In') || 'Sign In'}</Link>
            <Link to="/register" style={styles.getStartedBtn}>{t('Get Started') || 'Get Started'}</Link>
            <Link to="/app" style={styles.dashboardBtn}>{t('Dashboard') || 'Dashboard'}</Link>
          </div>
        </div>
        {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: '2px solid #0284c7',
                background: 'transparent',
                color: '#0284c7',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '14px',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#0284c7';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'transparent';
                e.target.style.color = '#0284c7';
              }}
            >
              {getLanguageLabel()}
            </button>
      </nav>

      {/* Hero Section with Background Image */}
      <section style={{...styles.hero, backgroundImage: `url(${ceoImage})`}}>
        <div style={styles.heroOverlay}></div>
        <div style={styles.heroContent}>
          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              {t('Digitalisation Partner') || 'Digitalisation Partner'} <br />
              <span style={styles.heroHighlight}>{t('for Microfinance') || 'for Microfinance'}</span>
            </h1>
            <p style={styles.heroSubtitle}>
              {t('Improve efficiency, reduce costs and launch new products & services with our cloud banking platform used by financial organisations all around the world.') || 'Improve efficiency, reduce costs and launch new products & services with our cloud banking platform used by financial organisations all around the world.'}
            </p>
            <div style={styles.heroButtons}>
              <Link to="/register" style={styles.primaryBtn}>{t('Start Free Trial') || 'Start Free Trial'}</Link>
              <a href="#features" style={styles.secondaryBtn}>{t('Learn More') || 'Learn More'}</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section style={styles.statsSection}>
        <div style={styles.statsContainer}>
          <div style={styles.statItem}>
            <h3 style={styles.statNumber}>500+</h3>
            <p style={styles.statLabel}>{t('Financial Institutions') || 'Financial Institutions'}</p>
          </div>
          <div style={styles.statItem}>
            <h3 style={styles.statNumber}>50,000+</h3>
            <p style={styles.statLabel}>{t('End Clients') || 'End Clients'}</p>
          </div>
          <div style={styles.statItem}>
            <h3 style={styles.statNumber}>25+</h3>
            <p style={styles.statLabel}>{t('Countries') || 'Countries'}</p>
          </div>
          <div style={styles.statItem}>
            <h3 style={styles.statNumber}>99.97%</h3>
            <p style={styles.statLabel}>{t('Uptime Guarantee') || 'Uptime Guarantee'}</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={styles.featuresSection}>
        <h2 style={styles.sectionTitle}>{t('The MicroFinance Core Platform') || 'The MicroFinance Core Platform'}</h2>
        <p style={styles.sectionSubtitle}>
          {t('Begin your digitalisation journey with our award-winning solution.') || 'Begin your digitalisation journey with our award-winning solution.'}
        </p>
        <div style={styles.featuresGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>☁️</div>
            <h3 style={styles.featureTitle}>{t('Cloud Based') || 'Cloud Based'}</h3>
            <p style={styles.featureDescription}>
              {t('All you need is a reliable internet connection and a modern web browser. We guarantee an up-time of over 99.97%.') || 'All you need is a reliable internet connection and a modern web browser. We guarantee an up-time of over 99.97%.'}
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💰</div>
            <h3 style={styles.featureTitle}>{t('Per Client Pricing') || 'Per Client Pricing'}</h3>
            <p style={styles.featureDescription}>
              {t('Flexible and affordable pricing structure enabling MFIs to benefit regardless of their size.') || 'Flexible and affordable pricing structure enabling MFIs to benefit regardless of their size.'}
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>🏆</div>
            <h3 style={styles.featureTitle}>{t('Award Winning') || 'Award Winning'}</h3>
            <p style={styles.featureDescription}>
              {t('Winner of multiple awards for technology, financial inclusion and innovation in microfinance.') || 'Winner of multiple awards for technology, financial inclusion and innovation in microfinance.'}
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📱</div>
            <h3 style={styles.featureTitle}>{t('Digital Field Application') || 'Digital Field Application'}</h3>
            <p style={styles.featureDescription}>
              {t('Improve loan officer efficiency, extend outreach and increase revenue with our revolutionary DFA.') || 'Improve loan officer efficiency, extend outreach and increase revenue with our revolutionary DFA.'}
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>💳</div>
            <h3 style={styles.featureTitle}>{t('Mobile Money Integration') || 'Mobile Money Integration'}</h3>
            <p style={styles.featureDescription}>
              {t('Integrated with MMT services, enabling clients to repay loans and deposit savings over their mobile phones.') || 'Integrated with MMT services, enabling clients to repay loans and deposit savings over their mobile phones.'}
            </p>
          </div>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>📨</div>
            <h3 style={styles.featureTitle}>{t('SMS Module') || 'SMS Module'}</h3>
            <p style={styles.featureDescription}>
              {t('Stay connected with your customers with our personalised and automated SMS module.') || 'Stay connected with your customers with our personalised and automated SMS module.'}
            </p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" style={styles.aboutSection}>
        <div style={styles.aboutContainer}>
          <div style={styles.aboutContent}>
            <h2 style={styles.sectionTitle}>{t('About Our Platform') || 'About Our Platform'}</h2>
            <p style={styles.aboutText}>
              {t('We are dedicated to empowering microfinance institutions with cutting-edge technology. Our platform is designed to help you transform your business, reach more clients, and make a real impact in your community.') || 'We are dedicated to empowering microfinance institutions with cutting-edge technology. Our platform is designed to help you transform your business, reach more clients, and make a real impact in your community.'}
            </p>
            <p style={styles.aboutText}>
              {t('From loan origination to collections, our comprehensive suite of tools automates your workflows, reduces costs, and gives you the insights you need to grow.') || 'From loan origination to collections, our comprehensive suite of tools automates your workflows, reduces costs, and gives you the insights you need to grow.'}
            </p>
            <ul style={styles.aboutList}>
              <li>✔️ {t('Client, Group, Loan, Savings, Shares and Accounting Modules') || 'Client, Group, Loan, Savings, Shares and Accounting Modules'}</li>
              <li>✔️ {t('Digital Field Application for your team') || 'Digital Field Application for your team'}</li>
              <li>✔️ {t('50+ Reports and Data Export Module') || '50+ Reports and Data Export Module'}</li>
              <li>✔️ {t('Self-onboarding and dedicated support') || 'Self-onboarding and dedicated support'}</li>
            </ul>
          </div>
          <div style={styles.aboutImage}>
            <div style={styles.aboutImagePlaceholder}></div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaContainer}>
          <h2 style={styles.ctaTitle}>{t('Ready to Transform Your Business?') || 'Ready to Transform Your Business?'}</h2>
          <p style={styles.ctaSubtitle}>
            {t('Join thousands of organizations already using our platform.') || 'Join thousands of organizations already using our platform.'}
          </p>
          <div style={styles.ctaButtons}>
            <Link to="/register" style={styles.primaryBtn}>{t('Start Free Trial') || 'Start Free Trial'}</Link>
            <Link to="/login" style={styles.secondaryBtn}>{t('Sign In') || 'Sign In'}</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContainer}>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerTitle}>MicroFinance System</h4>
            <p style={styles.footerText}>
              {t('Empowering financial inclusion through technology.') || 'Empowering financial inclusion through technology.'}
            </p>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerTitle}>{t('Product') || 'Product'}</h4>
            <a href="#features" style={styles.footerLink}>{t('Features') || 'Features'}</a>
            <a href="#about" style={styles.footerLink}>{t('About') || 'About'}</a>
            <a href="#" style={styles.footerLink}>{t('Pricing') || 'Pricing'}</a>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerTitle}>{t('Company') || 'Company'}</h4>
            <a href="#" style={styles.footerLink}>{t('About Us') || 'About Us'}</a>
            <a href="#" style={styles.footerLink}>{t('Careers') || 'Careers'}</a>
            <a href="#" style={styles.footerLink}>{t('Contact') || 'Contact'}</a>
          </div>
          <div style={styles.footerColumn}>
            <h4 style={styles.footerTitle}>{t('Support') || 'Support'}</h4>
            <a href="#" style={styles.footerLink}>{t('Help Center') || 'Help Center'}</a>
            <a href="#" style={styles.footerLink}>{t('Documentation') || 'Documentation'}</a>
            <a href="#" style={styles.footerLink}>{t('API Status') || 'API Status'}</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <p style={styles.footerCopyright}>
            &copy; 2026 MicroFinance System. {t('All rights reserved.') || 'All rights reserved.'}
          </p>
        </div>
      </footer>
    </div>
  );
};

// Styles
const styles = {
  nav: {
    padding: '16px 0',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    position: 'sticky',
    top: 0,
    zIndex: 50,
    backdropFilter: 'blur(10px)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    color: 'white',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '20px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#1f2937',
    background: 'linear-gradient(135deg, #1f2937, #0284c7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  navLink: {
    color: '#4b5563',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px',
  },
  loginBtn: {
    color: '#4b5563',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '8px 16px',
    fontSize: '14px',
  },
  getStartedBtn: {
    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
  },
  dashboardBtn: {
    backgroundColor: '#10b981',
    color: 'white',
    padding: '10px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
  },
  hero: {
    position: 'relative',
    minHeight: '650px',
    display: 'flex',
    alignItems: 'center',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    marginTop: '-1px',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.9) 0%, rgba(14, 165, 233, 0.7) 50%, rgba(2, 132, 199, 0.85) 100%)',
    zIndex: 1,
  },
  heroContent: {
    position: 'relative',
    zIndex: 2,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 20px',
    width: '100%',
  },
  heroText: {
    maxWidth: '650px',
    color: 'white',
  },
  heroTitle: {
    fontSize: '52px',
    fontWeight: 'bold',
    lineHeight: '1.2',
    marginBottom: '20px',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  heroHighlight: {
    color: '#fcd34d',
    textShadow: '0 2px 8px rgba(0,0,0,0.2)',
  },
  heroSubtitle: {
    fontSize: '20px',
    lineHeight: '1.6',
    marginBottom: '30px',
    opacity: 0.95,
    textShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: 'white',
    color: '#0284c7',
    padding: '14px 32px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  },
  secondaryBtn: {
    border: '2px solid white',
    color: 'white',
    padding: '14px 32px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '16px',
    display: 'inline-block',
    backgroundColor: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(5px)',
  },
  statsSection: {
    backgroundColor: 'white',
    padding: '60px 20px',
    borderBottom: '1px solid #e5e7eb',
  },
  statsContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '30px',
    textAlign: 'center',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '40px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  statLabel: {
    fontSize: '16px',
    color: '#4b5563',
    marginTop: '4px',
  },
  featuresSection: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '80px 20px',
  },
  sectionTitle: {
    fontSize: '38px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '12px',
  },
  sectionSubtitle: {
    fontSize: '18px',
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: '40px',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '30px',
  },
  featureCard: {
    padding: '32px 24px',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    backgroundColor: 'white',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  featureIcon: {
    fontSize: '42px',
    marginBottom: '16px',
  },
  featureTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  featureDescription: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.7',
  },
  aboutSection: {
    backgroundColor: '#f8fafc',
    padding: '80px 20px',
  },
  aboutContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '60px',
    alignItems: 'center',
  },
  aboutContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  aboutText: {
    fontSize: '16px',
    color: '#4b5563',
    lineHeight: '1.8',
  },
  aboutList: {
    listStyle: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '15px',
    color: '#1f2937',
  },
  aboutImage: {
    backgroundColor: '#e2e8f0',
    borderRadius: '16px',
    height: '350px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundImage: 'url("https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80")',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  aboutImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.2), rgba(2, 132, 199, 0.3))',
  },
  ctaSection: {
    background: 'linear-gradient(135deg, #0284c7, #0ea5e9)',
    padding: '80px 20px',
    textAlign: 'center',
  },
  ctaContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  ctaTitle: {
    fontSize: '38px',
    fontWeight: 'bold',
    color: 'white',
    marginBottom: '12px',
  },
  ctaSubtitle: {
    fontSize: '18px',
    color: '#bae6fd',
    marginBottom: '32px',
  },
  ctaButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  footer: {
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    padding: '60px 20px 20px',
  },
  footerContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '40px',
    marginBottom: '30px',
  },
  footerColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  footerTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '8px',
  },
  footerText: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#94a3b8',
  },
  footerLink: {
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
  },
  footerBottom: {
    maxWidth: '1200px',
    margin: '0 auto',
    paddingTop: '20px',
    borderTop: '1px solid #1e293b',
    textAlign: 'center',
  },
  footerCopyright: {
    fontSize: '14px',
    color: '#64748b',
  },
};

export default PublicHomepage;