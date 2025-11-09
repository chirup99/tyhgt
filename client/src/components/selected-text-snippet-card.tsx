import { X, Play } from 'lucide-react';
import type { SelectedTextSnippet } from '@/contexts/AudioModeContext';

interface SelectedTextSnippetCardProps {
  snippet: SelectedTextSnippet;
  onRemove: () => void;
  index: number;
}

export function SelectedTextSnippetCard({ snippet, onRemove, index }: SelectedTextSnippetCardProps) {
  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getGradient = (idx: number) => {
    const gradients = [
      { from: 'from-blue-500', to: 'to-blue-600', label: 'TECH NEWS', icon: '💻' },
      { from: 'from-purple-500', to: 'to-purple-600', label: 'MARKET UPDATE', icon: '📊' },
      { from: 'from-pink-500', to: 'to-pink-600', label: 'TRADING ALERT', icon: '📈' },
      { from: 'from-indigo-500', to: 'to-indigo-600', label: 'FINANCE NEWS', icon: '💡' },
      { from: 'from-cyan-500', to: 'to-cyan-600', label: 'INSIGHT', icon: '🎯' },
    ];
    return gradients[idx % gradients.length];
  };

  const gradient = getGradient(index);
  const authorName = snippet.authorDisplayName || snippet.authorUsername || 'Trading Insight';

  return (
    <div 
      className="relative flex-shrink-0 w-48 h-60 group"
      data-testid={`snippet-card-${snippet.id}`}
    >
      {/* Stacked card effect - bottom layers */}
      <div className="absolute top-2 left-2 right-2 bottom-0 bg-gray-400 dark:bg-gray-600 rounded-xl opacity-30" />
      <div className="absolute top-1 left-1 right-1 bottom-1 bg-gray-300 dark:bg-gray-700 rounded-xl opacity-50" />
      
      {/* Main card */}
      <div 
        className={`relative w-full h-full rounded-xl bg-gradient-to-br ${gradient.from} ${gradient.to} p-4 text-white shadow-2xl flex flex-col justify-between`}
      >
        {/* Remove button */}
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110 z-10"
          data-testid={`button-remove-snippet-${snippet.id}`}
        >
          <X className="w-3 h-3" />
        </button>
        
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{gradient.icon}</span>
            <p className="text-xs font-bold uppercase tracking-wider opacity-90">
              {gradient.label}
            </p>
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold leading-tight">
            Latest in {authorName.toLowerCase()}
          </h3>
          
          {/* Content preview */}
          <p className="text-xs leading-relaxed opacity-90 line-clamp-4">
            {truncateText(snippet.text, 100)}
          </p>
        </div>
        
        {/* Action Button */}
        <button 
          type="button"
          className="inline-flex items-center justify-center gap-2 bg-white text-gray-800 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors w-full shadow-md"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Play className="w-3 h-3 fill-current" />
          Read Now
        </button>
      </div>
    </div>
  );
}
