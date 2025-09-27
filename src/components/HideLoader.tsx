import { useEffect } from 'react';

const HideLoader = () => {
  useEffect(() => {
    // Immediately hide the initial loader when this component mounts
    const loader = document.getElementById('initial-loader');
    const errorContainer = document.querySelector('.error-container');
    
    if (loader) {
      loader.style.display = 'none';
      loader.remove(); // Remove it from DOM completely
    }
    
    if (errorContainer) {
      const errorDiv = errorContainer as HTMLElement;
      errorDiv.style.display = 'none';
      errorDiv.remove(); // Remove it from DOM completely
    }
    
    // Ensure body has correct classes
    document.body.classList.remove('loading');
    document.body.classList.add('app-loaded');
    
    // Clean up any remaining loading styles
    document.body.style.removeProperty('background');
    document.body.style.removeProperty('display');
    document.body.style.removeProperty('align-items');
    document.body.style.removeProperty('justify-content');
    document.body.style.removeProperty('color');
  }, []);
  
  return null;
};

export default HideLoader;
