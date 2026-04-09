import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MembershipPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const tiers = [
    {
      name: 'Basic',
      price: '₹0',
      period: '/ month',
      description: 'The standard CoderHub experience, perfect for getting started.',
      features: [
        'Standard code sharing (3/day)',
        'Standard tips sharing (1/day)',
        'Standard quizzes (1/day)',
        'Public folders and snippets',
        'Normal profile and avatar'
      ],
      buttonText: 'Current Plan',
      isCurrent: user?.membershipLevel === 'FREE' || !user?.membershipLevel,
      color: 'var(--text-secondary)'
    },
    {
      name: 'Pro',
      price: '₹449',
      period: '/ month',
      description: 'Power up your development journey with professional capabilities.',
      features: [
        'Enhanced code sharing (5/day)',
        'Unlimited tips per day 💡',
        'Increased quizzes (10/day)',
        'Blue gradient profilering',
        'Exclusive PRO badge box',
        'Ad-free experience'
      ],
      buttonText: 'Upgrade to Pro',
      isCurrent: user?.membershipLevel === 'ADVANCED',
      highlight: true,
      color: '#00d2ff'
    },
    {
      name: 'Premium',
      price: '₹899',
      period: '/ month',
      description: 'The ultimate toolkit for serious developers and elite coders.',
      features: [
        'Unlimited code posts 🚀',
        'Unlimited tips per day',
        'Unlimited quizzes',
        'Gold gradient profile ring',
        'Exclusive Gold Crown identity',
        'Priority 24/7 support'
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
