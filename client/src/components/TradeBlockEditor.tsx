import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { X, GripVertical } from 'lucide-react';

// Column header types
type HeaderKey = 'time' | 'order' | 'symbol' | 'type' | 'qty' | 'price';

const HEADER_CONFIG: Record<HeaderKey, { label: string; required: boolean }> = {
  time: { label: 'Time', required: true },
  order: { label: 'Order', required: true },
  symbol: { label: 'Symbol', required: true },
  type: { label: 'Type', required: true },
  qty: { label: 'Qty', required: true },
  price: { label: 'Price', required: true },
};

const HEADER_ORDER: HeaderKey[] = ['time', 'order', 'symbol', 'type', 'qty', 'price'];

// Block data structure
interface Block {
  id: string;
  text: string;
  source: 'parsed' | 'selected';
  createdAt: number;
  column: HeaderKey | 'unassigned';
}

// State structure
interface EditorState {
  blocks: Record<string, Block>;
  columns: Record<HeaderKey, string[]>; // blockId arrays
  unassigned: string[]; // blockId array
}

interface TradeBlockEditorProps {
  failedLine: string;
  brokerKey: string;
  onSaveMapping: (mapping: Record<HeaderKey, number>) => void;
  onClose: () => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
}

// Draggable Block Component
function DraggableBlock({
  block,
  onDelete,
}: {
  block: Block;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md px-2 py-1 text-sm group hover-elevate"
      data-testid={`block-${block.id}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        data-testid={`block-drag-${block.id}`}
      >
        <GripVertical className="w-3 h-3 text-blue-600 dark:text-blue-400" />
      </button>
      <span className="text-blue-900 dark:text-blue-100 select-none font-mono">{block.text}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-4 w-4 p-0 hover:bg-blue-200 dark:hover:bg-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onDelete(block.id)}
        data-testid={`block-delete-${block.id}`}
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
}

// Column Drop Zone Component
function ColumnDropZone({
  headerKey,
  blockIds,
  blocks,
  onDeleteBlock,
}: {
  headerKey: HeaderKey;
  blockIds: string[];
  blocks: Record<string, Block>;
  onDeleteBlock: (id: string) => void;
}) {
  const config = HEADER_CONFIG[headerKey];
  const hasBlocks = blockIds.length > 0;
  const isValid = !config.required || hasBlocks;

  return (
    <div className="flex-1 min-w-[120px]" data-testid={`dropzone-${headerKey}`}>
      <div
        className={`flex flex-col gap-2 border-2 border-dashed rounded-md p-3 min-h-[80px] ${
          isValid
            ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            : 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950'
        }`}
      >
        <div className="flex items-center justify-between">
          <span
            className={`text-xs font-semibold ${
              isValid ? 'text-gray-700 dark:text-gray-300' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {config.label}
            {config.required && <span className="text-red-500 ml-1">*</span>}
          </span>
          {!isValid && (
            <span className="text-xs text-red-500">Required</span>
          )}
        </div>
        <SortableContext items={blockIds} strategy={horizontalListSortingStrategy}>
          <div className="flex flex-wrap gap-1.5">
            {blockIds.map((blockId) => {
              const block = blocks[blockId];
              if (!block) return null;
              return (
                <DraggableBlock key={blockId} block={block} onDelete={onDeleteBlock} />
              );
            })}
            {blockIds.length === 0 && (
              <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                Drag blocks here
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function TradeBlockEditor({
  failedLine,
  brokerKey,
  onSaveMapping,
  onClose,
  textareaRef,
}: TradeBlockEditorProps) {
  const [state, setState] = useState<EditorState>(() => {
    // Initialize from failed line - split by whitespace
    const tokens = failedLine.trim().split(/\s+/).filter(Boolean);
    const blocks: Record<string, Block> = {};
    const unassigned: string[] = [];

    tokens.forEach((text, index) => {
      const blockId = `block-${Date.now()}-${index}`;
      blocks[blockId] = {
        id: blockId,
        text,
        source: 'parsed',
        createdAt: Date.now() + index,
        column: 'unassigned',
      };
      unassigned.push(blockId);
    });

    return {
      blocks,
      columns: {
        time: [],
        order: [],
        symbol: [],
        type: [],
        qty: [],
        price: [],
      },
      unassigned,
    };
  });

  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Load saved mapping from localStorage
  useEffect(() => {
    const savedMapping = localStorage.getItem(`tradeBlockMapping_${brokerKey}`);
    if (savedMapping) {
      try {
        const mapping: Record<HeaderKey, number> = JSON.parse(savedMapping);
        // Auto-assign blocks based on saved mapping
        console.log('📥 Loaded saved mapping for', brokerKey, mapping);
      } catch (e) {
        console.error('Failed to load mapping:', e);
      }
    }
  }, [brokerKey]);

  // Handle text selection from textarea
  const handleTextareaSelection = useCallback(() => {
    if (!textareaRef?.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start === end) return; // No selection

    const selectedText = textarea.value.substring(start, end).trim();
    if (!selectedText) return;

    // Create new block from selection
    const blockId = `block-${Date.now()}-selected`;
    const newBlock: Block = {
      id: blockId,
      text: selectedText,
      source: 'selected',
      createdAt: Date.now(),
      column: 'unassigned',
    };

    setState((prev) => ({
      ...prev,
      blocks: {
        ...prev.blocks,
        [blockId]: newBlock,
      },
      unassigned: [...prev.unassigned, blockId],
    }));

    // Clear selection
    textarea.setSelectionRange(end, end);
  }, [textareaRef]);

  // Attach selection handler
  useEffect(() => {
    const textarea = textareaRef?.current;
    if (!textarea) return;

    textarea.addEventListener('mouseup', handleTextareaSelection);
    textarea.addEventListener('keyup', handleTextareaSelection);

    return () => {
      textarea.removeEventListener('mouseup', handleTextareaSelection);
      textarea.removeEventListener('keyup', handleTextareaSelection);
    };
  }, [handleTextareaSelection, textareaRef]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveBlockId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveBlockId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Determine source and destination
    let sourceColumn: HeaderKey | 'unassigned' | null = null;
    let destColumn: HeaderKey | 'unassigned' | null = null;

    // Find source column
    if (state.unassigned.includes(activeId)) {
      sourceColumn = 'unassigned';
    } else {
      for (const key of HEADER_ORDER) {
        if (state.columns[key].includes(activeId)) {
          sourceColumn = key;
          break;
        }
      }
    }

    // Determine destination column from overId
    if (overId === 'unassigned' || state.unassigned.includes(overId)) {
      destColumn = 'unassigned';
    } else {
      // Check if overId is a header key
      if (HEADER_ORDER.includes(overId as HeaderKey)) {
        destColumn = overId as HeaderKey;
      } else {
        // overId is a block, find its column
        for (const key of HEADER_ORDER) {
          if (state.columns[key].includes(overId)) {
            destColumn = key;
            break;
          }
        }
      }
    }

    if (!sourceColumn || !destColumn) return;

    // Move block
    setState((prev) => {
      const newState = { ...prev };
      const newBlocks = { ...prev.blocks };

      // Remove from source
      if (sourceColumn === 'unassigned') {
        newState.unassigned = prev.unassigned.filter((id) => id !== activeId);
      } else {
        newState.columns = {
          ...prev.columns,
          [sourceColumn]: prev.columns[sourceColumn].filter((id) => id !== activeId),
        };
      }

      // Add to destination
      if (destColumn === 'unassigned') {
        newState.unassigned = [...newState.unassigned, activeId];
      } else {
        newState.columns = {
          ...newState.columns,
          [destColumn]: [...(newState.columns[destColumn] || []), activeId],
        };
      }

      // Update block column
      newBlocks[activeId] = {
        ...newBlocks[activeId],
        column: destColumn,
      };

      return {
        ...newState,
        blocks: newBlocks,
      };
    });
  };

  const handleDeleteBlock = (blockId: string) => {
    setState((prev) => {
      const newBlocks = { ...prev.blocks };
      delete newBlocks[blockId];

      const newColumns = { ...prev.columns };
      HEADER_ORDER.forEach((key) => {
        newColumns[key] = prev.columns[key].filter((id) => id !== blockId);
      });

      return {
        blocks: newBlocks,
        columns: newColumns,
        unassigned: prev.unassigned.filter((id) => id !== blockId),
      };
    });
  };

  const handleSaveMapping = () => {
    // Create mapping: column -> position in original line
    const mapping: Record<HeaderKey, number> = {} as any;
    
    HEADER_ORDER.forEach((key) => {
      const blocks = state.columns[key];
      if (blocks.length > 0) {
        // Use first block's original index as position
        mapping[key] = 0; // Simplified for now
      }
    });

    // Save to localStorage
    localStorage.setItem(`tradeBlockMapping_${brokerKey}`, JSON.stringify(mapping));
    
    console.log('💾 Saved mapping:', mapping);
    onSaveMapping(mapping);
  };

  const isValid = HEADER_ORDER.every((key) => {
    const config = HEADER_CONFIG[key];
    return !config.required || state.columns[key].length > 0;
  });

  const allBlockIds = [
    ...state.unassigned,
    ...HEADER_ORDER.flatMap((key) => state.columns[key]),
  ];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Block Editor Mode</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Drag blocks to the correct column headers. Select text from your pasted data to create new blocks.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            data-testid="button-close-block-editor"
          >
            Back to Table
          </Button>
        </div>

        {/* Column Drop Zones */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <SortableContext items={allBlockIds} strategy={horizontalListSortingStrategy}>
            {HEADER_ORDER.map((headerKey) => (
              <ColumnDropZone
                key={headerKey}
                headerKey={headerKey}
                blockIds={state.columns[headerKey]}
                blocks={state.blocks}
                onDeleteBlock={handleDeleteBlock}
              />
            ))}
          </SortableContext>
        </div>

        {/* Unassigned Blocks */}
        {state.unassigned.length > 0 && (
          <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-3">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Unassigned Blocks
            </div>
            <SortableContext items={state.unassigned} strategy={horizontalListSortingStrategy}>
              <div className="flex flex-wrap gap-1.5">
                {state.unassigned.map((blockId) => {
                  const block = state.blocks[blockId];
                  if (!block) return null;
                  return (
                    <DraggableBlock key={blockId} block={block} onDelete={handleDeleteBlock} />
                  );
                })}
              </div>
            </SortableContext>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs text-muted-foreground">
            {isValid ? (
              <span className="text-green-600 dark:text-green-400">✓ All required fields mapped</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">⚠️ Map all required fields</span>
            )}
          </div>
          <Button
            onClick={handleSaveMapping}
            disabled={!isValid}
            size="sm"
            data-testid="button-save-mapping"
          >
            Save Format & Import
          </Button>
        </div>
      </div>

      <DragOverlay>
        {activeBlockId ? (
          <div className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-md px-2 py-1 text-sm shadow-lg">
            <GripVertical className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-100 font-mono">
              {state.blocks[activeBlockId]?.text}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
