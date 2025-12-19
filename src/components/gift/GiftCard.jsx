import React from 'react';
import { Shield, Gift, Sparkles } from 'lucide-react';

const holidayThemes = {
  christmas: {
    gradient: 'linear-gradient(135deg, #dc2626 0%, #059669 100%)',
    accentColor: '#dc2626',
    emoji: '🎄',
    greeting: 'Merry Christmas!'
  },
  hanukkah: {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #eff6ff 100%)',
    accentColor: '#3b82f6',
    emoji: '🕎',
    greeting: 'Happy Hanukkah!'
  },
  kwanzaa: {
    gradient: 'linear-gradient(135deg, #dc2626 0%, #059669 50%, #000000 100%)',
    accentColor: '#059669',
    emoji: '🕯️',
    greeting: 'Happy Kwanzaa!'
  },
  general: {
    gradient: 'linear-gradient(135deg, #0f172a 0%, #334155 100%)',
    accentColor: '#0f172a',
    emoji: '🎁',
    greeting: 'Happy Holidays!'
  }
};

export default function GiftCard({ theme = 'general', plan, recipientName, message, cardRef }) {
  const themeStyle = holidayThemes[theme];

  return (
    <div
      ref={cardRef}
      style={{
        width: '650px',
        background: themeStyle.gradient,
        padding: '48px',
        borderRadius: '24px',
        position: 'relative',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Elements */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        fontSize: '48px',
        opacity: 0.3
      }}>
        {themeStyle.emoji}
      </div>
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        fontSize: '48px',
        opacity: 0.3
      }}>
        {themeStyle.emoji}
      </div>

      {/* Card Content */}
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '40px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            fontSize: '36px',
            marginBottom: '12px'
          }}>
            {themeStyle.emoji}
          </div>
          <h2 style={{
            fontSize: '32px',
            fontWeight: '700',
            color: themeStyle.accentColor,
            margin: 0,
            marginBottom: '8px'
          }}>
            {themeStyle.greeting}
          </h2>
          {recipientName && (
            <p style={{
              fontSize: '18px',
              color: '#64748b',
              margin: 0
            }}>
              {recipientName}
            </p>
          )}
        </div>

        {/* Gift Box */}
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: themeStyle.accentColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Gift style={{ width: '24px', height: '24px', color: 'white' }} />
            </div>
          </div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
            marginBottom: '8px'
          }}>
            Is This Real? Premium
          </h3>
          <p style={{
            fontSize: '16px',
            fontWeight: '600',
            color: themeStyle.accentColor,
            margin: 0
          }}>
            {plan.duration} of Full Access
          </p>
        </div>

        {/* Personal Message */}
        {message && (
          <div style={{
            padding: '20px',
            background: '#fefce8',
            borderLeft: `4px solid ${themeStyle.accentColor}`,
            borderRadius: '8px',
            marginBottom: '24px'
          }}>
            <p style={{
              fontSize: '14px',
              color: '#475569',
              margin: 0,
              fontStyle: 'italic',
              lineHeight: 1.6
            }}>
              "{message}"
            </p>
          </div>
        )}

        {/* What's Included */}
        <div style={{
          marginBottom: '24px'
        }}>
          <h4 style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            What's Included:
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '13px',
            color: '#64748b'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles style={{ width: '14px', height: '14px', color: themeStyle.accentColor }} />
              Unlimited verifications
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles style={{ width: '14px', height: '14px', color: themeStyle.accentColor }} />
              Priority analysis
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles style={{ width: '14px', height: '14px', color: themeStyle.accentColor }} />
              Advanced detection
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles style={{ width: '14px', height: '14px', color: themeStyle.accentColor }} />
              Export reports
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div style={{
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '20px'
        }}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: '600',
            color: '#334155',
            marginBottom: '12px'
          }}>
            How It Works:
          </h4>
          <ol style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '12px',
            color: '#64748b',
            lineHeight: 1.8
          }}>
            <li>Visit IsThisReal.com and create your account</li>
            <li>Upload images, videos, or paste URLs to analyze</li>
            <li>Get instant AI-powered verification results</li>
            <li>Share findings and keep truth at your fingertips</li>
          </ol>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          paddingTop: '16px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Shield style={{ width: '14px', height: '14px', color: 'white' }} />
          </div>
          <div style={{ fontSize: '11px', color: '#94a3b8' }}>
            <div style={{ fontWeight: '700', color: '#475569' }}>Is This Real?</div>
            <div>AI Content Verification</div>
          </div>
        </div>
      </div>
    </div>
  );
}