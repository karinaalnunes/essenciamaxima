import { memo } from 'react';

interface MessageFormatterProps {
  content: string;
  role: 'user' | 'assistant';
}

export const MessageFormatter = memo(({ content, role }: MessageFormatterProps) => {
  // Format text with line breaks and basic markdown
  const formatText = (text: string) => {
    // Split by double line breaks for paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, pIndex) => {
      // Split by single line breaks within paragraphs
      const lines = paragraph.split('\n');
      
      return (
        <div key={pIndex} className={pIndex > 0 ? 'mt-4' : ''}>
          {lines.map((line, lIndex) => {
            // Check if line is a list item
            const isListItem = line.trim().match(/^[-•]\s/);
            
            // Format bold text (**text**)
            const formattedLine = line.split(/(\*\*.*?\*\*)/).map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
              }
              return <span key={i}>{part}</span>;
            });
            
            if (isListItem) {
              return (
                <div key={lIndex} className="flex gap-2 ml-4 mb-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="flex-1">{formattedLine}</span>
                </div>
              );
            }
            
            return (
              <div key={lIndex} className={lIndex > 0 ? 'mt-2' : ''}>
                {formattedLine}
              </div>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className={`
      max-w-[85%] rounded-2xl p-4 shadow-sm animate-fade-in
      ${role === 'user' 
        ? 'bg-primary text-primary-foreground ml-auto' 
        : 'bg-muted text-foreground'
      }
    `}>
      <div className="text-sm leading-relaxed space-y-1">
        {formatText(content)}
      </div>
    </div>
  );
});

MessageFormatter.displayName = 'MessageFormatter';
