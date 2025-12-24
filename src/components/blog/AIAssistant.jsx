import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Sparkles, Loader2, List, FileText, Wand2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function AIAssistant({ 
  title, 
  outline, 
  body, 
  metadata,
  onTitleGenerated, 
  onOutlineGenerated, 
  onBodyGenerated,
  onInsertAtCursor 
}) {
  const [titleOptions, setTitleOptions] = useState([]);
  const [customPrompt, setCustomPrompt] = useState('');

  // Generate title options
  const generateTitleMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate 5 compelling, clear article titles about: ${metadata.topic || 'the given topic'}.

Audience level: ${metadata.audience_level}
Tone: ${metadata.tone}

Requirements:
- Clear and specific
- SEO-friendly
- Engaging but not clickbait
- 50-70 characters ideal
- Include key terms

Return 5 diverse title options.`,
        response_json_schema: {
          type: "object",
          properties: {
            titles: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });
      return result.titles;
    },
    onSuccess: (titles) => {
      setTitleOptions(titles);
      toast.success('Title options generated');
    }
  });

  // Generate outline from title
  const generateOutlineMutation = useMutation({
    mutationFn: async () => {
      if (!title) {
        toast.error('Please set a title first');
        return;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Create a detailed article outline for: "${title}"

Audience level: ${metadata.audience_level}
Tone: ${metadata.tone}
Learning mode: ${metadata.learning_mode ? 'Yes - include explanatory sections' : 'No'}

Create a logical, well-structured outline with:
- Introduction
- 3-5 main sections
- 2-3 subsections under each main section
- Conclusion

Each item should be a clear heading that will become a section in the article.`,
        response_json_schema: {
          type: "object",
          properties: {
            outline: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  level: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Add IDs and order
      return result.outline.map((item, idx) => ({
        id: `outline-${Date.now()}-${idx}`,
        text: item.text,
        level: item.level,
        order: idx
      }));
    },
    onSuccess: (generatedOutline) => {
      onOutlineGenerated(generatedOutline);
      toast.success('Outline generated');
    }
  });

  // Generate full article from outline
  const generateArticleMutation = useMutation({
    mutationFn: async () => {
      if (!title || !outline || outline.length === 0) {
        toast.error('Please set a title and outline first');
        return;
      }

      const outlineText = outline.map(item => 
        `${'  '.repeat(item.level - 1)}${item.text}`
      ).join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Write a comprehensive article based on this title and outline:

TITLE: ${title}

OUTLINE:
${outlineText}

PARAMETERS:
- Audience level: ${metadata.audience_level}
- Tone: ${metadata.tone}
- Learning mode: ${metadata.learning_mode}

INSTRUCTIONS:
- Follow the outline structure exactly
- Write detailed, valuable content for each section
- Use clear, ${metadata.tone} language
- Target ${metadata.audience_level} level readers
${metadata.learning_mode ? '- Include explanatory callouts and examples' : ''}
- Use proper formatting (headings, paragraphs, lists)
- Aim for 800-1500 words total

Return the article in HTML format with proper heading tags (h1, h2, h3) matching the outline structure.`
      });

      return result;
    },
    onSuccess: (generatedArticle) => {
      onBodyGenerated(generatedArticle);
      toast.success('Article generated');
    }
  });

  // Contextual AI actions
  const contextualActionMutation = useMutation({
    mutationFn: async ({ action, selectedText }) => {
      let prompt = '';
      
      switch (action) {
        case 'expand':
          prompt = `Expand this section with more detail and examples:\n\n${selectedText || body.substring(0, 500)}`;
          break;
        case 'simplify':
          prompt = `Simplify this text for easier understanding:\n\n${selectedText || body.substring(0, 500)}`;
          break;
        case 'technical':
          prompt = `Make this text more technical and detailed:\n\n${selectedText || body.substring(0, 500)}`;
          break;
        case 'examples':
          prompt = `Add 2-3 concrete examples to illustrate this content:\n\n${selectedText || body.substring(0, 500)}`;
          break;
        case 'summary':
          prompt = `Create a concise summary of this content:\n\n${selectedText || body.substring(0, 500)}`;
          break;
      }

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: prompt + `\n\nTone: ${metadata.tone}\nAudience: ${metadata.audience_level}\n\nReturn the improved content in HTML format.`
      });

      return result;
    },
    onSuccess: (result) => {
      onInsertAtCursor(result);
      toast.success('Content generated');
    }
  });

  return (
    <div className="h-full flex flex-col p-6">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          AI Assistant
        </h2>
        <p className="text-sm text-slate-600">
          Generate and enhance content intelligently
        </p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto">
        {/* Step 1: Title Generation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">1</span>
            Generate Title
          </h3>
          
          {!title && (
            <Button
              onClick={() => generateTitleMutation.mutate()}
              disabled={generateTitleMutation.isPending}
              size="sm"
              className="w-full mb-3 bg-indigo-600 hover:bg-indigo-700"
            >
              {generateTitleMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Generate Title Options</>
              )}
            </Button>
          )}

          {titleOptions.length > 0 && (
            <div className="space-y-2">
              {titleOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onTitleGenerated(option);
                    setTitleOptions([]);
                  }}
                  className="w-full text-left p-3 text-sm border border-slate-200 rounded-lg hover:border-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {title && (
            <div className="text-sm text-emerald-600 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
              Title set
            </div>
          )}
        </div>

        {/* Step 2: Outline Generation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">2</span>
            Generate Outline
          </h3>
          
          {title && outline.length === 0 && (
            <Button
              onClick={() => generateOutlineMutation.mutate()}
              disabled={generateOutlineMutation.isPending || !title}
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {generateOutlineMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><List className="w-4 h-4 mr-2" /> Generate from Title</>
              )}
            </Button>
          )}

          {outline.length > 0 && (
            <div className="text-sm text-emerald-600 flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </span>
              Outline created ({outline.length} sections)
            </div>
          )}
        </div>

        {/* Step 3: Article Generation */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center">3</span>
            Generate Article
          </h3>
          
          {title && outline.length > 0 && (
            <Button
              onClick={() => generateArticleMutation.mutate()}
              disabled={generateArticleMutation.isPending || !title || outline.length === 0}
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {generateArticleMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><FileText className="w-4 h-4 mr-2" /> Generate from Outline</>
              )}
            </Button>
          )}
        </div>

        {/* Contextual Actions */}
        {body && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => contextualActionMutation.mutate({ action: 'expand' })}
                disabled={contextualActionMutation.isPending}
                size="sm"
                variant="outline"
              >
                <Wand2 className="w-3 h-3 mr-1" />
                Expand
              </Button>
              <Button
                onClick={() => contextualActionMutation.mutate({ action: 'simplify' })}
                disabled={contextualActionMutation.isPending}
                size="sm"
                variant="outline"
              >
                Simplify
              </Button>
              <Button
                onClick={() => contextualActionMutation.mutate({ action: 'technical' })}
                disabled={contextualActionMutation.isPending}
                size="sm"
                variant="outline"
              >
                Technical
              </Button>
              <Button
                onClick={() => contextualActionMutation.mutate({ action: 'examples' })}
                disabled={contextualActionMutation.isPending}
                size="sm"
                variant="outline"
              >
                Examples
              </Button>
            </div>
          </div>
        )}

        {/* Custom Prompt */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Custom Request</h3>
          <Textarea
            placeholder="Ask AI to modify or add content..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="mb-2"
          />
          <Button
            onClick={() => {
              contextualActionMutation.mutate({ action: 'custom', selectedText: customPrompt });
              setCustomPrompt('');
            }}
            disabled={!customPrompt || contextualActionMutation.isPending}
            size="sm"
            className="w-full"
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}