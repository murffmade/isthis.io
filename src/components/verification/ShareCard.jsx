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

export default function ShareCard({ result, cardRef }) {
  const config = resultConfig[result.result] || resultConfig.uncertain;
  const Icon = config.icon;

  return (
    <div 
      ref={cardRef}
      style={{ 
        width: '800px',
        height: '800px',
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
        flexDirection: 'column',
        padding: '60px'
      }}>
        {/* Header with Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '60px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)'
            }}>
              <Shield style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
            <div>
              <div style={{ 
                fontSize: '22px', 
                fontWeight: '700',
                color: 'white',
                lineHeight: 1
              }}>
                IsThis.io
              </div>
              <div style={{ 
                fontSize: '13px',
                color: '#94a3b8',
                lineHeight: 1.4,
                marginTop: '2px'
              }}>
                A.I. Detection
              </div>
            </div>
          </div>
          <div style={{
            padding: '8px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <span style={{
              fontSize: '13px',
              color: 'white',
              fontWeight: '600'
            }}>
              Verified Content
            </span>
          </div>
        </div>

        {/* Main Result Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: '28px',
          padding: '50px',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          {/* Result Icon and Title */}
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '40px'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '24px',
                background: config.bgGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 12px 30px ${config.color}40`
              }}>
                <span style={{ fontSize: '48px' }}>{config.emoji}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  fontSize: '48px', 
                  fontWeight: '800', 
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em'
                }}>
                  {config.title}
                </h2>
                <p style={{ 
                  fontSize: '22px', 
                  color: '#64748b',
                  margin: '8px 0 0 0',
                  fontWeight: '500'
                }}>
                  Analysis Complete
                </p>
              </div>
            </div>

            {/* Confidence Bar */}
            <div style={{
              background: config.lightColor,
              borderRadius: '20px',
              padding: '32px',
              marginBottom: '32px'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: '16px'
              }}>
                <span style={{ 
                  fontSize: '18px', 
                  fontWeight: '600',
                  color: '#334155'
                }}>
                  Confidence Level
                </span>
                <span style={{ 
                  fontSize: '56px', 
                  fontWeight: '800',
                  color: config.darkColor,
                  lineHeight: 1
                }}>
                  {result.confidence}%
                </span>
              </div>
              <div style={{ 
                height: '20px', 
                background: 'white',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  width: `${result.confidence}%`,
                  height: '100%',
                  background: config.bgGradient,
                  borderRadius: '10px',
                  transition: 'width 1s ease-out'
                }} />
              </div>
            </div>

            {/* Summary */}
            {result.summary && (
              <div style={{
                padding: '28px',
                background: '#f8fafc',
                borderRadius: '16px',
                border: '2px solid #e2e8f0'
              }}>
                <p style={{ 
                  fontSize: '17px', 
                  color: '#334155',
                  margin: 0,
                  lineHeight: 1.7,
                  fontWeight: '500'
                }}>
                  {result.summary.length > 200 ? result.summary.substring(0, 200) + '...' : result.summary}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: '32px',
            paddingTop: '24px',
            borderTop: '2px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#94a3b8',
              lineHeight: 1.5,
              maxWidth: '70%'
            }}>
              ⚡ Results may not be perfect. Always verify from multiple sources.
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              padding: '12px 24px',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              color: 'white',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
            }}>
              Try it free →
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}