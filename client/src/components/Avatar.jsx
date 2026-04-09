import React from 'react';

const CrownIcon = () => (
  <svg className="crown-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 16L3 5L8.5 10L12 4L15.5 10L21 5L19 16H5Z" fill="#f0b429" stroke="#1a1a2e" strokeWidth="1.1" strokeLinejoin="round" />
    <path d="M5 18H19V20H5V18Z" fill="#f0b429" stroke="#1a1a2e" strokeWidth="1.1" strokeLinejoin="round" />
  </svg>
);

/**
 * Avatar with Instagram-style thin gradient ring for Pro/Premium members.
 *
 * Layout: [ring-container]
 *           ├── .ring-div  (gradient circle, masked to thin ring)
 *           └── .inner-div (avatar circle, smaller with gap border)
 *
 * Sizes (px, for default size=38):
 *   containerSize = size + ringPad*2    (ring thickness on each side)
 *   innerSize     = size                (the actual avatar)
 *   gap           = shown via box-shadow on inner div
 */
export default function Avatar({ user, size = 38 }) {
  const membership = user?.membershipLevel || 'FREE';
  const isPro = membership === 'ADVANCED';
  const isPremium = membership === 'PREMIUM';
  const hasBadge = isPro || isPremium;

  // Ring padding on each side: gap (2px) + ring width (2.5px) = 4.5 → round to 5
  const ringPad = 5;
  const containerSize = hasBadge ? size + ringPad * 2 : size;
  const ringGap = 2; // gap between avatar edge and ring

  const innerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    background: user?.profileImage
      ? 'transparent'
      : (user?.avatarColor || 'linear-gradient(135deg, #58a6ff, #bc8cff)'),
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: `${size / 2.7}px`,
    fontWeight: '700',
    color: 'white',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
    // Box-shadow creates the dark gap between avatar and the ring
    boxShadow: hasBadge ? `0 0 0 ${ringGap}px #0d1117` : 'none',
  };

  return (
    <div
      className={`avatar-container${isPro ? ' avatar-pro' : ''}${isPremium ? ' avatar-premium' : ''}`}
      style={{
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {/* Gradient ring fills the container; mask punches the center out to a thin ring */}
      {hasBadge && (
        <div
          className={isPremium ? 'avatar-ring-premium' : 'avatar-ring-pro'}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', zIndex: 0 }}
        />
      )}

      <div style={innerStyle}>
        {user?.profileImage ? (
          <img
            src={user.profileImage}
            alt="avatar"
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
          />
        ) : (
          user?.user_id?.[0]?.toUpperCase() || '?'
        )}
      </div>

      {isPro && <div className="avatar-badge-pro">PRO</div>}
      {isPremium && (
        <div className="avatar-badge-premium">
          <CrownIcon />
        </div>
      )}
    </div>
  );
}
