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
  
  return (
    <div 
      ref={cardRef}
      style={{ 
        width: '1200px',
        height: '630px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        position: 'relative',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle at 30% 30%, ${config.color}15 0%, transparent 60%)`,
        opacity: 0.6
      }} />

      {/* Main content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        height: '100%',
        display: 'flex',
        padding: '60px'
      }}>
        {/* Left: Image */}
        {(result.file_url || result.thumbnail_url) && (
          <div style={{
            width: '480px',
            display: 'flex',
            alignItems: 'center',
            marginRight: '60px'
          }}>
            <div style={{
              width: '100%',
              height: '480px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              border: '3px solid rgba(255,255,255,0.1)'
            }}>
              <img 
                src={result.file_url || result.thumbnail_url}
                alt="Analyzed"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                crossOrigin="anonymous"
              />
            </div>
          </div>
        )}

        {/* Right: Info */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '40px'
        }}>
          {/* Branding */}
          <div>
            <div style={{
              fontSize: '42px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '8px',
              letterSpacing: '-0.03em'
            }}>
              IsThis.io
            </div>
            <div style={{
              fontSize: '16px',
              color: '#94a3b8',
              fontWeight: '600'
            }}>
              AI Content Verification
            </div>
          </div>

          {/* Result */}
          <div style={{
            padding: '32px 40px',
            background: config.bgGradient,
            borderRadius: '20px',
            boxShadow: `0 20px 40px ${config.color}40`,
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            <div style={{
              fontSize: '56px',
              fontWeight: '900',
              color: 'white',
              lineHeight: 1.1,
              letterSpacing: '-0.04em',
              textShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {config.title}
            </div>
            <div style={{
              fontSize: '22px',
              color: 'rgba(255,255,255,0.95)',
              marginTop: '12px',
              fontWeight: '600'
            }}>
              {result.confidence}% confidence
            </div>
          </div>

          {/* Summary */}
          {result.summary && (
            <div style={{
              padding: '28px 32px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{
                fontSize: '18px',
                color: 'white',
                lineHeight: 1.6,
                fontWeight: '500',
                opacity: 0.95
              }}>
                {result.summary.length > 140 ? result.summary.substring(0, 140) + '...' : result.summary}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            fontSize: '15px',
            color: '#64748b',
            fontWeight: '600'
          }}>
            Free AI Detection Tool • isthis.io{affiliateCode ? `?ref=${affiliateCode}` : ''}
          </div>
        </div>
      </div>
    </div>
  );
}