import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Flag, Copy, Check, ChevronLeft, ExternalLink, 
  MessageSquare, FileText, AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const platformReportLinks = {
  twitter: {
    name: 'X (Twitter)',
    links: [
      { label: 'Report Misleading Media', url: 'https://help.twitter.com/en/rules-and-policies/synthetic-and-manipulated-media-policy' },
      { label: 'Report Impersonation', url: 'https://help.twitter.com/forms/impersonation' },
    ]
  },
  instagram: {
    name: 'Instagram',
    links: [
      { label: 'Report Content', url: 'https://help.instagram.com/192435014247952' },
      { label: 'Report Impersonation', url: 'https://help.instagram.com/370054663112398' },
    ]
  },
  facebook: {
    name: 'Facebook',
    links: [
      { label: 'Report False Information', url: 'https://www.facebook.com/help/572838089565953' },
      { label: 'Report Impersonation', url: 'https://www.facebook.com/help/174210519303259' },
    ]
  },
  tiktok: {
    name: 'TikTok',
    links: [
      { label: 'Report Content', url: 'https://support.tiktok.com/en/safety-hc/report-a-problem' },
      { label: 'Report Impersonation', url: 'https://support.tiktok.com/en/safety-hc/account-and-user-safety/impersonation-accounts' },
    ]
  },
  youtube: {
    name: 'YouTube',
    links: [
      { label: 'Report Misleading Content', url: 'https://support.google.com/youtube/answer/2802027' },
      { label: 'Report Impersonation', url: 'https://support.google.com/youtube/answer/2801947' },
    ]
  },
  unknown: {
    name: 'General',
    links: [
      { label: 'FTC Report Fraud', url: 'https://reportfraud.ftc.gov/' },
      { label: 'IC3 Cybercrime Complaint', url: 'https://www.ic3.gov/' },
    ]
  }
};

const toneOptions = [
  { id: 'neutral', label: 'Neutral', description: 'Factual and objective' },
  { id: 'concerned', label: 'Concerned', description: 'Express worry about impact' },
  { id: 'formal', label: 'Formal', description: 'Professional and detailed' },
];

export default function ActionPanel({ result, onBack }) {
  const [selectedTone, setSelectedTone] = useState('neutral');
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDraftPanel, setShowDraftPanel] = useState(false);

  const platform = platformReportLinks[result.platform] || platformReportLinks.unknown;

  const generateReportDraft = () => {
    const signalSummary = result.signals?.map(s => s.description).join('; ') || 'suspicious visual artifacts detected';
    
    const templates = {
      neutral: `I would like to report content that appears to be AI-generated while being presented as authentic. Analysis indicates: ${signalSummary}. The confidence level is ${result.confidence}%.`,
      concerned: `I am concerned about content that appears to be AI-generated and may be misleading viewers. My analysis found: ${signalSummary}. This content may be contributing to misinformation and I believe it warrants review.`,
      formal: `I am submitting a formal report regarding potentially synthetic media. Upon analysis, the following indicators of AI generation were identified: ${signalSummary}. The estimated confidence level is ${result.confidence}%. I request that this content be reviewed for potential policy violations regarding synthetic and manipulated media.`
    };

    setReportText(templates[selectedTone]);
    setShowDraftPanel(true);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(reportText);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Header */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to results</span>
      </button>

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Report Options</h2>
        <p className="text-slate-500">
          Choose how you'd like to take action on this content
        </p>
      </div>

      {/* Platform-Specific Reporting */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <Flag className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Report to {platform.name}</h3>
            <p className="text-sm text-slate-500">Direct reporting links</p>
          </div>
        </div>

        <div className="space-y-2">
          {platform.links.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors group"
            >
              <span className="font-medium text-slate-700">{link.label}</span>
              <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
            </a>
          ))}
        </div>
      </div>

      {/* Report Draft Generator */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Draft a Report</h3>
            <p className="text-sm text-slate-500">Generate a message to include with your report</p>
          </div>
        </div>

        {!showDraftPanel ? (
          <>
            <p className="text-sm text-slate-600 mb-4">Select a tone for your report:</p>
            <div className="grid gap-2 mb-5">
              {toneOptions.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => setSelectedTone(tone.id)}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    selectedTone === tone.id 
                      ? 'border-slate-900 bg-slate-50' 
                      : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-slate-700">{tone.label}</p>
                    <p className="text-sm text-slate-500">{tone.description}</p>
                  </div>
                  {selectedTone === tone.id && (
                    <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            <Button 
              onClick={generateReportDraft}
              className="w-full h-12 bg-slate-900 hover:bg-slate-800"
            >
              Generate Draft
            </Button>
          </>
        ) : (
          <>
            <Textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="min-h-[140px] mb-4 border-slate-200"
              placeholder="Your report text..."
            />
            <div className="flex gap-3">
              <Button 
                onClick={copyToClipboard}
                className="flex-1 h-11 bg-slate-900 hover:bg-slate-800"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button 
                onClick={() => setShowDraftPanel(false)}
                variant="outline"
                className="h-11"
              >
                Reset
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Evidence Summary */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
            <FileText className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Evidence Summary</h3>
            <p className="text-sm text-slate-500">Share with moderators or investigators</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed">
          <p className="mb-2"><strong>Result:</strong> {result.result === 'likely_ai' ? 'Likely AI-Generated' : result.result}</p>
          <p className="mb-2"><strong>Confidence:</strong> {result.confidence}%</p>
          <p className="mb-2"><strong>Signals detected:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-slate-500">
            {result.signals?.map((signal, i) => (
              <li key={i}>{signal.description}</li>
            ))}
          </ul>
        </div>

        <Button 
          onClick={async () => {
            const summary = `Analysis Result: ${result.result}\nConfidence: ${result.confidence}%\nSignals: ${result.signals?.map(s => s.description).join(', ')}`;
            await navigator.clipboard.writeText(summary);
            toast.success('Summary copied');
          }}
          variant="outline"
          className="w-full mt-4 h-11"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy Summary
        </Button>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 mt-6">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Please report responsibly. False reports may have consequences. This tool provides analysis assistance only and does not make accusations or legal determinations.
        </p>
      </div>
    </motion.div>
  );
}