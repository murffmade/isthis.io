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
            {/* Analyzed Image */}
            {(result.file_url || result.thumbnail_url) && (
              <div style={{
                marginBottom: '32px',
                borderRadius: '20px',
                overflow: 'hidden',
                border: '3px solid #e2e8f0',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)'
              }}>
                <img 
                  src={result.file_url || result.thumbnail_url}
                  alt="Analyzed content"
                  style={{
                    width: '100%',
                    height: '280px',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                />
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: config.bgGradient,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 8px 24px ${config.color}40`
              }}>
                <span style={{ fontSize: '40px' }}>{config.emoji}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  fontSize: '40px', 
                  fontWeight: '800', 
                  color: '#0f172a',
                  margin: 0,
                  lineHeight: 1.1,
                  letterSpacing: '-0.02em'
                }}>
                  {config.title}
                </h2>
                <p style={{ 
                  fontSize: '20px', 
                  color: '#64748b',
                  margin: '6px 0 0 0',
                  fontWeight: '500'
                }}>
                  {result.confidence}% Confidence
                </p>
              </div>
            </div>

            {/* Brief Summary */}
            {result.summary && (
              <div style={{
                padding: '24px',
                background: config.lightColor,
                borderRadius: '16px',
                border: `2px solid ${config.color}30`,
                marginBottom: '24px'
              }}>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#334155',
                  margin: 0,
                  lineHeight: 1.6,
                  fontWeight: '500'
                }}>
                  {result.summary.length > 150 ? result.summary.substring(0, 150) + '...' : result.summary}
                </p>
              </div>
            )}

            {/* Key Signals Count */}
            {result.signals && result.signals.length > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 24px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '2px solid #e2e8f0'
              }}>
                <span style={{ fontSize: '24px' }}>🔍</span>
                <span style={{
                  fontSize: '15px',
                  color: '#475569',
                  fontWeight: '600'
                }}>
                  {result.signals.length} detection signal{result.signals.length !== 1 ? 's' : ''} analyzed
                </span>
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
              fontSize: '13px', 
              color: '#94a3b8',
              lineHeight: 1.5,
              maxWidth: '55%'
            }}>
              ⚡ Results may not be perfect. Always verify from multiple sources.
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '6px'
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#6366f1'
              }}>
                isthis.io
              </div>
              <div style={{
                fontSize: '12px',
                color: '#94a3b8',
                fontWeight: '500'
              }}>
                Free A.I. Detection Tool
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}