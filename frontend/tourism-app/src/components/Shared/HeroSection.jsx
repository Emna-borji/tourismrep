import React from 'react';
import './heroSectionStyle.css';

const HeroSection = ({ 
  title = "Explorez la Tunisie", 
  subtitle = "Découvrez les meilleures destinations touristiques", 
  image = "https://www.lomondwholesale.co.uk/wp-content/uploads/slider/cache/3e83ac21c91d42e91e00ba9b5f8abc5b/Hero-Banner-1.png" 
}) => {
  return (
    <div 
      className="hero-section" 
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="overlay">
        <div className="hero-text">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
