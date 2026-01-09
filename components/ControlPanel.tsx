
import React, { useState, useEffect, useRef } from 'react';
import { DesignState, FONTS, RATIOS, AspectRatio, Decoration, InsertedImage, FreeText, DEFAULT_DESIGN, IllustrationStyle, FrameStyle, TextEffect } from '../types';
import { Palette, Type, Layout, Image as ImageIcon, Download, RefreshCw, Wand2, Upload, BoxSelect, Bold, Italic, AlignCenter, AlignLeft, AlignRight, Eye, EyeOff, Sparkles, ZoomIn, Move, Save, FolderOpen, Trash2, Calendar, MapPin, HardDrive, FileJson, Clock, ChevronsLeft, CheckCircle2, X, Droplet, Layers, ArrowRightLeft, ArrowUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus, Grid, Library, ImagePlus, Maximize2, Eraser, RotateCcw, MousePointer2, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Circle, Square, RectangleHorizontal, Link, PaintBucket, Scaling, AlignHorizontalJustifyCenter, AlignVerticalJustifyCenter, Frame, CopyPlus, Images, PlusCircle } from 'lucide-react';
import { generateIllustration, generateTextSuggestion, removeBackgroundImage } from '../services/geminiService';

const PX_PER_CM = 37.8;

interface ControlPanelProps {
  design: DesignState;
  setDesign: React.Dispatch<React.SetStateAction<DesignState>>;
  onExport: (format: 'png' | 'jpg' | 'pdf') => void;
  onClose?: () => void;
}

const TABS = [
  { id: 'layout', icon: Layout, label: 'Bố cục' },
  { id: 'text', icon: Type, label: 'Nội dung' },
  { id: 'image', icon: ImageIcon, label: 'Ảnh nền' },
  { id: 'insert-image', icon: ImagePlus, label: 'Chèn ảnh' },
  { id: 'frame', icon: BoxSelect, label: 'Khung viền' }, 
  { id: 'export', icon: Download, label: 'Xuất file' },
];

interface LocalProject {
    key: string;
    name: string;
    date: string;
    timestamp: number;
}

interface LibraryItem {
    id?: string;
    url: string;
    cat: string;
    thumb: string;
    isUserUpload?: boolean;
}

// Frame Categories Definition
const FRAME_CATEGORIES = [
  {
    name: "Cơ bản",
    items: [
      { id: 'none', label: 'Không' },
      { id: 'solid', label: 'Nét liền' },
      { id: 'double', label: 'Nét đôi' },
      { id: 'dashed', label: 'Nét đứt' },
      { id: 'dotted', label: 'Nét chấm' },
    ]
  },
  {
    name: "Trang trọng",
    items: [
      { id: 'certificate', label: 'Chứng chỉ' },
      { id: 'vintage-corner', label: 'Góc cổ điển' },
      { id: 'art-deco', label: 'Art Deco' },
      { id: 'classic-gold', label: 'Vàng cổ điển' },
      { id: 'ornamental', label: 'Hoa văn' },
      { id: 'floral', label: 'Hoa lá' },
    ]
  },
  {
    name: "Nhà trường",
    items: [
      { id: 'bamboo', label: 'Tre trúc' },
      { id: 'ruler', label: 'Thước kẻ' },
      { id: 'notebook', label: 'Vở viết' },
      { id: 'chalkboard', label: 'Bảng phấn' },
    ]
  },
  {
    name: "Thiếu nhi",
    items: [
      { id: 'stars', label: 'Sao lấp lánh' },
      { id: 'colorful-dots', label: 'Chấm bi màu' },
      { id: 'puzzle', label: 'Mảnh ghép' },
      { id: 'crayons', label: 'Bút sáp' },
    ]
  },
  {
    name: "Sự kiện & Hiện đại",
    items: [
      { id: 'neon-border', label: 'Đèn Neon' },
      { id: 'tech-hud', label: 'Công nghệ' },
      { id: 'geometric', label: 'Hình học' },
      { id: 'tribal', label: 'Thổ cẩm' },
    ]
  }
];

const BG_CATEGORIES = ['Tất cả', 'Tải lên', 'Trừu tượng', 'Giáo dục', 'Thiên nhiên', 'Lễ hội', 'Chất liệu', 'Việt Nam'];

const DEFAULT_BACKGROUND_LIBRARY: LibraryItem[] = [
    // Trừu tượng (Abstract)
    { url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80', cat: 'Trừu tượng', thumb: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=1200&q=80', cat: 'Trừu tượng', thumb: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80', cat: 'Trừu tượng', thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?auto=format&fit=crop&w=1200&q=80', cat: 'Trừu tượng', thumb: 'https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80', cat: 'Trừu tượng', thumb: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=200&q=60' },
    // Giáo dục
    { url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80', cat: 'Giáo dục', thumb: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1200&q=80', cat: 'Giáo dục', thumb: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=200&q=60' },
    // Thiên nhiên
    { url: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80', cat: 'Thiên nhiên', thumb: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', cat: 'Thiên nhiên', thumb: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=200&q=60' },
    // Lễ hội
    { url: 'https://images.unsplash.com/photo-1514525253440-b393452e3383?auto=format&fit=crop&w=1200&q=80', cat: 'Lễ hội', thumb: 'https://images.unsplash.com/photo-1514525253440-b393452e3383?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1533294455009-a79b7550d2de?auto=format&fit=crop&w=1200&q=80', cat: 'Lễ hội', thumb: 'https://images.unsplash.com/photo-1533294455009-a79b7550d2de?auto=format&fit=crop&w=200&q=60' },
    // Chất liệu
    { url: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1200&q=80', cat: 'Chất liệu', thumb: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=200&q=60' },
    { url: 'https://images.unsplash.com/photo-1550136513-548af4445338?auto=format&fit=crop&w=1200&q=80', cat: 'Chất liệu', thumb: 'https://images.unsplash.com/photo-1550136513-548af4445338?auto=format&fit=crop&w=200&q=60' },
    // Việt Nam
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Dong_Son_drum_tympanum.svg/1024px-Dong_Son_drum_tympanum.svg.png', cat: 'Việt Nam', thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Dong_Son_drum_tympanum.svg/200px-Dong_Son_drum_tympanum.svg.png' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Trong_dong_Ngoc_Lu.jpg/1024px-Trong_dong_Ngoc_Lu.jpg', cat: 'Việt Nam', thumb: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Trong_dong_Ngoc_Lu.jpg/200px-Trong_dong_Ngoc_Lu.jpg' },
    { url: 'https://images.unsplash.com/photo-1642697196280-454153922378?auto=format&fit=crop&w=1200&q=80', cat: 'Việt Nam', thumb: 'https://images.unsplash.com/photo-1642697196280-454153922378?auto=format&fit=crop&w=200&q=60' },
];

const SOLID_COLORS = [
  '#ffffff', '#1e293b', '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e',
  '#94a3b8', '#000000', '#fecaca', '#fed7aa', '#fde68a', '#d9f99d', '#a7f3d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#f0abfc', '#fecdd3'
];

const GRADIENT_PRESETS = [
  { name: 'Ấm áp', c1: '#fbc2eb', c2: '#a6c1ee' },
  { name: 'Mát mẻ', c1: '#84fab0', c2: '#8fd3f4' },
  { name: 'Năng động', c1: '#fa709a', c2: '#fee140' },
  { name: 'Sang trọng', c1: '#434343', c2: '#000000' },
  { name: 'Thiên nhiên', c1: '#96fbc4', c2: '#f9f586' },
  { name: 'Đại dương', c1: '#20e3b2', c2: '#2cd8d5' },
  { name: 'Tím mộng', c1: '#c471f5', c2: '#fa71cd' },
  { name: 'Hoàng hôn', c1: '#ff9a9e', c2: '#fecfef' },
  { name: 'Bình minh', c1: '#ffecd2', c2: '#fcb69f' },
  { name: 'Đêm tối', c1: '#0f2027', c2: '#2c5364' },
  { name: 'Rực rỡ', c1: '#ff512f', c2: '#dd2476' },
  { name: 'Cổ điển', c1: '#e0c3fc', c2: '#8ec5fc' }
];

export const ControlPanel: React.FC<ControlPanelProps> = ({ design, setDesign, onExport, onClose }) => {
  const [activeTab, setActiveTab] = useState('layout');
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isAuthorInfoExpanded, setIsAuthorInfoExpanded] = useState(false);
  
  // Image Library State
  const [bgCategory, setBgCategory] = useState('Tất cả');
  const [customLibrary, setCustomLibrary] = useState<LibraryItem[]>([]);
  const libraryInputRef = useRef<HTMLInputElement>(null);
  
  // Insert Image State
  const [selectedInsertedImageId, setSelectedInsertedImageId] = useState<string | null>(null);
  const insertImageInputRef = useRef<HTMLInputElement>(null);

  // Free Text State
  const [selectedFreeTextId, setSelectedFreeTextId] = useState<string | null>(null);

  // AI Generation Ref Image State
  const [refImages, setRefImages] = useState<string[]>([]);
  const refImageInputRef = useRef<HTMLInputElement>(null);

  // Background Mode State (Image or Color)
  const [bgTypeTab, setBgTypeTab] = useState<'image' | 'color'>('image');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  // Local Library State (Projects)
  const [savedProjects, setSavedProjects] = useState<LocalProject[]>([]);

  // Header Sync State
  const [isHeaderSynced, setIsHeaderSynced] = useState(false);

  // Load Saved Projects and Custom Backgrounds on mount
  useEffect(() => {
      refreshLibrary();
      loadCustomBackgrounds();
  }, []);

  const refreshLibrary = () => {
      const items: LocalProject[] = [];
      try {
        for(let i=0; i<localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key && key.startsWith('ai_poster_design_')) {
                try {
                    const data = JSON.parse(localStorage.getItem(key) || '{}');
                    const timestamp = parseInt(key.replace('ai_poster_design_', ''));
                    items.push({
                        key,
                        name: data.title?.content || 'Thiết kế chưa đặt tên',
                        date: new Date(timestamp).toLocaleString('vi-VN'),
                        timestamp
                    });
                } catch (e) {
                    console.error("Invalid project data", key);
                }
            }
        }
        setSavedProjects(items.sort((a,b) => b.timestamp - a.timestamp));
      } catch (e) {
          console.error("Error accessing localStorage");
      }
  };

  const loadCustomBackgrounds = () => {
      try {
          const stored = localStorage.getItem('ai_poster_custom_bgs');
          if (stored) {
              setCustomLibrary(JSON.parse(stored));
          }
      } catch (e) {
          console.error("Error loading custom backgrounds", e);
      }
  }

  const updateNested = (path: string[], value: any) => {
    setDesign((prev) => {
      const newDesign = { ...prev };
      let current: any = newDesign;
      for (let i = 0; i < path.length - 1; i++) {
        current[path[i]] = { ...current[path[i]] };
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newDesign;
    });
  };

  const updateFreeText = (id: string, updates: Partial<FreeText>) => {
    setDesign(prev => ({
      ...prev,
      freeTexts: prev.freeTexts.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const handleAddFreeText = () => {
    const newText: FreeText = {
      id: 'free-' + Date.now(),
      content: 'Nhập nội dung mới...',
      font: 'Roboto',
      color: '#000000',
      size: 1.0,
      lineHeight: 1.2,
      letterSpacing: 0,
      effect: 'none',
      effectColor: '#000000',
      effectThickness: 1,
      align: 'center',
      bold: false,
      italic: false,
      uppercase: false,
      x: 0,
      y: 0,
      rotation: 0,
      maxWidth: 300,
      hidden: false
    };
    setDesign(prev => ({
      ...prev,
      freeTexts: [...prev.freeTexts, newText]
    }));
    setSelectedFreeTextId(newText.id);
  };

  const handleSelectLibraryBg = (url: string) => {
      updateNested(['illustration', 'url'], url);
      updateNested(['illustration', 'scale'], 1);
      updateNested(['illustration', 'x'], 0);
      updateNested(['illustration', 'y'], 0);
      
      if (design.background.overlayOpacity > 0.8) {
          updateNested(['background', 'overlayOpacity'], 0.5);
      }
  };

  const handleUploadToLibrary = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (file.size > 8 * 1024 * 1024) { 
              alert("Ảnh quá lớn! Vui lòng chọn ảnh dưới 8MB.");
              return;
          }

          const reader = new FileReader();
          reader.onload = () => {
              const base64 = reader.result as string;
              if (!base64) return;

              const newItem: LibraryItem = {
                  id: 'bg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
                  url: base64,
                  thumb: base64,
                  cat: 'Tải lên',
                  isUserUpload: true
              };
              
              setCustomLibrary(prev => {
                  const updated = [newItem, ...prev];
                  try {
                      localStorage.setItem('ai_poster_custom_bgs', JSON.stringify(updated));
                  } catch (err) {
                      console.error("Storage limit reached", err);
                  }
                  return updated;
              });
              
              // Switch to "Tải lên" category
              setBgCategory('Tải lên');

              // Apply background immediately
              handleSelectLibraryBg(base64);
          };
          reader.readAsDataURL(file);
      }
      // Reset input value to allow selecting same file
      e.target.value = "";
  };

  const handleInsertImage = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      // Explicitly type file as File to avoid 'unknown' type issues in environments where FileList inference is weak.
      Array.from(files).forEach((file: File) => {
          const reader = new FileReader();
          reader.onload = () => {
              const base64 = reader.result as string;
              const newImg: InsertedImage = {
                  id: 'img-' + Date.now() + Math.random().toString(36).substr(2, 5),
                  url: base64,
                  x: 0,
                  y: 0,
                  scale: 0.5,
                  blur: 0,
                  featherLeft: 0,
                  featherRight: 0,
                  featherTop: 0,
                  featherBottom: 0,
                  rotation: 0,
                  isRemovedBg: false
              };
              setDesign(prev => ({
                  ...prev,
                  insertedImages: [...prev.insertedImages, newImg]
              }));
              setSelectedInsertedImageId(newImg.id);
          };
          reader.readAsDataURL(file);
      });
      e.target.value = "";
  };

  const updateInsertedImage = (id: string, updates: Partial<InsertedImage>) => {
      setDesign(prev => ({
          ...prev,
          insertedImages: prev.insertedImages.map(img => img.id === id ? { ...img, ...updates } : img)
      }));
  };

  const removeInsertedImage = (id: string) => {
      setDesign(prev => ({
          ...prev,
          insertedImages: prev.insertedImages.filter(img => img.id !== id)
      }));
      if (selectedInsertedImageId === id) setSelectedInsertedImageId(null);
  };

  const handleRemoveBg = async (img: InsertedImage) => {
      if (img.loading || img.isRemovedBg) return;
      
      updateInsertedImage(img.id, { loading: true });
      try {
          const newUrl = await removeBackgroundImage(img.url);
          if (newUrl) {
              updateInsertedImage(img.id, { 
                  url: newUrl, 
                  originalUrl: img.url, 
                  isRemovedBg: true,
                  loading: false 
              });
          } else {
              alert("Không thể tách nền. Vui lòng thử lại.");
              updateInsertedImage(img.id, { loading: false });
          }
      } catch (e) {
          alert("Lỗi AI khi tách nền.");
          updateInsertedImage(img.id, { loading: false });
      }
  };

  const handleRestoreImg = (img: InsertedImage) => {
      if (!img.originalUrl) return;
      updateInsertedImage(img.id, { 
          url: img.originalUrl, 
          originalUrl: undefined, 
          isRemovedBg: false 
      });
  };

  const handleDeleteFromBgLibrary = (e: React.MouseEvent, id: string) => {
      // Chặn sự kiện chọn ảnh nền
      e.stopPropagation();
      e.preventDefault();
      
      const itemToDelete = customLibrary.find(item => item.id === id);
      if (!itemToDelete) {
          console.error("Không tìm thấy ảnh để xoá");
          return;
      }

      // Kiểm tra trạng thái đang được sử dụng làm nền
      // design.illustration.url chứa base64 hoặc URL của ảnh nền hiện tại
      if (design.illustration.url === itemToDelete.url) {
          alert("Ảnh đang được sử dụng làm nền, hãy đổi nền khác trước khi xoá.");
          return;
      }

      if (window.confirm("Bạn có chắc muốn xóa ảnh này khỏi thư viện?")) {
          try {
              // 1. Cập nhật State cho UI
              const newLibrary = customLibrary.filter(item => item.id !== id);
              setCustomLibrary(newLibrary);
              
              // 2. Cập nhật localStorage để lưu trữ vĩnh viễn
              localStorage.setItem('ai_poster_custom_bgs', JSON.stringify(newLibrary));
              
              // 3. Phản hồi thành công
              alert("Đã xoá ảnh.");
          } catch (error) {
              console.error("Lỗi khi cập nhật thư viện ảnh", error);
              alert("Lỗi khi xoá ảnh: Vấn đề về bộ nhớ trình duyệt.");
          }
      }
  };

  const handleSaveToLibrary = () => {
      try {
          const timestamp = Date.now();
          const key = `ai_poster_design_${timestamp}`;
          localStorage.setItem(key, JSON.stringify(design));
          refreshLibrary();
          alert("Đã lưu thiết kế vào Thư viện trình duyệt!");
      } catch (e) {
          alert("Lỗi: Bộ nhớ trình duyệt đã đầy. Hãy xóa bớt các dự án cũ.");
      }
  };

  const handleLoadFromLibrary = (key: string) => {
      if(window.confirm("Bạn có chắc muốn mở dự án này? Thiết kế hiện tại sẽ bị thay thế.")) {
          try {
              const data = localStorage.getItem(key);
              if (data) {
                  const loadedDesign = JSON.parse(data);
                  setDesign(loadedDesign);
              }
          } catch (e) {
              alert("Không thể mở dự án.");
          }
      }
  };

  const handleDeleteFromLibrary = (e: React.MouseEvent, key: string) => {
      e.stopPropagation();
      e.preventDefault(); 

      if(window.confirm("Bạn có chắc muốn xóa dự án này vĩnh viễn?")) {
          try {
              localStorage.removeItem(key);
              setSavedProjects(prev => prev.filter(p => p.key !== key));
          } catch (error) {
              console.error("Error deleting project:", error);
              alert("Không thể xóa dự án.");
          }
      }
  };

  const handleResetDesign = () => {
      if(window.confirm("Bạn có chắc muốn làm mới lại toàn bộ thiết kế? Mọi thay đổi sẽ bị mất.")) {
          setDesign({
              ...DEFAULT_DESIGN,
              mode: design.mode, 
              dimensions: design.dimensions, 
              ratio: design.ratio 
          });
      }
  };

  const handleDimensionChange = (key: 'width' | 'height', value: number) => {
    const safeValue = Math.min(value, 800);
    setDesign(prev => ({
        ...prev,
        ratio: 'Custom',
        dimensions: {
            ...prev.dimensions,
            [key]: isNaN(safeValue) ? 0 : safeValue
        }
    }));
  };

  const handleDimensionBlur = (key: 'width' | 'height') => {
      setDesign(prev => ({
          ...prev,
          dimensions: {
              ...prev.dimensions,
              [key]: Math.max(0.1, prev.dimensions[key])
          }
      }));
  };

  const handleSwapDimensions = () => {
      setDesign(prev => ({
          ...prev,
          ratio: 'Custom',
          dimensions: {
              width: prev.dimensions.height,
              height: prev.dimensions.width
          }
      }));
  };

  const handleRatioSelect = (ratioKey: string) => {
      // @ts-ignore
      const r = RATIOS[ratioKey];
      if (r) {
          setDesign(prev => ({
              ...prev,
              ratio: ratioKey as any,
              dimensions: { width: r.w, height: r.h }
          }));
      }
  };

  const handleMagicText = async () => {
      if(!design.title.content) return;
      setIsGeneratingText(true);
      const suggestions = await generateTextSuggestion(design.title.content);
      setDesign(prev => ({
          ...prev,
          title: { ...prev.title, content: suggestions.title },
          subtitle: { ...prev.subtitle, content: suggestions.subtitle }
      }));
      setIsGeneratingText(false);
  }

  const getGeminiAspectRatio = (width: number, height: number): "1:1" | "3:4" | "4:3" | "16:9" | "9:16" => {
      const ratio = width / height;
      if (ratio > 0.8 && ratio < 1.2) return "1:1";
      if (ratio <= 0.8) return ratio < 0.6 ? "9:16" : "3:4";
      if (ratio >= 1.2) return ratio > 1.6 ? "16:9" : "4:3";
      return "1:1";
  }

  const handleGenerateImage = async () => {
    updateNested(['illustration', 'loading'], true);
    try {
        const targetRatio = getGeminiAspectRatio(design.dimensions.width, design.dimensions.height);
        const url = await generateIllustration(design.illustration.prompt, design.illustration.style, targetRatio, refImages);
        if (url) {
            updateNested(['illustration', 'url'], url);
            updateNested(['illustration', 'scale'], 1); 
            updateNested(['illustration', 'x'], 0); 
            updateNested(['illustration', 'y'], 0); 
            if (design.background.overlayOpacity > 0.9) {
                updateNested(['background', 'overlayOpacity'], 0.7);
            }
        }
    } catch (e) {
        alert("Không thể tạo ảnh. Vui lòng thử lại.");
    } finally {
        updateNested(['illustration', 'loading'], false);
    }
  };

  const handleRefImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const newImages: string[] = [];
          const readers: Promise<void>[] = [];

          Array.from(files).forEach((file: File) => {
              const reader = new FileReader();
              const promise = new Promise<void>((resolve) => {
                  reader.onloadend = () => {
                      if (reader.result) {
                          newImages.push(reader.result as string);
                      }
                      resolve();
                  };
              });
              reader.readAsDataURL(file);
              readers.push(promise);
          });

          Promise.all(readers).then(() => {
              setRefImages(prev => [...prev, ...newImages]);
          });
      }
      if (refImageInputRef.current) refImageInputRef.current.value = "";
  }

  const handleRemoveRefImage = (indexToRemove: number) => {
      setRefImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateNested(['illustration', 'url'], reader.result as string);
        updateNested(['illustration', 'scale'], 1);
        updateNested(['illustration', 'x'], 0);
        updateNested(['illustration', 'y'], 0);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorBgSelect = (c1: string, c2?: string) => {
    setDesign(prev => ({
        ...prev,
        illustration: {
            ...prev.illustration,
            url: null 
        },
        background: {
            ...prev.background,
            type: c2 ? 'gradient' : 'solid',
            color1: c1,
            color2: c2 || c1,
            overlayOpacity: 0 
        }
    }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesign(prev => ({
            ...prev,
            header: {
                ...prev.header,
                logo: reader.result as string,
                logoPosition: 'custom', 
                logoShape: 'circle', 
                logoX: 0, 
                logoY: -150 
            }
        }));
      };
      reader.readAsDataURL(file);
    }
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleRemoveLogo = () => {
      updateNested(['header', 'logo'], null);
  };

  const handleSaveProjectFile = () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(design));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", `ai-project-${Date.now()}.json`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleLoadProjectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const loadedDesign = JSON.parse(event.target?.result as string);
              if (loadedDesign.mode && loadedDesign.dimensions) {
                  setDesign(loadedDesign);
                  alert("Đã phục hồi dự án thành công!");
              } else {
                  alert("File dự án không hợp lệ. Vui lòng chọn đúng file .json đã tải xuống.");
              }
          } catch (err) {
              alert("Lỗi đọc file dự án. File có thể bị hỏng.");
          }
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSyncTopToBottom = () => {
        const newSyncState = !isHeaderSynced;
        setIsHeaderSynced(newSyncState);

        if (newSyncState) {
            setDesign(prev => ({
                ...prev,
                header: {
                    ...prev.header,
                    bottomText: {
                        ...prev.header.bottomText, 
                        font: prev.header.topText.font,
                        color: prev.header.topText.color,
                        size: prev.header.topText.size,
                        lineHeight: prev.header.topText.lineHeight,
                        letterSpacing: prev.header.topText.letterSpacing,
                        align: prev.header.topText.align,
                        bold: prev.header.topText.bold,
                        italic: prev.header.topText.italic,
                        uppercase: prev.header.topText.uppercase,
                        effect: prev.header.topText.effect,
                        effectColor: prev.header.topText.effectColor,
                        effectThickness: prev.header.topText.effectThickness,
                        shadowBlur: prev.header.topText.shadowBlur,
                        shadowOffsetX: prev.header.topText.shadowOffsetX,
                        shadowOffsetY: prev.header.topText.shadowOffsetY,
                    }
                }
            }));
        }
    };

  const updateFrameMargin = (side: 'top' | 'bottom' | 'left' | 'right', value: number) => {
      setDesign(prev => {
          const currentRect = prev.frame.rect || { x: 0, y: 0, width: prev.dimensions.width, height: prev.dimensions.height };
          let { x, y, width, height } = currentRect;
          
          if (side === 'top') {
              const diff = value - y;
              y = value;
              height -= diff;
          } else if (side === 'left') {
              const diff = value - x;
              x = value;
              width -= diff;
          } else if (side === 'right') {
              width = prev.dimensions.width - x - value;
          } else if (side === 'bottom') {
              height = prev.dimensions.height - y - value;
          }

          if (width < 1) width = 1;
          if (height < 1) height = 1;

          return {
              ...prev,
              frame: {
                  ...prev.frame,
                  rect: { x, y, width, height }
              }
          };
      });
  };

  const updateUniformMargin = (margin: number) => {
      setDesign(prev => {
          const w = prev.dimensions.width;
          const h = prev.dimensions.height;
          const maxMargin = Math.min(w, h) / 2 - 0.1;
          const safeMargin = Math.min(Math.max(0, margin), maxMargin);

          return {
              ...prev,
              frame: {
                  ...prev.frame,
                  rect: {
                      x: safeMargin,
                      y: safeMargin,
                      width: w - (safeMargin * 2),
                      height: h - (safeMargin * 2)
                  }
              }
          };
      });
  };

  const handleCenterFrame = () => {
      setDesign(prev => {
          const rect = prev.frame.rect || { x: 0, y: 0, width: prev.dimensions.width, height: prev.dimensions.height };
          const newX = (prev.dimensions.width - rect.width) / 2;
          const newY = (prev.dimensions.height - rect.height) / 2;
          return {
              ...prev,
              frame: {
                  ...prev.frame,
                  rect: { ...rect, x: newX, y: newY }
              }
          };
      });
  };

  const updateIllustrationTransform = (prop: 'scale' | 'x' | 'y', delta: number) => {
      setDesign(prev => ({
          ...prev,
          illustration: {
              ...prev.illustration,
              [prop]: parseFloat((prev.illustration[prop] + delta).toFixed(1))
          }
      }));
  };

  const resetIllustrationTransform = () => {
      updateNested(['illustration', 'scale'], 1);
      updateNested(['illustration', 'x'], 0);
      updateNested(['illustration', 'y'], 0);
  }

  // --- RENDER HELPERS ---
  const renderDimensionControls = () => (
      <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm mb-6 group hover:border-indigo-500 transition-colors">
          <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-md">
                <Scaling size={16} />
              </div>
              <span className="text-sm font-bold text-indigo-100">Kích thước tùy chỉnh</span>
          </div>
          <div className="flex items-center gap-3">
              <div className="flex-1">
                  <div className="relative">
                    <input 
                        type="number" 
                        value={design.dimensions.width}
                        onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value))}
                        onBlur={() => handleDimensionBlur('width')}
                        className="w-full pl-3 pr-8 py-2 text-sm font-medium border border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center bg-[#0b0923] text-white focus:bg-[#110e2e]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none">CM</span>
                  </div>
                  <label className="text-[10px] text-slate-500 font-medium text-center block mt-1.5">Chiều rộng</label>
              </div>
              
              <button 
                onClick={handleSwapDimensions}
                className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-full transition-all mt-[-20px]"
                title="Đảo chiều"
              >
                  <ArrowRightLeft size={18} />
              </button>
              
              <div className="flex-1">
                   <div className="relative">
                    <input 
                        type="number" 
                        value={design.dimensions.height}
                        onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value))}
                        onBlur={() => handleDimensionBlur('height')}
                        className="w-full pl-3 pr-8 py-2 text-sm font-medium border border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-center bg-[#0b0923] text-white focus:bg-[#110e2e]"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 pointer-events-none">CM</span>
                   </div>
                   <label className="text-[10px] text-slate-500 font-medium text-center block mt-1.5">Chiều cao</label>
              </div>
          </div>
      </div>
  );

  const renderRatioButtons = (ratios: string[], label: string) => (
      <div className="mb-6">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-3 px-1">{label}</h3>
          <div className="grid grid-cols-2 gap-3">
              {ratios.map(r => {
                  // @ts-ignore
                  const data = RATIOS[r];
                  if (!data) return null;
                  const isActive = design.ratio === r;
                  const aspect = data.w / data.h;
                  
                  return (
                      <button
                        key={r}
                        onClick={() => handleRatioSelect(r)}
                        className={`relative group flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                            isActive 
                            ? 'bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500/50 shadow-sm' 
                            : 'bg-[#1a1642] border-indigo-900/50 hover:border-indigo-400 hover:shadow-md'
                        }`}
                      >
                          <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-indigo-500 text-white' : 'bg-[#0b0923] text-slate-500 group-hover:text-indigo-400'}`}>
                             <div 
                                style={{ 
                                    width: aspect >= 1 ? '20px' : `${20 * aspect}px`, 
                                    height: aspect <= 1 ? '20px' : `${20 / aspect}px`,
                                    border: '1.5px solid currentColor',
                                    borderRadius: '2px'
                                }} 
                             />
                          </div>
                          
                          <div className="min-w-0">
                              <div className={`text-xs font-bold truncate mb-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-300'}`}>{data.name}</div>
                              <div className={`text-[10px] font-medium ${isActive ? 'text-indigo-300' : 'text-slate-500'}`}>{data.w} x {data.h} cm</div>
                          </div>

                          {isActive && (
                              <div className="absolute top-2 right-2 text-indigo-400">
                                  <CheckCircle2 size={14} className="fill-indigo-900" />
                              </div>
                          )}
                      </button>
                  );
              })}
          </div>
      </div>
  );

  const renderTextInput = (path: string[], label: string, isTextArea = false, overrideValue?: string, onValueChange?: (val: string) => void) => {
      let value = "";
      if (overrideValue !== undefined) {
        value = overrideValue;
      } else {
        let current = design as any;
        for (const p of path) current = current[p];
        value = current.content;
      }
      
      const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (onValueChange) {
          onValueChange(e.target.value);
        } else {
          updateNested([...path, 'content'], e.target.value);
        }
      };

      return (
          <div className="mb-3">
              <label className="text-[10px] font-bold text-indigo-300 uppercase mb-1 block">{label}</label>
              {isTextArea ? (
                  <textarea 
                    value={value}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none min-h-[60px] bg-[#0b0923] text-white placeholder-slate-600"
                    placeholder={`Nhập ${label.toLowerCase()}...`}
                  />
              ) : (
                  <input 
                    type="text"
                    value={value}
                    onChange={handleChange}
                    className="w-full px-3 py-2 text-sm border border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-[#0b0923] text-white placeholder-slate-600"
                    placeholder={`Nhập ${label.toLowerCase()}...`}
                  />
              )}
          </div>
      )
  };

  const renderTextStyleControls = (path: string[], overrideLayer?: any, onUpdateLayer?: (updates: any) => void) => {
      let layer = overrideLayer;
      if (!layer) {
        layer = design as any;
        for (const p of path) layer = layer[p];
      }

      const update = (field: string, val: any) => {
        if (onUpdateLayer) {
          onUpdateLayer({ [field]: val });
        } else {
          updateNested([...path, field], val);
        }
      };

      return (
          <div className="bg-[#110e2e] p-3 rounded-lg border border-indigo-900/50 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                  <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Phông chữ</label>
                      <select 
                        value={layer.font}
                        onChange={(e) => update('font', e.target.value as any)}
                        className="w-full p-1.5 text-xs border border-indigo-900/50 rounded bg-[#0b0923] text-white focus:outline-none focus:border-indigo-500"
                      >
                          {FONTS.map(f => (
                              <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
                          ))}
                      </select>
                  </div>
                  <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Màu chữ</label>
                      <div className="flex items-center gap-2">
                          <input 
                            type="color" 
                            value={layer.color}
                            onChange={(e) => update('color', e.target.value)}
                            className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
                          />
                          <span className="text-xs text-slate-500 uppercase">{layer.color}</span>
                      </div>
                  </div>
              </div>

              <div className="flex items-center justify-between border-t border-indigo-900/50 pt-2">
                 <div className="flex gap-1">
                     <button onClick={() => update('bold', !layer.bold)} className={`p-1.5 rounded ${layer.bold ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}><Bold size={14}/></button>
                     <button onClick={() => update('italic', !layer.italic)} className={`p-1.5 rounded ${layer.italic ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}><Italic size={14}/></button>
                     <button onClick={() => update('uppercase', !layer.uppercase)} className={`p-1.5 rounded ${layer.uppercase ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}><Type size={14}/></button>
                 </div>
                 <div className="w-px h-4 bg-indigo-900/50"></div>
                 <div className="flex gap-1">
                     <button onClick={() => update('align', 'left')} className={`p-1.5 rounded ${layer.align === 'left' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}><AlignLeft size={14}/></button>
                     <button onClick={() => update('align', 'center')} className={`p-1.5 rounded ${layer.align === 'center' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}><AlignCenter size={14}/></button>
                     <button onClick={() => update('align', 'right')} className={`p-1.5 rounded ${layer.align === 'right' ? 'bg-indigo-500/20 text-indigo-400' : 'hover:bg-white/5 text-slate-500'}`}><AlignRight size={14}/></button>
                 </div>
              </div>
              
              <div>
                  <div className="flex justify-between mb-1 items-center">
                      <label className="text-[10px] text-slate-400">Kích thước (cm)</label>
                      <input 
                        type="number" 
                        min="0.1" 
                        step="0.1"
                        value={layer.size}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) update('size', val);
                        }}
                        className="w-20 text-xs font-bold text-indigo-200 text-right border border-indigo-900/50 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 bg-[#0b0923]"
                      />
                  </div>
                  <input 
                    type="range" min="0.2" max="30" step="0.1"
                    value={layer.size}
                    onChange={(e) => update('size', parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
              </div>

              {/* Typography Controls: Giãn dòng & Giãn chữ */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <div className="flex justify-between mb-1 items-center">
                          <label className="text-[10px] text-slate-400">Giãn dòng</label>
                          <span className="text-[10px] text-indigo-300">{(layer.lineHeight || 1.2).toFixed(1)}</span>
                      </div>
                      <input 
                        type="range" min="0.5" max="3" step="0.1"
                        value={layer.lineHeight || 1.2}
                        onChange={(e) => update('lineHeight', parseFloat(e.target.value))}
                        className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                  </div>
                  <div>
                      <div className="flex justify-between mb-1 items-center">
                          <label className="text-[10px] text-slate-400">Giãn chữ</label>
                          <span className="text-[10px] text-indigo-300">{Math.round(layer.letterSpacing || 0)}px</span>
                      </div>
                      <input 
                        type="range" min="-10" max="50" step="1"
                        value={layer.letterSpacing || 0}
                        onChange={(e) => update('letterSpacing', parseInt(e.target.value))}
                        className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-400"
                      />
                  </div>
              </div>

              <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Hiệu ứng</label>
                  <div className="grid grid-cols-4 gap-1 mb-2">
                       {['none', 'shadow', 'outline', '3d', 'outline-fill', 'neon', 'glow', 'gradient', 'layer-shadow', 'soft-outline', 'highlight'].map((eff) => (
                           <button 
                             key={eff}
                             onClick={() => update('effect', eff as any)}
                             className={`text-[10px] py-1 px-1 rounded border capitalize ${layer.effect === eff ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 font-bold' : 'border-indigo-900/30 text-slate-500 hover:bg-white/5'}`}
                           >
                               {eff.replace('-', ' ')}
                           </button>
                       ))}
                  </div>
                  
                  {layer.effect !== 'none' && (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-indigo-900/50">
                        <div>
                            <label className="text-[9px] text-slate-500 block">Màu Effect</label>
                            <input type="color" value={layer.effectColor} onChange={(e) => update('effectColor', e.target.value)} className="w-full h-6 rounded cursor-pointer bg-transparent border-0" />
                        </div>
                        <div>
                            <label className="text-[9px] text-slate-500 block">Độ dày/Mờ</label>
                            <input type="range" min="0" max="20" value={layer.effectThickness || 0} onChange={(e) => update('effectThickness', parseInt(e.target.value))} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                        </div>
                    </div>
                  )}
              </div>
          </div>
      )
  };

  const selectedImg = design.insertedImages.find(img => img.id === selectedInsertedImageId);
  const selectedFreeText = design.freeTexts.find(t => t.id === selectedFreeTextId);

  return (
    <div className="flex flex-col h-full bg-[#110e2e] text-white">
       {/* MAIN TABS */}
       <div className="flex items-center gap-1 p-2 border-b border-indigo-900/50 bg-[#0b0923] sticky top-0 z-20 shadow-sm pr-12 lg:pr-2">
           {TABS.map(tab => {
               const Icon = tab.icon;
               const isActive = activeTab === tab.id;
               return (
                   <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-2 px-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-200 ${
                        isActive 
                        ? 'bg-indigo-500/10 text-indigo-300 shadow-sm ring-1 ring-indigo-500/30' 
                        : 'text-slate-500 hover:bg-white/5 hover:text-indigo-200'
                    }`}
                   >
                       <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                       <span className={`text-[10px] uppercase tracking-wide ${isActive ? 'font-bold' : 'font-medium'}`}>{tab.label}</span>
                   </button>
               )
           })}
           
           {onClose && (
               <button 
                   onClick={onClose}
                   className="lg:hidden absolute top-2 right-2 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
               >
                   <X size={20} />
               </button>
           )}
       </div>

       {/* CONTENT AREA */}
       <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#110e2e]">
           {/* === LAYOUT TAB === */}
           {activeTab === 'layout' && (
               <div className="animate-fadeIn space-y-6">
                   <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm group hover:border-indigo-500 transition-colors">
                       <div className="flex items-center justify-between mb-4 pb-3 border-b border-indigo-900/30">
                            <h3 className="text-sm font-bold text-indigo-100 flex items-center gap-2">
                                <FolderOpen size={18} className="text-indigo-400"/> Quản lý Dự án
                            </h3>
                            <div className="flex gap-1">
                                <button onClick={handleResetDesign} className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors" title="Làm mới">
                                    <RotateCcw size={16}/>
                                </button>
                            </div>
                       </div>
                       
                       <div className="grid grid-cols-3 gap-2 mb-4">
                           <button onClick={handleSaveToLibrary} className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-[#0b0923] border border-indigo-900/50 hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-lg text-[10px] font-medium transition-all">
                               <Save size={18} /> Lưu trình duyệt
                           </button>
                           <button onClick={handleSaveProjectFile} className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-[#0b0923] border border-indigo-900/50 hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-lg text-[10px] font-medium transition-all">
                               <HardDrive size={18} /> Tải file .json
                           </button>
                           <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center justify-center gap-1 py-3 px-2 bg-[#0b0923] border border-indigo-900/50 hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-lg text-[10px] font-medium transition-all">
                               <Upload size={18} /> Mở file .json
                           </button>
                           <input type="file" ref={fileInputRef} onChange={handleLoadProjectFile} accept=".json" className="hidden" />
                       </div>

                       {savedProjects.length > 0 && (
                           <div className="pt-2">
                               <div className="flex items-center justify-between mb-2">
                                   <label className="text-[10px] font-bold text-indigo-400 uppercase">Dự án đã lưu</label>
                                   <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.5 rounded-full">{savedProjects.length}</span>
                               </div>
                               <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar pr-1 -mr-1">
                                   {savedProjects.map(p => (
                                       <div key={p.key} onClick={() => handleLoadFromLibrary(p.key)} className="group flex items-center justify-between p-2 rounded-lg bg-[#0b0923] border border-transparent hover:border-indigo-500 hover:bg-[#151236] cursor-pointer transition-all">
                                           <div className="flex-1 min-w-0">
                                               <div className="text-xs font-semibold truncate text-indigo-100 group-hover:text-white">{p.name}</div>
                                               <div className="text-[10px] text-slate-500 flex items-center gap-1"><Clock size={10}/> {p.date}</div>
                                           </div>
                                           <button onClick={(e) => handleDeleteFromLibrary(e, p.key)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100">
                                               <Trash2 size={14}/>
                                           </button>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}
                   </div>

                   {renderDimensionControls()}

                   {renderRatioButtons(['1:1', '9:16', 'FB-Post', 'FB-Cover'], 'Mạng xã hội')}
                   {renderRatioButtons(['A4', 'A4-Landscape', '3:4', '4:3'], 'In ấn & Văn bản')}
                   {renderRatioButtons(['16:9', '3:1'], 'Màn hình')}
               </div>
           )}

           {/* === TEXT TAB === */}
           {activeTab === 'text' && (
             <div className="animate-fadeIn space-y-6">
                <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 p-4 rounded-xl border border-indigo-500/30 shadow-sm">
                    <button 
                        onClick={handleMagicText}
                        disabled={isGeneratingText}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-[0.98]"
                    >
                        {isGeneratingText ? <RefreshCw className="animate-spin" size={18}/> : <Wand2 size={18}/>}
                        {isGeneratingText ? 'Đang sáng tạo...' : 'Gợi ý nội dung bằng AI'}
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                         <div className="flex items-center justify-between mb-4 pb-2 border-b border-indigo-900/30">
                             <h3 className="text-sm font-bold text-indigo-100 flex items-center gap-2"><Layout size={16} className="text-indigo-400"/> Phần Header</h3>
                             <button onClick={() => updateNested(['header', 'hidden'], !design.header.hidden)} className={`transition-colors ${design.header.hidden ? 'text-slate-500 hover:text-slate-300' : 'text-indigo-400 bg-indigo-500/10 p-1 rounded hover:bg-indigo-500/20'}`}>
                                 {design.header.hidden ? <EyeOff size={18}/> : <Eye size={18}/>}
                             </button>
                         </div>
                         {!design.header.hidden && (
                             <div className="space-y-4">
                                 <div className="bg-[#110e2e] p-3 rounded-lg border border-indigo-900/50">
                                     <div className="flex justify-between items-center mb-2">
                                        <label className="text-[10px] font-bold text-indigo-300 uppercase">Logo</label>
                                        <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                                        <button onClick={() => logoInputRef.current?.click()} className="text-[10px] text-white bg-indigo-600 px-2 py-0.5 rounded hover:bg-indigo-500 font-medium">Tải lên</button>
                                     </div>
                                     {design.header.logo && (
                                         <div className="flex items-center gap-2 mb-2 p-2 bg-[#0b0923] rounded border border-indigo-900/50">
                                             <img src={design.header.logo} alt="logo preview" className="w-8 h-8 object-contain" />
                                             <div className="flex-1 min-w-0 text-[10px] text-slate-400 truncate">Logo đã chọn</div>
                                             <button onClick={handleRemoveLogo} className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded"><X size={14}/></button>
                                         </div>
                                     )}

                                     {design.header.logo && (
                                         <div className="mb-2 pb-2 border-b border-indigo-900/30">
                                             <div className="flex justify-between mb-1 items-center">
                                                 <label className="text-[10px] font-bold text-slate-400 uppercase">Kích thước</label>
                                                 <span className="text-[10px] font-bold text-slate-300">{Math.round(design.header.logoScale || (design.header.logoWidth ? design.header.logoWidth * PX_PER_CM : 95))} px</span>
                                             </div>
                                             <input 
                                                 type="range" min="20" max="600" step="5"
                                                 value={design.header.logoScale || (design.header.logoWidth ? design.header.logoWidth * PX_PER_CM : 95)}
                                                 onChange={(e) => {
                                                     const val = parseFloat(e.target.value);
                                                     setDesign(prev => ({
                                                         ...prev,
                                                         header: {
                                                             ...prev.header,
                                                             logoScale: val,
                                                             logoWidth: val / PX_PER_CM
                                                         }
                                                     }));
                                                 }}
                                                 className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer mb-2 accent-indigo-500"
                                             />

                                             <div className="flex justify-between mb-1 items-center mt-2">
                                                 <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><ZoomIn size={10}/> Zoom ảnh</label>
                                                 <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-1 rounded">{Math.round((design.header.logoInnerScale || 1) * 100)}%</span>
                                             </div>
                                             <input 
                                                 type="range" min="0.5" max="3" step="0.1"
                                                 value={design.header.logoInnerScale || 1}
                                                 onChange={(e) => updateNested(['header', 'logoInnerScale'], parseFloat(e.target.value))}
                                                 className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                             />
                                             
                                             <div className="flex items-center gap-2 mt-2 bg-yellow-900/20 p-2 rounded border border-yellow-700/30">
                                                 <MousePointer2 size={12} className="text-yellow-500"/>
                                                 <span className="text-[10px] text-yellow-500 leading-tight">Giữ phím <b>Ctrl</b> hoặc <b>Alt</b> + Kéo để dịch chuyển ảnh trong khung logo.</span>
                                             </div>
                                         </div>
                                     )}

                                     {design.header.logo && (
                                        <div className="mb-2 pb-2 border-b border-indigo-900/30">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Khung hình & Viền</label>
                                            <div className="flex gap-1 mb-2">
                                                {['circle', 'square', 'rectangle', 'ellipse'].map(shape => (
                                                    <button key={shape} onClick={() => updateNested(['header', 'logoShape'], shape)} className={`flex-1 py-1.5 text-[10px] font-medium border rounded transition-all flex items-center justify-center gap-1 capitalize ${design.header.logoShape === shape ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-transparent border-indigo-900/50 text-slate-500 hover:bg-white/5'}`}>
                                                        {shape}
                                                    </button>
                                                ))}
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <label className="text-[9px] text-slate-500 block mb-0.5">Màu viền</label>
                                                    <div className="flex items-center gap-2">
                                                        <input 
                                                            type="color" 
                                                            value={design.header.logoBorderColor || '#ffffff'}
                                                            onChange={(e) => updateNested(['header', 'logoBorderColor'], e.target.value)}
                                                            className="w-full h-6 rounded cursor-pointer border-0 bg-transparent"
                                                        />
                                                        {design.header.logoBorderColor && design.header.logoBorderColor !== 'transparent' && (
                                                            <button onClick={() => updateNested(['header', 'logoBorderColor'], 'transparent')} className="text-slate-500 hover:text-red-400 p-1"><X size={12}/></button>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-[9px] text-slate-500 block mb-0.5">Độ dày</label>
                                                    <input 
                                                        type="range" min="0" max="20" 
                                                        value={design.header.logoBorderWidth || 0}
                                                        onChange={(e) => updateNested(['header', 'logoBorderWidth'], parseInt(e.target.value))}
                                                        className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer mt-2 accent-indigo-500"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                     )}

                                      <div className="flex gap-1 mb-2">
                                         {['left', 'top', 'right', 'bottom', 'custom'].map((pos) => (
                                             <button key={pos} onClick={() => updateNested(['header', 'logoPosition'], pos)} className={`flex-1 py-1.5 text-[10px] font-medium border rounded capitalize transition-all ${design.header.logoPosition === pos ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-transparent border-indigo-900/50 text-slate-500 hover:bg-white/5'}`}>{pos}</button>
                                         ))}
                                     </div>

                                     <div className="flex gap-1 mb-2">
                                         {['left', 'center', 'right'].map((pos) => (
                                             <button key={pos} onClick={() => updateNested(['header', 'align'], pos)} className={`flex-1 py-1.5 text-[10px] font-medium border rounded capitalize transition-all ${design.header.align === pos ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-transparent border-indigo-900/50 text-slate-500 hover:bg-white/5'}`}>{pos}</button>
                                         ))}
                                     </div>
                                 </div>

                                 <div className="space-y-2">
                                     <label className="text-[10px] font-bold text-indigo-300 uppercase">Dòng trên</label>
                                     <textarea 
                                        value={design.header.topText.content} 
                                        onChange={(e) => updateNested(['header', 'topText', 'content'], e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-[#0b0923] text-white min-h-[40px]"
                                     />
                                     {renderTextStyleControls(['header', 'topText'])}
                                 </div>

                                 <div className="space-y-2 pt-4 border-t border-indigo-900/30">
                                     <div className="flex justify-between items-center">
                                         <label className="text-[10px] font-bold text-indigo-300 uppercase">Dòng dưới</label>
                                         <button onClick={handleSyncTopToBottom} className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${isHeaderSynced ? 'bg-indigo-500 text-white font-bold' : 'bg-indigo-900/50 text-slate-400 hover:bg-white/10'}`}>
                                            <CopyPlus size={10}/> Đồng bộ
                                         </button>
                                     </div>
                                     <textarea 
                                        value={design.header.bottomText.content} 
                                        onChange={(e) => updateNested(['header', 'bottomText', 'content'], e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-[#0b0923] text-white min-h-[40px]"
                                     />
                                     {renderTextStyleControls(['header', 'bottomText'])}
                                 </div>
                             </div>
                         )}
                    </div>

                    <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                        {renderTextInput(['title'], 'Tiêu đề chính', true)}
                        {renderTextStyleControls(['title'])}
                    </div>

                    <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                        {renderTextInput(['subtitle'], 'Tiêu đề phụ', true)}
                        {renderTextStyleControls(['subtitle'])}
                    </div>

                    <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm mb-6">
                         <div className="flex items-center justify-between mb-3">
                             <h3 className="text-sm font-bold text-indigo-100 flex items-center gap-2"><MapPin size={16} className="text-red-500"/> Địa điểm & Thời gian</h3>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mb-3">
                             <div>
                                <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">Ngày diễn ra</label>
                                <input type="date" value={design.meta.date} onChange={(e) => updateNested(['meta', 'date'], e.target.value)} className="w-full text-xs p-2 border border-indigo-900/50 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-[#0b0923] text-white"/>
                             </div>
                             <div>
                                <label className="text-[9px] text-slate-400 font-bold uppercase mb-1 block">Địa điểm</label>
                                <input type="text" value={design.meta.location} onChange={(e) => updateNested(['meta', 'location'], e.target.value)} placeholder="Địa điểm" className="w-full text-xs p-2 border border-indigo-900/50 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none bg-[#0b0923] text-white"/>
                             </div>
                         </div>
                         <div className="flex items-center gap-3 mb-3">
                             <label className="text-[10px] text-slate-500 font-bold uppercase whitespace-nowrap">Kiểu hiển thị:</label>
                             <select value={design.meta.format} onChange={(e) => updateNested(['meta', 'format'], e.target.value)} className="w-full text-xs p-1.5 border border-indigo-900/50 rounded-lg bg-[#0b0923] text-white focus:outline-none">
                                 <option value="full">Đầy đủ (Ngày..tháng..năm..)</option>
                                 <option value="short">Ngắn gọn (dd/mm/yyyy)</option>
                             </select>
                         </div>
                         {renderTextStyleControls(['meta'])}
                    </div>

                    {/* === FREE TEXT SECTION === */}
                    <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                         <div className="flex items-center justify-between mb-4">
                             <h3 className="text-sm font-bold text-indigo-100 flex items-center gap-2"><PlusCircle size={16} className="text-emerald-400"/> Chữ tự do</h3>
                             <button 
                                onClick={handleAddFreeText}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1 active:scale-95"
                             >
                                <Plus size={14}/> Thêm chữ tự do
                             </button>
                         </div>

                         {design.freeTexts.length > 0 ? (
                           <div className="space-y-3">
                             <label className="text-[10px] font-bold text-slate-500 uppercase block">Danh sách đã tạo</label>
                             <div className="max-h-[300px] overflow-y-auto custom-scrollbar pr-1 space-y-2">
                               {design.freeTexts.map((txt, idx) => (
                                 <div key={txt.id} className={`p-2 rounded-lg border transition-all ${selectedFreeTextId === txt.id ? 'bg-indigo-500/20 border-indigo-500 shadow-sm' : 'bg-[#0b0923] border-indigo-900/30'}`}>
                                   <div className="flex items-center justify-between gap-2 mb-2">
                                     <button 
                                       onClick={() => setSelectedFreeTextId(txt.id)}
                                       className={`flex-1 text-left text-xs font-semibold truncate ${selectedFreeTextId === txt.id ? 'text-indigo-200' : 'text-slate-400'}`}
                                     >
                                       {idx + 1}. {txt.content || '(Trống)'}
                                     </button>
                                     <div className="flex items-center gap-1">
                                       <button 
                                         onClick={() => updateFreeText(txt.id, { hidden: !txt.hidden })} 
                                         className={`p-1 rounded ${txt.hidden ? 'text-slate-600 hover:text-slate-400' : 'text-indigo-400 hover:bg-indigo-500/10'}`}
                                       >
                                         {txt.hidden ? <EyeOff size={14}/> : <Eye size={14}/>}
                                       </button>
                                       <button 
                                         onClick={() => {
                                           if (window.confirm('Bạn có chắc muốn xóa textbox này?')) {
                                             setDesign(prev => ({ ...prev, freeTexts: prev.freeTexts.filter(t => t.id !== txt.id) }));
                                             if (selectedFreeTextId === txt.id) setSelectedFreeTextId(null);
                                           }
                                         }}
                                         className="p-1 text-slate-600 hover:text-red-400 rounded"
                                       >
                                         <Trash2 size={14}/>
                                       </button>
                                     </div>
                                   </div>
                                   
                                   {selectedFreeTextId === txt.id && (
                                     <div className="animate-slideUp mt-3 space-y-3 pt-3 border-t border-indigo-900/30">
                                       {renderTextInput([], 'Nội dung chữ', true, txt.content, (val) => updateFreeText(txt.id, { content: val }))}
                                       {renderTextStyleControls([], txt, (updates) => updateFreeText(txt.id, updates))}
                                     </div>
                                   )}
                                 </div>
                               ))}
                             </div>
                           </div>
                         ) : (
                           <div className="py-8 text-center border-2 border-dashed border-indigo-900/30 rounded-xl">
                             <Type size={30} className="mx-auto text-slate-700 mb-2 opacity-50"/>
                             <p className="text-[10px] text-slate-500 font-medium px-4">Chưa có textbox tự do nào. Hãy nhấn nút phía trên để bắt đầu thêm nội dung bất kỳ.</p>
                           </div>
                         )}
                    </div>
                </div>
             </div>
           )}

           {/* === INSERT IMAGE TAB === */}
           {activeTab === 'insert-image' && (
               <div className="animate-fadeIn space-y-4">
                   <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                       <h3 className="text-sm font-bold text-indigo-100 uppercase mb-4 flex items-center gap-2">
                           <ImagePlus size={18} className="text-indigo-400"/> Chèn ảnh từ thiết bị
                       </h3>
                       <button 
                            onClick={() => insertImageInputRef.current?.click()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
                       >
                           <Upload size={18}/> Chọn ảnh để tải lên
                       </button>
                       <input type="file" multiple ref={insertImageInputRef} onChange={handleInsertImage} accept="image/*" className="hidden" />
                   </div>

                   {design.insertedImages.length > 0 && (
                       <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                           <h3 className="text-xs font-bold text-indigo-300 uppercase mb-3">Danh sách ảnh đã chèn</h3>
                           <div className="grid grid-cols-4 gap-2 mb-4">
                               {design.insertedImages.map(img => (
                                   <div 
                                        key={img.id}
                                        onClick={() => setSelectedInsertedImageId(img.id)}
                                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${selectedInsertedImageId === img.id ? 'border-indigo-500 scale-105 shadow-md' : 'border-indigo-900/30'}`}
                                   >
                                       <img src={img.url} className="w-full h-full object-cover" />
                                       {img.loading && (
                                           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                                <RefreshCw className="animate-spin text-white" size={16}/>
                                           </div>
                                       )}
                                       <button 
                                            onClick={(e) => { e.stopPropagation(); removeInsertedImage(img.id); }}
                                            className="absolute top-0 right-0 p-0.5 bg-black/60 text-white hover:text-red-400"
                                       >
                                           <X size={12}/>
                                       </button>
                                   </div>
                               ))}
                           </div>

                           {selectedImg && (
                               <div className="space-y-4 border-t border-indigo-900/30 pt-4 animate-slideUp">
                                   <div>
                                       <div className="flex justify-between items-center mb-2">
                                           <label className="text-[10px] font-bold text-slate-400 uppercase">Làm mờ toàn ảnh (Blur)</label>
                                           <span className="text-[10px] font-bold text-indigo-300">{selectedImg.blur}px</span>
                                       </div>
                                       <input 
                                            type="range" min="0" max="20" step="1"
                                            value={selectedImg.blur}
                                            onChange={(e) => updateInsertedImage(selectedImg.id, { blur: parseInt(e.target.value) })}
                                            className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                       />
                                   </div>

                                   <div className="space-y-3">
                                       <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Làm mờ cạnh (Feather)</label>
                                       
                                       <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                           <div>
                                               <div className="flex justify-between text-[9px] text-slate-500 mb-1 uppercase"><span>Trái</span><span>{selectedImg.featherLeft}%</span></div>
                                               <input type="range" min="0" max="100" value={selectedImg.featherLeft} onChange={(e) => updateInsertedImage(selectedImg.id, { featherLeft: parseInt(e.target.value) })} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                                           </div>
                                           <div>
                                               <div className="flex justify-between text-[9px] text-slate-500 mb-1 uppercase"><span>Phải</span><span>{selectedImg.featherRight}%</span></div>
                                               <input type="range" min="0" max="100" value={selectedImg.featherRight} onChange={(e) => updateInsertedImage(selectedImg.id, { featherRight: parseInt(e.target.value) })} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                                           </div>
                                           <div>
                                               <div className="flex justify-between text-[9px] text-slate-500 mb-1 uppercase"><span>Trên</span><span>{selectedImg.featherTop}%</span></div>
                                               <input type="range" min="0" max="100" value={selectedImg.featherTop} onChange={(e) => updateInsertedImage(selectedImg.id, { featherTop: parseInt(e.target.value) })} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                                           </div>
                                           <div>
                                               <div className="flex justify-between text-[9px] text-slate-500 mb-1 uppercase"><span>Dưới</span><span>{selectedImg.featherBottom}%</span></div>
                                               <input type="range" min="0" max="100" value={selectedImg.featherBottom} onChange={(e) => updateInsertedImage(selectedImg.id, { featherBottom: parseInt(e.target.value) })} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-400" />
                                           </div>
                                       </div>
                                   </div>

                                   <div className="space-y-2">
                                       <div className="flex items-center justify-between">
                                           <label className="text-[10px] font-bold text-slate-400 uppercase">Tách nền AI</label>
                                           <button 
                                                onClick={() => handleRemoveBg(selectedImg)}
                                                disabled={selectedImg.loading || selectedImg.isRemovedBg}
                                                className={`px-3 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 transition-all ${selectedImg.isRemovedBg ? 'bg-emerald-600 text-white cursor-default' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm disabled:opacity-50'}`}
                                           >
                                               {selectedImg.loading ? <RefreshCw className="animate-spin" size={12}/> : (selectedImg.isRemovedBg ? <CheckCircle2 size={12}/> : <Sparkles size={12}/>)}
                                               {selectedImg.isRemovedBg ? 'Đã tách nền' : 'Tách nền AI'}
                                           </button>
                                       </div>
                                       
                                       {selectedImg.isRemovedBg && !selectedImg.loading && (
                                           <button 
                                                onClick={() => handleRestoreImg(selectedImg)}
                                                className="w-full py-2 mt-2 bg-[#0b0923] border border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-300 rounded-lg text-[10px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                           >
                                               <RotateCcw size={14}/> Khôi phục ảnh gốc
                                           </button>
                                       )}
                                   </div>
                               </div>
                           )}
                       </div>
                   )}
               </div>
           )}

           {/* === IMAGE TAB === */}
           {activeTab === 'image' && (
               <div className="animate-fadeIn space-y-4">
                   <div className="flex p-1 bg-[#0b0923] rounded-xl mb-4 border border-indigo-900/50">
                       <button onClick={() => setBgTypeTab('image')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${bgTypeTab === 'image' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Hình ảnh</button>
                       <button onClick={() => setBgTypeTab('color')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${bgTypeTab === 'color' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>Màu sắc</button>
                   </div>

                   <div className="bg-[#1a1642] border border-indigo-900/50 p-4 rounded-xl shadow-sm">
                       <div className="flex justify-between mb-3 items-end">
                            <span className="text-xs font-bold text-indigo-100 uppercase">Lớp phủ mờ (Overlay)</span>
                            <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">{Math.round(design.background.overlayOpacity * 100)}%</span>
                       </div>
                       <input 
                            type="range" min="0" max="1" step="0.05"
                            value={design.background.overlayOpacity}
                            onChange={(e) => updateNested(['background', 'overlayOpacity'], parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer mb-4 accent-indigo-500"
                       />
                       <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Màu phủ:</span>
                            <div className="flex gap-2">
                                {['#ffffff', '#000000'].map(c => (
                                    <button 
                                        key={c}
                                        onClick={() => updateNested(['background', 'overlayColor'], c)}
                                        className={`w-6 h-6 rounded-full border border-indigo-900/50 shadow-sm transition-transform hover:scale-110 ${design.background.overlayColor === c ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-[#1a1642]' : ''}`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                       </div>
                   </div>

                   {/* Background Feathering Section */}
                   <div className="bg-[#1a1642] border border-indigo-900/50 p-4 rounded-xl shadow-sm space-y-4">
                       <h3 className="text-xs font-bold text-indigo-100 uppercase flex items-center gap-2">
                           <Droplet size={14} className="text-indigo-400"/> Phủ mờ nền (Feather)
                       </h3>
                       <div className="grid grid-cols-1 gap-3">
                           <div>
                               <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500 uppercase">
                                   <span>Phủ mờ trái</span>
                                   <span className="text-indigo-300">{design.background.featherLeft}%</span>
                               </div>
                               <input type="range" min="0" max="100" value={design.background.featherLeft} onChange={(e) => updateNested(['background', 'featherLeft'], parseInt(e.target.value))} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                           </div>
                           <div>
                               <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500 uppercase">
                                   <span>Phủ mờ phải</span>
                                   <span className="text-indigo-300">{design.background.featherRight}%</span>
                               </div>
                               <input type="range" min="0" max="100" value={design.background.featherRight} onChange={(e) => updateNested(['background', 'featherRight'], parseInt(e.target.value))} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                           </div>
                           <div>
                               <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500 uppercase">
                                   <span>Phủ mờ trên</span>
                                   <span className="text-indigo-300">{design.background.featherTop}%</span>
                               </div>
                               <input type="range" min="0" max="100" value={design.background.featherTop} onChange={(e) => updateNested(['background', 'featherTop'], parseInt(e.target.value))} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                           </div>
                           <div>
                               <div className="flex justify-between items-center mb-1 text-[10px] font-bold text-slate-500 uppercase">
                                   <span>Phủ mờ dưới</span>
                                   <span className="text-indigo-300">{design.background.featherBottom}%</span>
                               </div>
                               <input type="range" min="0" max="100" value={design.background.featherBottom} onChange={(e) => updateNested(['background', 'featherBottom'], parseInt(e.target.value))} className="w-full h-1 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                           </div>
                       </div>
                   </div>

                   {bgTypeTab === 'image' ? (
                       <div className="space-y-6">
                            {design.illustration.url && (
                                <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-bold text-indigo-100 uppercase">Điều chỉnh ảnh nền</h3>
                                        <button onClick={resetIllustrationTransform} className="text-[10px] text-red-400 hover:bg-white/5 px-2 py-1 rounded">Đặt lại</button>
                                    </div>
                                    
                                    <div className="flex items-center gap-3 mb-4">
                                        <button onClick={() => updateIllustrationTransform('scale', -0.1)} className="p-1.5 rounded-lg border border-indigo-900/50 hover:bg-white/5"><Minus size={14}/></button>
                                        <div className="flex-1 flex items-center gap-2">
                                            <ZoomIn size={14} className="text-slate-500"/>
                                            <input 
                                                type="range" min="0.1" max="3" step="0.1"
                                                value={design.illustration.scale} 
                                                onChange={(e) => updateNested(['illustration', 'scale'], parseFloat(e.target.value))}
                                                className="flex-1 h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                            />
                                        </div>
                                        <button onClick={() => updateIllustrationTransform('scale', 0.1)} className="p-1.5 rounded-lg border border-indigo-900/50 hover:bg-white/5"><Plus size={14}/></button>
                                    </div>

                                    <div className="flex justify-center">
                                        <div className="grid grid-cols-3 gap-1">
                                            <div></div>
                                            <button onClick={() => updateIllustrationTransform('y', -5)} className="p-2 rounded-lg border border-indigo-900/50 bg-[#0b0923] hover:bg-indigo-500/20 text-white flex justify-center"><ArrowUp size={16}/></button>
                                            <div></div>
                                            
                                            <button onClick={() => updateIllustrationTransform('x', -5)} className="p-2 rounded-lg border border-indigo-900/50 bg-[#0b0923] hover:bg-indigo-500/20 text-white flex justify-center"><ArrowLeft size={16}/></button>
                                            <div className="w-8 h-8 flex items-center justify-center text-slate-500"><Move size={16}/></div>
                                            <button onClick={() => updateIllustrationTransform('x', 5)} className="p-2 rounded-lg border border-indigo-900/50 bg-[#0b0923] hover:bg-indigo-500/20 text-white flex justify-center"><ArrowRight size={16}/></button>
                                            
                                            <div></div>
                                            <button onClick={() => updateIllustrationTransform('y', 5)} className="p-2 rounded-lg border border-indigo-900/50 bg-[#0b0923] hover:bg-indigo-500/20 text-white flex justify-center"><ArrowDown size={16}/></button>
                                            <div></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                           <div className="bg-gradient-to-b from-indigo-900/80 to-[#1a1642] p-5 rounded-xl border border-indigo-500/30 shadow-sm relative overflow-hidden">
                               <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
                                   <Sparkles size={100} className="text-indigo-400" />
                               </div>
                               <h3 className="text-sm font-bold text-indigo-100 uppercase mb-4 flex items-center gap-2 relative z-10"><Sparkles size={16} className="text-indigo-400"/> Tạo ảnh bằng AI</h3>
                               
                               <div className="mb-4 relative z-10">
                                   <div className="flex justify-between items-center mb-2">
                                       <label className="text-[10px] font-bold text-indigo-300 uppercase">Ảnh tham khảo</label>
                                       <button onClick={() => refImageInputRef.current?.click()} className="text-[10px] font-bold text-indigo-100 bg-indigo-500/50 px-2 py-1 rounded-full flex items-center gap-1 hover:bg-indigo-500 transition-colors"><ImagePlus size={12}/> Thêm ảnh</button>
                                       <input type="file" multiple ref={refImageInputRef} onChange={handleRefImageUpload} accept="image/*" className="hidden" />
                                   </div>
                                   {refImages.length > 0 ? (
                                       <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                                           {refImages.map((img, idx) => (
                                               <div key={idx} className="relative w-14 h-14 flex-shrink-0 group rounded-lg overflow-hidden border-2 border-indigo-500/50 shadow-sm">
                                                   <img src={img} className="w-full h-full object-cover" />
                                                   <button onClick={() => handleRemoveRefImage(idx)} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                                       <X size={16}/>
                                                   </button>
                                               </div>
                                           ))}
                                       </div>
                                   ) : (
                                       <div onClick={() => refImageInputRef.current?.click()} className="border-2 border-dashed border-indigo-500/30 rounded-lg p-3 text-center cursor-pointer hover:bg-indigo-500/10 transition-colors">
                                           <span className="text-[10px] text-indigo-300 block">Chưa có ảnh mẫu</span>
                                       </div>
                                   )}
                               </div>

                               <textarea 
                                    value={design.illustration.prompt}
                                    onChange={(e) => updateNested(['illustration', 'prompt'], e.target.value)}
                                    placeholder="Mô tả ý tưởng của bạn một cách chi tiết..."
                                    className="w-full p-3 text-xs border border-indigo-500/30 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[80px] mb-3 bg-[#0b0923] text-white relative z-10 placeholder-slate-500"
                               />
                               
                               <div className="flex gap-3 relative z-10">
                                   <select 
                                        value={design.illustration.style}
                                        onChange={(e) => updateNested(['illustration', 'style'], e.target.value)}
                                        className="flex-1 p-2 text-xs font-medium border border-indigo-500/30 rounded-lg bg-[#0b0923] text-white focus:outline-none focus:border-indigo-500"
                                   >
                                       {['2D', '3D Render', 'Flat Design', 'Cartoon', 'Realistic', 'Watercolor', 'Sketch'].map(s => (
                                           <option key={s} value={s}>{s}</option>
                                       ))}
                                   </select>
                                   <button 
                                        onClick={handleGenerateImage}
                                        disabled={design.illustration.loading}
                                        className="flex-[1.5] py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center gap-2 active:scale-95"
                                   >
                                       {design.illustration.loading ? <RefreshCw className="animate-spin" size={14}/> : <Wand2 size={14}/>} Tạo Ngay
                                   </button>
                               </div>
                           </div>

                           <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                               <div className="flex items-center justify-between mb-3">
                                   <h3 className="text-sm font-bold text-indigo-100 uppercase flex items-center gap-2"><Images size={16} className="text-blue-500"/> Thư viện ảnh</h3>
                                   <label className="text-[10px] font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer">
                                       <Upload size={12}/> Tải lên
                                       <input type="file" onChange={handleUploadToLibrary} accept="image/*" className="hidden" />
                                   </label>
                               </div>

                               <div className="flex gap-2 overflow-x-auto pb-3 mb-1 custom-scrollbar">
                                   {BG_CATEGORIES.map(cat => (
                                       <button 
                                            key={cat}
                                            onClick={() => setBgCategory(cat)}
                                            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border ${bgCategory === cat ? 'bg-indigo-500 text-white border-indigo-500 shadow-md scale-105' : 'bg-[#0b0923] text-slate-400 border-indigo-900/50 hover:border-indigo-500/50 hover:text-white'}`}
                                       >
                                           {cat}
                                       </button>
                                   ))}
                               </div>

                               <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                   {[...customLibrary, ...DEFAULT_BACKGROUND_LIBRARY]
                                        .filter(item => bgCategory === 'Tất cả' || item.cat === bgCategory)
                                        .map((item) => (
                                            <div 
                                                key={item.id || item.url} 
                                                onClick={() => handleSelectLibraryBg(item.url)}
                                                className="relative group cursor-pointer aspect-video rounded-lg overflow-hidden border border-indigo-900/30 hover:border-blue-500 hover:ring-2 hover:ring-blue-500/50 transition-all shadow-sm"
                                            >
                                                <img src={item.thumb} alt={item.cat} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" loading="lazy" />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                {item.isUserUpload && (
                                                    <button 
                                                        onClick={(e) => handleDeleteFromBgLibrary(e, item.id!)}
                                                        className="absolute top-1 right-1 p-1.5 bg-black/60 text-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm z-10"
                                                        title="Xoá ảnh"
                                                    >
                                                        <Trash2 size={12}/>
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                   }
                               </div>
                           </div>
                       </div>
                   ) : (
                       <div className="space-y-6">
                            <div className="bg-[#1a1642] p-4 border border-indigo-900/50 rounded-xl shadow-sm">
                                <label className="text-[10px] font-bold text-slate-400 uppercase mb-3 block">Màu tùy chỉnh</label>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <div className="text-[9px] font-bold text-slate-500 mb-1.5 uppercase">Màu chính</div>
                                        <div className="flex gap-2">
                                            <div className="h-10 w-full rounded-lg border border-indigo-900/50 overflow-hidden relative">
                                                <input type="color" value={design.background.color1} onChange={(e) => handleColorBgSelect(e.target.value, design.background.type === 'gradient' ? design.background.color2 : undefined)} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 border-0"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[9px] font-bold text-slate-500 mb-1.5 uppercase">Màu phụ (Gradient)</div>
                                        <div className="flex gap-2 relative">
                                            <div className="h-10 w-full rounded-lg border border-indigo-900/50 overflow-hidden relative">
                                                <input type="color" value={design.background.color2} onChange={(e) => handleColorBgSelect(design.background.color1, e.target.value)} className="absolute -top-2 -left-2 w-[150%] h-[150%] cursor-pointer p-0 border-0"/>
                                            </div>
                                            {design.background.type === 'gradient' && (
                                                <button onClick={() => handleColorBgSelect(design.background.color1)} className="absolute -top-2 -right-2 bg-black/50 text-white hover:text-red-400 shadow-sm border border-white/10 rounded-full p-0.5"><X size={12}/></button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#1a1642] p-4 border border-indigo-900/50 rounded-xl shadow-sm">
                                <h3 className="text-xs font-bold text-indigo-100 uppercase mb-3">Bảng màu đơn sắc</h3>
                                <div className="grid grid-cols-8 gap-2">
                                    {SOLID_COLORS.map(c => (
                                        <button 
                                            key={c}
                                            onClick={() => handleColorBgSelect(c)}
                                            className="w-full aspect-square rounded-full border border-white/10 shadow-sm hover:scale-110 transition-transform focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ring-offset-[#1a1642]"
                                            style={{ backgroundColor: c }}
                                            title={c}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="bg-[#1a1642] p-4 border border-indigo-900/50 rounded-xl shadow-sm">
                                <h3 className="text-xs font-bold text-indigo-100 uppercase mb-3">Gradient nổi bật</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    {GRADIENT_PRESETS.map((g, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleColorBgSelect(g.c1, g.c2)}
                                            className="h-12 w-full rounded-lg shadow-sm border border-white/10 hover:ring-2 ring-blue-400 transition-all relative overflow-hidden group"
                                            style={{ background: `linear-gradient(135deg, ${g.c1}, ${g.c2})` }}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-center backdrop-blur-[1px]">{g.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                       </div>
                   )}
               </div>
           )}

           {/* === FRAME TAB === */}
           {activeTab === 'frame' && (
               <div className="animate-fadeIn space-y-6">
                   <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm">
                       <h3 className="text-sm font-bold text-indigo-100 uppercase mb-4 flex items-center gap-2">
                           <Frame size={18} className="text-emerald-500"/> Kho Khung Viền
                       </h3>
                       
                       <div className="space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                           {FRAME_CATEGORIES.map((category) => (
                               <div key={category.name}>
                                   <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider mb-2 sticky top-0 bg-[#1a1642]/95 backdrop-blur z-10 py-1">
                                       {category.name}
                                   </div>
                                   <div className="grid grid-cols-3 gap-2">
                                       {category.items.map((style) => {
                                           // @ts-ignore
                                           const isSelected = design.frame.style === style.id;
                                           return (
                                               <button 
                                                    key={style.id}
                                                    // @ts-ignore
                                                    onClick={() => updateNested(['frame', 'style'], style.id)}
                                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all active:scale-95 ${isSelected ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-sm ring-1 ring-emerald-500/30' : 'bg-[#0b0923] border-indigo-900/30 text-slate-500 hover:border-emerald-500/50 hover:bg-[#151236] hover:text-emerald-400'}`}
                                               >
                                                   <div className={`w-8 h-8 mb-2 border-2 border-current rounded opacity-80 bg-white/5 shadow-sm flex items-center justify-center`}>
                                                        {style.id === 'none' && <X size={16} className="opacity-50"/>}
                                                   </div>
                                                   <span className="text-[10px] font-bold text-center leading-tight">{style.label}</span>
                                               </button>
                                           );
                                       })}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                   
                   {design.frame.style !== 'none' && (
                       <div className="bg-[#1a1642] p-4 rounded-xl border border-indigo-900/50 shadow-sm space-y-5 animate-slideUp">
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Màu viền</label>
                                   <div className="flex items-center gap-2 h-10 bg-[#0b0923] rounded-lg border border-indigo-900/50 px-2">
                                       <div className="relative w-8 h-6 rounded border border-indigo-900/50 overflow-hidden">
                                           <input 
                                                type="color" 
                                                value={design.frame.color}
                                                onChange={(e) => updateNested(['frame', 'color'], e.target.value)}
                                                className="absolute -top-2 -left-2 w-[200%] h-[200%] cursor-pointer p-0 border-0"
                                           />
                                       </div>
                                       <span className="text-xs text-slate-400 font-mono flex-1 text-right">{design.frame.color}</span>
                                   </div>
                               </div>
                               <div>
                                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Kích thước</label>
                                   <div className="h-10 flex items-center">
                                       <input 
                                            type="range" min="1" max="100" 
                                            value={design.frame.width}
                                            onChange={(e) => updateNested(['frame', 'width'], parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                       />
                                   </div>
                               </div>
                           </div>

                           <div className="border-t border-indigo-900/30 pt-4">
                               <h3 className="text-xs font-bold text-indigo-100 uppercase mb-4 flex items-center justify-between">
                                   <span>Vị trí & Lề</span>
                                   <button onClick={handleCenterFrame} className="text-[10px] text-white bg-emerald-600 px-2 py-0.5 rounded hover:bg-emerald-500 transition-colors">Căn giữa</button>
                               </h3>
                               
                               <div className="relative w-40 h-28 mx-auto border border-indigo-900/50 bg-[#0b0923] rounded-lg flex items-center justify-center mb-4 shadow-inner">
                                   <div className="absolute top-0 -mt-2 bg-[#1a1642] px-1 shadow-sm rounded border border-indigo-900/50">
                                       <input type="number" className="w-10 text-[10px] text-center font-medium outline-none bg-transparent text-white" placeholder="T" onChange={(e) => updateFrameMargin('top', parseFloat(e.target.value))} />
                                   </div>
                                   <div className="absolute bottom-0 -mb-2 bg-[#1a1642] px-1 shadow-sm rounded border border-indigo-900/50">
                                       <input type="number" className="w-10 text-[10px] text-center font-medium outline-none bg-transparent text-white" placeholder="B" onChange={(e) => updateFrameMargin('bottom', parseFloat(e.target.value))} />
                                   </div>
                                   <div className="absolute left-0 -ml-2 bg-[#1a1642] py-1 px-0.5 shadow-sm rounded border border-indigo-900/50">
                                        <input type="number" className="w-8 text-[10px] text-center font-medium outline-none bg-transparent text-white" placeholder="L" onChange={(e) => updateFrameMargin('left', parseFloat(e.target.value))} />
                                   </div>
                                   <div className="absolute right-0 -mr-2 bg-[#1a1642] py-1 px-0.5 shadow-sm rounded border border-indigo-900/50">
                                        <input type="number" className="w-8 text-[10px] text-center font-medium outline-none bg-transparent text-white" placeholder="R" onChange={(e) => updateFrameMargin('right', parseFloat(e.target.value))} />
                                   </div>
                                   <div className="w-20 h-14 bg-emerald-500/20 border border-emerald-500/50 rounded opacity-60"></div>
                               </div>

                               <div className="flex items-center gap-3 bg-[#0b0923] p-3 rounded-lg border border-indigo-900/30">
                                   <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Lề chung:</label>
                                   <input 
                                        type="range" min="0" max="5" step="0.1" defaultValue="0"
                                        onChange={(e) => updateUniformMargin(parseFloat(e.target.value))}
                                        className="flex-1 h-1.5 bg-indigo-900/50 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                   />
                               </div>
                           </div>
                       </div>
                   )}
               </div>
           )}

           {/* === EXPORT TAB === */}
           {activeTab === 'export' && (
               <div className="animate-fadeIn space-y-6 flex flex-col items-center justify-center h-full pb-20">
                   <div className="text-center mb-8">
                       <div className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full flex items-center justify-center text-indigo-400 mx-auto mb-4 shadow-inner border border-indigo-500/20">
                           <Download size={40} className="drop-shadow-sm"/>
                       </div>
                       <h2 className="text-xl font-bold text-white mb-2">Hoàn thành thiết kế</h2>
                       <p className="text-sm text-slate-400 max-w-[220px] mx-auto leading-relaxed">Tải xuống tác phẩm của bạn ở độ phân giải cao để in ấn hoặc chia sẻ.</p>
                   </div>
                   
                   <div className="w-full max-w-[260px] space-y-3">
                       <button onClick={() => onExport('png')} className="w-full py-4 bg-[#1a1642] border-2 border-indigo-900/50 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-2xl shadow-sm flex items-center justify-between px-6 transition-all group active:scale-[0.98]">
                           <span className="font-bold text-sm text-white">PNG (Chất lượng cao)</span>
                           <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                                <Download size={16} className="text-slate-400 group-hover:text-indigo-400"/>
                           </div>
                       </button>
                       <button onClick={() => onExport('jpg')} className="w-full py-4 bg-[#1a1642] border-2 border-indigo-900/50 hover:border-indigo-500 hover:bg-indigo-500/10 hover:text-indigo-300 rounded-2xl shadow-sm flex items-center justify-between px-6 transition-all group active:scale-[0.98]">
                           <span className="font-bold text-sm text-white">JPG (Nhẹ hơn)</span>
                           <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                                <Download size={16} className="text-slate-400 group-hover:text-indigo-400"/>
                           </div>
                       </button>
                   </div>
                   
                   <div className="mt-8 pt-6 border-t border-indigo-900/30 w-full text-center max-w-[260px]">
                       <p className="text-[10px] text-slate-500 font-medium bg-[#0b0923] py-2 rounded-lg border border-indigo-900/30">Mẹo: Sử dụng PNG cho các thiết kế có độ chi tiết cao và văn bản sắc nét.</p>
                   </div>
               </div>
           )}
       </div>

       {/* AUTHOR INFORMATION SECTION (READ-ONLY) - COLLAPSIBLE */}
       <div className="border-t border-indigo-900/50 bg-[#0b0923]/80 shrink-0 select-none transition-all duration-300">
           <button 
                onClick={() => setIsAuthorInfoExpanded(!isAuthorInfoExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
           >
               <div>
                   <h3 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">THÔNG TIN TÁC GIẢ</h3>
                   {!isAuthorInfoExpanded && <p className="text-[9px] text-slate-500 mt-0.5 animate-fadeIn">Thông tin ứng dụng & liên hệ</p>}
               </div>
               <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-400">
                   {isAuthorInfoExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
               </div>
           </button>
           
           {isAuthorInfoExpanded && (
               <div className="px-4 pb-4 animate-fadeIn space-y-1.5 text-[9px] text-slate-400 leading-normal border-t border-indigo-900/20 pt-2">
                   <p><span className="font-bold text-slate-300">Tên ứng dụng:</span> App tạo poster và băng rôn</p>
                   <p><span className="font-bold text-slate-300">Tác giả:</span> Thầy Đỗ Anh Dũng</p>
                   <p><span className="font-bold text-slate-300">Đơn vị công tác:</span> Trường THCS Trần Hưng Đạo</p>
                   <p><span className="font-bold text-slate-300">Mô tả ngắn:</span> Tạo các poster, băng rôn nhanh chóng; hỗ trợ chuẩn hóa thiết kế và xuất file chất lượng cao.</p>
                   <p><span className="font-bold text-slate-300">Bản quyền & sử dụng:</span> Giao diện và cấu trúc đã chuẩn hóa. Người dùng chỉ nhập nội dung và xuất file.</p>
                   <p><span className="font-bold text-slate-300">Liên hệ kỹ thuật:</span> 0904442979</p>
               </div>
           )}
       </div>
    </div>
  );
};
function bubbleTab(cat: string): string {
    return cat;
}
