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
        width: '100%',
        maxWidth: `${size.width}px`,
        aspectRatio: aspectRatio === '16:9' ? '16/9' : aspectRatio === '4:5' ? '4/5' : '1/1',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        position: 'relative',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: `min(${size.padding}px, 8vw)`
      }}
    >
      {/* Header - IsThis.io branding */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: `min(${16 * scale}px, 3vw)`,
        marginBottom: `min(${50 * scale}px, 8vw)`,
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        <div style={{
          width: `min(${56 * scale}px, 12vw)`,
          height: `min(${56 * scale}px, 12vw)`,
          minWidth: '40px',
          minHeight: '40px',
          borderRadius: `min(${14 * scale}px, 3vw)`,
          background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(52, 152, 219, 0.3)',
          flexShrink: 0
        }}>
          <Shield style={{ width: `min(${32 * scale}px, 7vw)`, height: `min(${32 * scale}px, 7vw)`, minWidth: '24px', minHeight: '24px', color: 'white' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontSize: `min(${32 * scale}px, 7vw)`,
            fontWeight: '900',
            color: '#0f172a',
            letterSpacing: '-0.04em',
            lineHeight: 1
          }}>
            IsThis.io
          </div>
          <div style={{
            fontSize: `min(${14 * scale}px, 3vw)`,
            color: '#64748b',
            fontWeight: '700',
            marginTop: `min(${6 * scale}px, 1vw)`,
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
        padding: `min(${56 * scale}px, 8vw) min(${48 * scale}px, 6vw)`,
        background: config.lightBg,
        borderRadius: `min(${28 * scale}px, 5vw)`,
        border: `min(4px, 0.5vw) solid ${config.color}`,
        marginBottom: `min(${44 * scale}px, 6vw)`,
        textAlign: 'center',
        boxShadow: `0 12px 40px ${config.color}30`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: `min(${24 * scale}px, 4vw)`,
          marginBottom: `min(${28 * scale}px, 5vw)`,
          flexWrap: 'wrap'
        }}>
          <Icon style={{ 
            width: `min(${70 * scale}px, 12vw)`, 
            height: `min(${70 * scale}px, 12vw)`,
            minWidth: '40px',
            minHeight: '40px',
            color: config.color,
            strokeWidth: 2.5,
            flexShrink: 0
          }} />
          <div style={{
            fontSize: `min(${64 * scale}px, 10vw)`,
            fontWeight: '900',
            color: config.darkColor,
            lineHeight: 0.95,
            letterSpacing: '-0.05em'
          }}>
            {config.title}
          </div>
        </div>
        
        {/* Confidence Indicator */}
        <div style={{
          display: 'inline-block',
          padding: `min(${14 * scale}px, 2vw) min(${28 * scale}px, 4vw)`,
          background: 'white',
          borderRadius: `min(${14 * scale}px, 2vw)`,
          border: `min(3px, 0.4vw) solid ${config.color}`,
          fontSize: `min(${22 * scale}px, 4vw)`,
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
        marginBottom: `min(${40 * scale}px, 6vw)`,
        padding: '0 2vw'
      }}>
        <div style={{
          fontSize: `min(${17 * scale}px, 3.5vw)`,
          fontWeight: '800',
          color: '#64748b',
          marginBottom: `min(${14 * scale}px, 2vw)`,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'center'
        }}>
          Why This Verdict?
        </div>
        <div style={{
          fontSize: `min(${24 * scale}px, 4.5vw)`,
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
        fontSize: `min(${16 * scale}px, 3.2vw)`,
        color: '#94a3b8',
        marginBottom: `min(${36 * scale}px, 5vw)`,
        fontWeight: '600',
        textAlign: 'center',
        padding: '0 2vw'
      }}>
        Analyzed using multiple AI detection signals
      </div>

      {/* CTA Button */}
      <div style={{
        padding: `min(${22 * scale}px, 3vw) min(${56 * scale}px, 8vw)`,
        background: 'linear-gradient(135deg, #3498DB 0%, #2C3E50 100%)',
        borderRadius: `min(${18 * scale}px, 3vw)`,
        fontSize: `min(${26 * scale}px, 4.5vw)`,
        fontWeight: '900',
        color: 'white',
        boxShadow: '0 10px 30px rgba(52, 152, 219, 0.5)',
        marginBottom: `min(${28 * scale}px, 4vw)`,
        letterSpacing: '-0.02em'
      }}>
        View Full Analysis
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '0 2vw'
      }}>
        <div style={{
          fontSize: `min(${22 * scale}px, 4vw)`,
          fontWeight: '800',
          color: '#3498DB',
          marginBottom: `min(${10 * scale}px, 1.5vw)`
        }}>
          {reportUrl}
        </div>
        {affiliateCode && (
          <div style={{
            fontSize: `min(${12 * scale}px, 2.5vw)`,
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