import { useState } from 'react';
import { X, Play } from 'lucide-react';
import type { SelectedTextSnippet } from '@/contexts/AudioModeContext';

interface StackedSwipeableCardsProps {
  snippets: SelectedTextSnippet[];
  onRemove: (id: string) => void;
}

export function StackedSwipeableCards({ snippets, onRemove }: StackedSwipeableCardsProps) {
  const [cards, setCards] = useState(snippets);

  // Update cards when snippets change
  if (JSON.stringify(cards.map(c => c.id)) !== JSON.stringify(snippets.map(s => s.id))) {
    setCards(snippets);
  }

  const swipeCard = (direction: 'left' | 'right') => {
    setCards((prevCards) => {
      const newCards = [...prevCards];
      if (direction === 'right') {
        // Move first card to end (swipe right = next card)
        const firstCard = newCards.shift();
        if (firstCard) newCards.push(firstCard);
      } else {
        // Move last card to front (swipe left = previous card)
        const lastCard = newCards.pop();
        if (lastCard) newCards.unshift(lastCard);
      }
      return newCards;
    });
  };

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

  if (cards.length === 0) return null;

  return (
    <div className="relative w-28 h-40 mx-auto">
      {cards.map((card, index) => {
        const isTop = index === 0;
        const isSecond = index === 1;
        const isThird = index === 2;
        const gradient = getGradient(index);
        const authorName = card.authorDisplayName || card.authorUsername || 'Trading';

        return (
          <div
            key={card.id}
            data-card-index={index}
            className={`absolute inset-0 transition-all duration-300 ease-out cursor-grab active:cursor-grabbing ${
              isTop
                ? "z-40 scale-100 rotate-0"
                : isSecond
                ? "z-30 scale-95 rotate-1 translate-y-2"
                : isThird
                ? "z-20 scale-90 rotate-2 translate-y-4"
                : "z-10 scale-85 rotate-3 translate-y-6 opacity-50"
            }`}
            onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.clientX;
              const startY = e.clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleMouseMove = (e: MouseEvent) => {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                  );
                }
              };

              const handleMouseUp = (e: MouseEvent) => {
                if (isDragging) {
                  const deltaX = e.clientX - startX;
                  if (Math.abs(deltaX) > 40) {
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection);
                      }, 300);
                    } else {
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";
                      swipeCard(swipeDirection);

                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]'
                          ) as HTMLElement;
                        if (newTopCard) {
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("mousemove", handleMouseMove);
                document.removeEventListener("mouseup", handleMouseUp);
              };

              document.addEventListener("mousemove", handleMouseMove);
              document.addEventListener("mouseup", handleMouseUp);
            }}
            onTouchStart={(e: React.TouchEvent<HTMLDivElement>) => {
              if (!isTop) return;

              const startX = e.touches[0].clientX;
              const startY = e.touches[0].clientY;
              const cardElement = e.currentTarget as HTMLElement;
              let isDragging = false;

              const handleTouchMove = (e: TouchEvent) => {
                const deltaX = e.touches[0].clientX - startX;
                const deltaY = e.touches[0].clientY - startY;

                if (
                  !isDragging &&
                  (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)
                ) {
                  isDragging = true;
                }

                if (isDragging) {
                  e.preventDefault();
                  const rotation = deltaX * 0.1;
                  cardElement.style.transform = `translate(${deltaX}px, ${deltaY}px) rotate(${rotation}deg)`;
                  cardElement.style.opacity = String(
                    Math.max(0.3, 1 - Math.abs(deltaX) / 300)
                  );
                }
              };

              const handleTouchEnd = (e: TouchEvent) => {
                if (isDragging) {
                  const deltaX = e.changedTouches[0].clientX - startX;
                  if (Math.abs(deltaX) > 40) {
                    const swipeDirection = deltaX > 0 ? "right" : "left";

                    if (swipeDirection === "right") {
                      const direction = "150%";
                      const rotation = "30deg";
                      cardElement.style.transform = `translate(${direction}, ${
                        deltaX * 0.5
                      }px) rotate(${rotation})`;
                      cardElement.style.opacity = "0";

                      setTimeout(() => {
                        cardElement.style.transform = "";
                        cardElement.style.opacity = "";
                        swipeCard(swipeDirection);
                      }, 300);
                    } else {
                      cardElement.style.transform = "";
                      cardElement.style.opacity = "";
                      swipeCard(swipeDirection);

                      setTimeout(() => {
                        const newTopCard =
                          cardElement.parentElement?.querySelector(
                            '[data-card-index="0"]'
                          ) as HTMLElement;
                        if (newTopCard) {
                          newTopCard.style.transform =
                            "translate(150%, 0) rotate(30deg)";
                          newTopCard.style.opacity = "0";

                          setTimeout(() => {
                            newTopCard.style.transform = "";
                            newTopCard.style.opacity = "";
                            newTopCard.style.transition =
                              "transform 300ms ease-out, opacity 300ms ease-out";

                            setTimeout(() => {
                              newTopCard.style.transition = "";
                            }, 300);
                          }, 10);
                        }
                      }, 10);
                    }
                  } else {
                    cardElement.style.transform = "";
                    cardElement.style.opacity = "";
                  }
                }

                document.removeEventListener("touchmove", handleTouchMove);
                document.removeEventListener("touchend", handleTouchEnd);
              };

              document.addEventListener("touchmove", handleTouchMove, { passive: false });
              document.addEventListener("touchend", handleTouchEnd);
            }}
          >
            <div
              className={`bg-gradient-to-br ${gradient.from} ${gradient.to} rounded-xl p-3 h-full relative overflow-hidden shadow-xl border-2 border-white/10`}
            >
              {/* Background decoration */}
              <div className="absolute bottom-0 right-0 w-16 h-16 opacity-30">
                <div className="w-full h-full bg-gradient-to-br from-white/20 to-white/10 rounded-full"></div>
              </div>

              {/* Card content */}
              <div className="relative z-10">
                <div className="text-[8px] text-white/80 mb-1 uppercase tracking-wide font-medium">
                  {gradient.label}
                </div>
                <h3 className="text-xs font-bold text-white mb-2 leading-tight">
                  Latest in
                  <br />
                  {authorName.toLowerCase()}
                </h3>
                <button
                  className="bg-white text-gray-800 hover:bg-gray-100 px-2 py-1 rounded-full text-[10px] font-medium shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isTop) {
                      console.log('Read Now clicked for:', card.text);
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <Play className="w-2 h-2" />
                    <span>Read Now</span>
                  </div>
                </button>
              </div>

              {/* Icon */}
              <div className="absolute top-2 right-2 text-sm filter drop-shadow-lg">
                {gradient.icon}
              </div>

              {/* Remove button - only show on top card */}
              {isTop && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(card.id);
                  }}
                  className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all hover:scale-110 z-30"
                  data-testid={`button-remove-snippet-${card.id}`}
                >
                  <X className="w-2 h-2 text-white" />
                </button>
              )}

              {/* Stack indicator for non-top cards */}
              {!isTop && (
                <div className="absolute inset-0 bg-black/10 rounded-2xl"></div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
