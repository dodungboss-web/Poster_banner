
import React, { useState, useRef, useEffect } from 'react';
import { DesignState, DEFAULT_DESIGN } from './types';
import { ControlPanel } from './components/ControlPanel';
import { DesignCanvas } from './components/DesignCanvas';
import html2canvas from 'html2canvas';
import { PanelLeftClose, PanelLeftOpen, Undo, Redo, Menu, ChevronLeft, ChevronRight } from 'lucide-react';

// Constant for conversion (Must match DesignCanvas)
const PX_PER_CM = 37.8;

const App: React.FC = () => {
  const [design, setDesign] = useState<DesignState>(DEFAULT_DESIGN);
  // Responsive init: Closed on mobile (<1024px), Open on desktop
  const [isSidebarOpen, setIsSidebarOpen] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  const [sidebarWidth, setSidebarWidth] = useState(400); // Default width within 240-420px range
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);

  const [isExporting, setIsExporting] = useState(false); // NEW: Export State
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // History Management
  const [history, setHistory] = useState<DesignState[]>([]);
  const [future, setFuture] = useState<DesignState[]>([]);

  // Monitor screen size for desktop/mobile differentiation & Auto-collapse on transition
  useEffect(() => {
    let lastWidth = window.innerWidth;

    const handleResize = () => {
      const currentWidth = window.innerWidth;
      // Maintain sync with CSS breakpoint (lg: 1024px) for desktop layout
      const isNowDesktop = currentWidth >= 1024;
      setIsDesktop(isNowDesktop);
      
      // Auto-collapse sidebar when resizing from Desktop to Mobile/Tablet (<1024px)
      // This ensures the sidebar doesn't obstruct the canvas on smaller screens where it becomes fixed
      if (lastWidth >= 1024 && currentWidth < 1024) {
          setIsSidebarOpen(false);
      }
      
      lastWidth = currentWidth;
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Constraint: Min 240px, Max 420px
      const newWidth = Math.max(240, Math.min(420, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection while resizing
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing]);

  const recordHistory = () => {
    setHistory(prev => {
        const newHistory = [...prev, design];
        if (newHistory.length > 50) return newHistory.slice(newHistory.length - 50);
        return newHistory;
    });
    setFuture([]);
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, history.length - 1);
    setFuture(prev => [design, ...prev]);
    setDesign(previous);
    setHistory(newHistory);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setHistory(prev => [...prev, design]);
    setDesign(next);
    setFuture(newFuture);
  };

  const handleControlPanelChange: React.Dispatch<React.SetStateAction<DesignState>> = (value) => {
      recordHistory();
      setDesign(value);
  };

  const handleExport = async (format: 'png' | 'jpg' | 'pdf') => {
    if (!canvasRef.current) return;

    // 1. Enter EXPORT MODE (Hides all UI elements in DesignCanvas)
    setIsExporting(true);

    // 2. Wait for React to repaint the DOM without UI
    await new Promise(resolve => setTimeout(resolve, 300));

    const scrollPos = window.scrollY;
    
    try {
      window.scrollTo(0, 0);

      // 3. Calculate Dimensions
      const pixelWidth = Math.round(design.dimensions.width * PX_PER_CM);
      const pixelHeight = Math.round(design.dimensions.height * PX_PER_CM);
      
      // 4. Define Buffer Size
      const BUFFER = 50; 
      const wrapperWidth = pixelWidth + (BUFFER * 2);
      const wrapperHeight = pixelHeight + (BUFFER * 2);

      // 5. Create Sandbox
      const sandbox = document.createElement('div');
      sandbox.id = 'export-sandbox';
      sandbox.style.position = 'fixed';
      sandbox.style.top = '0';
      sandbox.style.left = '0';
      sandbox.style.width = `${wrapperWidth}px`;
      sandbox.style.height = `${wrapperHeight}px`;
      sandbox.style.zIndex = '-9999';
      sandbox.style.display = 'flex';
      sandbox.style.alignItems = 'center';
      sandbox.style.justifyContent = 'center';
      sandbox.style.overflow = 'hidden';
      
      // Sandbox background (Double safety)
      if (design.background.type === 'gradient') {
          sandbox.style.background = `linear-gradient(135deg, ${design.background.color1} 0%, ${design.background.color2} 100%)`;
      } else if (design.background.type === 'solid') {
          sandbox.style.backgroundColor = design.background.color1;
      } else {
          sandbox.style.backgroundColor = design.background.color1 || '#ffffff';
      }

      document.body.appendChild(sandbox);

      // 6. Clone Content (Which is now clean due to isExporting=true)
      const originalCanvas = canvasRef.current;
      const clonedCanvas = originalCanvas.cloneNode(true) as HTMLElement;

      // 7. Style Clone
      clonedCanvas.removeAttribute('class'); 
      clonedCanvas.removeAttribute('id');
      
      clonedCanvas.style.width = `${pixelWidth}px`;
      clonedCanvas.style.height = `${pixelHeight}px`;
      clonedCanvas.style.position = 'absolute';
      clonedCanvas.style.left = `${BUFFER}px`;
      clonedCanvas.style.top = `${BUFFER}px`;
      clonedCanvas.style.margin = '0';
      clonedCanvas.style.boxShadow = 'none'; 
      clonedCanvas.style.border = 'none'; 
      clonedCanvas.style.overflow = 'visible'; // ALLOW BLEED: Key fix
      clonedCanvas.style.transform = 'none';
      
      // 8. APPLY BLEED TO BACKGROUND LAYERS ONLY
      // FIX: Do NOT include frame in bleed logic. Frames must respect their rect.
      // We only bleed background to ensure edges are clean.
      const layersToBleed = clonedCanvas.querySelectorAll('[data-export-layer="background"]'); 
      if (layersToBleed.length > 0) {
          layersToBleed.forEach((el) => {
              const div = el as HTMLElement;
              
              // Expand element outwards by 2px in all directions
              div.style.position = 'absolute';
              div.style.left = '-2px';
              div.style.top = '-2px';
              div.style.width = 'calc(100% + 4px)';
              div.style.height = 'calc(100% + 4px)';
              
              // Force low z-index for background to stay behind frame
              if (!div.style.zIndex) {
                  div.style.zIndex = '0';
              }
          });
      }

      // 9. Extra Cleanup (Just in case)
      const uiElements = clonedCanvas.querySelectorAll('.ring-2, .ring-1, [data-html2canvas-ignore="true"]');
      uiElements.forEach(el => el.remove());

      sandbox.appendChild(clonedCanvas);

      // 10. Scale Calculation
      const MAX_PIXELS = 35000000; 
      const currentArea = wrapperWidth * wrapperHeight;
      let scale = 2.5; 
      if (currentArea * scale * scale > MAX_PIXELS) {
          scale = Math.sqrt(MAX_PIXELS / currentArea);
          if (scale < 1) scale = 1; 
      }
      
      // 11. Capture
      const bigCanvas = await html2canvas(sandbox, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null, 
        scrollX: 0,
        scrollY: 0,
        logging: false,
        onclone: (doc) => {
             // Text Stroke Polyfill
            const strokeElements = doc.querySelectorAll('[style*="-webkit-text-stroke"]');
            strokeElements.forEach(el => {
                const htmlEl = el as HTMLElement;
                const strokeStyle = htmlEl.style.webkitTextStroke;
                if (strokeStyle && strokeStyle !== '0px') {
                    const parts = strokeStyle.trim().match(/^([\d.]+)px\s+(.+)$/);
                    if (parts) {
                        const w = parseFloat(parts[1]);
                        const c = parts[2];
                        if (w > 0 && c) {
                            const shadows = [];
                            for (let x = -1; x <= 1; x++) {
                                for (let y = -1; y <= 1; y++) {
                                    if (x === 0 && y === 0) continue;
                                    shadows.push(`${x * w}px ${y * w}px 0 ${c}`);
                                }
                            }
                            const current = htmlEl.style.textShadow;
                            htmlEl.style.textShadow = (current && current !== 'none') ? `${current}, ${shadows.join(', ')}` : shadows.join(', ');
                            htmlEl.style.webkitTextStroke = '0px transparent';
                        }
                    }
                }
            });
            // Fix Flexbox Display
            const flexContainers = doc.querySelectorAll('.flex');
            flexContainers.forEach(el => { (el as HTMLElement).style.display = 'flex'; });
        }
      });

      // 12. Manual Crop
      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = pixelWidth * scale;
      finalCanvas.height = pixelHeight * scale;
      const ctx = finalCanvas.getContext('2d');
      
      if (!ctx) throw new Error("Context 2d failed");

      // Source coordinates (Buffer * Scale)
      const srcX = Math.floor(BUFFER * scale);
      const srcY = Math.floor(BUFFER * scale);
      const srcW = finalCanvas.width;
      const srcH = finalCanvas.height;

      // Draw clipped region
      ctx.drawImage(bigCanvas, srcX, srcY, srcW, srcH, 0, 0, srcW, srcH);

      // 13. Save File
      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? 0.9 : 1.0;

      // Explicitly type the callback parameter to avoid potential 'unknown' type issues in strict TypeScript environments.
      finalCanvas.toBlob((blob: Blob | null) => {
          if (document.body.contains(sandbox)) document.body.removeChild(sandbox);
          window.scrollTo(0, scrollPos);
          if (!blob) { alert("Lỗi tạo ảnh"); return; }
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `thiet-ke-${design.mode}-${Date.now()}.${format}`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 100);
      }, mimeType, quality);

    } catch (error) {
       console.error("Export Error:", error);
       alert("Xuất file thất bại. Vui lòng thử lại.");
       const sb = document.getElementById('export-sandbox');
       if(sb) sb.remove();
       window.scrollTo(0, scrollPos);
    } finally {
        // 14. Exit Export Mode
        setIsExporting(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-white font-sans bg-[#0f172a]">
      
      {/* Mobile Backdrop for Sidebar */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}

      {/* Left Sidebar: Controls - Responsive Drawer with Resizable Width on Desktop */}
      <aside 
        className={`
            fixed lg:relative z-40 h-full bg-[#110e2e] border-r border-indigo-900/50 shadow-xl transition-all duration-300 ease-in-out flex flex-col group
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden'}
        `}
        style={{
            // Apply dynamic width only on desktop when open
            width: (isDesktop && isSidebarOpen) ? `${sidebarWidth}px` : undefined,
            // Fallback classes for mobile are handled by className `w-[90vw] sm:w-[400px]` implicitly or we need to enforce them
        }}
      >
          {/* Enforce mobile width via class if not desktop */}
          <div className={`flex-1 overflow-hidden h-full flex flex-col ${!isDesktop ? 'w-[90vw] sm:w-[400px]' : 'w-full'}`}>
            <ControlPanel 
                design={design} 
                setDesign={handleControlPanelChange} 
                onExport={handleExport}
                onClose={() => setIsSidebarOpen(false)}
            />
          </div>

          {/* Resizer Handle - Desktop Only */}
          {isDesktop && isSidebarOpen && (
              <div
                className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-indigo-500/50 z-50 transition-colors group-hover:bg-indigo-500/10 active:bg-indigo-500"
                onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
                title="Kéo để thay đổi kích thước"
              />
          )}
      </aside>

      {/* Main Area: Canvas */}
      <main className="flex-1 relative flex flex-col min-w-0 transition-all duration-300 w-full h-full bg-[#0f172a]">
        {/* Toggle Button - Desktop Only - Attached to the left edge of Main Area */}
        {isDesktop && !isExporting && (
           <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`
                 absolute top-1/2 -translate-y-1/2 z-50
                 w-5 h-10 flex items-center justify-center
                 bg-[#110e2e] border border-indigo-900/50 border-l-0
                 shadow-[2px_0_5px_rgba(0,0,0,0.2)] cursor-pointer
                 text-indigo-400 hover:text-white hover:bg-indigo-600
                 transition-all duration-300 ease-in-out
                 rounded-r-md opacity-80 hover:opacity-100 hover:w-6
              `}
              style={{ left: 0 }}
              title={isSidebarOpen ? "Thu gọn (Collapse)" : "Mở rộng (Expand)"}
           >
              {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
           </button>
        )}

        {/* Top bar */}
        <header className="h-14 bg-[#0b0923]/90 backdrop-blur-md border-b border-indigo-900/50 flex items-center justify-between px-4 lg:px-6 shadow-sm z-10 sticky top-0 shrink-0">
           <div className="flex items-center gap-4">
               {/* Sidebar Toggle Button (Header - Legacy/Mobile) */}
               <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors border border-transparent hover:border-white/20 lg:hidden"
                  title={isSidebarOpen ? "Thu gọn AI Designer" : "Mở rộng AI Designer"}
               >
                   {isSidebarOpen ? <PanelLeftClose size={20}/> : <Menu size={20}/>}
               </button>

               {/* Undo / Redo Buttons */}
               <div className="flex items-center gap-1">
                   <button 
                      onClick={undo}
                      disabled={history.length === 0}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${history.length === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                      title="Hoàn tác (Undo)"
                   >
                       <Undo size={18}/>
                   </button>
                   <button 
                      onClick={redo}
                      disabled={future.length === 0}
                      className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${future.length === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-slate-300 hover:bg-white/10 hover:text-white'}`}
                      title="Làm lại (Redo)"
                   >
                       <Redo size={18}/>
                   </button>
               </div>

               <div className="h-6 w-px bg-indigo-900/50 mx-1 hidden sm:block"></div>

               <h1 className="text-sm font-bold text-white flex items-center gap-2 truncate">
                   <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] shrink-0"></span>
                   <span className="hidden sm:inline">{design.mode === 'poster' ? 'Thiết kế Poster' : 'Thiết kế Băng rôn'}</span>
                   <span className="text-indigo-300 font-medium px-2 py-0.5 bg-indigo-900/50 border border-indigo-800 rounded text-xs whitespace-nowrap">{design.ratio}</span>
               </h1>
           </div>
           
           <div className="text-xs text-indigo-300 font-semibold bg-indigo-900/50 px-3 py-1.5 rounded-full border border-indigo-500/30 shadow-sm flex items-center gap-1 hidden sm:flex">
               <span className="animate-pulse">✨</span> AI-Powered Studio
           </div>
        </header>

        {/* Canvas Wrapper with darker contrast pattern */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] bg-[#0f172a] flex items-center justify-center">
            {/* 
               If Exporting, we show a clean loading state or keeping the canvas 
               isExporting prop ensures DesignCanvas renders purely design elements.
            */}
            <DesignCanvas 
                design={design} 
                canvasRef={canvasRef} 
                setDesign={setDesign} 
                onHistoryRecord={recordHistory}
                isExporting={isExporting} // PASS EXPORT STATE
            />
            
            {/* Export Overlay Loader */}
            {isExporting && (
                <div className="absolute inset-0 z-[9999] bg-[#0f172a]/90 backdrop-blur-sm flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                         <div className="w-8 h-8 border-4 border-indigo-900 border-t-indigo-500 rounded-full animate-spin"></div>
                         <div className="text-sm font-bold text-indigo-300">Đang xuất file chất lượng cao...</div>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default App;
