import React from 'react';
import './FloatingFoodIcons.css';

const FloatingFoodIcons = () => {
  // Rich selection of Indian and South Indian food items (14 items)
  const icons = [
    {
      id: 1,
      label: 'Filter Coffee Set',
      className: 'item-coffee-1',
      component: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 8l1 7.5h6l1-7.5H8z" fill="rgba(212, 175, 55, 0.05)" />
          <path d="M5 15.5c0 2 2 2.5 7 2.5s7-.5 7-2.5H5z" />
          <path d="M10 5c0-1.5 1-1.5 1-3M13 5c0-1.5 1-1.5 1-3" />
        </svg>
      )
    },
    {
      id: 2,
      label: 'Idli & Vada Plate',
      className: 'item-idli-1',
      component: (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <circle cx="9" cy="9" r="3" fill="rgba(255, 255, 255, 0.1)" />
          <circle cx="15" cy="10" r="3" fill="rgba(255, 255, 255, 0.1)" />
          <circle cx="11" cy="15.5" r="2.5" fill="rgba(212, 175, 55, 0.05)" />
          <circle cx="11" cy="15.5" r="0.8" />
        </svg>
      )
    },
    {
      id: 3,
      label: 'Rolled Masala Dosa',
      className: 'item-dosa-1',
      component: (
        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 14.5c0-1.8 4.5-3.2 10-3.2s10 1.4 10 3.2-4.5 3.2-10 3.2-10-1.4-10-3.2z" fill="rgba(212, 175, 55, 0.05)" />
          <path d="M2 14.5v-4.5c0-1.8 4.5-3.2 10-3.2s10 1.4 10 3.2v4.5" />
          <path d="M12 6.8c-5.5 0-10 1.4-10 3.2s4.5 3.2 10 3.2 10-1.4 10-3.2-4.5-3.2-10-3.2z" fill="rgba(212, 175, 55, 0.1)" />
        </svg>
      )
    },
    {
      id: 4,
      label: 'Banana Leaf Meal',
      className: 'item-leaf-1',
      component: (
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12c0-5 3.5-9 9-9s9 4 9 9-3.5 9-9 9-9-4-9-9z" fill="rgba(212, 175, 55, 0.03)" />
          <path d="M12 3v18" strokeWidth="2" />
          <path d="M3.5 10c2.5 1 5 1.5 8.5 2M12 12c3.5-.5 6-1 8.5-2M4 7c2.5 1 5 1.5 8 1.5M12 8.5c3-0.5 5.5-1 8-1.5M4.5 15c2.5 .5 5 1 7.5 1M12 16c2.5 0 5-.5 7.5-1" />
        </svg>
      )
    },
    {
      id: 5,
      label: 'Sambar Bowl',
      className: 'item-sambar-1',
      component: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18c0 4.5-4 8-9 8s-9-3.5-9-8z" fill="rgba(212, 175, 55, 0.05)" />
          <path d="M3 12c0-1 4-1.8 9-1.8s9 .8 9 1.8" />
          <path d="M12 7c0-2 1-2 1-3.5" />
        </svg>
      )
    },
    {
      id: 6,
      label: 'Triangular Samosa',
      className: 'item-samosa-1',
      component: (
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l9 15H3l9-15z" fill="rgba(212, 175, 55, 0.05)" />
          <path d="M12 3v15M12 9l-4 5M12 12l5 4" />
        </svg>
      )
    },
    {
      id: 7,
      label: 'Laddoo Sweet Bowl',
      className: 'item-sweet-1',
      component: (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12h16c0 4-3 7-8 7s-8-3-8-7z" fill="rgba(212, 175, 55, 0.05)" />
          <circle cx="9" cy="9" r="2.5" fill="rgba(255, 255, 255, 0.1)" />
          <circle cx="15" cy="9" r="2.5" fill="rgba(255, 255, 255, 0.1)" />
          <circle cx="12" cy="6.2" r="2.5" fill="rgba(255, 255, 255, 0.15)" />
        </svg>
      )
    },
    {
      id: 8,
      label: 'Indian Hot Naan / Roti',
      className: 'item-naan-1',
      component: (
        <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 13c0-4 4.5-8 9-8s9 4 9 8-4.5 7-9 7-9-3-9-7z" fill="rgba(212, 175, 55, 0.05)" />
          {/* Butter spots / details */}
          <ellipse cx="9" cy="11" rx="1.5" ry="1" />
          <ellipse cx="14" cy="14" rx="2" ry="1" />
          <circle cx="12" cy="9" r="1" />
        </svg>
      )
    },
    {
      id: 9,
      label: 'Clay Tandoori Pot',
      className: 'item-pot-1',
      component: (
        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9h12v9c0 2.5-2.5 3.5-6 3.5s-6-1-6-3.5V9z" fill="rgba(212, 175, 55, 0.05)" />
          <path d="M4 9c0-1.5 3-2 8-2s8 .5 8 2H4z" />
          <path d="M12 3v2" />
        </svg>
      )
    },
    {
      id: 10,
      label: 'Cutting Chai Glass',
      className: 'item-chai-1',
      component: (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 5l1.8 14.5h8.4L18 5H6z" fill="rgba(212, 175, 55, 0.05)" />
          <path d="M5 5h14" strokeWidth="2" />
          <path d="M8 10h8M7.5 14h9" />
        </svg>
      )
    },
    {
      id: 11,
      label: 'Filter Coffee 2',
      className: 'item-coffee-2',
      component: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 8l1 7.5h6l1-7.5H8z" />
          <path d="M5 15.5c0 2 2 2.5 7 2.5s7-.5 7-2.5H5z" />
        </svg>
      )
    },
    {
      id: 12,
      label: 'Samosa 2',
      className: 'item-samosa-2',
      component: (
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l9 15H3l9-15z" />
        </svg>
      )
    },
    {
      id: 13,
      label: 'Banana Leaf Meal 2',
      className: 'item-leaf-2',
      component: (
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12c0-5 3.5-9 9-9s9 4 9 9-3.5 9-9 9-9-4-9-9z" />
          <path d="M12 3v18" />
        </svg>
      )
    },
    {
      id: 14,
      label: 'Sambar Bowl 2',
      className: 'item-sambar-2',
      component: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12h18c0 4-4 7-9 7s-9-3-9-7z" />
        </svg>
      )
    }
  ];

  return (
    <div className="floating-icons-container">
      {icons.map((icon) => (
        <div key={icon.id} className={`floating-food-item ${icon.className}`} title={icon.label}>
          {icon.component}
        </div>
      ))}
    </div>
  );
};

export default FloatingFoodIcons;
