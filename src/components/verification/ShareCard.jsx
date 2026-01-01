import React from 'react';
import { Shield, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';

const resultConfig = {
  likely_real: {
    icon: CheckCircle2,
    title: 'Likely Human-Created',
    color: '#10b981',
    darkColor: '#065f46',
    lightBg: '#ecfdf5'
  },
  likely_ai: {
    icon: AlertTriangle,
    title: 'Likely AI-Generated',
    color: '#f59e0b',
    darkColor: '#92400e',
    lightBg: '#fffbeb'
  },
  uncertain: {
    icon: HelpCircle,
    title: 'Mixed/Uncertain',
    color: '#64748b',
    darkColor: '#1e293b',
    lightBg: '#f8fafc'
  }
};

const getConfidenceLabel = (confidence) => {
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Medium';
  return 'Low';
};

const getOneLineSummary = (result) => {
  if (result.summary) {
    const firstSentence = result.summary.split('.')[0];
    return firstSentence.length > 100 ? firstSentence.substring(0, 100) + '...' : firstSentence + '.';
  }
  return 'Multiple AI detection signals analyzed to determine content origin.';
};

export default function ShareCard({ result, cardRef, affiliateCode, aspectRatio = '1:1' }) {
  const config = resultConfig[result.result] || resultConfig.uncertain;
  const Icon = config.icon;
  
  // Calculate confidence from result
  const confidence = result.confidence || result.score || 75;
  
  const dimensions = {
    '1:1': { width: 1080, height: 1080, padding: 60, fontSize: 1 },
    '4:5': { width: 1080, height: 1350, padding: 70, fontSize: 1 },
    '16:9': { width: 1920, height: 1080, padding: 80, fontSize: 1.1 }
  };
  
  const size = dimensions[aspectRatio] || dimensions['1:1'];
  const scale = size.fontSize;
  const reportUrl = `isthis.io${affiliateCode ? `?ref=${affiliateCode}` : ''}`;
  
  return (
    <div 
      ref={cardRef}
      style={{ 
        width: `${size.width}px`,
        height: `${size.height}px`,
        background: '#ffffff',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${size.padding}px`
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${14 * scale}px`,
        marginBottom: `${40 * scale}px`
      }}>
        <div style={{
          width: `${48 * scale}px`,
          height: `${48 * scale}px`,
          borderRadius: `${12 * scale}px`,
          background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(52, 152, 219, 0.25)'
        }}>
          <Shield style={{ width: `${28 * scale}px`, height: `${28 * scale}px`, color: 'white' }} />
        </div>
        <div>
          <div style={{
            fontSize: `${28 * scale}px`,
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: '-0.03em',
            lineHeight: 1
          }}>
            IsThis.io
          </div>
          <div style={{
            fontSize: `${13 * scale}px`,
            color: '#64748b',
            fontWeight: '600',
            marginTop: `${4 * scale}px`,
            letterSpacing: '0.03em',
            textTransform: 'uppercase'
          }}>
            AI Content Analysis
          </div>
        </div>
      </div>

      {/* Verdict Block - Primary Focal Point */}
      <div style={{
        width: '100%',
        maxWidth: `${800 * scale}px`,
        padding: `${48 * scale}px ${40 * scale}px`,
        background: config.lightBg,
        borderRadius: `${24 * scale}px`,
        border: `3px solid ${config.color}`,
        marginBottom: `${36 * scale}px`,
        textAlign: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${20 * scale}px`,
          marginBottom: `${20 * scale}px`
        }}>
          <Icon style={{ 
            width: `${60 * scale}px`, 
            height: `${60 * scale}px`,
            color: config.color
          }} />
          <div style={{
            fontSize: `${56 * scale}px`,
            fontWeight: '900',
            color: config.darkColor,
            lineHeight: 1,
            letterSpacing: '-0.04em'
          }}>
            {config.title}
          </div>
        </div>
        
        {/* Confidence Meter */}
        <div style={{
          display: 'inline-block',
          padding: `${12 * scale}px ${24 * scale}px`,
          background: 'white',
          borderRadius: `${12 * scale}px`,
          border: `2px solid ${config.color}`,
          fontSize: `${20 * scale}px`,
          fontWeight: '700',
          color: config.darkColor
        }}>
          {getConfidenceLabel(confidence)} • {confidence}%
        </div>
      </div>

      {/* Why This Verdict */}
      <div style={{
        width: '100%',
        maxWidth: `${800 * scale}px`,
        marginBottom: `${36 * scale}px`
      }}>
        <div style={{
          fontSize: `${16 * scale}px`,
          fontWeight: '700',
          color: '#64748b',
          marginBottom: `${12 * scale}px`,
          textTransform: 'uppercase',
          letterSpacing: '0.08em'
        }}>
          Why This Verdict?
        </div>
        <div style={{
          fontSize: `${22 * scale}px`,
          color: '#1e293b',
          lineHeight: 1.5,
          fontWeight: '500'
        }}>
          {getOneLineSummary(result)}
        </div>
      </div>

      {/* Trust Line */}
      <div style={{
        fontSize: `${15 * scale}px`,
        color: '#94a3b8',
        marginBottom: `${32 * scale}px`,
        fontWeight: '500'
      }}>
        Analyzed using multiple AI detection signals
      </div>

      {/* CTA Button */}
      <div style={{
        padding: `${20 * scale}px ${48 * scale}px`,
        background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
        borderRadius: `${16 * scale}px`,
        fontSize: `${24 * scale}px`,
        fontWeight: '800',
        color: 'white',
        boxShadow: '0 8px 24px rgba(52, 152, 219, 0.4)',
        marginBottom: `${24 * scale}px`,
        letterSpacing: '-0.02em'
      }}>
        View Full Analysis
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: `${20 * scale}px`,
          fontWeight: '700',
          color: '#3498DB',
          marginBottom: `${8 * scale}px`
        }}>
          {reportUrl}
        </div>
        {affiliateCode && (
          <div style={{
            fontSize: `${11 * scale}px`,
            color: '#94a3b8',
            fontWeight: '500'
          }}>
            Creators may earn referral credit
          </div>
        )}
      </div>
    </div>
  );
}