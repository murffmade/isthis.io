import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, HelpCircle, Sparkles } from 'lucide-react';

const resultConfig = {
  likely_real: {
    icon: CheckCircle2,
    title: 'Likely Real',
    emoji: '✓',
    color: '#059669',
    darkColor: '#047857',
    lightColor: '#d1fae5',
    bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    pattern: 'radial-gradient(circle at 20% 30%, rgba(16, 185, 129, 0.15) 0%, transparent 50%)'
  },
  likely_ai: {
    icon: AlertTriangle,
    title: 'Likely AI-Generated',
    emoji: '⚠️',
    color: '#f59e0b',
    darkColor: '#d97706',
    lightColor: '#fef3c7',
    bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    pattern: 'radial-gradient(circle at 80% 20%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)'
  },
  uncertain: {
    icon: HelpCircle,
    title: 'Uncertain',
    emoji: '❓',
    color: '#64748b',
    darkColor: '#475569',
    lightColor: '#f1f5f9',
    bgGradient: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
    pattern: 'radial-gradient(circle at 50% 50%, rgba(148, 163, 184, 0.15) 0%, transparent 50%)'
  }
};

export default function ShareCard({ result, cardRef, affiliateCode }) {
  const config = resultConfig[result.result] || resultConfig.uncertain;
  const Icon = config.icon;

  return (
    <div 
      ref={cardRef}
      style={{ 
        width: '1200px',
        height: '630px',
        background: `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`,
        padding: '0',
        position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: config.pattern,
        opacity: 0.5
      }} />
      
      {/* Decorative Circles */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: config.bgGradient,
        opacity: 0.1,
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-80px',
        left: '-80px',
        width: '250px',
        height: '250px',
        borderRadius: '50%',
        background: config.bgGradient,
        opacity: 0.1,
        filter: 'blur(40px)'
      }} />

      {/* Content Container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'row',
        padding: '50px',
        gap: '40px'
      }}>
        {/* Left side - Analyzed Image */}
        {(result.file_url || result.thumbnail_url) && (
          <div style={{
            flex: '0 0 45%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              borderRadius: '24px',
              overflow: 'hidden',
              border: '4px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              background: 'white'
            }}>
              <img 
                src={result.file_url || result.thumbnail_url}
                alt="Analyzed content"
                style={{
                  width: '100%',
                  height: '530px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
            </div>
          </div>
        )}

        {/* Right side - Result Info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 20px'
        }}>
          {/* Logo */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '40px'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}>
              <Shield style={{ width: '28px', height: '28px', color: 'white' }} />
            </div>
            <div>
              <div style={{ 
                fontSize: '26px', 
                fontWeight: '800',
                color: 'white',
                lineHeight: 1,
                letterSpacing: '-0.02em'
              }}>
                IsThis.io
              </div>
              <div style={{ 
                fontSize: '14px',
                color: '#94a3b8',
                lineHeight: 1.4,
                marginTop: '4px',
                fontWeight: '500'
              }}>
                A.I. Content Detection
              </div>
            </div>
          </div>

          {/* Result Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '16px',
            padding: '20px 28px',
            background: config.bgGradient,
            borderRadius: '20px',
            marginBottom: '32px',
            boxShadow: `0 12px 32px ${config.color}50`,
            border: '2px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ fontSize: '48px', lineHeight: 1 }}>{config.emoji}</span>
            <div>
              <h2 style={{ 
                fontSize: '48px', 
                fontWeight: '900', 
                color: 'white',
                margin: 0,
                lineHeight: 1,
                letterSpacing: '-0.03em',
                textShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>
                {config.title}
              </h2>
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div style={{
              padding: '24px 28px',
              background: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              marginBottom: '28px',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{ 
                fontSize: '17px', 
                color: 'white',
                margin: 0,
                lineHeight: 1.6,
                fontWeight: '500'
              }}>
                {result.summary.length > 120 ? result.summary.substring(0, 120) + '...' : result.summary}
              </p>
            </div>
          )}

          {/* Signals Count */}
          {result.signals && result.signals.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '16px 24px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              marginBottom: '32px'
            }}>
              <span style={{ fontSize: '24px' }}>🔍</span>
              <span style={{
                fontSize: '15px',
                color: 'white',
                fontWeight: '600'
              }}>
                {result.signals.length} detection signal{result.signals.length !== 1 ? 's' : ''} analyzed
              </span>
            </div>
          )}

          {/* Footer */}
          <div style={{
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              fontSize: '13px', 
              color: '#94a3b8',
              lineHeight: 1.4,
              fontWeight: '500'
            }}>
              Free A.I. Detection • isthis.io{affiliateCode ? `?ref=${affiliateCode}` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}