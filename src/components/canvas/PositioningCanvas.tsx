import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { CoreMessaging, GeneratedContent } from '@/types';

interface PositioningCanvasProps {
  coreMessaging?: CoreMessaging;
  generatedContent?: GeneratedContent;
}

// Helper function to create highlighted text
function createHighlightedText(text: string, highlights: { text: string; color: string }[]) {
  if (!text) return text;
  
  // Create a mapping of character positions to highlights
  const highlightMap = new Map<number, { color: string; length: number }>();
  
  // Find all matches and map their positions
  highlights.forEach(highlight => {
    const searchText = highlight.text.toLowerCase();
    const sourceText = text.toLowerCase();
    let searchIndex = 0;
    
    while (searchIndex < sourceText.length) {
      const foundIndex = sourceText.indexOf(searchText, searchIndex);
      if (foundIndex === -1) break;
      
      // Only highlight if this position isn't already highlighted
      let canHighlight = true;
      for (let i = foundIndex; i < foundIndex + highlight.text.length; i++) {
        if (highlightMap.has(i)) {
          canHighlight = false;
          break;
        }
      }
      
      if (canHighlight) {
        highlightMap.set(foundIndex, {
          color: highlight.color,
          length: highlight.text.length
        });
        break; // Only highlight first occurrence of each phrase
      }
      
      searchIndex = foundIndex + 1;
    }
  });
  
  // Build the result by walking through the text
  const elements: React.ReactNode[] = [];
  let i = 0;
  
  while (i < text.length) {
    const highlight = highlightMap.get(i);
    
    if (highlight) {
      // Add highlighted text
      elements.push(
        <span 
          key={`highlight-${i}`} 
          className="px-1 rounded"
          style={{ backgroundColor: highlight.color }}
        >
          {text.substring(i, i + highlight.length)}
        </span>
      );
      i += highlight.length;
    } else {
      // Find the next highlight or end of text
      let nextHighlight = text.length;
      for (const [pos] of highlightMap) {
        if (pos > i && pos < nextHighlight) {
          nextHighlight = pos;
        }
      }
      
      // Add non-highlighted text
      const textSegment = text.substring(i, nextHighlight);
      if (textSegment) {
        elements.push(
          <span key={`text-${i}`} className="text-gray-800">
            {textSegment}
          </span>
        );
      }
      i = nextHighlight;
    }
  }
  
  return elements.length > 0 ? elements : <span className="text-gray-800">{text}</span>;
}

export function PositioningCanvas({ coreMessaging, generatedContent }: PositioningCanvasProps) {
  const handleExport = () => {
    // TODO: Implement PDF export with jsPDF + html2canvas
    console.log('Export to PDF');
  };

  // Define highlight colors for different elements
  const colors = {
    primaryAnchor: '#fef3c7', // yellow
    secondaryAnchor: '#dbeafe', // blue
    problem: '#fecaca', // red
    differentiator: '#dcfce7', // green
    value: '#f3e8ff', // purple
  };

  const getHighlights = () => {
    if (!coreMessaging) return [];
    
    const highlights = [];

    // Primary anchor - exact text
    if (coreMessaging.primaryAnchor.content) {
      highlights.push({ text: coreMessaging.primaryAnchor.content, color: colors.primaryAnchor });
    }

    // Secondary anchor - exact text
    if (coreMessaging.secondaryAnchor.content) {
      highlights.push({ text: coreMessaging.secondaryAnchor.content, color: colors.secondaryAnchor });
    }

    // ICP segments - exact text
    if (coreMessaging.icp) {
      coreMessaging.icp.forEach(icpSegment => {
        if (icpSegment && icpSegment.trim()) {
          highlights.push({ text: icpSegment.trim(), color: colors.secondaryAnchor });
        }
      });
    }

    // Problem - break into key phrases from user input
    if (coreMessaging.problem) {
      const problemPhrases = extractKeyPhrases(coreMessaging.problem);
      problemPhrases.forEach(phrase => {
        highlights.push({ text: phrase, color: colors.problem });
      });
    }

    // Differentiator - break into key phrases from user input
    if (coreMessaging.differentiator) {
      const diffPhrases = extractKeyPhrases(coreMessaging.differentiator);
      diffPhrases.forEach(phrase => {
        highlights.push({ text: phrase, color: colors.differentiator });
      });
    }

    return highlights.filter(highlight => highlight.text && highlight.text.trim());
  };

  // Extract meaningful phrases from text (sentences, key phrases)
  const extractKeyPhrases = (text: string): string[] => {
    if (!text) return [];
    
    const phrases = [];
    
    // Split by sentences first (most important)
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
    sentences.forEach(sentence => {
      phrases.push(sentence.trim());
    });

    // Split by commas for key phrases
    const commaPhrases = text.split(',').filter(phrase => phrase.trim().length > 15);
    commaPhrases.forEach(phrase => {
      phrases.push(phrase.trim());
    });

    // Add some important 3-5 word phrases (but limit them)
    const words = text.split(/\s+/);
    for (let i = 0; i < Math.min(words.length - 2, 10); i++) { // Limit to first 10 positions
      const threeWordPhrase = words.slice(i, i + 3).join(' ');
      const fourWordPhrase = words.slice(i, i + 4).join(' ');
      
      if (threeWordPhrase.length > 15) phrases.push(threeWordPhrase);
      if (fourWordPhrase.length > 20) phrases.push(fourWordPhrase);
    }

    // Add the full text last (lowest priority for matching)
    phrases.push(text.trim());

    return phrases.slice(0, 15); // Limit to 15 phrases max per field
  };

  return (
    <div className="relative bg-white border-2 border-gray-800 shadow-lg">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b-2 border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="text-2xl font-bold text-gray-800">
            Positioning Strategy Visualizer
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
      </div>
      
      <div className="p-1">
        
        <div className="border border-gray-800 bg-gray-50 p-4 mb-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Positioning Option:</span>
            <span className="text-sm">
              {coreMessaging?.primaryAnchor.content ? 
                `Anchor on the ${coreMessaging.primaryAnchor.type.toLowerCase()} of ${coreMessaging.primaryAnchor.content}` :
                'Anchor on the use case of applying a new positioning strategy'
              }
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1 min-h-[500px]">
          {/* Left Sidebar */}
          <div className="col-span-3 space-y-1">
            {/* Primary Anchors */}
            <div className="border border-gray-800 bg-white p-3 h-40">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 px-2 py-1 rounded" style={{ backgroundColor: colors.primaryAnchor }}>Primary Anchors</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-xs">
                  <input type="radio" className="w-3 h-3" checked readOnly />
                  <span className="font-medium">{coreMessaging?.primaryAnchor.type || 'Type'}:</span>
                </label>
                <p className="text-xs text-gray-600 ml-5">
                  {coreMessaging?.primaryAnchor.content || 'Primary anchor content will appear here when you fill out the form below...'}
                </p>
              </div>
            </div>

            {/* Secondary Anchors */}
            <div className="border border-gray-800 bg-white p-3 h-32">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 px-2 py-1 rounded" style={{ backgroundColor: colors.secondaryAnchor }}>Secondary Anchors</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-xs">
                  <input type="radio" className="w-3 h-3" checked readOnly />
                  <span className="font-medium">{coreMessaging?.secondaryAnchor.type || 'Type'}:</span>
                </label>
                <p className="text-xs text-gray-600 ml-5">
                  {coreMessaging?.secondaryAnchor.content || 'Secondary anchor content will appear here when you fill out the form below...'}
                </p>
              </div>
            </div>

            {/* Problem */}
            <div className="border border-gray-800 bg-white p-3 h-28 flex flex-col">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 flex-shrink-0 px-2 py-1 rounded" style={{ backgroundColor: colors.problem }}>Problem</h3>
              <div className="flex-1 overflow-y-auto space-y-1">
                <label className="flex items-center space-x-2 text-xs">
                  <input type="radio" className="w-3 h-3" checked readOnly />
                  <span className="font-medium">Problem:</span>
                </label>
                <p className="text-xs text-gray-600 ml-5">
                  {coreMessaging?.problem || 'Problem statement will appear here when you fill out the form below...'}
                </p>
              </div>
            </div>

            {/* Differentiator */}
            <div className="border border-gray-800 bg-white p-3 h-28 flex flex-col">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 flex-shrink-0 px-2 py-1 rounded" style={{ backgroundColor: colors.differentiator }}>Differentiator</h3>
              <div className="flex-1 overflow-y-auto space-y-1">
                <label className="flex items-center space-x-2 text-xs">
                  <input type="radio" className="w-3 h-3" checked readOnly />
                  <span className="font-medium">Differentiator:</span>
                </label>
                <p className="text-xs text-gray-600 ml-5">
                  {coreMessaging?.differentiator || 'Differentiator will appear here when you fill out the form below...'}
                </p>
              </div>
            </div>
          </div>

          {/* Center Content */}
          <div className="col-span-6 border border-gray-800 bg-white p-6 flex flex-col justify-center">
            <div className="text-center space-y-4">
              <div className="bg-gray-100 rounded p-2 text-xs">LOGO</div>
              
              <div className="space-y-3">
                <h2 className="text-2xl font-bold leading-tight text-gray-800">
                  {coreMessaging && generatedContent?.headline ? 
                    createHighlightedText(generatedContent.headline, getHighlights()) :
                    generatedContent?.headline || 'Your Positioning Strategy'
                  }
                </h2>
                
                <div className="text-sm space-y-2">
                  {/* Show generated content with highlights, or fallback to template */}
                  {generatedContent ? (
                    <>
                      <p className="text-sm text-gray-700">
                        {createHighlightedText(
                          generatedContent.subheadline,
                          getHighlights()
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p>
                        {coreMessaging ? 
                          createHighlightedText(
                            `We help ${coreMessaging.secondaryAnchor.content || 'businesses'} with ${coreMessaging.primaryAnchor.content || 'their needs'} by solving ${coreMessaging.problem || 'key challenges'}.`,
                            getHighlights()
                          ) :
                          <span className="text-gray-600">We help businesses solve key challenges with innovative solutions.</span>
                        }
                      </p>
                      <p>
                        {coreMessaging ? 
                          createHighlightedText(
                            `Our approach: ${coreMessaging.differentiator || 'unique differentiation'} sets us apart in the market.`,
                            getHighlights()
                          ) :
                          <span className="text-gray-600">Our unique approach sets us apart in the market.</span>
                        }
                      </p>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex justify-center space-x-2 mt-4">
                <div className="w-8 h-2 bg-gray-800 rounded"></div>
                <div className="w-4 h-2 bg-gray-300 rounded"></div>
                <div className="w-4 h-2 bg-gray-300 rounded"></div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3 space-y-1">
            {/* Thesis */}
            <div className="border border-gray-800 bg-white p-3 h-48 flex flex-col">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 flex-shrink-0 px-2 py-1 rounded bg-gray-200">Thesis</h3>
              <ul className="space-y-2 text-xs flex-1 overflow-y-auto">
                {coreMessaging?.thesis?.filter(point => point.trim()).map((point, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 flex-shrink-0">•</span>
                    <span className="break-words">{point}</span>
                  </li>
                )) || (
                  <li className="flex items-start text-gray-400">
                    <span className="mr-2 flex-shrink-0">•</span>
                    <span className="break-words">Thesis points will appear here when you fill out the form below...</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Risks */}
            <div className="border border-gray-800 bg-white p-3 h-32 flex flex-col">
              <h3 className="font-bold text-sm mb-2 border-b pb-1 flex-shrink-0 px-2 py-1 rounded bg-gray-200">Risks</h3>
              <ul className="space-y-2 text-xs flex-1 overflow-y-auto">
                {coreMessaging?.risks?.filter(risk => risk.trim()).map((risk, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2 flex-shrink-0">•</span>
                    <span className="break-words">{risk}</span>
                  </li>
                )) || (
                  <li className="flex items-start text-gray-400">
                    <span className="mr-2 flex-shrink-0">•</span>
                    <span className="break-words">Risk points will appear here when you fill out the form below...</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 bg-white p-4 text-center">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">↑</span>
          </div>
          <p className="text-sm font-medium mt-2">
            This is where you visualize the strategy in a customer-facing (perhaps slightly verbose) way,
          </p>
          <p className="text-sm font-medium">
            along with color coding each word to match the anchors, problem, & differentiation
          </p>
        </div>
      </div>
    </div>
  );
}