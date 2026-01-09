
export type DesignMode = 'poster' | 'banner';

export type AspectRatio = 
  | '16:9' | 'A4' | 'A4-Landscape' | '3:1' 
  | 'Banner-3x0.8' | 'Banner-4x1' | 'Banner-6x1' 
  | '1:1' | '9:16' | '3:4' | '4:3' 
  | 'FB-Post' | 'FB-Cover'
  | 'Backdrop-275x135'
  | 'Custom';

export type FontStyle = 
  | 'Roboto' | 'Oswald' | 'Pacifico' | 'Montserrat' | 'Dancing Script' | 'Bangers' | 'Playfair Display' | 'Anton' | 'Patrick Hand'
  | 'Be Vietnam Pro' | 'Noto Sans' | 'Inter' | 'Poppins' | 'Archivo' | 'League Spartan' | 'Lora' | 'Merriweather' | 'Nunito' | 'Quicksand';

export type TextEffect = 'none' | 'shadow' | 'outline' | 'outline-fill' | 'neon' | '3d' | 'glow' | 'gradient' | 'layer-shadow' | 'soft-outline' | 'highlight';

export type IllustrationStyle = '2D' | '3D Render' | 'Flat Design' | 'Cartoon' | 'Realistic' | 'Watercolor' | 'Sketch';

export type FrameStyle = 
  // Cơ bản
  | 'none' | 'solid' | 'double' | 'dashed' | 'dotted'
  // Trang trọng / Cổ điển
  | 'vintage-corner' | 'art-deco' | 'certificate' | 'classic-gold' | 'ornamental'
  // Nhà trường / Giáo dục
  | 'bamboo' | 'ruler' | 'notebook' | 'chalkboard'
  // Thiếu nhi / Vui nhộn
  | 'stars' | 'colorful-dots' | 'puzzle' | 'crayons'
  // Sự kiện / Hiện đại
  | 'neon-border' | 'tribal' | 'tech-hud' | 'geometric' | 'floral';

export interface Decoration {
  id: string;
  type: 'icon' | 'shape';
  content: string; // Icon name or SVG path
  color: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface InsertedImage {
  id: string;
  url: string;
  originalUrl?: string; // Backup for undoing AI removal
  loading?: boolean;   // Loading state for AI processing
  x: number;
  y: number;
  scale: number;
  blur: number; // 0 to 20px
  // Edge blur (Feather) per side in %
  featherLeft: number;
  featherRight: number;
  featherTop: number;
  featherBottom: number;
  rotation: number;
  isRemovedBg: boolean;
}

export interface TextLayer {
  content: string;
  font: FontStyle;
  color: string;
  size: number; // Unit: cm
  effect: TextEffect;
  effectColor?: string; 
  
  // New Advanced Effect Properties
  effectThickness?: number; // For outline width or neon spread (px)
  shadowBlur?: number;      // For shadow blur radius (px)
  shadowOffsetX?: number;   // For shadow X offset (px)
  shadowOffsetY?: number;   // For shadow Y offset (px)

  // Typography controls
  lineHeight?: number;      // Multiplier (e.g. 1.2)
  letterSpacing?: number;   // Pixels (px)

  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  uppercase: boolean;
  hidden?: boolean;
  maxWidth?: number; // Constraint for text wrapping
  x: number; 
  y: number; 
  rotation?: number;
}

export interface FreeText extends TextLayer {
  id: string;
}

export interface HeaderState {
  topText: TextLayer;
  bottomText: TextLayer;
  logo: string | null;
  logoPosition: 'left' | 'right' | 'bottom' | 'top' | 'custom';
  logoShape?: 'circle' | 'square' | 'rectangle' | 'ellipse';
  logoWidth?: number; // Unit: cm (Size precision)
  logoInnerScale?: number; // Zoom level of image inside the shape (1 = 100%)
  logoScale?: number; // Deprecated but kept for backward compatibility (px)
  logoX?: number; // Custom X position
  logoY?: number; // Custom Y position
  
  // New Properties for Logo Border and Internal Image Position
  logoBorderColor?: string; 
  logoBorderWidth?: number;
  logoImageX?: number; // Internal Offset X
  logoImageY?: number; // Internal Offset Y

  align: 'left' | 'center' | 'right';
  hidden?: boolean; 
  x?: number; // cm
  y?: number;
}

export interface DesignState {
  mode: DesignMode;
  ratio: AspectRatio;
  dimensions: { width: number; height: number }; // cm
  
  header: HeaderState; 
  title: TextLayer; 
  subtitle: TextLayer; 
  meta: TextLayer & { date: string; location: string; format: 'full' | 'short' }; 
  bannerRightText: TextLayer; 
  
  decorations: Decoration[];
  insertedImages: InsertedImage[];
  freeTexts: FreeText[];

  illustration: {
    url: string | null;
    prompt: string;
    style: IllustrationStyle;
    loading: boolean;
    scale: number; 
    x: number; 
    y: number; 
  };
  
  background: {
    type: 'solid' | 'gradient' | 'image'; 
    color1: string;
    color2: string;
    overlayColor: string; 
    overlayOpacity: number; 
    pattern?: string;
    // New background feather properties
    featherLeft: number;
    featherRight: number;
    featherTop: number;
    featherBottom: number;
  };

  frame: {
    style: FrameStyle;
    color: string;
    width: number;
    // Tọa độ và kích thước khung (cm). Nếu undefined, mặc định full canvas
    rect?: { x: number; y: number; width: number; height: number }; 
  };

  layout: {
    headerSpace: number; // cm
    illustrationSpace: number; 
    contentSpace: number;
    horizontalPadding: number; // %
    
    headerLineGap: number; // cm
    headerToTitle: number; // cm
    titleToSubtitle: number; // cm
    subtitleToMeta: number; // cm
  };
}

export const FONTS: { label: string; value: FontStyle }[] = [
  { label: 'Cơ bản (Roboto)', value: 'Roboto' },
  { label: 'Mạnh mẽ (Oswald)', value: 'Oswald' },
  { label: 'Vui vẻ (Pacifico)', value: 'Pacifico' },
  { label: 'Hiện đại (Montserrat)', value: 'Montserrat' },
  { label: 'Mềm mại (Dancing Script)', value: 'Dancing Script' },
  { label: 'Hoạt hình (Bangers)', value: 'Bangers' },
  { label: 'Trang trọng (Playfair)', value: 'Playfair Display' },
  { label: 'Ấn tượng (Anton)', value: 'Anton' },
  { label: 'Viết tay (Patrick Hand)', value: 'Patrick Hand' },
  // Nhóm font hiện đại - giáo dục
  { label: 'Be Vietnam Pro', value: 'Be Vietnam Pro' },
  { label: 'Noto Sans VN', value: 'Noto Sans' },
  { label: 'Inter', value: 'Inter' },
  // Nhóm font tiêu đề
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Archivo', value: 'Archivo' },
  { label: 'League Spartan', value: 'League Spartan' },
  // Nhóm font báo cáo - sự kiện
  { label: 'Lora (Serif)', value: 'Lora' },
  { label: 'Merriweather', value: 'Merriweather' },
  // Nhóm sáng tạo
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Quicksand', value: 'Quicksand' },
];

export const RATIOS: Record<Exclude<AspectRatio, 'Custom'>, { w: number; h: number; name: string }> = {
  '16:9': { w: 32, h: 18, name: 'Màn hình chiếu (16:9)' },
  'A4': { w: 21, h: 29.7, name: 'A4 Đứng' },
  'A4-Landscape': { w: 29.7, h: 21, name: 'A4 Ngang' },
  
  '1:1': { w: 20, h: 20, name: 'Vuông (1:1) - Instagram/FB' },
  '9:16': { w: 15, h: 26.6, name: '9:16 - TikTok / Story / Reels' },
  '3:4': { w: 21, h: 28, name: '3:4 - Chân dung' },
  '4:3': { w: 28, h: 21, name: '4:3 - Ngang truyền thống' },
  'FB-Post': { w: 24, h: 12.6, name: 'Facebook Bài viết (1200x630)' },
  'FB-Cover': { w: 25.1, h: 9.3, name: 'Facebook Ảnh bìa (851x315)' },
  
  'Backdrop-275x135': { w: 275, h: 135, name: 'Phông hội trường (275x135cm)' },

  '3:1': { w: 90, h: 30, name: 'Panorama (3:1)' },
  'Banner-3x0.8': { w: 300, h: 80, name: 'Băng rôn 3m x 0.8m' },
  'Banner-4x1': { w: 400, h: 100, name: 'Băng rôn 4m x 1m' },
  'Banner-6x1': { w: 600, h: 100, name: 'Băng rôn 6m x 1m' },
};

export const DEFAULT_DESIGN: DesignState = {
  mode: 'poster',
  ratio: 'A4',
  dimensions: { width: 21, height: 29.7 },
  decorations: [],
  insertedImages: [],
  freeTexts: [],
  header: {
    align: 'center',
    logo: null,
    logoPosition: 'left',
    logoShape: 'circle',
    logoWidth: 2.5, // Default 2.5cm
    logoInnerScale: 1, // Default no zoom
    logoScale: 80, // Deprecated default
    logoX: 0,
    logoY: 0,
    logoBorderColor: 'transparent',
    logoBorderWidth: 0,
    logoImageX: 0,
    logoImageY: 0,
    hidden: false,
    x: 0,
    y: 0,
    topText: {
        content: 'UBND PHƯỜNG LƯU KIẾM',
        font: 'Roboto',
        color: '#000000',
        size: 0.6, // cm
        lineHeight: 1.2,
        letterSpacing: 0,
        effect: 'none',
        effectColor: '#000000',
        effectThickness: 0,
        align: 'center',
        bold: false,
        italic: false,
        uppercase: true,
        hidden: false,
        x: 0, y: 0
    },
    bottomText: {
        content: 'TRƯỜNG THCS TRẦN HƯNG ĐẠO',
        font: 'Roboto',
        color: '#000000',
        size: 0.8, // cm
        lineHeight: 1.2,
        letterSpacing: 0,
        effect: 'none',
        effectColor: '#000000',
        effectThickness: 0,
        align: 'center',
        bold: true, 
        italic: false,
        uppercase: true,
        hidden: false,
        x: 0, y: 0
    }
  },
  title: {
    content: 'HỘI TRẠI TRUYỀN THỐNG 26/3',
    font: 'Bangers',
    color: '#D32F2F',
    size: 2.5, // cm
    lineHeight: 1.1,
    letterSpacing: 0,
    effect: '3d',
    effectColor: '#555555',
    effectThickness: 3,
    shadowBlur: 0,
    shadowOffsetX: 3,
    shadowOffsetY: 3,
    align: 'center',
    bold: true,
    italic: false,
    uppercase: true,
    hidden: false,
    x: 0, y: 0
  },
  subtitle: {
    content: 'Tiếp Lửa Truyền Thống - Vững Bước Tương Lai',
    font: 'Montserrat',
    color: '#1976D2',
    size: 1.2, // cm
    lineHeight: 1.2,
    letterSpacing: 0,
    effect: '3d',
    effectColor: '#000000',
    effectThickness: 1,
    shadowBlur: 0,
    shadowOffsetX: 1,
    shadowOffsetY: 1,
    align: 'center',
    bold: false,
    italic: false,
    uppercase: false,
    hidden: false,
    x: 0, y: 0
  },
  meta: {
    content: '',
    date: new Date().toISOString().split('T')[0], 
    location: 'Lưu Kiếm',
    format: 'full',
    font: 'Roboto',
    color: '#424242',
    size: 0.7, // cm
    lineHeight: 1.3,
    letterSpacing: 0,
    effect: 'none',
    effectColor: '#000000',
    effectThickness: 0,
    align: 'center',
    bold: false,
    italic: true,
    uppercase: false,
    hidden: false,
    x: 0, y: 0
  },
  bannerRightText: {
    content: 'Niên khóa 2024 - 2027',
    font: 'Patrick Hand',
    color: '#333333',
    size: 0.8, // cm
    lineHeight: 1.2,
    letterSpacing: 0,
    effect: 'none',
    effectColor: '#000000',
    effectThickness: 0,
    align: 'right',
    bold: false,
    italic: false,
    uppercase: false,
    hidden: true,
    x: 0, y: 0
  },
  illustration: {
    url: null,
    prompt: 'học sinh cắm trại vui vẻ trường học',
    style: 'Cartoon',
    loading: false,
    scale: 1,
    x: 0,
    y: 0
  },
  background: {
    type: 'gradient',
    color1: '#ffffff',
    color2: '#e3f2fd',
    overlayColor: '#ffffff',
    overlayOpacity: 0.85,
    featherLeft: 0,
    featherRight: 0,
    featherTop: 0,
    featherBottom: 0,
  },
  frame: {
    style: 'none', // Changed default to 'none'
    color: '#1976D2',
    width: 8,
    // rect is undefined by default, implying full width/height
  },
  layout: {
    headerSpace: 1.0, // cm
    illustrationSpace: 40, 
    contentSpace: 45,
    horizontalPadding: 5, // %
    headerLineGap: 0.2, // cm
    headerToTitle: 0.8, // cm
    titleToSubtitle: 0.8, // cm
    subtitleToMeta: 0.5, // cm
  }
};
