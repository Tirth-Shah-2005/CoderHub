import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MembershipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tiers = [
    {
      name: 'Basic',
      price: '$0',
      period: '/ month',
      description: 'The standard CoderHub experience, perfect for getting started.',
      features: [
        'Unlimited global feed browsing',
        'Standard code sharing (3/day)',
        'Basic profile customization',
        'Public folders and snippets',
        'Standard support'
      ],
      buttonText: 'Current Plan',
      isCurrent: user?.membershipLevel === 'FREE' || !user?.membershipLevel,
      color: 'var(--text-secondary)'
    },
    {
      name: 'Advanced',
      price: '$5',
      period: '/ month',
      description: 'Power up your development journey with enhanced capabilities.',
      features: [
        'Unlimited code posts',
        'Advanced profile badge 🎖️',
        'Ad-free experience',
        'Custom avatar gradients',
        '50 Private snippets',
        'Faster global CDN'
      ],
      buttonText: 'Upgrade to Advanced',
      isCurrent: user?.membershipLevel === 'ADVANCED',
      highlight: true,
      color: 'var(--accent)'
    },
    {
      name: 'Premium',
      price: '$10',
      period: '/ month',
      description: 'The ultimate toolkit for serious developers and teams.',
      features: [
        'Everything in Advanced',
        'Unlimited Private snippets',
        'Custom profile themes',
        'Priority 24/7 support',
        'Early access to new features',
        'Custom domain for profile (soon)'
      ],
      buttonText: 'Upgrade to Premium',
      isCurrent: user?.membershipLevel === 'PREMIUM',
      color: '#f0b429'
    }
  ];

  return (
    <div className="membership-page">
      <div className="membership-header">
        <button className="back-btn" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="premium-gold-text">💎 MEMBERSHIP</h1>
        <p>Elevate your CoderHub experience with premium features</p>
      </div>

      <div className="pricing-container">
        <div className="pricing-grid">
          {tiers.map((tier) => (
            <div key={tier.name} className={`pricing-card ${tier.highlight ? 'highlighted' : ''} ${tier.name.toLowerCase()}`}>
              {tier.highlight && <div className="popular-badge">MOST POPULAR</div>}
              
              <div className="card-header">
                <h2 style={{ color: tier.color, fontFamily: tier.name !== 'Basic' ? 'Cinzel, serif' : 'inherit' }}>
                  {tier.name}
                </h2>
                <div className="price-box">
                  <span className="price">{tier.price}</span>
                  <span className="period">{tier.period}</span>
                </div>
              </div>

              <p className="description">{tier.description}</p>

              <div className="features-list">
                {tier.features.map((feature, i) => (
                  <div key={i} className="feature-item">
                    <span className="check">✓</span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button 
                className={`cta-btn ${tier.isCurrent ? 'current' : ''}`}
                disabled={tier.isCurrent}
                style={{
                  background: tier.isCurrent ? 'var(--bg-tertiary)' : (tier.highlight ? 'var(--accent)' : 'var(--bg-primary)'),
                  border: tier.highlight ? 'none' : '1px solid var(--border-color)',
                  color: tier.isCurrent ? 'var(--text-muted)' : 'var(--text-primary)'
                }}
              >
                {tier.isCurrent ? 'Current Plan' : tier.buttonText}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
