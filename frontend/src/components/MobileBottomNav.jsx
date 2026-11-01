import React from 'react';
import { 
  Home, 
  Clock, 
  BookOpen, 
  CalendarRange, 
  Sparkles, 
  Menu 
} from 'lucide-react';

export default function MobileBottomNav({ currentView, onNavigate, onOpenMenu }) {
  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'countdown', label: 'Exams', icon: Clock },
    { id: 'syllabus', label: 'Syllabus', icon: BookOpen },
    { id: 'study-plan', label: 'Plan', icon: CalendarRange },
    { id: 'teacher', label: 'AI Tutor', icon: Sparkles },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentView === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`mobile-nav-btn ${isActive ? 'active' : ''}`}
            aria-label={item.label}
          >
            <div className="mobile-nav-icon-wrapper">
              <Icon size={20} />
            </div>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        );
      })}

      {/* Menu / Profile Button */}
      <button
        onClick={onOpenMenu}
        className="mobile-nav-btn"
        aria-label="Open Full Menu"
      >
        <div className="mobile-nav-icon-wrapper">
          <Menu size={20} />
        </div>
        <span className="mobile-nav-label">Menu</span>
      </button>
    </nav>
  );
}

