import React from 'react';
import './ShimmerLoading.css';

export const ShimmerText = ({ lines = 1, width = '100%' }) => {
  return (
    <>
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i} 
          className="shimmer-text"
          style={{ 
            width: typeof width === 'object' ? width[i] || '100%' : width,
            marginBottom: '8px'
          }}
        />
      ))}
    </>
  );
};

export const ShimmerImage = ({ height = '300px', width = '100%', className = '' }) => {
  return (
    <div 
      className={`shimmer-image ${className}`}
      style={{ height, width }}
    />
  );
};

export const ShimmerCard = ({ height = '250px', width = '100%' }) => {
  return (
    <div className="shimmer-card" style={{ height, width }}>
      <div className="shimmer-card-icon" />
      <div className="shimmer-card-title" />
      <ShimmerText lines={3} />
    </div>
  );
};

export const ShimmerSection = ({ type = 'default' }) => {
  switch (type) {
    case 'hero':
      return (
        <div className="shimmer-hero-section">
          <ShimmerText width="60%" height="40px" />
          <ShimmerText width="80%" height="24px" />
        </div>
      );
    
    case 'story':
      return (
        <div className="shimmer-story-section">
          <ShimmerText width="40%" height="32px" />
          <div className="shimmer-story-content">
            <div className="shimmer-story-text">
              <ShimmerText lines={4} />
            </div>
            <ShimmerImage height="400px" width="100%" />
          </div>
        </div>
      );
    
    case 'values':
      return (
        <div className="shimmer-values-section">
          <ShimmerText width="30%" height="32px" />
          <div className="shimmer-values-grid">
            <ShimmerCard />
            <ShimmerCard />
            <ShimmerCard />
          </div>
        </div>
      );
    
    case 'craftsmanship':
      return (
        <div className="shimmer-craftsmanship-section">
          <div className="shimmer-craft-content">
            <ShimmerText width="40%" height="32px" />
            <ShimmerText lines={3} />
            <ShimmerText width="25%" height="40px" />
          </div>
          <div className="shimmer-craft-gallery">
            <div className="shimmer-gallery-row">
              <ShimmerImage height="200px" width="48%" />
              <ShimmerImage height="200px" width="48%" />
            </div>
            <div className="shimmer-gallery-row">
              <ShimmerImage height="200px" width="48%" />
              <ShimmerImage height="200px" width="48%" />
            </div>
          </div>
        </div>
      );
    
    case 'team':
      return (
        <div className="shimmer-team-section">
          <ShimmerText width="50%" height="32px" />
          <ShimmerText lines={2} width="90%" />
          <div className="shimmer-commitment">
            <ShimmerText width="40%" height="24px" />
            <ShimmerText lines={3} />
            <div className="shimmer-signature">
              <ShimmerText width="20%" height="20px" />
            </div>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="shimmer-default-section">
          <ShimmerText width="40%" height="32px" />
          <ShimmerText lines={3} />
        </div>
      );
  }
};
