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
  const hasImage = result.file_url || result.thumbnail_url;
  
  return (
    <div 
      ref={cardRef}
      style={{ 
        width: '1200px',
        height: '630px',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Animated background pattern */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 15% 25%, ${config.color}20 0%, transparent 45%),
          radial-gradient(circle at 85% 75%, ${config.color}15 0%, transparent 45%),
          radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 70%)
        `,
        opacity: 0.8
      }} />

      {/* Geometric decorations */}
      <div style={{
        position: 'absolute',
        top: '-100px',
        right: '-100px',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        border: `2px solid ${config.color}30`,
        opacity: 0.3
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-120px',
        left: '-120px',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        border: `2px solid ${config.color}25`,
        opacity: 0.25
      }} />

      {/* Main content container */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: hasImage ? 'row' : 'column',
        padding: hasImage ? '40px' : '60px',
        gap: hasImage ? '40px' : '0'
      }}>
        {/* Left side: Image (if present) */}
        {hasImage && (
          <div style={{
            flex: '0 0 520px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              maxHeight: '550px',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: `0 20px 50px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), 0 0 60px ${config.color}35`,
              position: 'relative'
            }}>
              <img 
                src={result.file_url || result.thumbnail_url}
                alt="Analyzed content"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block'
                }}
                crossOrigin="anonymous"
              />
              {/* Image overlay gradient */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: `linear-gradient(to top, ${config.color}20 0%, transparent 40%)`,
                pointerEvents: 'none'
              }} />
            </div>
          </div>
        )}

        {/* Right side: Content */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: hasImage ? '28px' : '48px',
          paddingLeft: hasImage ? '10px' : '0'
        }}>
          {/* Logo & Branding */}
          <div style={{ marginBottom: hasImage ? '0' : '20px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '12px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(52, 152, 219, 0.35)'
              }}>
                <Shield style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <div>
                <div style={{
                  fontSize: hasImage ? '34px' : '52px',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.04em',
                  lineHeight: 1
                }}>
                  IsThis.io
                </div>
                <div style={{
                  fontSize: hasImage ? '13px' : '18px',
                  color: '#94a3b8',
                  fontWeight: '600',
                  marginTop: '4px',
                  letterSpacing: '0.02em'
                }}>
                  AI Content Assessment
                </div>
              </div>
            </div>
          </div>

          {/* Verdict Badge */}
          <div style={{
            padding: hasImage ? '32px 36px' : '48px 56px',
            background: config.bgGradient,
            borderRadius: '20px',
            boxShadow: `0 20px 40px ${config.color}55, 0 0 0 1px rgba(255,255,255,0.15)`,
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Inner glow */}
            <div style={{
              position: 'absolute',
              inset: 0,
              background: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
              pointerEvents: 'none'
            }} />
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <Icon style={{ 
                  width: hasImage ? '44px' : '64px', 
                  height: hasImage ? '44px' : '64px',
                  color: 'white',
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
                }} />
                <div style={{
                  fontSize: hasImage ? '46px' : '68px',
                  fontWeight: '900',
                  color: 'white',
                  lineHeight: 1,
                  letterSpacing: '-0.05em',
                  textShadow: '0 4px 16px rgba(0,0,0,0.25)'
                }}>
                  {config.title}
                </div>
              </div>
              <div style={{
                fontSize: hasImage ? '22px' : '32px',
                color: 'rgba(255,255,255,0.95)',
                fontWeight: '700',
                letterSpacing: '-0.02em'
              }}>
                {result.confidence}% Confidence
              </div>
            </div>
          </div>

          {/* Summary Box */}
          {result.summary && (
            <div style={{
              padding: hasImage ? '20px 24px' : '32px 40px',
              background: 'rgba(255, 255, 255, 0.06)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                fontSize: hasImage ? '15px' : '20px',
                color: 'rgba(255, 255, 255, 0.92)',
                lineHeight: 1.5,
                fontWeight: '500',
                letterSpacing: '-0.01em'
              }}>
                {result.summary.length > (hasImage ? 120 : 160) 
                  ? result.summary.substring(0, hasImage ? 120 : 160) + '...' 
                  : result.summary}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: hasImage ? '12px' : '20px',
            borderTop: '1px solid rgba(255,255,255,0.08)'
          }}>
            <div style={{
              fontSize: hasImage ? '13px' : '16px',
              color: '#64748b',
              fontWeight: '600',
              letterSpacing: '0.02em'
            }}>
              🆓 Free AI Assessment Tool
            </div>
            <div style={{
              fontSize: hasImage ? '14px' : '17px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              isthis.io{affiliateCode ? `?ref=${affiliateCode}` : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Scan line animation effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: `linear-gradient(90deg, transparent 0%, ${config.color} 50%, transparent 100%)`,
        opacity: 0.4
      }} />
    </div>
  );
}