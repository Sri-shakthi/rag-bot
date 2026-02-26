import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { User, Bot } from 'lucide-react';
import { Message } from '../services/api';

interface MessageItemProps {
  message: Message;
}

export function MessageItem({ message }: MessageItemProps) {
  const isUser = message.role === 'user';
  const segments = isUser ? [] : parseAssistantContent(message.content);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-8",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "flex max-w-[85%] md:max-w-[75%] gap-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        {/* Avatar */}
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
          isUser ? "bg-gray-200 text-gray-600" : "bg-[#D97757] text-white"
        )}>
          {isUser ? <User size={16} /> : <Bot size={16} />}
        </div>

        {/* Content */}
        <div className={cn(
          "flex flex-col",
          isUser ? "items-end" : "items-start"
        )}>
          <div className={cn(
            "px-6 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed",
            isUser 
              ? "bg-[#F0F0EF] text-gray-900 rounded-tr-sm" 
              : "bg-white border border-gray-100 text-gray-800 rounded-tl-sm"
          )}>
            {isUser ? (
              message.content
            ) : (
              <div className="space-y-2">
                {segments.map((segment, index) => {
                  if (segment.type === 'h1') {
                    return (
                      <h3 key={index} className="text-[17px] font-bold text-gray-900">
                        {segment.text}
                      </h3>
                    );
                  }

                  if (segment.type === 'h2') {
                    return (
                      <h4 key={index} className="text-[16px] font-semibold text-gray-900">
                        {segment.text}
                      </h4>
                    );
                  }

                  if (segment.type === 'ul') {
                    return (
                      <ul key={index} className="list-disc pl-5 space-y-1">
                        {segment.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{renderInlineFormatting(item)}</li>
                        ))}
                      </ul>
                    );
                  }

                  if (segment.type === 'ol') {
                    return (
                      <ol key={index} className="list-decimal pl-5 space-y-1">
                        {segment.items.map((item, itemIndex) => (
                          <li key={itemIndex}>{renderInlineFormatting(item)}</li>
                        ))}
                      </ol>
                    );
                  }

                  return (
                    <p key={index} className="whitespace-pre-wrap">
                      {renderInlineFormatting(segment.text)}
                    </p>
                  );
                })}
              </div>
            )}
            {message.imageUrl && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <img 
                  src={message.imageUrl} 
                  alt="Generated content" 
                  className="w-full h-auto max-w-[400px] object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 px-1">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

type Segment =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] };

function parseAssistantContent(content: string): Segment[] {
  const lines = content.split('\n');
  const output: Segment[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (!line) {
      i += 1;
      continue;
    }

    if (line.startsWith('### ')) {
      output.push({ type: 'h1', text: line.replace(/^###\s+/, '') });
      i += 1;
      continue;
    }

    if (line.startsWith('## ')) {
      output.push({ type: 'h1', text: line.replace(/^##\s+/, '') });
      i += 1;
      continue;
    }

    if (line.startsWith('# ')) {
      output.push({ type: 'h1', text: line.replace(/^#\s+/, '') });
      i += 1;
      continue;
    }

    if (/^[A-Za-z][A-Za-z0-9\s]{1,40}:$/.test(line)) {
      output.push({ type: 'h2', text: line.replace(/:$/, '') });
      i += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i += 1;
      }
      output.push({ type: 'ul', items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i += 1;
      }
      output.push({ type: 'ol', items });
      continue;
    }

    const paragraphLines: string[] = [line];
    i += 1;
    while (i < lines.length) {
      const peek = lines[i].trim();
      if (!peek || /^#{1,3}\s+/.test(peek) || /^[-*]\s+/.test(peek) || /^\d+\.\s+/.test(peek)) {
        break;
      }
      paragraphLines.push(peek);
      i += 1;
    }
    output.push({ type: 'p', text: paragraphLines.join(' ') });
  }

  return output.length ? output : [{ type: 'p', text: content }];
}

function renderInlineFormatting(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}
