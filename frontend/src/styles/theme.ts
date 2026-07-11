/**
 * Enterprise Cybersecurity Dashboard Theme
 * Inspired by Microsoft Defender XDR, CrowdStrike Falcon, Splunk
 */

export const THEME = {
  colors: {
    // Primary backgrounds
    bg: {
      primary: '#070B14',      // Deep space black
      secondary: '#0F1419',    // Slightly lighter
      tertiary: '#111827',     // Card background
      hover: '#16213E',        // Hover state
    },
    
    // Brand colors
    brand: {
      primary: '#4F46E5',      // Indigo
      secondary: '#6366F1',    // Light indigo
      accent: '#3B82F6',       // Bright blue
      neon: '#00D9FF',         // Cyan neon
      purple: '#8B5CF6',       // Purple
    },
    
    // Status colors
    status: {
      success: '#22C55E',      // Green
      warning: '#F59E0B',      // Amber
      danger: '#EF4444',       // Red
      critical: '#DC2626',     // Dark red
      info: '#3B82F6',         // Blue
    },
    
    // Text colors
    text: {
      primary: '#FFFFFF',
      secondary: '#D1D5DB',
      muted: '#9CA3AF',
      dim: '#6B7280',
    },
    
    // Borders
    border: {
      light: 'rgba(255, 255, 255, 0.08)',
      medium: 'rgba(255, 255, 255, 0.12)',
      dark: 'rgba(0, 0, 0, 0.4)',
    },
  },
  
  // Glassmorphism effect
  glass: {
    light: 'backdrop-blur-xl bg-white/5 border border-white/10',
    medium: 'backdrop-blur-lg bg-white/8 border border-white/15',
    dark: 'backdrop-blur-md bg-black/40 border border-white/20',
  },
  
  // Shadows
  shadow: {
    sm: '0 2px 8px rgba(0, 0, 0, 0.3)',
    md: '0 4px 16px rgba(0, 0, 0, 0.4)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
    xl: '0 12px 48px rgba(0, 0, 0, 0.6)',
    glow: '0 0 24px rgba(79, 70, 229, 0.3)',
    glow_cyan: '0 0 24px rgba(0, 217, 255, 0.2)',
  },
  
  // Border radius
  radius: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    full: '9999px',
  },
  
  // Animations
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export type Theme = typeof THEME;
