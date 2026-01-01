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
  likely_deepfake: {
    icon: AlertTriangle,
    title: 'Likely Deepfake',
    color: '#dc2626',
    darkColor: '#7f1d1d',
    lightBg: '#fef2f2'
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
  if (confidence >= 80) return 'High Confidence';
  if (confidence >= 60) return 'Medium Confidence';
  return 'Low Confidence';
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
  
  const confidence = result.confidence || result.score || 75;
  
  const dimensions = {
    '1:1': { width: 1080, height: 1080, padding: 80, fontSize: 1 },
    '4:5': { width: 1080, height: 1350, padding: 90, fontSize: 1 },
    '16:9': { width: 1920, height: 1080, padding: 100, fontSize: 1.1 }
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
        background: '#FF0000',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `${size.padding}px`
      }}
    >
      {/* Header - IsThis.io branding */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${16 * scale}px`,
        marginBottom: `${50 * scale}px`
      }}>
        <div style={{
          width: `${56 * scale}px`,
          height: `${56 * scale}px`,
          borderRadius: `${14 * scale}px`,
          background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(52, 152, 219, 0.3)'
        }}>
          <Shield style={{ width: `${32 * scale}px`, height: `${32 * scale}px`, color: 'white' }} />
        </div>
        <div>
          <div style={{
            fontSize: `${32 * scale}px`,
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: '-0.04em',
            lineHeight: 1
          }}>
            IsThis.io
          </div>
          <div style={{
            fontSize: `${14 * scale}px`,
            color: '#64748b',
            fontWeight: '700',
            marginTop: `${6 * scale}px`,
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            AI Content Analysis
          </div>
        </div>
      </div>

      {/* Verdict Block - PRIMARY FOCAL POINT */}
      <div style={{
        width: '100%',
        maxWidth: `${850 * scale}px`,
        padding: `${56 * scale}px ${48 * scale}px`,
        background: config.lightBg,
        borderRadius: `${28 * scale}px`,
        border: `4px solid ${config.color}`,
        marginBottom: `${44 * scale}px`,
        textAlign: 'center',
        boxShadow: `0 12px 40px ${config.color}30`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `${24 * scale}px`,
          marginBottom: `${28 * scale}px`
        }}>
          <Icon style={{ 
            width: `${70 * scale}px`, 
            height: `${70 * scale}px`,
            color: config.color,
            strokeWidth: 2.5
          }} />
          <div style={{
            fontSize: `${84 * scale}px`,
            fontWeight: '900',
            color: '#00FF00',
            lineHeight: 0.95,
            letterSpacing: '-0.05em'
          }}>
            TESTING 123 BRIGHT GREEN
          </div>
        </div>
        
        {/* Confidence Indicator */}
        <div style={{
          display: 'inline-block',
          padding: `${14 * scale}px ${28 * scale}px`,
          background: 'white',
          borderRadius: `${14 * scale}px`,
          border: `3px solid ${config.color}`,
          fontSize: `${22 * scale}px`,
          fontWeight: '800',
          color: config.darkColor
        }}>
          {getConfidenceLabel(confidence)} ({confidence}%)
        </div>
      </div>

      {/* Why This Verdict - Single sentence */}
      <div style={{
        width: '100%',
        maxWidth: `${850 * scale}px`,
        marginBottom: `${40 * scale}px`
      }}>
        <div style={{
          fontSize: `${17 * scale}px`,
          fontWeight: '800',
          color: '#64748b',
          marginBottom: `${14 * scale}px`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'center'
        }}>
          Why This Verdict?
        </div>
        <div style={{
          fontSize: `${24 * scale}px`,
          color: '#1e293b',
          lineHeight: 1.4,
          fontWeight: '600',
          textAlign: 'center'
        }}>
          {getOneLineSummary(result)}
        </div>
      </div>

      {/* Trust Line */}
      <div style={{
        fontSize: `${16 * scale}px`,
        color: '#94a3b8',
        marginBottom: `${36 * scale}px`,
        fontWeight: '600',
        textAlign: 'center'
      }}>
        Analyzed using multiple AI detection signals
      </div>

      {/* CTA Button */}
      <div style={{
        padding: `${22 * scale}px ${56 * scale}px`,
        background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
        borderRadius: `${18 * scale}px`,
        fontSize: `${26 * scale}px`,
        fontWeight: '900',
        color: 'white',
        boxShadow: '0 10px 30px rgba(52, 152, 219, 0.5)',
        marginBottom: `${28 * scale}px`,
        letterSpacing: '-0.02em'
      }}>
        View Full Analysis
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: `${22 * scale}px`,
          fontWeight: '800',
          color: '#3498DB',
          marginBottom: `${10 * scale}px`
        }}>
          {reportUrl}
        </div>
        {affiliateCode && (
          <div style={{
            fontSize: `${12 * scale}px`,
            color: '#94a3b8',
            fontWeight: '600'
          }}>
            Creators may earn referral credit
          </div>
        )}
      </div>
    </div>
  );
}