
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DesignState, TextLayer, FreeText, FrameStyle, Decoration, InsertedImage } from '../types';
import { Star, Heart, Sun, Moon, Award, Bookmark, Flag, Flower, Circle, Square, Triangle, ZoomIn, ZoomOut, Maximize, Move, Maximize2, RotateCw, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, AlignVerticalJustifyEnd, Trash2 } from 'lucide-react';

interface DesignCanvasProps {
  design: DesignState;
  canvasRef: React.RefObject<HTMLDivElement>;
  setDesign?: React.Dispatch<React.SetStateAction<DesignState>>;
  onHistoryRecord?: () => void;
  isExporting?: boolean; // NEW: Strict Export Mode Flag
}

const DECORATION_ICONS: Record<string, any> = {
    'star': Star, 'heart': Heart, 'sun': Sun, 'moon': Moon, 
    'award': Award, 'bookmark': Bookmark, 'flag': Flag, 'flower': Flower,
    'circle': Circle, 'square': Square, 'triangle': Triangle
};

// Helper interface for resizing
interface ResizingState {
    id: string;
    path: string[]; // Path to update in state object
    startSize: number; // For text size or logo scale, or width/height for frame
    startOtherSize?: number; // For frame height
    startX: number;
    startY: number;
    type: 'size' | 'rotate' | 'width' | 'logo-scale' | 'frame-resize' | 'inserted-img-scale'; 
    startRotation?: number;
    startWidth?: number;
    startX_Pos?: number; // For frame pos
    startY_Pos?: number; // For frame pos
}

interface GuideLine {
    type: 'horizontal' | 'vertical';
    position: number; // in CM relative to canvas origin
    label?: string;
}

const PX_PER_CM = 37.8;
const SNAP_THRESHOLD_PX = 6;

// --- RULER COMPONENT ---
const Ruler: React.FC<{ length: number; orientation: 'horizontal' | 'vertical'; zoom: number }> = ({ length, orientation, zoom }) => {
    const ticks = [];
    const majorTickInterval = 1; // 1 cm
    const steps = Math.ceil(length / majorTickInterval);

    for (let i = 0; i <= steps; i++) {
        const pos = i * majorTickInterval;
        if (pos > length) break;
        
        ticks.push(
            <div 
                key={i} 
                className="absolute flex items-center justify-center text-[10px] font-bold text-slate-400 select-none pointer-events-none"
                style={{
                    left: orientation === 'horizontal' ? `${pos}cm` : 0,
                    top: orientation === 'vertical' ? `${pos}cm` : 0,
                    width: orientation === 'horizontal' ? '1px' : '100%',
                    height: orientation === 'vertical' ? '1px' : '100%',
                }}
            >
                {/* Tick Mark */}
                <div 
                    className="bg-indigo-500/50 absolute"
                    style={{
                        left: orientation === 'horizontal' ? 0 : 'auto',
                        right: 0,
                        top: orientation === 'vertical' ? 0 : 'auto',
                        bottom: 0,
                        width: orientation === 'horizontal' ? '1px' : '8px',
                        height: orientation === 'vertical' ? '1px' : '8px',
                    }}
                />
                {/* Number Label */}
                <span className="absolute" style={{
                    top: orientation === 'horizontal' ? '4px' : '4px',
                    left: orientation === 'vertical' ? '4px' : '4px',
                    transform: `scale(${1/Math.max(0.5, zoom)})`, // Counter-scale text to keep readable
                    transformOrigin: 'top left'
                }}>
                    {pos > 0 ? pos : ''}
                </span>
            </div>
        );
        
        // Minor ticks (0.5cm)
        if (i < steps) {
             ticks.push(
                <div 
                    key={`sub-${i}`} 
                    className="absolute bg-indigo-500/20 pointer-events-none"
                    style={{
                        left: orientation === 'horizontal' ? `${pos + 0.5}cm` : 'auto',
                        right: orientation === 'vertical' ? 0 : 'auto',
                        top: orientation === 'vertical' ? `${pos + 0.5}cm` : 'auto',
                        bottom: 0,
                        width: orientation === 'horizontal' ? '1px' : '5px',
                        height: orientation === 'vertical' ? '1px' : '5px',
                    }}
                />
            );
        }
    }

    return (
        <div 
            className={`absolute z-[60] bg-[#1a1642]/90 backdrop-blur-[2px] border-indigo-900/50 shadow-sm ${orientation === 'horizontal' ? 'border-b h-7 top-0 left-0 w-full' : 'border-r w-7 top-0 left-0 h-full'}`}
            data-html2canvas-ignore="true"
        >
            {ticks}
        </div>
    );
};

// --- RENDER FUNCTIONS ---
const renderFrame = (style: FrameStyle, color: string, width: number, rect?: {x: number, y: number, width: number, height: number}) => {
    if (style === 'none') return null;

    const containerStyle: React.CSSProperties = rect ? {
        position: 'absolute',
        left: `${rect.x}cm`,
        top: `${rect.y}cm`,
        width: `${rect.width}cm`,
        height: `${rect.height}cm`,
        pointerEvents: 'none',
        zIndex: 50,
        boxSizing: 'border-box'
    } : {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        zIndex: 50,
        borderColor: color,
        boxSizing: 'border-box',
    };

    const borderStyle: React.CSSProperties = {
        width: '100%',
        height: '100%',
        position: 'relative',
        borderColor: color,
        boxSizing: 'border-box'
    };

    const renderInner = () => {
        switch(style) {
            case 'solid':
                return <div style={{ ...borderStyle, borderWidth: `${width}px`, borderStyle: 'solid' }} />;
            case 'double':
                return (
                    <div style={{ ...borderStyle, borderWidth: `${width}px`, borderStyle: 'double', outline: `${Math.max(1, width/3)}px solid ${color}`, outlineOffset: `-${width*1.5}px` }} />
                );
            case 'dashed':
                return <div style={{ ...borderStyle, borderWidth: `${Math.max(2, width/2)}px`, borderStyle: 'dashed' }} />;
            case 'dotted':
                 return <div style={{ ...borderStyle, borderWidth: `${Math.max(2, width/2)}px`, borderStyle: 'dotted' }} />;
            
            case 'vintage-corner':
                return (
                    <>
                        <div style={{ ...borderStyle, border: `${Math.max(1, width/4)}px double ${color}`, position: 'absolute', top: '15px', left: '15px', right: '15px', bottom: '15px', width: 'auto', height: 'auto' }} />
                        <div className="absolute top-0 left-0 w-8 h-8 z-50 border-t-4 border-l-4" style={{ borderColor: color, width: `${width*4}px`, height: `${width*4}px`, borderWidth: `${width}px` }}></div>
                        <div className="absolute top-0 right-0 w-8 h-8 z-50 border-t-4 border-r-4" style={{ borderColor: color, width: `${width*4}px`, height: `${width*4}px`, borderWidth: `${width}px` }}></div>
                        <div className="absolute bottom-0 left-0 w-8 h-8 z-50 border-b-4 border-l-4" style={{ borderColor: color, width: `${width*4}px`, height: `${width*4}px`, borderWidth: `${width}px` }}></div>
                        <div className="absolute bottom-0 right-0 w-8 h-8 z-50 border-b-4 border-r-4" style={{ borderColor: color, width: `${width*4}px`, height: `${width*4}px`, borderWidth: `${width}px` }}></div>
                    </>
                );
            case 'certificate':
                 return (
                     <div style={{ 
                         ...borderStyle, 
                         border: `${width}px solid ${color}`,
                         padding: `${width/2}px`,
                         boxShadow: `inset 0 0 0 ${width/2}px white, inset 0 0 0 ${width}px ${color}`
                     }} />
                 );
            case 'classic-gold':
                 return (
                     <div style={{ 
                         ...borderStyle, 
                         border: `${width}px solid transparent`,
                         background: `linear-gradient(white, white) padding-box, linear-gradient(45deg, ${color}, #f1c40f, ${color}) border-box`
                     }} />
                 );

            case 'art-deco':
                 return (
                     <div style={{ ...borderStyle, border: `${width}px solid ${color}`, padding: '8px' }}>
                          <div style={{ width: '100%', height: '100%', border: `${Math.max(1, width/4)}px solid ${color}`, position: 'relative' }}>
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-8 border-b-2 border-l-2 border-r-2 bg-transparent" style={{ borderColor: color }}></div>
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-16 h-8 border-t-2 border-l-2 border-r-2 bg-transparent" style={{ borderColor: color }}></div>
                          </div>
                     </div>
                 );
            case 'ornamental':
                 return (
                     <>
                        <div style={{ ...borderStyle, border: `${Math.max(1, width/3)}px solid ${color}`, opacity: 0.7, margin: '5px', width: 'auto', height: 'auto', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}></div>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: 60, height: 60, borderTop: `${width}px solid ${color}`, borderLeft: `${width}px solid ${color}`, borderRadius: '20px 0 20px 0', zIndex: 51}}></div>
                        <div style={{ position: 'absolute', top: 0, right: 0, width: 60, height: 60, borderTop: `${width}px solid ${color}`, borderRight: `${width}px solid ${color}`, borderRadius: '0 20px 0 20px', zIndex: 51}}></div>
                        <div style={{ position: 'absolute', bottom: 0, left: 0, width: 60, height: 60, borderBottom: `${width}px solid ${color}`, borderLeft: `${width}px solid ${color}`, borderRadius: '0 20px 0 20px', zIndex: 51}}></div>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 60, height: 60, borderBottom: `${width}px solid ${color}`, borderRight: `${width}px solid ${color}`, borderRadius: '20px 0 20px 0', zIndex: 51}}></div>
                     </>
                 );
            case 'floral':
                return (
                    <div style={{ 
                        ...borderStyle, 
                        border: `${width}px solid ${color}`,
                        borderRadius: '0px',
                        backgroundImage: `radial-gradient(circle, ${color} 2px, transparent 2.5px)`,
                        backgroundSize: '15px 15px',
                        padding: '5px',
                        outline: `2px dashed ${color}`,
                        outlineOffset: '-10px'
                    }} />
                );

            case 'bamboo':
                return (
                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                        <div style={{ ...borderStyle, borderLeft: `${width}px solid ${color}`, borderRight: `${width}px solid ${color}`, borderWidth: 0, borderLeftWidth: width, borderRightWidth: width, borderStyle: 'solid' }}></div>
                        <div style={{ position: 'absolute', top: '10%', left: -2, width: `${width+4}px`, height: '3px', background: '#fff', borderTop: `1px solid ${color}`, borderBottom: `1px solid ${color}`, zIndex: 52 }}></div>
                        <div style={{ position: 'absolute', top: '35%', left: -2, width: `${width+4}px`, height: '3px', background: '#fff', borderTop: `1px solid ${color}`, borderBottom: `1px solid ${color}`, zIndex: 52 }}></div>
                        <div style={{ position: 'absolute', top: '60%', left: -2, width: `${width+4}px`, height: '3px', background: '#fff', borderTop: `1px solid ${color}`, borderBottom: `1px solid ${color}`, zIndex: 52 }}></div>
                        <div style={{ position: 'absolute', top: '85%', left: -2, width: `${width+4}px`, height: '3px', background: '#fff', borderTop: `1px solid ${color}`, borderBottom: `1px solid ${color}`, zIndex: 52 }}></div>

                        <div style={{ position: 'absolute', top: '20%', right: -2, width: `${width+4}px`, height: '3px', background: '#fff', borderTop: `1px solid ${color}`, borderBottom: `1px solid ${color}`, zIndex: 52 }}></div>
                        <div style={{ position: 'absolute', top: '45%', right: -2, width: `${width+4}px`, height: '3px', background: '#fff', borderTop: `1px solid ${color}`, borderBottom: `1px solid ${color}`, zIndex: 52 }}></div>
                        <div style={{ position: 'absolute', top: '70%', right: -2, width: `${width+4}px`, height: '3px', background: '#fff', borderTop: `1px solid ${color}`, borderBottom: `1px solid ${color}`, zIndex: 52 }}></div>
                    </div>
                );
             case 'ruler':
                 return (
                    <div style={{
                        ...borderStyle,
                        border: `${width}px solid ${color}`,
                        background: `repeating-linear-gradient(90deg, ${color}, ${color} 2px, transparent 2px, transparent 20px), repeating-linear-gradient(180deg, ${color}, ${color} 2px, transparent 2px, transparent 20px)`,
                        backgroundSize: '100% 10px, 10px 100%',
                        backgroundPosition: '0 bottom, left 0',
                        backgroundRepeat: 'no-repeat',
                    }} />
                 );
             case 'notebook':
                 return (
                     <div style={{
                         ...borderStyle,
                         border: `${width}px solid #e2e8f0`,
                         borderLeft: `${width*3}px solid #ef4444`,
                         backgroundColor: 'transparent',
                         backgroundImage: `linear-gradient(#e2e8f0 1px, transparent 1px)`,
                         backgroundSize: `100% 2em`
                     }} />
                 );
             case 'chalkboard':
                  return (
                      <div style={{
                          ...borderStyle,
                          border: `${width}px solid #8b4513`,
                          outline: '4px solid #5d4037',
                          boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
                      }} />
                  );

            case 'stars':
                 return (
                     <div style={{ ...borderStyle, border: `${width}px double ${color}` }}>
                         <div className="absolute -top-3 -left-3 text-4xl leading-none drop-shadow-sm" style={{ color }}>★</div>
                         <div className="absolute -top-3 -right-3 text-4xl leading-none drop-shadow-sm" style={{ color }}>★</div>
                         <div className="absolute -bottom-2 -left-3 text-4xl leading-none drop-shadow-sm" style={{ color }}>★</div>
                         <div className="absolute -bottom-2 -right-3 text-4xl leading-none drop-shadow-sm" style={{ color }}>★</div>
                     </div>
                 );
            case 'colorful-dots':
                 return (
                     <div style={{
                         ...borderStyle,
                         border: `${width}px solid transparent`,
                         backgroundImage: `radial-gradient(${color} 30%, transparent 30%), radial-gradient(${color} 30%, transparent 30%)`,
                         backgroundSize: `${width*2}px ${width*2}px`,
                         backgroundPosition: `0 0, ${width}px ${width}px`
                     }} />
                 );
            case 'puzzle':
                 return (
                    <div style={{
                        ...borderStyle,
                        border: `${width}px dashed ${color}`,
                        borderRadius: '20px',
                        backgroundColor: 'transparent'
                    }} />
                 );
            case 'crayons':
                 return (
                     <div style={{
                         ...borderStyle,
                         border: `${width}px solid ${color}`,
                         borderImage: `linear-gradient(to right, #f87171, #fbbf24, #34d399, #60a5fa, #a78bfa) 1`,
                     }} />
                 );

            case 'neon-border':
                return (
                    <div style={{ 
                        ...borderStyle, 
                        border: `${width}px solid ${color}`, 
                        boxShadow: `0 0 10px ${color}, 0 0 20px ${color}, inset 0 0 20px ${color}` 
                    }} />
                );
            case 'tribal':
                 return (
                     <div style={{
                         ...borderStyle,
                         background: `repeating-linear-gradient(45deg, ${color} 0, ${color} ${width}px, transparent ${width}px, transparent ${width*2}px)`,
                         mask: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(#fff, #fff)',
                         maskComposite: 'exclude',
                         WebkitMask: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(#fff, #fff)',
                         WebkitMaskComposite: 'xor',
                         padding: `${width*2}px`,
                         border: `2px solid ${color}`
                     }}></div>
                 );
            case 'tech-hud':
                 return (
                     <>
                        <div style={{ ...borderStyle, border: `1px solid ${color}`, opacity: 0.5 }}></div>
                        <div style={{ position: 'absolute', top: -2, left: -2, width: '40px', height: '40px', borderTop: `${width}px solid ${color}`, borderLeft: `${width}px solid ${color}`, zIndex: 51 }}></div>
                        <div style={{ position: 'absolute', top: -2, right: -2, width: '40px', height: '40px', borderTop: `${width}px solid ${color}`, borderRight: `${width}px solid ${color}`, zIndex: 51 }}></div>
                        <div style={{ position: 'absolute', bottom: -2, left: -2, width: '40px', height: '40px', borderBottom: `${width}px solid ${color}`, borderLeft: `${width}px solid ${color}`, zIndex: 51 }}></div>
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: '40px', height: '40px', borderBottom: `${width}px solid ${color}`, borderRight: `${width}px solid ${color}`, zIndex: 51 }}></div>
                        <div style={{ position: 'absolute', top: '50%', left: -width, width: '10px', height: '40px', background: color, transform: 'translateY(-50%)' }}></div>
                        <div style={{ position: 'absolute', top: '50%', right: -width, width: '10px', height: '40px', background: color, transform: 'translateY(-50%)' }}></div>
                     </>
                 );
            case 'geometric':
                 return (
                     <div style={{
                         ...borderStyle,
                         border: `${width}px solid ${color}`,
                         backgroundImage: `linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color}), linear-gradient(45deg, ${color} 25%, transparent 25%, transparent 75%, ${color} 75%, ${color})`,
                         backgroundSize: `${width*2}px ${width*2}px`,
                         backgroundPosition: `0 0, ${width}px ${width}px`,
                         mask: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(#fff, #fff)',
                         maskComposite: 'exclude',
                         WebkitMask: 'linear-gradient(#fff, #fff) padding-box, linear-gradient(#fff, #fff)',
                         WebkitMaskComposite: 'xor',
                         padding: `${width*1.5}px`
                     }}></div>
                 );
            default:
                return null;
        }
    };

    return (
        <div style={containerStyle}>
            {renderInner()}
        </div>
    );
}

const renderDecoration = (decor: Decoration) => {
    const Icon = DECORATION_ICONS[decor.content];
    if (!Icon) return null;

    const style: React.CSSProperties = {
        position: 'absolute',
        left: '50%', 
        top: '50%',
        transform: `translate(-50%, -50%) translate(${decor.x}px, ${decor.y}px) scale(${decor.scale}) rotate(${decor.rotation}deg)`,
        color: decor.color,
        opacity: decor.opacity,
        zIndex: 25,
        cursor: 'move',
    };

    return (
        <div style={style} className="decoration-item">
            <Icon size={40} fill={decor.type === 'shape' ? decor.color : 'none'} strokeWidth={decor.type === 'shape' ? 0 : 2} />
        </div>
    );
};


export const DesignCanvas: React.FC<DesignCanvasProps> = ({ design, canvasRef, setDesign, onHistoryRecord, isExporting = false }) => {
  const { width, height } = design.dimensions;
  
  // Drag & Drop Element State
  const [draggingItem, setDraggingItem] = useState<{ id: string, type: 'text' | 'decor' | 'header' | 'logo' | 'frame' | 'logo-inner' | 'inserted-img' | 'free-text', startX: number, startY: number, initialX: number, initialY: number } | null>(null);
  
  // Selection State (for highlighting and resizing)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  // Resizing State
  const [resizingItem, setResizingItem] = useState<ResizingState | null>(null);

  // Smart Guides State
  const [activeGuides, setActiveGuides] = useState<GuideLine[]>([]);

  // Viewport State (Zoom & Pan)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  // FIX: Initialize panStart with a default value to avoid 'e' is not defined error.
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Fit to screen calculation
  const fitToScreen = () => {
        if (!containerRef.current) return;
        const parent = containerRef.current;
        const availableW = parent.clientWidth - 50; 
        const availableH = parent.clientHeight - 50;
        
        const designW_px = design.dimensions.width * PX_PER_CM;
        const designH_px = design.dimensions.height * PX_PER_CM;

        const scaleW = availableW / designW_px;
        const scaleH = availableH / designH_px;
        
        setZoom(Math.min(scaleW, scaleH));
        setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (containerRef.current) {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }
  }

  useEffect(() => {
    fitToScreen();
  }, [design.dimensions]);

  useEffect(() => {
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [design.dimensions]);

  const bgContainerStyle: React.CSSProperties = {
    backgroundColor: design.background.color1, 
    backgroundImage: design.background.type === 'gradient' ? `linear-gradient(135deg, ${design.background.color1} 0%, ${design.background.color2} 100%)` : 'none',
  };

  const imageTransformStyle: React.CSSProperties = {
      transform: `scale(${design.illustration.scale || 1}) translate(${design.illustration.x || 0}%, ${design.illustration.y || 0}%)`,
      transition: 'transform 0.1s ease-out',
  };

  const getFormattedDateString = () => {
    if (!design.meta.date) return design.meta.location || '';
    try {
        const d = new Date(design.meta.date);
        if (isNaN(d.getTime())) return `${design.meta.location}, ${design.meta.date}`;
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        const dateStr = design.meta.format === 'full' 
            ? `ngày ${day} tháng ${month} năm ${year}`
            : `${day}/${month}/${year}`;
        if (design.meta.location) {
            return `${design.meta.location}, ${dateStr}`;
        }
        return dateStr.charAt(0).toUpperCase() + dateStr.slice(1); 
    } catch (e) {
        return `${design.meta.location}, ${design.meta.date}`;
    }
  };

  const logoPosition = design.header.logoPosition || 'left';
  const hasLogo = !!design.header.logo;
  const logoSizeCm = design.header.logoWidth || (design.header.logoScale ? design.header.logoScale / PX_PER_CM : 2.5);
  const logoShape = design.header.logoShape || 'circle';
  const logoInnerScale = design.header.logoInnerScale || 1;

  const getLogoDimensionsPx = () => {
        const height = logoSizeCm * PX_PER_CM;
        let width = logoSizeCm * PX_PER_CM;
        if (logoShape === 'ellipse' || logoShape === 'rectangle') {
            width = logoSizeCm * 1.5 * PX_PER_CM;
        }
        return { width, height };
  };
  const { width: logoW, height: logoH } = getLogoDimensionsPx();

  const canvasWidthPx = design.dimensions.width * PX_PER_CM;
  const canvasHeightPx = design.dimensions.height * PX_PER_CM;

  const renderLogoImage = () => {
      const containerStyle: React.CSSProperties = {
          height: `${logoSizeCm}cm`,
          pointerEvents: 'none',
          userSelect: 'none',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'transparent',
          border: `${design.header.logoBorderWidth || 0}px solid ${design.header.logoBorderColor || 'transparent'}`,
          boxSizing: 'border-box'
      };

      if (logoShape === 'circle') {
          containerStyle.width = `${logoSizeCm}cm`;
          containerStyle.borderRadius = '50%';
      } else if (logoShape === 'square') {
          containerStyle.width = `${logoSizeCm}cm`;
          containerStyle.borderRadius = '0px';
      } else if (logoShape === 'ellipse') {
          containerStyle.width = `${logoSizeCm * 1.5}cm`;
          containerStyle.height = `${logoSizeCm}cm`;
          containerStyle.borderRadius = '50%';
      } else {
          containerStyle.width = `${logoSizeCm * 1.5}cm`;
          containerStyle.height = `${logoSizeCm}cm`;
          containerStyle.borderRadius = '0px';
      }

      return (
          <div style={containerStyle}>
              <img 
                  src={design.header.logo || ''} 
                  alt="Logo" 
                  style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      display: 'block',
                      transform: `translate(${design.header.logoImageX || 0}px, ${design.header.logoImageY || 0}px) scale(${logoInnerScale})`, 
                      transition: draggingItem?.type === 'logo-inner' ? 'none' : 'transform 0.1s ease-out',
                      cursor: 'move'
                  }}
              />
          </div>
      );
  };

  const handleItemMouseDown = (e: React.MouseEvent, id: string, type: 'text' | 'decor' | 'header' | 'logo' | 'frame' | 'logo-inner' | 'inserted-img' | 'free-text', currentX: number, currentY: number) => {
      if (isExporting) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      setSelectedItemId(id);
      if (onHistoryRecord) onHistoryRecord();

      if (!setDesign) return;

      if (type === 'logo' && (e.altKey || e.ctrlKey)) {
          setDraggingItem({
              id, 
              type: 'logo-inner',
              startX: e.clientX,
              startY: e.clientY,
              initialX: design.header.logoImageX || 0,
              initialY: design.header.logoImageY || 0
          });
          return;
      }

      setDraggingItem({
          id, type,
          startX: e.clientX,
          startY: e.clientY,
          initialX: currentX,
          initialY: currentY
      });
  };

  const handleResizeStart = (e: React.MouseEvent, id: string, path: string[], currentSize: number, type: ResizingState['type'] = 'size', currentRotation: number = 0, currentWidth: number = 0, startX_Pos: number = 0, startY_Pos: number = 0, startOtherSize: number = 0) => {
      if (isExporting) return;
      e.stopPropagation();
      e.preventDefault();
      if (onHistoryRecord) onHistoryRecord();

      setResizingItem({
          id, path,
          startSize: currentSize,
          startOtherSize: startOtherSize,
          startX: e.clientX,
          startY: e.clientY,
          type,
          startRotation: currentRotation,
          startWidth: currentWidth,
          startX_Pos: startX_Pos,
          startY_Pos: startY_Pos,
      });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      if (isExporting) return;
      if (e.button !== 0) return; 
      setSelectedItemId(null);
      setIsPanning(true);
      // FIX: Correctly set panStart during mouse down event to allow panning logic to work correctly in handleGlobalMouseMove.
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleGlobalMouseMove = (e: React.MouseEvent) => {
      if (isExporting) return;
      
      if (resizingItem && setDesign) {
            const dx = (e.clientX - resizingItem.startX) / zoom;
            const dy = (e.clientY - resizingItem.startY) / zoom;
            
            if (resizingItem.type === 'size') {
                const sensitivity = 0.05; 
                const delta = (dx + dy) * sensitivity; 
                const newSize = Math.max(0.1, resizingItem.startSize + delta);
                
                setDesign(prev => {
                    const newState = { ...prev };
                    let target: any = newState;
                    for(let i=0; i<resizingItem.path.length-1; i++) {
                        target[resizingItem.path[i]] = { ...target[resizingItem.path[i]] };
                        target = target[resizingItem.path[i]];
                    }
                    target[resizingItem.path[resizingItem.path.length-1]] = parseFloat(newSize.toFixed(2));
                    return newState;
                });
            } else if (resizingItem.type === 'inserted-img-scale') {
                 const delta = (dx + dy) * 0.005;
                 const newScale = Math.max(0.05, resizingItem.startSize + delta);
                 setDesign(prev => ({
                     ...prev,
                     insertedImages: prev.insertedImages.map(img => img.id === resizingItem.id ? { ...img, scale: newScale } : img)
                 }));

            } else if (resizingItem.type === 'logo-scale') {
                 const deltaCm = (dx + dy) / PX_PER_CM;
                 const newSize = Math.max(0.5, resizingItem.startSize + deltaCm);
                 
                 setDesign(prev => {
                    const newState = { ...prev };
                    let target: any = newState;
                    for(let i=0; i<resizingItem.path.length-1; i++) {
                        target[resizingItem.path[i]] = { ...target[resizingItem.path[i]] };
                        target = target[resizingItem.path[i]];
                    }
                    target[resizingItem.path[resizingItem.path.length-1]] = parseFloat(newSize.toFixed(2));
                    return newState;
                 });

            } else if (resizingItem.type === 'frame-resize') {
                const deltaW = dx / PX_PER_CM;
                const deltaH = dy / PX_PER_CM;
                const x = resizingItem.startX_Pos || 0;
                const y = resizingItem.startY_Pos || 0;
                let newWidth = Math.max(1, resizingItem.startSize + deltaW);
                let newHeight = Math.max(1, (resizingItem.startOtherSize || 0) + deltaH);

                if (x + newWidth > design.dimensions.width) {
                    newWidth = design.dimensions.width - x;
                }
                if (y + newHeight > design.dimensions.height) {
                    newHeight = design.dimensions.height - y;
                }

                setDesign(prev => ({
                    ...prev,
                    frame: {
                        ...prev.frame,
                        rect: {
                            ...(prev.frame.rect || { x:0, y:0, width: prev.dimensions.width, height: prev.dimensions.height }),
                            width: parseFloat(newWidth.toFixed(2)),
                            height: parseFloat(newHeight.toFixed(2))
                        }
                    }
                }));

            } else if (resizingItem.type === 'rotate') {
                const deltaRotation = dx * 0.5;
                const newRotation = (resizingItem.startRotation || 0) + deltaRotation;
                 setDesign(prev => {
                    const newState = { ...prev };
                    let target: any = newState;
                    const rotatePath = [...resizingItem.path];
                    rotatePath.pop(); 
                    for(let i=0; i<rotatePath.length-1; i++) {
                        target[rotatePath[i]] = { ...target[rotatePath[i]] };
                        target = target[rotatePath[i]];
                    }
                    target[rotatePath[rotatePath.length-1]] = Math.round(newRotation);
                    return newState;
                });
            } else if (resizingItem.type === 'width') {
                 const newWidth = Math.max(100, (resizingItem.startWidth || 300) + dx);
                 setDesign(prev => {
                    const newState = { ...prev };
                    let target: any = newState;
                    const widthPath = [...resizingItem.path];
                    widthPath.pop(); 
                    for(let i=0; i<widthPath.length-1; i++) {
                        target[widthPath[i]] = { ...target[widthPath[i]] };
                        target = target[widthPath[i]];
                    }
                    target[widthPath[widthPath.length-1]] = Math.round(newWidth);
                    return newState;
                 });
            }
            return;
      }

      if (draggingItem && setDesign) {
            const dx = (e.clientX - draggingItem.startX) / zoom;
            const dy = (e.clientY - draggingItem.startY) / zoom;
            
            if (draggingItem.type === 'logo-inner') {
                setDesign(prev => ({
                    ...prev,
                    header: {
                        ...prev.header,
                        logoImageX: draggingItem.initialX + dx,
                        logoImageY: draggingItem.initialY + dy
                    }
                }));
                return;
            }

            let newX = draggingItem.initialX + dx;
            let newY = draggingItem.initialY + dy;
            
            if (draggingItem.type === 'frame') {
                const dxCm = dx / PX_PER_CM;
                const dyCm = dy / PX_PER_CM;
                newX = draggingItem.initialX + dxCm;
                newY = draggingItem.initialY + dyCm;
            }

            const snapThreshold = SNAP_THRESHOLD_PX / (draggingItem.type === 'frame' ? PX_PER_CM : 1); 
            const newGuides: GuideLine[] = [];
            
            if (!e.altKey) {
                if (['text', 'header', 'logo', 'inserted-img', 'free-text'].includes(draggingItem.type)) {
                     if (Math.abs(newX) < (5 / zoom)) {
                         newX = 0;
                         newGuides.push({ type: 'vertical', position: design.dimensions.width / 2 });
                     }
                     if (Math.abs(newY) < (5 / zoom)) {
                         newY = 0;
                         newGuides.push({ type: 'horizontal', position: design.dimensions.height / 2 });
                     }
                }
                
                if (draggingItem.type === 'frame') {
                    const frameW = design.frame.rect?.width || design.dimensions.width;
                    const frameH = design.frame.rect?.height || design.dimensions.height;
                    
                    if (Math.abs(newX) < snapThreshold) {
                         newX = 0;
                         newGuides.push({ type: 'vertical', position: 0 });
                    }
                    else if (Math.abs(newX - (design.dimensions.width - frameW)) < snapThreshold) {
                        newX = design.dimensions.width - frameW;
                        newGuides.push({ type: 'vertical', position: design.dimensions.width });
                    }
                    else if (Math.abs((newX + frameW/2) - design.dimensions.width/2) < snapThreshold) {
                        newX = design.dimensions.width/2 - frameW/2;
                        newGuides.push({ type: 'vertical', position: design.dimensions.width / 2 });
                    }

                    if (Math.abs(newY) < snapThreshold) {
                        newY = 0;
                        newGuides.push({ type: 'horizontal', position: 0 });
                    }
                    else if (Math.abs(newY - (design.dimensions.height - frameH)) < snapThreshold) {
                        newY = design.dimensions.height - frameH;
                        newGuides.push({ type: 'horizontal', position: design.dimensions.height });
                    }
                    else if (Math.abs((newY + frameH/2) - design.dimensions.height/2) < snapThreshold) {
                        newY = design.dimensions.height/2 - frameH/2;
                        newGuides.push({ type: 'horizontal', position: design.dimensions.height / 2 });
                    }
                }
                
                if (draggingItem.type === 'decor') {
                    if (Math.abs(newX) < 5) {
                        newX = 0;
                        newGuides.push({ type: 'vertical', position: design.dimensions.width / 2 });
                    }
                     if (Math.abs(newY) < 5) {
                        newY = 0;
                        newGuides.push({ type: 'horizontal', position: design.dimensions.height / 2 });
                    }
                }
            }
            
            setActiveGuides(newGuides);

            if (draggingItem.type === 'frame') {
                const frameW = design.frame.rect?.width || design.dimensions.width;
                const frameH = design.frame.rect?.height || design.dimensions.height;
                newX = Math.max(0, Math.min(newX, design.dimensions.width - frameW));
                newY = Math.max(0, Math.min(newY, design.dimensions.height - frameH));

                setDesign(prev => ({
                    ...prev,
                    frame: {
                        ...prev.frame,
                        rect: {
                            ...(prev.frame.rect || { width: prev.dimensions.width, height: prev.dimensions.height, x: 0, y: 0 }),
                            x: parseFloat(newX.toFixed(2)),
                            y: parseFloat(newY.toFixed(2))
                        }
                    }
                }));

            } else if (draggingItem.type === 'text') {
                if (draggingItem.id === 'title') setDesign(prev => ({ ...prev, title: { ...prev.title, x: newX, y: newY } }));
                else if (draggingItem.id === 'subtitle') setDesign(prev => ({ ...prev, subtitle: { ...prev.subtitle, x: newX, y: newY } }));
                else if (draggingItem.id === 'meta') setDesign(prev => ({ ...prev, meta: { ...prev.meta, x: newX, y: newY } }));
                else if (draggingItem.id === 'bannerRightText') setDesign(prev => ({ ...prev, bannerRightText: { ...prev.bannerRightText, x: newX, y: newY } }));
                else if (draggingItem.id === 'headerTop') setDesign(prev => ({ ...prev, header: { ...prev.header, topText: { ...prev.header.topText, x: newX, y: newY } } }));
                else if (draggingItem.id === 'headerBottom') setDesign(prev => ({ ...prev, header: { ...prev.header, bottomText: { ...prev.header.bottomText, x: newX, y: newY } } }));

            } else if (draggingItem.type === 'header') {
                setDesign(prev => ({ ...prev, header: { ...prev.header, x: newX, y: newY } }));
            } else if (draggingItem.type === 'logo') {
                setDesign(prev => ({ ...prev, header: { ...prev.header, logoX: newX, logoY: newY } }));
            } else if (draggingItem.type === 'inserted-img') {
                setDesign(prev => ({
                    ...prev,
                    insertedImages: prev.insertedImages.map(img => img.id === draggingItem.id ? { ...img, x: newX, y: newY } : img)
                }));
            } else if (draggingItem.type === 'decor') {
                setDesign(prev => ({
                    ...prev,
                    decorations: prev.decorations.map(d => d.id === draggingItem.id ? { ...d, x: newX, y: newY } : d)
                }));
            } else if (draggingItem.type === 'free-text') {
                setDesign(prev => ({
                  ...prev,
                  freeTexts: prev.freeTexts.map(t => t.id === draggingItem.id ? { ...t, x: newX, y: newY } : t)
                }));
            }
            return;
      }

      if (isPanning) {
          setPan({
              x: e.clientX - panStart.x,
              y: e.clientY - panStart.y
          });
      }
  };

  const handleGlobalMouseUp = () => {
      setDraggingItem(null);
      setIsPanning(false);
      setResizingItem(null);
      setActiveGuides([]);
  };

  const handleZoom = (delta: number) => {
      setZoom(prev => Math.min(5, Math.max(0.1, prev + delta)));
  };

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
      if (!selectedItemId || !setDesign) return;
      if (onHistoryRecord) onHistoryRecord();

      setDesign(prev => {
          const newState = { ...prev };
          let targetObj: any = null;
          if (selectedItemId === 'title') targetObj = newState.title;
          else if (selectedItemId === 'subtitle') targetObj = newState.subtitle;
          else if (selectedItemId === 'meta') targetObj = newState.meta;
          else if (selectedItemId === 'header') targetObj = newState.header;
          else if (selectedItemId === 'headerTop') targetObj = newState.header.topText;
          else if (selectedItemId === 'headerBottom') targetObj = newState.header.bottomText;
          else if (selectedItemId === 'bannerRightText') targetObj = newState.bannerRightText;
          else if (selectedItemId === 'logo') targetObj = newState.header; 
          else if (selectedItemId === 'frame') targetObj = newState.frame.rect;

          if (!targetObj && !selectedItemId.startsWith('decor-') && !selectedItemId.startsWith('img-') && !selectedItemId.startsWith('free-')) return newState;

          if (selectedItemId === 'logo') {
             if (alignment === 'center') targetObj.logoX = 0;
             if (alignment === 'middle') targetObj.logoY = 0;
          } else if (selectedItemId.startsWith('img-')) {
             const img = newState.insertedImages.find(i => i.id === selectedItemId);
             if (img) {
                 if (alignment === 'center') img.x = 0;
                 if (alignment === 'middle') img.y = 0;
             }
          } else if (selectedItemId.startsWith('free-')) {
            const txt = newState.freeTexts.find(t => t.id === selectedItemId);
            if (txt) {
                if (alignment === 'center') txt.x = 0;
                if (alignment === 'middle') txt.y = 0;
            }
          } else if (selectedItemId === 'frame') {
             if (alignment === 'center') targetObj.x = (newState.dimensions.width - targetObj.width) / 2;
             if (alignment === 'middle') targetObj.y = (newState.dimensions.height - targetObj.height) / 2;
             if (alignment === 'left') targetObj.x = 0;
             if (alignment === 'top') targetObj.y = 0;
             if (alignment === 'right') targetObj.x = newState.dimensions.width - targetObj.width;
             if (alignment === 'bottom') targetObj.y = newState.dimensions.height - targetObj.height;
          } else {
             if (alignment === 'center') targetObj.x = 0;
             if (alignment === 'middle') targetObj.y = 0;
             if (alignment === 'left') targetObj.x = -150; 
             if (alignment === 'right') targetObj.x = 150;
          }
          
          return newState;
      });
  };

  useEffect(() => {
      if (design.frame.style !== 'none' && !design.frame.rect && setDesign) {
          setDesign(prev => ({
              ...prev,
              frame: {
                  ...prev.frame,
                  rect: { x: 0, y: 0, width: prev.dimensions.width, height: prev.dimensions.height }
              }
          }));
      }
  }, [design.frame.style, design.dimensions]);


  const renderTextLayer = (id: string, layer: TextLayer, path: string[], extraContent?: string, className: string = "") => {
    
    if (layer.hidden) return null;
    
    const isSelected = selectedItemId === id && !isExporting;
  
    const effectColor = layer.effectColor || '#000000';
    const mainColor = layer.color;
    const thickness = layer.effectThickness || 1;
    const blur = layer.shadowBlur !== undefined ? layer.shadowBlur : 2;
    const offX = layer.shadowOffsetX !== undefined ? layer.shadowOffsetX : 2;
    const offY = layer.shadowOffsetY !== undefined ? layer.shadowOffsetY : 2;

    const style: React.CSSProperties = {
      display: 'inline-block',
      position: id.startsWith('free-') ? 'absolute' : 'relative',
      left: id.startsWith('free-') ? '50%' : undefined,
      top: id.startsWith('free-') ? '50%' : undefined,
      fontFamily: layer.font,
      color: layer.color,
      fontSize: `${layer.size}cm`,
      textAlign: layer.align,
      fontWeight: layer.bold ? 'bold' : 'normal',
      fontStyle: layer.italic ? 'italic' : 'normal',
      textTransform: layer.uppercase ? 'uppercase' : 'none',
      lineHeight: layer.lineHeight || 1.2, // Applying Giãn dòng
      letterSpacing: `${layer.letterSpacing || 0}px`, // Applying Giãn chữ
      transform: id.startsWith('free-') 
        ? `translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation || 0}deg)`
        : `translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation || 0}deg)`,
      transformOrigin: 'center', 
      cursor: 'move',
      userSelect: 'none',
      border: isSelected ? '2px dashed #3b82f6' : '2px solid transparent',
      padding: '4px',
      whiteSpace: 'pre-wrap', 
      wordBreak: 'break-word',
      minWidth: '50px',
      maxWidth: layer.maxWidth ? `${layer.maxWidth}px` : 'none',
      zIndex: 100
    };
  
    switch (layer.effect) {
      case 'shadow':
          style.textShadow = `${offX}px ${offY}px ${blur}px ${effectColor}`;
          break;
      case 'outline':
          // @ts-ignore
          style.WebkitTextStroke = `${thickness}px ${effectColor}`;
          style.color = 'transparent';
          break;
      case 'outline-fill':
          // @ts-ignore
          style.WebkitTextStroke = `${thickness}px ${effectColor}`;
          style.color = mainColor; 
          break;
      case 'neon':
          style.textShadow = `0 0 ${thickness + 5}px ${mainColor}, 0 0 ${thickness + 10}px ${effectColor}, 0 0 ${thickness + 20}px ${effectColor}`;
          break;
      case '3d':
          style.textShadow = `${thickness}px ${thickness}px 0 ${effectColor}, ${thickness+1}px ${thickness+1}px 0 ${effectColor}`;
          break;
      case 'glow':
          style.textShadow = `0 0 ${thickness + 10}px ${effectColor}`;
          break;
      case 'gradient':
          style.background = `linear-gradient(180deg, ${mainColor}, ${effectColor})`;
          style.WebkitBackgroundClip = 'text';
          style.WebkitTextFillColor = 'transparent';
          break;
      case 'layer-shadow':
          style.textShadow = `0 1px 1px ${effectColor}, 0 2px 2px ${effectColor}88, 0 4px 4px ${effectColor}44`;
          break;
      case 'soft-outline':
          // @ts-ignore
          style.WebkitTextStroke = `0.5px ${effectColor}`;
          style.textShadow = `0 0 5px ${effectColor}44`;
          break;
      case 'highlight':
          style.backgroundColor = `${effectColor}44`;
          style.borderRadius = '0.1cm';
          break;
      default:
          break;
    }
  
    const itemType = id.startsWith('free-') ? 'free-text' : 'text';

    return (
      <div 
        key={id}
        className={`relative group ${className}`} 
        style={style}
        onMouseDown={(e) => handleItemMouseDown(e, id, itemType, layer.x, layer.y)}
        data-design-selected={isSelected ? "true" : undefined}
      >
        {layer.content}
        {extraContent && <div className="text-[0.6em] opacity-80 mt-1">{extraContent}</div>}
        
        {isSelected && (
            <>
                 <div 
                    className="absolute -bottom-4 -right-4 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize z-[70] shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                    onMouseDown={(e) => handleResizeStart(e, id, [...path, 'size'], layer.size, 'size')}
                    title="Kéo để thay đổi kích thước"
                    data-html2canvas-ignore="true"
                 >
                     <Maximize2 size={16} className="text-indigo-600" />
                 </div>

                 <div 
                    className="absolute top-1/2 -right-4 -translate-y-1/2 w-5 h-10 bg-white border-2 border-indigo-600 rounded-lg cursor-ew-resize z-[70] shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                    onMouseDown={(e) => handleResizeStart(e, id, [...path, 'maxWidth'], 0, 'width', 0, layer.maxWidth || 500)}
                    title="Kéo để ép dòng"
                    data-html2canvas-ignore="true"
                 >
                     <div className="w-0.5 h-5 bg-indigo-400"></div>
                 </div>

                 <div 
                    className="absolute -top-4 -right-4 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full cursor-ew-resize z-[70] shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                    onMouseDown={(e) => handleResizeStart(e, id, [...path, 'rotation'], 0, 'rotate', layer.rotation || 0)}
                    title="Kéo để xoay"
                    data-html2canvas-ignore="true"
                 >
                     <RotateCw size={16} className="text-indigo-600" />
                 </div>
            </>
        )}
      </div>
    );
  };

  const frameRect = design.frame.rect || { x: 0, y: 0, width: design.dimensions.width, height: design.dimensions.height };

  const logoLeftPx = (canvasWidthPx / 2) + (design.header.logoX || 0) - (logoW / 2);
  const logoTopPx = (canvasHeightPx / 2) + (design.header.logoY || 0) - (logoH / 2);

  return (
    <div className="w-full h-full relative overflow-hidden">
        {!isExporting && (
            <div 
                className="absolute bottom-6 right-6 z-[150] flex items-center gap-2 bg-[#0b0923]/95 backdrop-blur shadow-[0_4px_20px_rgba(0,0,0,0.4)] border border-indigo-900/50 p-1.5 rounded-full ring-1 ring-black/20"
                data-html2canvas-ignore="true"
            >
                {selectedItemId && (
                    <div className="flex items-center gap-1 pr-2 border-r border-indigo-900/50 mr-2 animate-fadeIn">
                        <button onClick={() => handleAlign('left')} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white" title="Căn trái"><AlignLeft size={16}/></button>
                        <button onClick={() => handleAlign('center')} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white" title="Căn giữa ngang"><AlignCenter size={16}/></button>
                        <button onClick={() => handleAlign('right')} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white" title="Căn phải"><AlignRight size={16}/></button>
                        <div className="w-px h-3 bg-indigo-900/50 mx-0.5"></div>
                        <button onClick={() => handleAlign('top')} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white" title="Căn trên"><AlignVerticalJustifyStart size={16}/></button>
                        <button onClick={() => handleAlign('middle')} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white" title="Căn giữa dọc"><AlignVerticalJustifyCenter size={16}/></button>
                        <button onClick={() => handleAlign('bottom')} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white" title="Căn dưới"><AlignVerticalJustifyEnd size={16}/></button>
                    </div>
                )}

                <button onClick={() => handleZoom(-0.1)} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors" title="Thu nhỏ"><ZoomOut size={18}/></button>
                <span className="text-xs font-bold text-indigo-300 w-12 text-center select-none">{Math.round(zoom * 100)}%</span>
                <button onClick={() => handleZoom(0.1)} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors" title="Phóng to"><ZoomIn size={18}/></button>
                <div className="w-px h-4 bg-indigo-900/50 mx-1"></div>
                <button onClick={fitToScreen} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors" title="Vừa màn hình"><Maximize size={18}/></button>
                <div className="w-px h-4 bg-indigo-900/50 mx-1"></div>
                <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition-colors" title="Toàn màn hình"><Maximize2 size={18}/></button>
                <div className="w-px h-4 bg-indigo-900/50 mx-1"></div>
                <div className="px-2 flex items-center gap-1 text-xs text-slate-400"><Move size={14}/> <span>Kéo để di chuyển</span></div>
            </div>
        )}

      <div 
        ref={containerRef}
        className={`w-full h-full flex items-center justify-center p-10 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleGlobalMouseMove}
        onMouseUp={handleGlobalMouseUp}
        onMouseLeave={handleGlobalMouseUp}
        onWheel={(e) => { if (e.ctrlKey) { e.preventDefault(); handleZoom(e.deltaY > 0 ? -0.05 : 0.05); } }}
      >
        <div 
          className="relative transition-transform duration-75 ease-linear shrink-0"
          style={{
            width: `${canvasWidthPx}px`,
            height: `${canvasHeightPx}px`,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
          onMouseDown={(e) => e.stopPropagation()} 
        >
          {!isExporting && (
              <div className="absolute bottom-full left-0 w-full h-7 z-[60]" data-html2canvas-ignore="true">
                 <Ruler length={design.dimensions.width} orientation="horizontal" zoom={zoom} />
              </div>
          )}

          {!isExporting && (
              <div className="absolute top-0 right-full h-full w-7 z-[60]" data-html2canvas-ignore="true">
                 <Ruler length={design.dimensions.height} orientation="vertical" zoom={zoom} />
              </div>
          )}

          {!isExporting && activeGuides.map((guide, idx) => (
              <div
                key={idx}
                className="absolute z-[200] bg-pink-500 pointer-events-none"
                style={{
                    left: guide.type === 'vertical' ? `${guide.position}cm` : 0,
                    top: guide.type === 'horizontal' ? `${guide.position}cm` : 0,
                    width: guide.type === 'vertical' ? '1px' : '100%',
                    height: guide.type === 'horizontal' ? '1px' : '100%',
                    boxShadow: '0 0 4px rgba(255, 0, 255, 0.5)'
                }}
                data-html2canvas-ignore="true"
              />
          ))}

          <div 
            ref={canvasRef}
            id="poster-canvas"
            className="relative shadow-[0_20px_60px_rgba(0,0,0,0.5)] ring-1 ring-black/20 flex flex-col overflow-hidden bg-white w-full h-full"
            style={{ ...bgContainerStyle }}
            data-export-canvas="true"
          >
            {/* DESIGN GUIDES */}
            {!isExporting && (
                <div 
                    className="absolute inset-0 pointer-events-none z-[5]" 
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(99, 102, 241, 0.12) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(99, 102, 241, 0.12) 1px, transparent 1px)
                        `,
                        backgroundSize: '1cm 1cm',
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0
                    }}
                    data-html2canvas-ignore="true"
                >
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-indigo-500/30 -translate-y-1/2"></div>
                    <div className="absolute left-1/2 top-0 h-full w-[2px] bg-indigo-500/30 -translate-x-1/2"></div>
                </div>
            )}

            {/* BACKGROUND LAYER (z-0) */}
            {design.illustration.url && (
                <div 
                    className="absolute inset-0 z-0 overflow-hidden pointer-events-none" 
                    data-export-layer="background" 
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <img src={design.illustration.url} alt="Background" className="w-full h-full object-cover" style={imageTransformStyle} />
                </div>
            )}

            {/* BACKGROUND BLUR FEATHER OVERLAY (Layer 0.5) - REFINED FOR INDEPENDENT DIRECTIONS */}
            {design.illustration.url && (
                <>
                    {/* Left edge blur */}
                    {design.background.featherLeft > 0 && (
                        <div className="absolute inset-0 z-[0.4] overflow-hidden pointer-events-none"
                             style={{ 
                                 maskImage: `linear-gradient(to right, black 0%, transparent ${design.background.featherLeft}%)`,
                                 WebkitMaskImage: `linear-gradient(to right, black 0%, transparent ${design.background.featherLeft}%)`
                             }}>
                            <img src={design.illustration.url} className="w-full h-full object-cover" style={{ ...imageTransformStyle, filter: 'blur(20px)' }} />
                        </div>
                    )}
                    {/* Right edge blur */}
                    {design.background.featherRight > 0 && (
                        <div className="absolute inset-0 z-[0.4] overflow-hidden pointer-events-none"
                             style={{ 
                                 maskImage: `linear-gradient(to left, black 0%, transparent ${design.background.featherRight}%)`,
                                 WebkitMaskImage: `linear-gradient(to left, black 0%, transparent ${design.background.featherRight}%)`
                             }}>
                            <img src={design.illustration.url} className="w-full h-full object-cover" style={{ ...imageTransformStyle, filter: 'blur(20px)' }} />
                        </div>
                    )}
                    {/* Top edge blur */}
                    {design.background.featherTop > 0 && (
                        <div className="absolute inset-0 z-[0.4] overflow-hidden pointer-events-none"
                             style={{ 
                                 maskImage: `linear-gradient(to bottom, black 0%, transparent ${design.background.featherTop}%)`,
                                 WebkitMaskImage: `linear-gradient(to bottom, black 0%, transparent ${design.background.featherTop}%)`
                             }}>
                            <img src={design.illustration.url} className="w-full h-full object-cover" style={{ ...imageTransformStyle, filter: 'blur(20px)' }} />
                        </div>
                    )}
                    {/* Bottom edge blur */}
                    {design.background.featherBottom > 0 && (
                        <div className="absolute inset-0 z-[0.4] overflow-hidden pointer-events-none"
                             style={{ 
                                 maskImage: `linear-gradient(to top, black 0%, transparent ${design.background.featherBottom}%)`,
                                 WebkitMaskImage: `linear-gradient(to top, black 0%, transparent ${design.background.featherBottom}%)`
                             }}>
                            <img src={design.illustration.url} className="w-full h-full object-cover" style={{ ...imageTransformStyle, filter: 'blur(20px)' }} />
                        </div>
                    )}
                </>
            )}

            {/* OVERLAY LAYER (z-1) */}
            <div 
                className="absolute inset-0 pointer-events-none"
                style={{ 
                    backgroundColor: design.background.overlayColor, 
                    opacity: design.background.overlayOpacity,
                    zIndex: 1,
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 
                }}
                data-export-layer="background"
            />

            {/* INSERTED IMAGES LAYER (z-10 - Below text, above background) */}
            {design.insertedImages.map((img) => {
                const isSelected = selectedItemId === img.id && !isExporting;
                
                // Multi-edge Feather logic using composite linear gradients
                const maskStyle = {
                    maskImage: `
                      linear-gradient(to right, transparent 0%, black ${img.featherLeft}%, black calc(100% - ${img.featherRight}%), transparent 100%),
                      linear-gradient(to bottom, transparent 0%, black ${img.featherTop}%, black calc(100% - ${img.featherBottom}%), transparent 100%)
                    `,
                    WebkitMaskImage: `
                      linear-gradient(to right, transparent 0%, black ${img.featherLeft}%, black calc(100% - ${img.featherRight}%), transparent 100%),
                      linear-gradient(to bottom, transparent 0%, black ${img.featherTop}%, black calc(100% - ${img.featherBottom}%), transparent 100%)
                    `,
                    maskComposite: 'intersect',
                    WebkitMaskComposite: 'destination-in',
                };
                
                return (
                    <div 
                        key={img.id}
                        className={`absolute z-10 cursor-move ${isSelected ? 'ring-2 ring-indigo-500 ring-dashed' : ''}`}
                        style={{
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) translate(${img.x}px, ${img.y}px) rotate(${img.rotation}deg) scale(${img.scale})`,
                        }}
                        onMouseDown={(e) => handleItemMouseDown(e, img.id, 'inserted-img', img.x, img.y)}
                        data-design-selected={isSelected ? "true" : undefined}
                    >
                        <div className="relative">
                            <img 
                                src={img.url} 
                                className="max-w-none transition-all duration-300"
                                style={{
                                    filter: `blur(${img.blur}px) ${img.isRemovedBg ? 'contrast(1.15) brightness(1.08)' : ''}`,
                                    ...maskStyle as any
                                }}
                            />
                            {isSelected && (
                                <>
                                    <div 
                                        className="absolute -bottom-6 -right-6 w-10 h-10 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize z-[70] shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                                        onMouseDown={(e) => handleResizeStart(e, img.id, [], img.scale, 'inserted-img-scale')}
                                        data-html2canvas-ignore="true"
                                    >
                                        <Maximize2 size={20} className="text-indigo-600" />
                                    </div>
                                    <div 
                                        className="absolute -top-6 -left-6 w-8 h-8 bg-red-600 text-white rounded-full z-[70] shadow-xl flex items-center justify-center hover:bg-red-700 transition-colors pointer-events-auto cursor-pointer"
                                        onClick={() => setDesign && setDesign(prev => ({ ...prev, insertedImages: prev.insertedImages.filter(i => i.id !== img.id) }))}
                                        data-html2canvas-ignore="true"
                                    >
                                        <Trash2 size={16} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* FRAME LAYER (z-20) */}
            {design.frame.style !== 'none' && (
                <div 
                    className={`absolute z-[20] ${selectedItemId === 'frame' && !isExporting ? 'ring-2 ring-indigo-500 ring-dashed' : ''}`}
                    style={{
                        position: 'absolute', zIndex: 20, 
                        left: `${frameRect.x}cm`, top: `${frameRect.y}cm`,
                        width: `${frameRect.width}cm`, height: `${frameRect.height}cm`,
                        pointerEvents: 'auto', cursor: 'move'
                    }}
                    onMouseDown={(e) => handleItemMouseDown(e, 'frame', 'frame', frameRect.x, frameRect.y)}
                    data-design-selected={selectedItemId === 'frame' ? "true" : undefined}
                >
                    <div className="w-full h-full pointer-events-none"> 
                        {renderFrame(design.frame.style, design.frame.color, design.frame.width, { x: 0, y: 0, width: frameRect.width, height: frameRect.height })}
                    </div>
                    {selectedItemId === 'frame' && !isExporting && (
                            <div 
                                className="absolute -bottom-4 -right-4 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize z-[70] shadow-xl flex items-center justify-center hover:scale-110 transition-transform pointer-events-auto"
                                onMouseDown={(e) => handleResizeStart(e, 'frame', [], frameRect.width, 'frame-resize', 0, 0, frameRect.x, frameRect.y, frameRect.height)}
                                title="Kéo để thay đổi kích thước khung"
                                data-html2canvas-ignore="true"
                            >
                                <Maximize2 size={16} className="text-indigo-600" />
                            </div>
                    )}
                </div>
            )}

            {/* DECORATIONS LAYER (z-30) */}
            {design.decorations.map(decor => (
                <div key={decor.id} onMouseDown={(e) => handleItemMouseDown(e, decor.id, 'decor', decor.x, decor.y)} className={draggingItem?.id === decor.id && !isExporting ? 'ring-2 ring-blue-500 ring-dashed' : ''}>
                    {renderDecoration(decor)}
                </div>
            ))}

            {/* TEXT LAYER GROUP (z-100) */}
            <div className="absolute inset-0 z-[100] pointer-events-none">
              {/* FREE TEXTS */}
              {design.freeTexts.map((txt, index) => (
                <div key={txt.id} className="pointer-events-auto">
                  {renderTextLayer(txt.id, txt, ['freeTexts', index.toString()])}
                </div>
              ))}
            </div>

            {/* TEXT LAYER FIXED (z-100) */}
            {hasLogo && logoPosition === 'custom' && (
                <div 
                    className={`absolute z-[110] cursor-move ${selectedItemId === 'logo' && !isExporting ? 'ring-2 ring-indigo-500 ring-dashed' : ''}`}
                    style={{ left: `${logoLeftPx}px`, top: `${logoTopPx}px` }}
                    onMouseDown={(e) => handleItemMouseDown(e, 'logo', 'logo', design.header.logoX || 0, design.header.logoY || 0)}
                    data-design-selected={selectedItemId === 'logo' ? "true" : undefined}
                >
                    <div className="relative group">
                        {renderLogoImage()}
                        {selectedItemId === 'logo' && !isExporting && (
                            <>
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap" data-html2canvas-ignore="true">
                                    Logo ({logoSizeCm.toFixed(1)}cm)
                                </div>
                                <div 
                                    className="absolute -bottom-4 -right-4 w-8 h-8 bg-white border-2 border-indigo-600 rounded-full cursor-nwse-resize z-[70] shadow-xl flex items-center justify-center hover:scale-110 transition-transform"
                                    onMouseDown={(e) => handleResizeStart(e, 'logo', ['header', 'logoWidth'], logoSizeCm, 'logo-scale')}
                                    title="Kéo để thay đổi kích thước Logo"
                                    data-html2canvas-ignore="true"
                                >
                                    <Maximize2 size={16} className="text-indigo-600" />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {design.mode === 'banner' && !design.bannerRightText.hidden && (
                <div 
                    className={`absolute z-[100] flex flex-col justify-end items-end`}
                    style={{ right: `${design.layout.horizontalPadding}%`, bottom: '10%', maxWidth: '30%' }}
                >
                    {renderTextLayer('bannerRightText', design.bannerRightText, ['bannerRightText'])}
                </div>
            )}

            <div className="relative z-[100] w-full h-full flex flex-col pointer-events-none">
                {!design.header.hidden && (
                    <div 
                    className={`w-full py-4 relative flex items-center shrink-0 pointer-events-auto ${draggingItem?.id === 'header' && !isExporting ? 'ring-2 ring-blue-500 ring-dashed' : ''} ${selectedItemId === 'header' && !isExporting ? 'ring-1 ring-blue-400' : ''}`}
                    style={{ 
                        marginBottom: `${design.layout.headerToTitle}cm`,
                        paddingLeft: `${design.layout.horizontalPadding}%`, paddingRight: `${design.layout.horizontalPadding}%`,
                        marginTop: design.mode === 'poster' ? `${design.layout.headerSpace}cm` : '0',
                        transform: `translate(${design.header.x || 0}px, ${design.header.y || 0}px)`,
                        cursor: 'move',
                        zIndex: 100
                    }}
                    onMouseDown={(e) => handleItemMouseDown(e, 'header', 'header', design.header.x || 0, design.header.y || 0)}
                    data-design-selected={selectedItemId === 'header' ? "true" : undefined}
                    >
                    {hasLogo && logoPosition === 'left' && (
                        <div className="absolute top-1/2 -translate-y-1/2 z-[110]" style={{ left: `${design.layout.horizontalPadding}%` }}>{renderLogoImage()}</div>
                    )}
                    {hasLogo && logoPosition === 'right' && (
                        <div className="absolute top-1/2 -translate-y-1/2 z-[110]" style={{ right: `${design.layout.horizontalPadding}%` }}>{renderLogoImage()}</div>
                    )}
                    <div 
                        className="w-full h-full flex flex-col justify-center" 
                        style={{ 
                            alignItems: design.header.align === 'left' ? 'flex-start' : (design.header.align === 'right' ? 'flex-end' : 'center'),
                            paddingLeft: (design.header.align === 'left' && hasLogo && logoPosition === 'left') ? `${logoSizeCm + 0.5}cm` : '0',
                            paddingRight: (design.header.align === 'right' && hasLogo && logoPosition === 'right') ? `${logoSizeCm + 0.5}cm` : '0',
                            gap: `${design.layout.headerLineGap}cm`
                        }}
                    >
                        {hasLogo && logoPosition === 'top' && (
                            <div className={`mb-2 flex w-full z-[110] ${design.header.align === 'center' ? 'justify-center' : (design.header.align === 'right' ? 'justify-end' : 'justify-start')}`}>{renderLogoImage()}</div>
                        )}
                        {renderTextLayer('headerTop', design.header.topText, ['header', 'topText'])}
                        {renderTextLayer('headerBottom', design.header.bottomText, ['header', 'bottomText'])}
                        {hasLogo && logoPosition === 'bottom' && (
                            <div className={`mt-2 flex w-full z-[110] ${design.header.align === 'center' ? 'justify-center' : (design.header.align === 'right' ? 'justify-end' : 'justify-start')}`}>{renderLogoImage()}</div>
                        )}
                    </div>
                    </div>
                )}

                <div 
                    className="flex-1 w-full flex flex-col items-center justify-center pb-8 pointer-events-none"
                    style={{ 
                        paddingLeft: `${design.layout.horizontalPadding}%`, paddingRight: `${design.layout.horizontalPadding}%`,
                        paddingTop: design.mode === 'banner' ? `${design.layout.headerSpace}cm` : '0'
                    }}
                >
                    <div className={`w-full text-center pointer-events-auto z-[100]`} style={{ marginBottom: `${design.layout.titleToSubtitle}cm` }}>
                        {renderTextLayer('title', design.title, ['title'])}
                    </div>
                    <div className={`w-full text-center pointer-events-auto z-[100]`} style={{ marginBottom: `${design.layout.titleToSubtitle}cm` }}>
                        {renderTextLayer('subtitle', design.subtitle, ['subtitle'])}
                    </div>
                    <div className={`w-full text-center pointer-events-auto z-[100]`}>
                        {renderTextLayer('meta', { ...design.meta, content: getFormattedDateString() }, ['meta'])}
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
