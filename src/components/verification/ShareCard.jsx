import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

const resultConfig = {
  likely_real: {
    icon: CheckCircle2,
    title: 'Likely Real',
    color: '#059669',
    bgGradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)'
  },
  likely_ai: {
    icon: AlertTriangle,
    title: 'Likely AI-Generated',
    color: '#d97706',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)'
  },
  uncertain: {
    icon: HelpCircle,
    title: 'Uncertain',
    color: '#475569',
    bgGradient: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
  }
};

export default function ShareCard({ result, cardRef }) {
  const config = resultConfig[result.result] || resultConfig.uncertain;
  const Icon = config.icon;

  return (
    <div 
      ref={cardRef}
      style={{ 
        width: '600px', 
        background: config.bgGradient,
        padding: '48px',
        borderRadius: '24px',
        position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
    >
      {/* Content */}
      <div style={{ 
        background: 'white', 
        borderRadius: '20px', 
        padding: '40px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: config.color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Icon style={{ width: '32px', height: '32px', color: 'white' }} />
          </div>
          <div>
            <h2 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              color: config.color,
              margin: 0,
              lineHeight: 1.2
            }}>
              {config.title}
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#64748b',
              margin: '4px 0 0 0'
            }}>
              Content Verification Result
            </p>
          </div>
        </div>

        {/* Confidence */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '500',
              color: '#334155'
            }}>
              Confidence Estimate
            </span>
            <span style={{ 
              fontSize: '28px', 
              fontWeight: '700',
              color: config.color
            }}>
              {result.confidence}%
            </span>
          </div>
          <div style={{ 
            height: '12px', 
            background: '#f1f5f9',
            borderRadius: '6px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${result.confidence}%`,
              height: '100%',
              background: config.color,
              borderRadius: '6px'
            }} />
          </div>
        </div>

        {/* Summary */}
        {result.summary && (
          <div style={{
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            marginBottom: '24px'
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: '#475569',
              margin: 0,
              lineHeight: 1.6
            }}>
              {result.summary}
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <div style={{ 
          fontSize: '11px', 
          color: '#94a3b8',
          lineHeight: 1.5,
          borderTop: '1px solid #e2e8f0',
          paddingTop: '16px'
        }}>
          AI analysis isn't perfect and may be wrong. Always check multiple sources.
        </div>
      </div>

      {/* Watermark */}
      <div style={{ 
        position: 'absolute',
        bottom: '20px',
        right: '48px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: 0.7
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Shield style={{ width: '16px', height: '16px', color: 'white' }} />
        </div>
        <div>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: '700',
            color: '#1e293b',
            lineHeight: 1
          }}>
            Is This Real?
          </div>
          <div style={{ 
            fontSize: '10px',
            color: '#64748b',
            lineHeight: 1
          }}>
            AI Content Verification
          </div>
        </div>
      </div>
    </div>
  );
}