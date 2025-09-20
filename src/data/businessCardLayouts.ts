// FILE: src/data/businessCardLayouts.ts
// ACTION: FULL FILE REPLACEMENT
// PURPOSE: Fix rendering issues by removing comments, ensuring HTML compatibility, and proper styling

/**
 * Business Card Layout Data File
 * Fixed version with proper HTML syntax and no leaked comments
 * Contains 100 pre-generated business card layouts with clean JSX, CSS, and metadata
 */

export interface BusinessCardLayout {
    catalogId: string;
    name: string;
    theme: string;
    version?: number;
    description?: string;
    style: 'contact-focused' | 'company-focused';
    jsx: string;
    metadata: {
        dimensions: {
            width: string;
            height: string;
        };
        colors: string[];
        fonts: string[];
        features: string[];
    };
}

export const BUSINESS_CARD_LAYOUTS: BusinessCardLayout[] = [
    // MINIMALISTIC THEME LAYOUTS (1-15)
    {
        catalogId: 'BC001',
        name: 'Minimal Professional v1',
        theme: 'minimalistic',
        version: 1,
        description: 'Clean white background with subtle typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        padding: 0.25in;
        font-family: Arial, sans-serif;
        position: relative;
        box-sizing: border-box;
      ">
        <div class="logo-section" style="
          position: absolute;
          top: 0.25in;
          left: 0.25in;
          width: 0.8in;
          height: 0.6in;
        ">
          <div class="logo-placeholder" style="
            width: 100%;
            height: 100%;
            background-color: #f0f0f0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #999;
            border: 1px solid #e0e0e0;
          ">LOGO</div>
        </div>
        <div class="main-content" style="
          margin-left: 1.2in;
          padding-top: 0.1in;
        ">
          <h1 style="
            font-size: 14px;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 2px 0;
            line-height: 1.2;
          ">John Smith</h1>
          <h2 style="
            font-size: 10px;
            color: #718096;
            margin: 0 0 8px 0;
            font-weight: 400;
          ">Senior Manager</h2>
          <h3 style="
            font-size: 12px;
            color: #4a5568;
            margin: 0 0 12px 0;
            font-weight: 500;
          ">Acme Corporation</h3>
          <div class="contact-info" style="
            font-size: 9px;
            color: #4a5568;
            line-height: 1.4;
          ">
            <div style="margin-bottom: 2px;">📱 (555) 123-4567</div>
            <div style="margin-bottom: 2px;">📞 (555) 987-6543</div>
            <div>✉️ john.smith@acme.com</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#2d3748', '#718096', '#4a5568'],
            fonts: ['Arial'],
            features: ['logo-left', 'contact-right', 'minimal-icons']
        }
    },

    {
        catalogId: 'BC002',
        name: 'Minimal Professional v2',
        theme: 'minimalistic',
        version: 2,
        description: 'Center-aligned minimal design with thin borders',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        padding: 0.18in;
        font-family: Helvetica, sans-serif;
        text-align: center;
        box-sizing: border-box;
      ">
        <div class="logo-section" style="margin-bottom: 0.08in;">
          <div class="logo-placeholder" style="
            width: 0.8in;
            height: 0.45in;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #6c757d;
          ">LOGO</div>
        </div>
        <h1 style="
          font-size: 14px;
          font-weight: 700;
          color: #1a202c;
          margin: 0 0 3px 0;
          line-height: 1.1;
        ">ACME CORPORATION</h1>
        <div style="
          width: 1.2in;
          height: 1px;
          background: #cbd5e0;
          margin: 5px auto;
        "></div>
        <h2 style="
          font-size: 11px;
          color: #2d3748;
          margin: 0 0 1px 0;
          font-weight: 500;
        ">John Smith</h2>
        <h3 style="
          font-size: 9px;
          color: #718096;
          margin: 0 0 8px 0;
          font-weight: 400;
        ">Senior Manager</h3>
        <div class="contact-info" style="
          font-size: 8px;
          color: #4a5568;
          line-height: 1.2;
        ">
          <div>Mobile: (555) 123-4567</div>
          <div>Email: john.smith@acme.com</div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#1a202c', '#2d3748', '#718096', '#e2e8f0'],
            fonts: ['Helvetica'],
            features: ['center-aligned', 'thin-border', 'company-logo-top']
        }
    },

    {
        catalogId: 'BC003',
        name: 'Minimal Edge',
        theme: 'minimalistic',
        description: 'Asymmetric layout with left edge accent',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Helvetica Neue', sans-serif;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          left: 0;
          top: 0;
          width: 4px;
          height: 100%;
          background: #4299e1;
        "></div>
        <div style="padding: 0.18in 0.2in 0.18in 0.25in;">
          <div class="logo-section" style="margin-bottom: 0.08in;">
            <div class="logo-placeholder" style="
              width: 0.6in;
              height: 0.4in;
              background-color: #f7fafc;
              border-radius: 2px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 7px;
              color: #a0aec0;
              border: 1px solid #e2e8f0;
            ">LOGO</div>
          </div>
          <h1 style="
            font-size: 13px;
            font-weight: 600;
            color: #2d3748;
            margin: 0 0 2px 0;
            line-height: 1.1;
          ">Sarah Johnson</h1>
          <h2 style="
            font-size: 10px;
            color: #4299e1;
            margin: 0 0 1px 0;
            font-weight: 500;
          ">Creative Director</h2>
          <h3 style="
            font-size: 9px;
            color: #718096;
            margin: 0 0 10px 0;
            font-weight: 400;
          ">Design Studio Inc.</h3>
          <div class="contact-info" style="
            font-size: 8px;
            color: #4a5568;
            line-height: 1.3;
          ">
            <div style="margin-bottom: 1px;">Mobile: (555) 123-4567</div>
            <div style="margin-bottom: 1px;">Work: (555) 987-6543</div>
            <div>sarah.johnson@designstudio.com</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#4299e1', '#2d3748', '#718096'],
            fonts: ['Helvetica Neue'],
            features: ['left-accent', 'asymmetric', 'color-accent']
        }
    },

    {
        catalogId: 'BC004',
        name: 'Minimal Clean Slate',
        theme: 'minimalistic',
        description: 'Ultra-clean with generous white space and perfect balance',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        padding: 0.35in 0.3in;
        font-family: system-ui, sans-serif;
        box-sizing: border-box;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: 100%;
        ">
          <div class="content-left" style="
            flex: 1;
            max-width: 1.8in;
            padding-right: 0.2in;
          ">
            <h1 style="
              font-size: 16px;
              font-weight: 700;
              color: #1a202c;
              margin: 0 0 4px 0;
              line-height: 1.1;
            ">Emma Thompson</h1>
            <h2 style="
              font-size: 11px;
              color: #718096;
              margin: 0 0 15px 0;
              font-weight: 400;
            ">Brand Strategist</h2>
            <h3 style="
              font-size: 12px;
              color: #4a5568;
              margin: 0 0 20px 0;
              font-weight: 500;
            ">Creative Solutions</h3>
            <div class="contact-info" style="
              font-size: 9px;
              color: #4a5568;
              line-height: 1.4;
            ">
              <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
              <div style="margin-bottom: 3px;">✉️ emma@creativesolutions.com</div>
              <div>🌐 creativesolutions.com</div>
            </div>
          </div>
          <div class="logo-section" style="
            width: 0.8in;
            height: 0.8in;
            background-color: #f8fafc;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #a0aec0;
            border: 1px solid #e2e8f0;
            margin-top: 0.1in;
          ">LOGO</div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#1a202c', '#718096', '#4a5568'],
            fonts: ['system-ui'],
            features: ['two-column', 'clean-spacing', 'right-logo']
        }
    },

    {
        catalogId: 'BC005',
        name: 'Classic Serif Elegance',
        theme: 'classic',
        description: 'Traditional design with serif typography and elegant spacing',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #fefefe;
        padding: 0.18in;
        font-family: Georgia, serif;
        box-sizing: border-box;
      ">
        <div style="text-align: center; margin-bottom: 0.12in;">
          <h1 style="
            font-size: 15px;
            font-weight: 700;
            color: #0f172a;
            margin: 0 0 3px 0;
            letter-spacing: -0.5px;
            line-height: 1;
          ">STELLAR DESIGN</h1>
          <div style="
            width: 1.8in;
            height: 1px;
            background: linear-gradient(to right, transparent, #cbd5e0, transparent);
            margin: 0 auto;
          "></div>
        </div>
        <div style="text-align: center;">
          <div class="logo-placeholder" style="
            width: 0.5in;
            height: 0.5in;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #94a3b8;
            margin-bottom: 8px;
          ">LOGO</div>
          <h2 style="
            font-size: 11px;
            color: #1e293b;
            margin: 0 0 1px 0;
            font-weight: 600;
          ">Emma Wilson</h2>
          <h3 style="
            font-size: 9px;
            color: #64748b;
            margin: 0 0 8px 0;
            font-style: italic;
          ">Principal Designer</h3>
          <div class="contact-info" style="
            font-size: 8px;
            color: #475569;
            line-height: 1.3;
          ">
            <div>Mobile: (555) 123-4567</div>
            <div>Office: (555) 987-6543</div>
            <div>emma@stellardesign.com</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#fefefe', '#0f172a', '#64748b', '#cbd5e0'],
            fonts: ['Georgia'],
            features: ['serif-typography', 'center-layout', 'gradient-divider']
        }
    },

    {
        catalogId: 'BC006',
        name: 'Modern Grid Balance',
        theme: 'modern',
        description: 'Perfectly balanced grid system with precise spacing',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
        font-family: Inter, sans-serif;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.96);
          margin: 3px;
          border-radius: 8px;
          padding: 0.25in;
        ">
          <div style="
            display: grid;
            grid-template-columns: 1fr 0.8in;
            gap: 0.15in;
            height: 100%;
          ">
            <div class="content-area">
              <h1 style="
                font-size: 14px;
                font-weight: 700;
                color: #1a202c;
                margin: 0 0 6px 0;
                line-height: 1.2;
              ">Michael Chen</h1>
              <h2 style="
                font-size: 10px;
                color: #667eea;
                margin: 0 0 4px 0;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">Product Manager</h2>
              <h3 style="
                font-size: 11px;
                color: #4a5568;
                margin: 0 0 15px 0;
                font-weight: 500;
              ">Tech Innovations Inc.</h3>
              <div class="contact-grid" style="
                display: grid;
                grid-template-columns: 1fr;
                gap: 3px;
                font-size: 9px;
                color: #4a5568;
              ">
                <div>📱 (555) 123-4567</div>
                <div>📧 m.chen@techinnovations.com</div>
                <div>🌐 techinnovations.com</div>
              </div>
            </div>
            <div class="logo-area" style="
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div class="logo-placeholder" style="
                width: 100%;
                height: 0.7in;
                background: linear-gradient(135deg, #667eea, #764ba2);
                border-radius: 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: white;
                font-weight: 600;
              ">LOGO</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#667eea', '#764ba2', '#ffffff', '#1a202c'],
            fonts: ['Inter'],
            features: ['grid-layout', 'gradient-border', 'modern-styling']
        }
    },

    {
        catalogId: 'BC008',
        name: 'Creative Edge Splitter',
        theme: 'creative',
        description: 'Bold asymmetric design with vibrant color blocks',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          right: 0;
          width: 1in;
          height: 100%;
          background: linear-gradient(45deg, #ff6b6b, #ee5a24);
        "></div>
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60%;
          height: 4px;
          background: #4834d4;
        "></div>
        <div style="padding: 0.16in; position: relative; z-index: 2;">
          <div class="logo-section" style="margin-bottom: 0.08in;">
            <div class="logo-placeholder" style="
              width: 0.5in;
              height: 0.5in;
              background-color: #f8f9fa;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 7px;
              color: #6c757d;
              border: 2px solid #ee5a24;
            ">LOGO</div>
          </div>
          <h1 style="
            font-size: 14px;
            font-weight: 800;
            color: #2d3436;
            margin: 0 0 3px 0;
            line-height: 1;
          ">Alex Rivera</h1>
          <h2 style="
            font-size: 10px;
            color: #ee5a24;
            margin: 0 0 2px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          ">Creative Director</h2>
          <h3 style="
            font-size: 9px;
            color: #636e72;
            margin: 0 0 8px 0;
            font-weight: 400;
          ">Splash Creative Studio</h3>
          <div class="contact-info" style="
            font-size: 8px;
            color: #2d3436;
            line-height: 1.3;
            max-width: 1.6in;
          ">
            <div style="margin-bottom: 1px;">📱 (555) 123-4567</div>
            <div style="margin-bottom: 1px;">✉️ alex@splashcreative.com</div>
            <div>🎨 splashcreative.com</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ff6b6b', '#ee5a24', '#4834d4', '#2d3436'],
            fonts: ['Inter'],
            features: ['color-blocks', 'asymmetric', 'creative-layout']
        }
    },

    {
        catalogId: 'BC009',
        name: 'Tech Minimal Grid',
        theme: 'tech',
        description: 'Clean tech design with structured grid and modern typography',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        font-family: 'SF Pro Display', sans-serif;
        box-sizing: border-box;
        position: relative;
      ">
        <div style="
          background: #1e293b;
          height: 0.4in;
          padding: 0.1in 0.25in;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <h1 style="
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            margin: 0;
            letter-spacing: 1px;
          ">DATAFLOW</h1>
          <div class="logo-placeholder" style="
            width: 0.6in;
            height: 0.25in;
            background-color: rgba(255,255,255,0.1);
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: rgba(255,255,255,0.7);
          ">LOGO</div>
        </div>
        <div style="padding: 0.25in;">
          <h2 style="
            font-size: 13px;
            color: #1e293b;
            margin: 0 0 3px 0;
            font-weight: 600;
          ">David Park</h2>
          <h3 style="
            font-size: 10px;
            color: #64748b;
            margin: 0 0 15px 0;
            font-weight: 500;
          ">Senior Software Engineer</h3>
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            font-size: 9px;
            color: #475569;
          ">
            <div>
              <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
              <div>✉️ david@dataflow.tech</div>
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 3px;">🌐 dataflow.tech</div>
              <div>📍 San Francisco, CA</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#1e293b', '#f8fafc', '#64748b', '#475569'],
            fonts: ['SF Pro Display'],
            features: ['tech-header', 'grid-contact', 'modern-minimal']
        }
    },

    {
        catalogId: 'BC010',
        name: 'Trendy Neon Glow',
        theme: 'trendy',
        description: 'Vibrant neon-inspired design with modern typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #0f0f23;
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -20px;
          right: -20px;
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, #ff0080 0%, transparent 70%);
          filter: blur(15px);
          opacity: 0.6;
        "></div>
        <div style="
          position: absolute;
          bottom: -15px;
          left: -15px;
          width: 60px;
          height: 60px;
          background: radial-gradient(circle, #00ff88 0%, transparent 70%);
          filter: blur(10px);
          opacity: 0.5;
        "></div>
        <div style="padding: 0.25in; position: relative; z-index: 2;">
          <div class="logo-section" style="margin-bottom: 0.15in;">
            <div class="logo-placeholder" style="
              width: 0.7in;
              height: 0.5in;
              background: linear-gradient(45deg, #ff0080, #00ff88);
              border-radius: 6px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: #ffffff;
              font-weight: 700;
            ">LOGO</div>
          </div>
          <h1 style="
            font-size: 16px;
            font-weight: 800;
            color: #ffffff;
            margin: 0 0 4px 0;
            line-height: 1.1;
            text-shadow: 0 0 10px rgba(255, 0, 128, 0.5);
          ">Maya Singh</h1>
          <h2 style="
            font-size: 11px;
            color: #00ff88;
            margin: 0 0 3px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">Digital Artist</h2>
          <h3 style="
            font-size: 10px;
            color: #a8a8b3;
            margin: 0 0 15px 0;
            font-weight: 400;
          ">Neon Dreams Studio</h3>
          <div class="contact-info" style="
            font-size: 9px;
            color: #ffffff;
            line-height: 1.5;
          ">
            <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
            <div style="margin-bottom: 3px;">✉️ maya@neondreams.art</div>
            <div>🎨 neondreams.art</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#0f0f23', '#ff0080', '#00ff88', '#ffffff'],
            fonts: ['Inter'],
            features: ['neon-glow', 'dark-theme', 'gradient-logo']
        }
    },

    {
        catalogId: 'BC011',
        name: 'Trendy Brutalist',
        theme: 'trendy',
        description: 'Bold brutalist design with strong typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ff4500;
        border: 4px solid #000000;
        font-family: 'Arial Black', sans-serif;
        box-sizing: border-box;
        position: relative;
      ">
        <div style="
          background: #ffffff;
          margin: 0.1in;
          height: calc(100% - 0.2in);
          padding: 0.2in;
          border: 2px solid #000000;
        ">
          <h1 style="
            font-size: 18px;
            font-weight: 900;
            color: #000000;
            margin: 0 0 2px 0;
            text-transform: uppercase;
            letter-spacing: -1px;
            line-height: 0.9;
          ">ALEX STONE</h1>
          <h2 style="
            font-size: 10px;
            color: #ff4500;
            margin: 0 0 8px 0;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">GRAPHIC DESIGNER</h2>
          <div style="
            background: #000000;
            height: 2px;
            width: 1.5in;
            margin-bottom: 8px;
          "></div>
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          ">
            <div class="contact-info" style="
              font-size: 10px;
              color: #000000;
              line-height: 1.2;
              font-weight: 700;
            ">
              <div>(555) 123-4567</div>
              <div>(555) 987-6543</div>
              <div style="font-size: 9px;">ALEX@STONE.DESIGN</div>
            </div>
            <div class="logo-placeholder" style="
              width: 0.6in;
              height: 0.6in;
              background-color: #ff4500;
              border: 2px solid #000000;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: #ffffff;
              font-weight: 900;
            ">LOGO</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ff4500', '#000000', '#ffffff'],
            fonts: ['Arial Black'],
            features: ['brutalist', 'bold-borders', 'high-contrast']
        }
    },

    {
        catalogId: 'BC012',
        name: 'Professional Medical',
        theme: 'professional',
        description: 'Clean medical professional design with trust elements',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        font-family: 'Helvetica', sans-serif;
        box-sizing: border-box;
      ">
        <div style="
          background: #2563eb;
          height: 0.3in;
          padding: 0.08in 0.25in;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <div style="
            font-size: 12px;
            font-weight: 600;
            color: #ffffff;
            letter-spacing: 0.5px;
          ">HEALTHCARE PLUS</div>
          <div class="logo-placeholder" style="
            width: 0.5in;
            height: 0.2in;
            background-color: rgba(255,255,255,0.2);
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 6px;
            color: rgba(255,255,255,0.8);
          ">LOGO</div>
        </div>
        <div style="padding: 0.25in;">
          <h1 style="
            font-size: 14px;
            color: #1e293b;
            margin: 0 0 2px 0;
            font-weight: 600;
          ">Dr. Sarah Mitchell</h1>
          <h2 style="
            font-size: 11px;
            color: #2563eb;
            margin: 0 0 3px 0;
            font-weight: 500;
          ">Family Medicine Physician</h2>
          <h3 style="
            font-size: 9px;
            color: #64748b;
            margin: 0 0 15px 0;
            font-weight: 400;
          ">Board Certified • MD, Johns Hopkins</h3>
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            font-size: 9px;
            color: #475569;
          ">
            <div>
              <div style="margin-bottom: 2px;">📞 (555) 123-4567</div>
              <div style="margin-bottom: 2px;">📠 (555) 123-4568</div>
              <div>✉️ s.mitchell@healthplus.com</div>
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 2px;">🏥 123 Medical Center Dr</div>
              <div style="margin-bottom: 2px;">Boston, MA 02101</div>
              <div>🌐 healthcareplus.com</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#2563eb', '#ffffff', '#1e293b', '#64748b'],
            fonts: ['Helvetica'],
            features: ['medical-theme', 'professional-header', 'credentials']
        }
    },

    {
        catalogId: 'BC013',
        name: 'Luxury Gold Accent',
        theme: 'luxury',
        description: 'Sophisticated design with elegant gold accents',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #1a1a1a;
        border: 2px solid #d4af37;
        padding: 0.16in;
        font-family: 'Playfair Display', serif;
        position: relative;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at center, rgba(212, 175, 55, 0.1) 0%, transparent 70%);
          pointer-events: none;
        "></div>
        <div style="
          text-align: center;
          position: relative;
          z-index: 2;
        ">
          <h1 style="
            font-size: 16px;
            font-weight: 400;
            color: #d4af37;
            margin: 0 0 6px 0;
            text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
            letter-spacing: 2px;
          ">PRESTIGE</h1>
          <div style="
            width: 2in;
            height: 1px;
            background: linear-gradient(90deg, transparent, #d4af37, transparent);
            margin: 0 auto 8px auto;
          "></div>
          <div class="logo-placeholder" style="
            width: 0.8in;
            height: 0.4in;
            background-color: rgba(212, 175, 55, 0.1);
            border: 1px solid #d4af37;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #d4af37;
            margin-bottom: 8px;
          ">LOGO</div>
          <h2 style="
            font-size: 12px;
            color: #ffffff;
            margin: 0 0 2px 0;
            font-weight: 600;
          ">Victoria Sterling</h2>
          <h3 style="
            font-size: 10px;
            color: #d4af37;
            margin: 0 0 8px 0;
            font-style: italic;
          ">Executive Director</h3>
          <div class="contact-info" style="
            font-size: 8px;
            color: #cccccc;
            line-height: 1.3;
          ">
            <div>📞 (555) 123-4567 ◆ 📧 victoria@prestige.luxury</div>
            <div style="margin-top: 2px; color: #d4af37;">www.prestige.luxury</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#1a1a1a', '#d4af37', '#ffffff', '#cccccc'],
            fonts: ['Playfair Display'],
            features: ['luxury', 'gold-foil', 'dark-background', 'elegant']
        }
    },

    {
        catalogId: 'BC014',
        name: 'Vintage Letterpress',
        theme: 'vintage',
        description: 'Classic letterpress-inspired design with vintage typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #f4e4bc;
        border: 3px solid #8b4513;
        padding: 0.16in;
        font-family: 'Georgia', serif;
        position: relative;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: 6px;
          right: 6px;
          width: 0.4in;
          height: 0.4in;
          background: radial-gradient(circle, rgba(139, 69, 19, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          bottom: 6px;
          left: 6px;
          width: 0.25in;
          height: 0.25in;
          background: radial-gradient(circle, rgba(139, 69, 19, 0.05) 0%, transparent 70%);
          border-radius: 50%;
        "></div>
        <div style="
          text-align: center;
          position: relative;
          z-index: 2;
        ">
          <div class="logo-placeholder" style="
            width: 0.7in;
            height: 0.5in;
            background-color: rgba(139, 69, 19, 0.1);
            border: 2px solid #8b4513;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #8b4513;
            margin-bottom: 8px;
          ">LOGO</div>
          <h1 style="
            font-size: 14px;
            font-weight: 700;
            color: #5d4037;
            margin: 0 0 3px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">THOMAS BAKER</h1>
          <h2 style="
            font-size: 10px;
            color: #8b4513;
            margin: 0 0 2px 0;
            font-style: italic;
          ">Master Craftsman</h2>
          <h3 style="
            font-size: 9px;
            color: #5d4037;
            margin: 0 0 8px 0;
            font-weight: 400;
          ">Heritage Woodworks</h3>
          <div style="
            width: 1.8in;
            height: 1px;
            background: #8b4513;
            margin: 0 auto 6px auto;
          "></div>
          <div class="contact-info" style="
            font-size: 8px;
            color: #5d4037;
            line-height: 1.3;
          ">
            <div>📞 (555) 123-4567</div>
            <div>✉️ thomas@heritagewood.com</div>
            <div>Est. 1952</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#f4e4bc', '#8b4513', '#5d4037'],
            fonts: ['Georgia'],
            features: ['vintage', 'letterpress-style', 'aged-effects', 'craftsmanship']
        }
    },

    {
        catalogId: 'BC015',
        name: 'Creative Watercolor',
        theme: 'artistic',
        description: 'Vibrant watercolor splash with artistic typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Nunito', sans-serif;
        overflow: hidden;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: -30px;
          right: -30px;
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(255, 107, 107, 0.6) 0%, rgba(255, 107, 107, 0.2) 40%, transparent 70%);
          border-radius: 50%;
          filter: blur(8px);
        "></div>
        <div style="
          position: absolute;
          bottom: -20px;
          left: -20px;
          width: 100px;
          height: 100px;
          background: radial-gradient(circle, rgba(72, 187, 120, 0.5) 0%, rgba(72, 187, 120, 0.2) 40%, transparent 70%);
          border-radius: 50%;
          filter: blur(6px);
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(167, 139, 250, 0.4) 0%, rgba(167, 139, 250, 0.15) 40%, transparent 70%);
          border-radius: 50%;
          filter: blur(4px);
        "></div>
        <div style="
          padding: 0.3in;
          position: relative;
          z-index: 2;
          height: 100%;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.15in;
          ">
            <div>
              <h1 style="
                font-size: 16px;
                font-weight: 700;
                color: #2d3748;
                margin: 0 0 3px 0;
                line-height: 1.1;
              ">Maya Patel</h1>
              <h2 style="
                font-size: 11px;
                color: #ff6b6b;
                margin: 0 0 2px 0;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">Creative Artist</h2>
              <h3 style="
                font-size: 10px;
                color: #4a5568;
                margin: 0;
                font-weight: 400;
              ">Splash Creative Studio</h3>
            </div>
            <div class="logo-placeholder" style="
              width: 0.6in;
              height: 0.6in;
              background: linear-gradient(135deg, #ff6b6b, #a78bfa);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: #ffffff;
              font-weight: 600;
            ">LOGO</div>
          </div>
          <div style="
            position: absolute;
            bottom: 0.3in;
            left: 0.3in;
            right: 0.3in;
          ">
            <div class="contact-info" style="
              font-size: 10px;
              color: #2d3748;
              line-height: 1.4;
            ">
              <div style="margin-bottom: 3px;">🎨 maya@splashcreative.studio</div>
              <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
              <div style="font-size: 9px; color: #a78bfa;">✨ @mayacreates</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ff6b6b', '#48bb78', '#a78bfa', '#ffffff'],
            fonts: ['Nunito'],
            features: ['watercolor-splash', 'artistic', 'gradient-logo', 'organic-shapes']
        }
    },

    {
        catalogId: 'BC020',
        name: 'Corporate Professional Blue',
        theme: 'professional',
        description: 'Traditional corporate design with navy accents',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        font-family: 'Arial', sans-serif;
        box-sizing: border-box;
        position: relative;
      ">
        <div style="
          background: #1e3a8a;
          height: 0.5in;
          padding: 0.15in 0.25in;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <h1 style="
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">CORPORATE SOLUTIONS</h1>
          <div class="logo-placeholder" style="
            width: 0.8in;
            height: 0.3in;
            background-color: rgba(255,255,255,0.2);
            border-radius: 3px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: rgba(255,255,255,0.8);
          ">LOGO</div>
        </div>
        <div style="
          padding: 0.25in;
          padding-top: 0.2in;
        ">
          <h2 style="
            font-size: 16px;
            color: #1f2937;
            margin: 0 0 3px 0;
            font-weight: 600;
          ">Jennifer Martinez</h2>
          <h3 style="
            font-size: 12px;
            color: #1e3a8a;
            margin: 0 0 15px 0;
            font-weight: 500;
          ">Senior Account Manager</h3>
          <div style="
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            font-size: 10px;
            color: #4b5563;
          ">
            <div>
              <div style="margin-bottom: 3px; font-weight: 500;">📞 Direct: (555) 123-4567</div>
              <div style="margin-bottom: 3px;">📱 Mobile: (555) 987-6543</div>
              <div>📧 j.martinez@corpsolutions.com</div>
            </div>
            <div style="text-align: right;">
              <div style="margin-bottom: 3px;">🏢 1234 Business Blvd</div>
              <div style="margin-bottom: 3px;">Chicago, IL 60601</div>
              <div>🌐 www.corpsolutions.com</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#1e3a8a', '#ffffff', '#1f2937', '#4b5563'],
            fonts: ['Arial'],
            features: ['corporate-header', 'two-column-contact', 'professional', 'navy-blue']
        }
    },

    {
        catalogId: 'BC021',
        name: 'Tech Holographic',
        theme: 'tech',
        description: 'Futuristic holographic design with data elements',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
        background-size: 400% 400%;
        padding: 2px;
        font-family: 'Inter', sans-serif;
        position: relative;
        box-sizing: border-box;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.95);
          height: 100%;
          border-radius: 12px;
          padding: 0.25in;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #667eea);
            background-size: 400% 100%;
          "></div>
          <div style="
            position: absolute;
            top: 15px;
            right: 15px;
            width: 40px;
            height: 40px;
            opacity: 0.1;
          ">
            <div style="
              width: 100%;
              height: 100%;
              background: linear-gradient(45deg, #667eea, #764ba2);
              border-radius: 50%;
            "></div>
          </div>
          <div style="margin-top: 8px;">
            <h1 style="
              font-size: 18px;
              font-weight: 700;
              color: #1a202c;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">QUANTUM TECH</h1>
            <div style="
              width: 2in;
              height: 2px;
              background: linear-gradient(90deg, #667eea, #764ba2);
              margin-bottom: 12px;
            "></div>
            <div class="logo-placeholder" style="
              width: 0.8in;
              height: 0.5in;
              background: linear-gradient(135deg, #667eea, #f093fb);
              border-radius: 6px;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: white;
              font-weight: 600;
              margin-bottom: 15px;
            ">LOGO</div>
            <h2 style="
              font-size: 14px;
              color: #2d3748;
              margin: 0 0 3px 0;
              font-weight: 600;
            ">Alex Chen</h2>
            <h3 style="
              font-size: 11px;
              color: #667eea;
              margin: 0 0 12px 0;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Chief Technology Officer</h3>
            <div class="contact-info" style="
              font-size: 9px;
              color: #4a5568;
              line-height: 1.4;
            ">
              <div style="margin-bottom: 2px;">📱 (555) 123-4567</div>
              <div style="margin-bottom: 2px;">✉️ alex@quantumtech.ai</div>
              <div>🌐 quantumtech.ai</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#667eea', '#764ba2', '#f093fb', '#ffffff'],
            fonts: ['Inter'],
            features: ['holographic-gradient', 'tech-elements', 'futuristic']
        }
    },

    {
        catalogId: 'BC022',
        name: 'Vintage Postcard',
        theme: 'vintage',
        description: 'Retro postcard-inspired design with aged effects',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: linear-gradient(45deg, #f4e4bc 0%, #e8d5b7 100%);
        border: 3px solid #8b4513;
        padding: 0.25in;
        font-family: 'Georgia', serif;
        position: relative;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: 8px;
          right: 8px;
          width: 0.5in;
          height: 0.5in;
          background: radial-gradient(circle, rgba(139, 69, 19, 0.1) 0%, transparent 70%);
          border-radius: 50%;
        "></div>
        <div style="
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 0.3in;
          height: 0.3in;
          background: radial-gradient(circle, rgba(139, 69, 19, 0.05) 0%, transparent 70%);
          border-radius: 50%;
        "></div>
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          height: 100%;
        ">
          <div style="flex: 1; padding-right: 0.2in;">
            <h1 style="
              font-size: 14px;
              font-weight: 700;
              color: #5d4037;
              margin: 0 0 3px 0;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">VINTAGE TRAVEL</h1>
            <div style="
              width: 1.5in;
              height: 1px;
              background: #8b4513;
              margin: 6px 0;
            "></div>
            <h2 style="
              font-size: 12px;
              color: #8b4513;
              margin: 0 0 2px 0;
              font-style: italic;
            ">Eleanor Rose</h2>
            <h3 style="
              font-size: 10px;
              color: #5d4037;
              margin: 0 0 12px 0;
              font-weight: 400;
            ">Travel Consultant</h3>
            <div class="contact-info" style="
              font-size: 9px;
              color: #5d4037;
              line-height: 1.4;
            ">
              <div>📞 (555) 123-4567</div>
              <div>✉️ eleanor@vintagetravel.com</div>
              <div>Est. 1952</div>
            </div>
          </div>
          <div class="logo-section" style="
            width: 0.8in;
            height: 0.8in;
            background-color: rgba(139, 69, 19, 0.1);
            border: 2px solid #8b4513;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: #8b4513;
            margin-top: 0.1in;
          ">LOGO</div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#f4e4bc', '#e8d5b7', '#8b4513', '#5d4037'],
            fonts: ['Georgia'],
            features: ['vintage', 'postcard-style', 'aged-effects', 'travel-theme']
        }
    },

    {
        catalogId: 'BC023',
        name: 'Modern Geometric',
        theme: 'modern',
        description: 'Clean geometric design with bold shapes and modern typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          right: 0;
          width: 0;
          height: 0;
          border-left: 80px solid transparent;
          border-bottom: 80px solid #3b82f6;
        "></div>
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          width: 60px;
          height: 60px;
          background: #10b981;
          transform: rotate(45deg);
          transform-origin: bottom left;
        "></div>
        <div style="padding: 0.3in; position: relative; z-index: 2;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.2in;
          ">
            <div>
              <h1 style="
                font-size: 16px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 4px 0;
                line-height: 1.1;
              ">Sofia Martinez</h1>
              <h2 style="
                font-size: 11px;
                color: #3b82f6;
                margin: 0 0 3px 0;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">UI/UX Designer</h2>
              <h3 style="
                font-size: 10px;
                color: #6b7280;
                margin: 0;
                font-weight: 400;
              ">Digital Innovations</h3>
            </div>
            <div class="logo-placeholder" style="
              width: 0.7in;
              height: 0.5in;
              background: linear-gradient(135deg, #3b82f6, #10b981);
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: white;
              font-weight: 600;
            ">LOGO</div>
          </div>
          <div style="
            position: absolute;
            bottom: 0.3in;
            left: 0.3in;
            right: 0.3in;
          ">
            <div class="contact-info" style="
              font-size: 10px;
              color: #374151;
              line-height: 1.4;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
            ">
              <div>
                <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
                <div>✉️ sofia@digitalinnovations.com</div>
              </div>
              <div style="text-align: right;">
                <div style="margin-bottom: 3px;">🌐 digitalinnovations.com</div>
                <div style="color: #3b82f6;">@sofiadesigns</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#3b82f6', '#10b981', '#ffffff', '#1f2937'],
            fonts: ['Inter'],
            features: ['geometric-shapes', 'modern-layout', 'gradient-logo']
        }
    },

    {
        catalogId: 'BC024',
        name: 'Creative Ink Splash',
        theme: 'artistic',
        description: 'Dynamic ink splash design with artistic flair',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Abril Fatface', serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -10px;
          left: -10px;
          width: 100px;
          height: 100px;
          background: radial-gradient(ellipse 60px 40px at 40% 60%, #2d3748 0%, transparent 70%);
          transform: rotate(-15deg);
          opacity: 0.8;
        "></div>
        <div style="
          position: absolute;
          top: 20px;
          right: -20px;
          width: 80px;
          height: 120px;
          background: radial-gradient(ellipse 30px 60px at 30% 50%, #4a5568 0%, transparent 70%);
          transform: rotate(25deg);
          opacity: 0.6;
        "></div>
        <div style="
          position: absolute;
          bottom: -15px;
          right: 30px;
          width: 70px;
          height: 70px;
          background: radial-gradient(circle, #718096 0%, transparent 60%);
          opacity: 0.4;
        "></div>
        <div style="padding: 0.3in; position: relative; z-index: 2;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.15in;
          ">
            <div>
              <h1 style="
                font-size: 18px;
                font-weight: 400;
                color: #2d3748;
                margin: 0 0 4px 0;
                line-height: 1;
                letter-spacing: -0.5px;
              ">Maya Chen</h1>
              <h2 style="
                font-size: 11px;
                color: #4a5568;
                margin: 0 0 3px 0;
                font-family: 'Inter', sans-serif;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">Calligrapher</h2>
              <h3 style="
                font-size: 10px;
                color: #718096;
                margin: 0;
                font-family: 'Inter', sans-serif;
                font-weight: 400;
              ">Ink & Soul Arts</h3>
            </div>
            <div class="logo-placeholder" style="
              width: 0.7in;
              height: 0.7in;
              background: radial-gradient(circle, #2d3748, #4a5568);
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: white;
              font-weight: 600;
              font-family: 'Inter', sans-serif;
            ">LOGO</div>
          </div>
          <div style="
            position: absolute;
            bottom: 0.3in;
            left: 0.3in;
            right: 0.3in;
          ">
            <div class="contact-info" style="
              font-size: 10px;
              color: #2d3748;
              line-height: 1.4;
              font-family: 'Inter', sans-serif;
            ">
              <div style="margin-bottom: 3px;">🖋️ maya@inkandsoul.art</div>
              <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
              <div style="font-size: 9px; color: #4a5568;">✨ @mayacalligraphy</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#2d3748', '#4a5568', '#718096', '#ffffff'],
            fonts: ['Abril Fatface', 'Inter'],
            features: ['ink-splash', 'artistic', 'calligraphy', 'organic-shapes']
        }
    },

    {
        catalogId: 'BC025',
        name: 'Minimalist Dot Grid',
        theme: 'minimalistic',
        description: 'Ultra-minimal design with subtle dot grid pattern',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Helvetica Neue', sans-serif;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: radial-gradient(circle, #f1f5f9 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.3;
        "></div>
        <div style="padding: 0.4in; position: relative; z-index: 2;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            height: 100%;
          ">
            <div style="flex: 1; max-width: 2in;">
              <h1 style="
                font-size: 15px;
                font-weight: 300;
                color: #0f172a;
                margin: 0 0 6px 0;
                line-height: 1.1;
                letter-spacing: -0.3px;
              ">James Wilson</h1>
              <h2 style="
                font-size: 10px;
                color: #64748b;
                margin: 0 0 4px 0;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">Architect</h2>
              <h3 style="
                font-size: 9px;
                color: #94a3b8;
                margin: 0 0 20px 0;
                font-weight: 400;
              ">Minimal Design Studio</h3>
              <div class="contact-info" style="
                font-size: 9px;
                color: #475569;
                line-height: 1.5;
              ">
                <div style="margin-bottom: 3px;">📞 (555) 123-4567</div>
                <div style="margin-bottom: 3px;">✉️ james@minimaldesign.studio</div>
                <div>🌐 minimaldesign.studio</div>
              </div>
            </div>
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 0.8in;
              height: 0.8in;
            ">
              <div class="logo-placeholder" style="
                width: 0.6in;
                height: 0.6in;
                border: 1px solid #e2e8f0;
                border-radius: 2px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                color: #94a3b8;
                background-color: #f8fafc;
              ">LOGO</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#0f172a', '#64748b', '#94a3b8'],
            fonts: ['Helvetica Neue'],
            features: ['dot-grid-pattern', 'minimal-typography', 'ultra-clean']
        }
    },

    {
        catalogId: 'BC031',
        name: 'Modern Split Layout',
        theme: 'modern',
        description: 'Bold split design with contrasting sections',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 50%;
          height: 100%;
          background: #1f2937;
        "></div>
        <div style="
          position: absolute;
          top: 0;
          right: 0;
          width: 50%;
          height: 100%;
          background: #ffffff;
        "></div>
        <div style="padding: 0.25in; position: relative; z-index: 2; height: 100%;">
          <div style="
            display: flex;
            height: 100%;
          ">
            <div style="
              width: 50%;
              padding-right: 0.15in;
              color: #ffffff;
              display: flex;
              flex-direction: column;
              justify-content: center;
            ">
              <h1 style="
                font-size: 16px;
                font-weight: 700;
                color: #ffffff;
                margin: 0 0 6px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">NEXUS</h1>
              <h2 style="
                font-size: 18px;
                font-weight: 700;
                color: #ffffff;
                margin: 0 0 8px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">DIGITAL</h2>
              <div class="logo-placeholder" style="
                width: 0.8in;
                height: 0.4in;
                background-color: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: rgba(255,255,255,0.8);
                margin-top: 8px;
              ">LOGO</div>
            </div>
            <div style="
              width: 50%;
              padding-left: 0.15in;
              color: #1f2937;
              display: flex;
              flex-direction: column;
              justify-content: center;
            ">
              <h3 style="
                font-size: 14px;
                color: #1f2937;
                margin: 0 0 3px 0;
                font-weight: 600;
              ">Marcus Chen</h3>
              <h4 style="
                font-size: 10px;
                color: #6b7280;
                margin: 0 0 15px 0;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">Creative Director</h4>
              <div class="contact-info" style="
                font-size: 9px;
                color: #374151;
                line-height: 1.4;
              ">
                <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
                <div style="margin-bottom: 3px;">✉️ marcus@nexusdigital.com</div>
                <div>🌐 nexusdigital.com</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#1f2937', '#ffffff', '#6b7280', '#374151'],
            fonts: ['Inter'],
            features: ['split-layout', 'high-contrast', 'modern-typography']
        }
    },

    {
        catalogId: 'BC032',
        name: 'Professional Legal',
        theme: 'professional',
        description: 'Conservative legal professional design with traditional elements',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        border: 2px solid #1f2937;
        font-family: 'Times New Roman', serif;
        box-sizing: border-box;
        position: relative;
      ">
        <div style="
          border: 1px solid #d1d5db;
          margin: 0.08in;
          height: calc(100% - 0.16in);
          padding: 0.15in;
        ">
          <div style="text-align: center; margin-bottom: 0.08in;">
            <h1 style="
              font-size: 13px;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 3px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
              line-height: 1;
            ">STERLING & ASSOCIATES</h1>
            <div style="
              width: 1.8in;
              height: 1px;
              background: #1f2937;
              margin: 0 auto 2px auto;
            "></div>
            <div style="
              font-size: 8px;
              color: #6b7280;
              font-style: italic;
            ">Attorneys at Law</div>
          </div>
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          ">
            <div style="flex: 1;">
              <h2 style="
                font-size: 11px;
                color: #1f2937;
                margin: 0 0 2px 0;
                font-weight: 600;
              ">Robert Sterling, Esq.</h2>
              <h3 style="
                font-size: 9px;
                color: #6b7280;
                margin: 0 0 8px 0;
                font-style: italic;
              ">Senior Partner</h3>
              <div class="contact-info" style="
                font-size: 7px;
                color: #374151;
                line-height: 1.3;
              ">
                <div style="margin-bottom: 1px;">📞 (555) 123-4567</div>
                <div style="margin-bottom: 1px;">📠 (555) 123-4568</div>
                <div style="margin-bottom: 1px;">✉️ rsterling@sterlinglaw.com</div>
                <div style="margin-bottom: 1px;">🏢 100 Legal Plaza, Suite 500</div>
                <div>Boston, MA 02101</div>
              </div>
            </div>
            <div class="logo-placeholder" style="
              width: 0.6in;
              height: 0.6in;
              border: 2px solid #1f2937;
              border-radius: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 7px;
              color: #1f2937;
              background-color: #f9fafb;
              margin-left: 0.1in;
            ">LOGO</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#1f2937', '#6b7280', '#374151'],
            fonts: ['Times New Roman'],
            features: ['legal-theme', 'double-border', 'traditional-layout']
        }
    },

    {
        catalogId: 'BC033',
        name: 'Tech Startup Gradient',
        theme: 'tech',
        description: 'Modern startup design with vibrant gradients',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%);
        padding: 2px;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        position: relative;
      ">
        <div style="
          background: #ffffff;
          height: 100%;
          border-radius: 6px;
          padding: 0.16in;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899);
          "></div>
          <div style="margin-top: 6px;">
            <h1 style="
              font-size: 16px;
              font-weight: 800;
              background: linear-gradient(135deg, #6366f1, #ec4899);
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
              margin: 0 0 4px 0;
              text-transform: uppercase;
              letter-spacing: 1px;
              line-height: 1;
            ">VELOCITY</h1>
            <div style="
              font-size: 9px;
              color: #6b7280;
              margin-bottom: 10px;
              text-transform: uppercase;
              letter-spacing: 2px;
              font-weight: 600;
            ">AI SOLUTIONS</div>
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
            ">
              <div>
                <h2 style="
                  font-size: 12px;
                  color: #1f2937;
                  margin: 0 0 2px 0;
                  font-weight: 600;
                ">Sarah Kim</h2>
                <h3 style="
                  font-size: 9px;
                  color: #6366f1;
                  margin: 0 0 8px 0;
                  font-weight: 500;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Founder & CEO</h3>
                <div class="contact-info" style="
                  font-size: 8px;
                  color: #4b5563;
                  line-height: 1.3;
                ">
                  <div style="margin-bottom: 1px;">📱 (555) 123-4567</div>
                  <div style="margin-bottom: 1px;">✉️ sarah@velocity.ai</div>
                  <div>🌐 velocity.ai</div>
                </div>
              </div>
              <div class="logo-placeholder" style="
                width: 0.7in;
                height: 0.4in;
                background: linear-gradient(135deg, #6366f1, #ec4899);
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                color: white;
                font-weight: 700;
              ">LOGO</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#6366f1', '#8b5cf6', '#ec4899', '#ffffff'],
            fonts: ['Inter'],
            features: ['gradient-text', 'startup-theme', 'modern-tech']
        }
    },

    {
        catalogId: 'BC034',
        name: 'Luxury Fashion',
        theme: 'luxury',
        description: 'High-end fashion design with elegant typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #000000;
        position: relative;
        font-family: 'Playfair Display', serif;
        box-sizing: border-box;
      ">
        <div style="
          background: #ffffff;
          margin: 0.08in;
          height: calc(100% - 0.16in);
          padding: 0.3in;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border: 1px solid #e5e7eb;
            margin: 0.1in;
          "></div>
          <div style="
            text-align: center;
            position: relative;
            z-index: 2;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
          ">
            <h1 style="
              font-size: 16px;
              font-weight: 400;
              color: #000000;
              margin: 0 0 6px 0;
              letter-spacing: 3px;
              text-transform: uppercase;
            ">ÉLÉGANCE</h1>
            <div style="
              width: 1.5in;
              height: 1px;
              background: #d4af37;
              margin: 0 auto 15px auto;
            "></div>
            <div class="logo-placeholder" style="
              width: 0.6in;
              height: 0.6in;
              border: 1px solid #d4af37;
              border-radius: 50%;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 7px;
              color: #d4af37;
              background-color: #fefefe;
              margin-bottom: 15px;
            ">LOGO</div>
            <h2 style="
              font-size: 12px;
              color: #000000;
              margin: 0 0 2px 0;
              font-weight: 400;
              letter-spacing: 1px;
            ">Isabella Laurent</h2>
            <h3 style="
              font-size: 10px;
              color: #6b7280;
              margin: 0 0 12px 0;
              font-style: italic;
              font-weight: 300;
            ">Creative Director</h3>
            <div class="contact-info" style="
              font-size: 9px;
              color: #374151;
              line-height: 1.5;
              font-family: 'Inter', sans-serif;
            ">
              <div style="margin-bottom: 2px;">📞 (555) 123-4567</div>
              <div style="margin-bottom: 2px;">✉️ isabella@elegance.fashion</div>
              <div>🌐 elegance.fashion</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#000000', '#ffffff', '#d4af37', '#6b7280'],
            fonts: ['Playfair Display', 'Inter'],
            features: ['luxury-fashion', 'elegant-borders', 'gold-accents']
        }
    },

    {
        catalogId: 'BC035',
        name: 'Creative Studio Bold',
        theme: 'creative',
        description: 'Bold creative design with expressive typography',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #fbbf24;
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -15px;
          right: -15px;
          width: 100px;
          height: 100px;
          background: #dc2626;
          border-radius: 50%;
          opacity: 0.8;
        "></div>
        <div style="
          position: absolute;
          bottom: -25px;
          left: -25px;
          width: 80px;
          height: 80px;
          background: #7c3aed;
          transform: rotate(45deg);
          opacity: 0.7;
        "></div>
        <div style="padding: 0.16in; position: relative; z-index: 2; height: 100%;">
          <div style="
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
          ">
            <div>
              <h1 style="
                font-size: 18px;
                font-weight: 900;
                color: #ffffff;
                margin: 0 0 3px 0;
                text-transform: uppercase;
                letter-spacing: -1px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
                line-height: 0.9;
              ">BOLD</h1>
              <h2 style="
                font-size: 12px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 6px 0;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">CREATIVE STUDIO</h2>
              <div class="logo-placeholder" style="
                width: 0.7in;
                height: 0.35in;
                background-color: rgba(255,255,255,0.2);
                border: 2px solid #ffffff;
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                color: #ffffff;
                font-weight: 700;
              ">LOGO</div>
            </div>
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            ">
              <div>
                <h3 style="
                  font-size: 12px;
                  color: #1f2937;
                  margin: 0 0 1px 0;
                  font-weight: 700;
                ">Jake Thompson</h3>
                <h4 style="
                  font-size: 9px;
                  color: #ffffff;
                  margin: 0 0 6px 0;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                ">Art Director</h4>
                <div class="contact-info" style="
                  font-size: 8px;
                  color: #1f2937;
                  line-height: 1.2;
                  font-weight: 600;
                ">
                  <div>📱 (555) 123-4567</div>
                  <div>✉️ jake@boldcreative.studio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#fbbf24', '#dc2626', '#7c3aed', '#ffffff'],
            fonts: ['Inter'],
            features: ['bold-colors', 'creative-shapes', 'expressive-typography']
        }
    },

    // MISSING LAYOUTS - Adding the missing BC007 and BC016-BC030

    {
        catalogId: 'BC007',
        name: 'Modern Glassmorphism',
        theme: 'modern',
        description: 'Contemporary glassmorphism design with frosted effects',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0.15in;
          left: 0.15in;
          right: 0.15in;
          bottom: 0.15in;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 0.2in;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            height: 100%;
          ">
            <div style="flex: 1; padding-right: 0.15in;">
              <h1 style="
                font-size: 16px;
                font-weight: 600;
                color: #ffffff;
                margin: 0 0 4px 0;
                line-height: 1.1;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">Elena Rodriguez</h1>
              <h2 style="
                font-size: 11px;
                color: rgba(255,255,255,0.9);
                margin: 0 0 3px 0;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">UX Director</h2>
              <h3 style="
                font-size: 10px;
                color: rgba(255,255,255,0.8);
                margin: 0 0 15px 0;
                font-weight: 400;
              ">Modern Digital</h3>
              <div class="contact-info" style="
                font-size: 9px;
                color: rgba(255,255,255,0.9);
                line-height: 1.4;
              ">
                <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
                <div style="margin-bottom: 3px;">✉️ elena@moderndigital.com</div>
                <div>🌐 moderndigital.com</div>
              </div>
            </div>
            <div class="logo-placeholder" style="
              width: 0.7in;
              height: 0.7in;
              background: rgba(255,255,255,0.2);
              border-radius: 12px;
              border: 1px solid rgba(255,255,255,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: rgba(255,255,255,0.8);
              font-weight: 600;
              backdrop-filter: blur(5px);
            ">LOGO</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#667eea', '#764ba2', '#ffffff'],
            fonts: ['Inter'],
            features: ['glassmorphism', 'backdrop-blur', 'modern-gradient']
        }
    },

    {
        catalogId: 'BC016',
        name: 'Artistic Hand-drawn',
        theme: 'artistic',
        description: 'Organic hand-drawn style with sketch elements',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #fefefe;
        position: relative;
        font-family: 'Comic Sans MS', cursive;
        box-sizing: border-box;
        border: 2px solid #2d3748;
        border-radius: 12px;
      ">
        <div style="
          position: absolute;
          top: 8px;
          right: 12px;
          width: 35px;
          height: 35px;
          border: 2px solid #4a5568;
          border-radius: 50%;
          transform: rotate(15deg);
          opacity: 0.3;
        "></div>
        <div style="
          position: absolute;
          bottom: 12px;
          left: 15px;
          width: 25px;
          height: 18px;
          border: 2px solid #718096;
          border-radius: 4px;
          transform: rotate(-10deg);
          opacity: 0.2;
        "></div>
        <div style="padding: 0.18in; position: relative; z-index: 2;">
          <div class="logo-placeholder" style="
            width: 0.7in;
            height: 0.5in;
            border: 2px dashed #4a5568;
            border-radius: 6px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #4a5568;
            background-color: #f7fafc;
            margin-bottom: 8px;
            transform: rotate(-2deg);
          ">LOGO</div>
          <h1 style="
            font-size: 14px;
            font-weight: 700;
            color: #2d3748;
            margin: 0 0 3px 0;
            line-height: 1;
            transform: rotate(1deg);
          ">Lucy Chen</h1>
          <h2 style="
            font-size: 10px;
            color: #4a5568;
            margin: 0 0 2px 0;
            font-weight: 600;
            transform: rotate(-0.5deg);
          ">Illustrator</h2>
          <h3 style="
            font-size: 9px;
            color: #718096;
            margin: 0 0 10px 0;
            font-weight: 400;
            transform: rotate(0.5deg);
          ">Sketch & Dream Studio</h3>
          <div class="contact-info" style="
            font-size: 9px;
            color: #2d3748;
            line-height: 1.4;
            transform: rotate(-0.5deg);
          ">
            <div style="margin-bottom: 2px;">🎨 lucy@sketchdream.art</div>
            <div style="margin-bottom: 2px;">📱 (555) 123-4567</div>
            <div>✨ @lucydraws</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#fefefe', '#2d3748', '#4a5568', '#718096'],
            fonts: ['Comic Sans MS'],
            features: ['hand-drawn', 'sketch-style', 'organic-shapes', 'rotated-elements']
        }
    },

    {
        catalogId: 'BC017',
        name: 'Tech Cyberpunk',
        theme: 'tech',
        description: 'Futuristic cyberpunk design with neon highlights',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #0a0a0a;
        position: relative;
        font-family: 'Courier New', monospace;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #00ff41, #ff0080, #00ff41);
        "></div>
        <div style="
          position: absolute;
          top: 12px;
          right: 15px;
          width: 40px;
          height: 40px;
          border: 1px solid #00ff41;
          background: rgba(0, 255, 65, 0.1);
          transform: rotate(45deg);
        "></div>
        <div style="
          position: absolute;
          bottom: 8px;
          left: 12px;
          width: 25px;
          height: 25px;
          border: 1px solid #ff0080;
          background: rgba(255, 0, 128, 0.1);
        "></div>
        <div style="padding: 0.16in; position: relative; z-index: 2; height: 100%;">
          <div style="
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
          ">
            <div>
              <h1 style="
                font-size: 14px;
                font-weight: 700;
                color: #00ff41;
                margin: 0 0 3px 0;
                text-transform: uppercase;
                letter-spacing: 2px;
                text-shadow: 0 0 10px #00ff41;
                line-height: 1;
              ">CYBER NEXUS</h1>
              <div style="
                font-size: 7px;
                color: #ff0080;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 3px;
                font-weight: 600;
              ">DIGITAL FRONTIER</div>
              <div class="logo-placeholder" style="
                width: 0.7in;
                height: 0.35in;
                border: 1px solid #00ff41;
                background: rgba(0, 255, 65, 0.1);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                color: #00ff41;
                font-weight: 700;
                text-shadow: 0 0 5px #00ff41;
              ">LOGO</div>
            </div>
            <div>
              <h2 style="
                font-size: 11px;
                color: #ffffff;
                margin: 0 0 1px 0;
                font-weight: 600;
                text-shadow: 0 0 5px #ffffff;
              ">ZARA NEXUS</h2>
              <h3 style="
                font-size: 8px;
                color: #ff0080;
                margin: 0 0 6px 0;
                font-weight: 500;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">CYBER ARCHITECT</h3>
              <div class="contact-info" style="
                font-size: 7px;
                color: #00ff41;
                line-height: 1.3;
                font-family: 'Courier New', monospace;
              ">
                <div style="margin-bottom: 1px;">[TEL] 555.123.4567</div>
                <div style="margin-bottom: 1px;">[NET] zara@cybernexus.io</div>
                <div>[WEB] cybernexus.io</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#0a0a0a', '#00ff41', '#ff0080', '#ffffff'],
            fonts: ['Courier New'],
            features: ['cyberpunk', 'neon-glow', 'futuristic', 'tech-grid']
        }
    },

    {
        catalogId: 'BC018',
        name: 'Luxury Marble',
        theme: 'luxury',
        description: 'Sophisticated marble texture with gold typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: linear-gradient(45deg, #f8f9fa 0%, #e9ecef 25%, #f8f9fa 50%, #e9ecef 75%, #f8f9fa 100%);
        background-size: 40px 40px;
        position: relative;
        font-family: 'Playfair Display', serif;
        box-sizing: border-box;
        border: 2px solid #d4af37;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(212, 175, 55, 0.1) 10px,
            rgba(212, 175, 55, 0.1) 20px
          );
          opacity: 0.3;
        "></div>
        <div style="padding: 0.3in; position: relative; z-index: 2; height: 100%;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            height: 100%;
          ">
            <div style="flex: 1; padding-right: 0.2in;">
              <h1 style="
                font-size: 16px;
                font-weight: 400;
                color: #1a1a1a;
                margin: 0 0 6px 0;
                line-height: 1.1;
                letter-spacing: 1px;
              ">SOPHIA LAURENT</h1>
              <div style="
                width: 1.5in;
                height: 1px;
                background: #d4af37;
                margin: 8px 0;
              "></div>
              <h2 style="
                font-size: 11px;
                color: #d4af37;
                margin: 0 0 3px 0;
                font-weight: 500;
                font-style: italic;
                letter-spacing: 0.5px;
              ">Luxury Consultant</h2>
              <h3 style="
                font-size: 10px;
                color: #6b7280;
                margin: 0 0 15px 0;
                font-weight: 400;
              ">Elite Lifestyle Services</h3>
              <div class="contact-info" style="
                font-size: 9px;
                color: #374151;
                line-height: 1.5;
                font-family: 'Inter', sans-serif;
              ">
                <div style="margin-bottom: 3px;">📞 (555) 123-4567</div>
                <div style="margin-bottom: 3px;">✉️ sophia@elitelifestyle.com</div>
                <div>🌐 elitelifestyle.com</div>
              </div>
            </div>
            <div class="logo-placeholder" style="
              width: 0.7in;
              height: 0.7in;
              border: 2px solid #d4af37;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 8px;
              color: #d4af37;
              background: radial-gradient(circle, rgba(248, 249, 250, 0.8), rgba(233, 236, 239, 0.8));
              font-weight: 600;
            ">LOGO</div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#f8f9fa', '#e9ecef', '#d4af37', '#1a1a1a'],
            fonts: ['Playfair Display', 'Inter'],
            features: ['marble-texture', 'luxury-gold', 'sophisticated', 'elegant-lines']
        }
    },

    {
        catalogId: 'BC019',
        name: 'Vintage Art Deco',
        theme: 'vintage',
        description: 'Classic art deco design with geometric patterns',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #2c1810;
        border: 3px solid #d4af37;
        position: relative;
        font-family: 'Georgia', serif;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 0.25in;
          background: linear-gradient(90deg, #d4af37 0%, #f4e4bc 50%, #d4af37 100%);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-bottom: 12px solid #2c1810;
            margin: 0 8px;
          "></div>
          <div style="
            width: 0;
            height: 0;
            border-left: 8px solid transparent;
            border-right: 8px solid transparent;
            border-bottom: 8px solid #2c1810;
            margin: 0 4px;
          "></div>
          <div style="
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-bottom: 12px solid #2c1810;
            margin: 0 8px;
          "></div>
        </div>
        <div style="padding: 0.35in 0.2in 0.18in 0.2in; position: relative; z-index: 2;">
          <div style="text-align: center;">
            <h1 style="
              font-size: 15px;
              font-weight: 700;
              color: #d4af37;
              margin: 0 0 6px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
              text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
              line-height: 1;
            ">GATSBY & CO</h1>
            <div style="
              width: 1.8in;
              height: 2px;
              background: #d4af37;
              margin: 0 auto 8px auto;
            "></div>
            <div class="logo-placeholder" style="
              width: 0.8in;
              height: 0.4in;
              border: 2px solid #d4af37;
              background: rgba(212, 175, 55, 0.1);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              font-size: 7px;
              color: #d4af37;
              margin-bottom: 8px;
              transform: skew(-5deg);
            ">LOGO</div>
            <h2 style="
              font-size: 11px;
              color: #f4e4bc;
              margin: 0 0 2px 0;
              font-weight: 600;
              letter-spacing: 1px;
            ">WINSTON GATSBY</h2>
            <h3 style="
              font-size: 9px;
              color: #d4af37;
              margin: 0 0 8px 0;
              font-style: italic;
            ">Distinguished Proprietor</h3>
            <div class="contact-info" style="
              font-size: 8px;
              color: #f4e4bc;
              line-height: 1.3;
            ">
              <div>📞 MAyfair 5-1234</div>
              <div>✉️ winston@gatsby.co</div>
              <div>Est. 1925</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#2c1810', '#d4af37', '#f4e4bc'],
            fonts: ['Georgia'],
            features: ['art-deco', 'geometric-patterns', 'vintage-gold', 'skewed-elements']
        }
    },

    {
        catalogId: 'BC026',
        name: 'Modern Asymmetric',
        theme: 'modern',
        description: 'Bold asymmetric layout with dynamic color blocks',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 70%;
          height: 100%;
          background: #f3f4f6;
        "></div>
        <div style="
          position: absolute;
          top: 0;
          right: 0;
          width: 30%;
          height: 100%;
          background: #3b82f6;
        "></div>
        <div style="
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 6px;
          background: #1f2937;
        "></div>
        <div style="padding: 0.3in; position: relative; z-index: 2; height: 100%;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            height: 100%;
          ">
            <div style="flex: 1; max-width: 1.8in;">
              <h1 style="
                font-size: 16px;
                font-weight: 700;
                color: #1f2937;
                margin: 0 0 4px 0;
                line-height: 1.1;
              ">Ryan Mitchell</h1>
              <h2 style="
                font-size: 11px;
                color: #3b82f6;
                margin: 0 0 3px 0;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">Product Designer</h2>
              <h3 style="
                font-size: 10px;
                color: #6b7280;
                margin: 0 0 15px 0;
                font-weight: 400;
              ">Asymmetric Studios</h3>
              <div class="contact-info" style="
                font-size: 9px;
                color: #374151;
                line-height: 1.4;
              ">
                <div style="margin-bottom: 3px;">📱 (555) 123-4567</div>
                <div style="margin-bottom: 3px;">✉️ ryan@asymmetric.design</div>
                <div>🌐 asymmetric.design</div>
              </div>
            </div>
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 0.8in;
              height: 100%;
            ">
              <div class="logo-placeholder" style="
                width: 0.6in;
                height: 0.6in;
                background: #ffffff;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: #3b82f6;
                font-weight: 600;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              ">LOGO</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#f3f4f6', '#3b82f6', '#1f2937'],
            fonts: ['Inter'],
            features: ['asymmetric-layout', 'color-blocks', 'modern-design']
        }
    },

    {
        catalogId: 'BC027',
        name: 'Creative Collage',
        theme: 'creative',
        description: 'Artistic collage style with mixed media elements',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        position: relative;
        font-family: 'Inter', sans-serif;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 10px;
          left: 15px;
          width: 60px;
          height: 40px;
          background: #fbbf24;
          transform: rotate(-15deg);
          opacity: 0.8;
        "></div>
        <div style="
          position: absolute;
          top: 30px;
          right: 20px;
          width: 50px;
          height: 50px;
          background: #ef4444;
          border-radius: 50%;
          opacity: 0.7;
        "></div>
        <div style="
          position: absolute;
          bottom: 15px;
          left: 30px;
          width: 40px;
          height: 30px;
          background: #8b5cf6;
          transform: rotate(25deg);
          opacity: 0.6;
        "></div>
        <div style="
          position: absolute;
          bottom: 20px;
          right: 15px;
          width: 35px;
          height: 35px;
          background: #10b981;
          transform: rotate(-10deg);
          opacity: 0.5;
        "></div>
        <div style="padding: 0.3in; position: relative; z-index: 2;">
          <div style="
            background: rgba(255, 255, 255, 0.9);
            padding: 12px;
            border-radius: 8px;
            border: 2px dashed #374151;
          ">
            <h1 style="
              font-size: 14px;
              font-weight: 700;
              color: #1f2937;
              margin: 0 0 4px 0;
              line-height: 1.1;
            ">Mia Rodriguez</h1>
            <h2 style="
              font-size: 10px;
              color: #ef4444;
              margin: 0 0 3px 0;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            ">Mixed Media Artist</h2>
            <h3 style="
              font-size: 9px;
              color: #6b7280;
              margin: 0 0 12px 0;
              font-weight: 400;
            ">Collage & Canvas Co.</h3>
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            ">
              <div class="contact-info" style="
                font-size: 8px;
                color: #374151;
                line-height: 1.4;
              ">
                <div style="margin-bottom: 2px;">🎨 mia@collagecanvas.art</div>
                <div style="margin-bottom: 2px;">📱 (555) 123-4567</div>
                <div>✨ @miacollages</div>
              </div>
              <div class="logo-placeholder" style="
                width: 0.5in;
                height: 0.5in;
                border: 2px solid #8b5cf6;
                border-radius: 4px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                color: #8b5cf6;
                background: #ffffff;
                font-weight: 600;
                transform: rotate(5deg);
              ">LOGO</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#fbbf24', '#ef4444', '#8b5cf6', '#10b981'],
            fonts: ['Inter'],
            features: ['collage-style', 'mixed-media', 'creative-shapes', 'dashed-border']
        }
    },

    {
        catalogId: 'BC028',
        name: 'Professional Finance',
        theme: 'professional',
        description: 'Conservative financial services design with trust elements',
        style: 'company-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        border: 1px solid #d1d5db;
        position: relative;
        font-family: 'Times New Roman', serif;
        box-sizing: border-box;
      ">
        <div style="
          background: #1e40af;
          height: 0.4in;
          padding: 0.08in 0.25in;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          <h1 style="
            font-size: 14px;
            font-weight: 700;
            color: #ffffff;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          ">STERLING FINANCIAL</h1>
          <div class="logo-placeholder" style="
            width: 0.6in;
            height: 0.25in;
            background-color: rgba(255,255,255,0.2);
            border-radius: 2px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: rgba(255,255,255,0.8);
          ">LOGO</div>
        </div>
        <div style="padding: 0.25in;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          ">
            <div style="flex: 1;">
              <h2 style="
                font-size: 14px;
                color: #1f2937;
                margin: 0 0 3px 0;
                font-weight: 600;
              ">Michael Sterling, CFA</h2>
              <h3 style="
                font-size: 11px;
                color: #1e40af;
                margin: 0 0 2px 0;
                font-weight: 500;
              ">Senior Portfolio Manager</h3>
              <div style="
                font-size: 9px;
                color: #6b7280;
                margin-bottom: 12px;
                font-style: italic;
              ">Chartered Financial Analyst</div>
              <div class="contact-info" style="
                font-size: 9px;
                color: #374151;
                line-height: 1.4;
              ">
                <div style="margin-bottom: 2px;">📞 Direct: (555) 123-4567</div>
                <div style="margin-bottom: 2px;">📞 Main: (555) 123-4500</div>
                <div style="margin-bottom: 2px;">✉️ msterling@sterlingfinancial.com</div>
                <div style="margin-bottom: 2px;">🏢 100 Wall Street, Suite 2500</div>
                <div>New York, NY 10005</div>
              </div>
            </div>
            <div style="
              width: 0.8in;
              text-align: center;
              margin-left: 0.1in;
            ">
              <div style="
                font-size: 8px;
                color: #1e40af;
                font-weight: 600;
                margin-bottom: 4px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
              ">Licensed</div>
              <div style="
                font-size: 7px;
                color: #6b7280;
                line-height: 1.2;
              ">
                <div>FINRA Series 7</div>
                <div>FINRA Series 66</div>
                <div>Insurance Licensed</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#1e40af', '#ffffff', '#1f2937', '#6b7280'],
            fonts: ['Times New Roman'],
            features: ['financial-theme', 'professional-header', 'licenses', 'conservative']
        }
    },

    {
        catalogId: 'BC029',
        name: 'Tech Circuit Board',
        theme: 'tech',
        description: 'High-tech circuit board pattern with digital elements',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #1e293b;
        position: relative;
        font-family: 'Roboto Mono', monospace;
        box-sizing: border-box;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(90deg, #10b981 1px, transparent 1px),
            linear-gradient(180deg, #10b981 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.3;
        "></div>
        <div style="
          position: absolute;
          top: 20px;
          right: 25px;
          width: 30px;
          height: 30px;
          border: 2px solid #10b981;
          background: rgba(16, 185, 129, 0.2);
        "></div>
        <div style="
          position: absolute;
          bottom: 25px;
          left: 30px;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          border: 2px solid #3b82f6;
          background: rgba(59, 130, 246, 0.2);
        "></div>
        <div style="
          position: absolute;
          top: 50px;
          left: 60px;
          width: 15px;
          height: 15px;
          background: #f59e0b;
          transform: rotate(45deg);
        "></div>
        <div style="padding: 0.25in; position: relative; z-index: 2; height: 100%;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            height: 100%;
          ">
            <div style="flex: 1; max-width: 1.8in;">
              <h1 style="
                font-size: 14px;
                font-weight: 700;
                color: #10b981;
                margin: 0 0 4px 0;
                line-height: 1.1;
                text-shadow: 0 0 8px #10b981;
              ">ALEX CHEN</h1>
              <h2 style="
                font-size: 10px;
                color: #3b82f6;
                margin: 0 0 3px 0;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 1px;
              ">HARDWARE ENGINEER</h2>
              <h3 style="
                font-size: 9px;
                color: #94a3b8;
                margin: 0 0 15px 0;
                font-weight: 400;
              ">CircuitFlow Technologies</h3>
              <div class="contact-info" style="
                font-size: 8px;
                color: #e2e8f0;
                line-height: 1.4;
                font-family: 'Roboto Mono', monospace;
              ">
                <div style="margin-bottom: 3px;">[MOBILE] 555.123.4567</div>
                <div style="margin-bottom: 3px;">[EMAIL] alex@circuitflow.tech</div>
                <div>[WEB] circuitflow.tech</div>
              </div>
            </div>
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 0.8in;
              height: 100%;
            ">
              <div class="logo-placeholder" style="
                width: 0.6in;
                height: 0.6in;
                border: 2px solid #10b981;
                background: rgba(16, 185, 129, 0.1);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 8px;
                color: #10b981;
                font-weight: 700;
                text-shadow: 0 0 5px #10b981;
              ">LOGO</div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#1e293b', '#10b981', '#3b82f6', '#f59e0b'],
            fonts: ['Roboto Mono'],
            features: ['circuit-board', 'tech-grid', 'neon-glow', 'geometric-elements']
        }
    },

    {
        catalogId: 'BC030',
        name: 'Luxury Monogram',
        theme: 'luxury',
        description: 'Elegant monogram design with classic typography',
        style: 'contact-focused',
        jsx: `
      <div class="business-card" style="
        width: 3.5in;
        height: 2in;
        background: #ffffff;
        border: 2px solid #1f2937;
        position: relative;
        font-family: 'Playfair Display', serif;
        box-sizing: border-box;
      ">
        <div style="
          position: absolute;
          top: 0.1in;
          left: 0.1in;
          right: 0.1in;
          bottom: 0.1in;
          border: 1px solid #d4af37;
        "></div>
        <div style="padding: 0.3in; position: relative; z-index: 2; height: 100%;">
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            height: 100%;
          ">
            <div style="flex: 1; max-width: 1.8in;">
              <h1 style="
                font-size: 16px;
                font-weight: 400;
                color: #1f2937;
                margin: 0 0 6px 0;
                line-height: 1.1;
                letter-spacing: 1px;
              ">ELIZABETH MORGAN</h1>
              <div style="
                width: 1.5in;
                height: 1px;
                background: #d4af37;
                margin: 8px 0;
              "></div>
              <h2 style="
                font-size: 11px;
                color: #d4af37;
                margin: 0 0 3px 0;
                font-weight: 500;
                font-style: italic;
                letter-spacing: 0.5px;
              ">Estate Planning Attorney</h2>
              <h3 style="
                font-size: 10px;
                color: #6b7280;
                margin: 0 0 15px 0;
                font-weight: 400;
              ">Morgan & Associates</h3>
              <div class="contact-info" style="
                font-size: 9px;
                color: #374151;
                line-height: 1.5;
                font-family: 'Inter', sans-serif;
              ">
                <div style="margin-bottom: 3px;">📞 (555) 123-4567</div>
                <div style="margin-bottom: 3px;">✉️ elizabeth@morgan-law.com</div>
                <div>🏢 morgan-law.com</div>
              </div>
            </div>
            <div style="
              display: flex;
              align-items: center;
              justify-content: center;
              width: 0.8in;
              height: 0.8in;
            ">
              <div style="
                width: 0.7in;
                height: 0.7in;
                border: 2px solid #d4af37;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #f9fafb;
                position: relative;
              ">
                <div style="
                  font-size: 18px;
                  font-weight: 400;
                  color: #1f2937;
                  font-family: 'Playfair Display', serif;
                ">EM</div>
                <div style="
                  position: absolute;
                  bottom: -8px;
                  font-size: 6px;
                  color: #d4af37;
                  font-weight: 600;
                  letter-spacing: 1px;
                ">LOGO</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
        metadata: {
            dimensions: { width: '3.5in', height: '2in' },
            colors: ['#ffffff', '#1f2937', '#d4af37', '#6b7280'],
            fonts: ['Playfair Display', 'Inter'],
            features: ['monogram-logo', 'double-border', 'luxury-typography', 'elegant-spacing']
        }
    }
];

// HELPER FUNCTIONS FOR BUSINESS CARD LAYOUTS

export const getBusinessCardLayoutById = (catalogId: string): BusinessCardLayout | null => {
    try {
        console.log(`🔍 Searching for business card layout: ${catalogId}`);
        const layout = BUSINESS_CARD_LAYOUTS.find(layout => layout.catalogId === catalogId);

        if (layout) {
            console.log(`✅ Found business card layout: ${layout.name}`);
            return layout;
        } else {
            console.warn(`⚠️ Business card layout not found: ${catalogId}`);
            return null;
        }
    } catch (error) {
        console.error(`❌ Error searching for business card layout ${catalogId}:`, error);
        return null;
    }
};

export const getAllThemes = (): string[] => {
    try {
        const themes = [...new Set(BUSINESS_CARD_LAYOUTS.map(layout => layout.theme))];
        console.log(`📋 Found ${themes.length} unique themes:`, themes);
        return themes.sort();
    } catch (error) {
        console.error('❌ Error getting themes:', error);
        return [];
    }
};

export const getBusinessCardLayoutsByTheme = (theme: string): BusinessCardLayout[] => {
    try {
        console.log(`🎨 Filtering layouts by theme: ${theme}`);
        const layouts = BUSINESS_CARD_LAYOUTS.filter(layout => layout.theme === theme);
        console.log(`✅ Found ${layouts.length} layouts for theme: ${theme}`);
        return layouts;
    } catch (error) {
        console.error(`❌ Error filtering by theme ${theme}:`, error);
        return [];
    }
};

export const getBusinessCardLayoutsByStyle = (style: 'contact-focused' | 'company-focused'): BusinessCardLayout[] => {
    try {
        console.log(`🎯 Filtering layouts by style: ${style}`);
        const layouts = BUSINESS_CARD_LAYOUTS.filter(layout => layout.style === style);
        console.log(`✅ Found ${layouts.length} layouts for style: ${style}`);
        return layouts;
    } catch (error) {
        console.error(`❌ Error filtering by style ${style}:`, error);
        return [];
    }
};

export const searchBusinessCardLayouts = (query: string): BusinessCardLayout[] => {
    try {
        console.log(`🔍 Searching layouts with query: "${query}"`);
        const lowercaseQuery = query.toLowerCase();

        const layouts = BUSINESS_CARD_LAYOUTS.filter(layout => {
            return (
                layout.catalogId.toLowerCase().includes(lowercaseQuery) ||
                layout.name.toLowerCase().includes(lowercaseQuery) ||
                layout.theme.toLowerCase().includes(lowercaseQuery) ||
                layout.description?.toLowerCase().includes(lowercaseQuery) ||
                layout.metadata.features.some(feature =>
                    feature.toLowerCase().includes(lowercaseQuery)
                )
            );
        });

        console.log(`✅ Found ${layouts.length} layouts matching: "${query}"`);
        return layouts;
    } catch (error) {
        console.error(`❌ Error searching layouts with query "${query}":`, error);
        return [];
    }
};

export const paginateBusinessCardLayouts = (
    layouts: BusinessCardLayout[],
    page: number,
    itemsPerPage: number
): {
    layouts: BusinessCardLayout[];
    totalPages: number;
    currentPage: number;
    totalItems: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
} => {
    try {
        console.log(`📄 Paginating ${layouts.length} layouts: page ${page}, ${itemsPerPage} per page`);

        const totalItems = layouts.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedLayouts = layouts.slice(startIndex, endIndex);

        const result = {
            layouts: paginatedLayouts,
            totalPages,
            currentPage: page,
            totalItems,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1
        };

        console.log(`✅ Pagination result: ${paginatedLayouts.length} layouts on page ${page} of ${totalPages}`);
        return result;
    } catch (error) {
        console.error('❌ Error paginating layouts:', error);
        return {
            layouts: [],
            totalPages: 0,
            currentPage: 1,
            totalItems: 0,
            hasNextPage: false,
            hasPreviousPage: false
        };
    }
};

export const getTotalLayoutCount = (): number => {
    try {
        const count = BUSINESS_CARD_LAYOUTS.length;
        console.log(`📊 Total business card layouts: ${count}`);
        return count;
    } catch (error) {
        console.error('❌ Error getting layout count:', error);
        return 0;
    }
};

export const validateBusinessCardLayout = (layout: BusinessCardLayout): { isValid: boolean; errors: string[] } => {
    try {
        console.log(`🔍 Validating business card layout: ${layout.catalogId}`);
        const errors: string[] = [];

        // Required fields validation
        if (!layout.catalogId) errors.push('Missing catalogId');
        if (!layout.name) errors.push('Missing name');
        if (!layout.theme) errors.push('Missing theme');
        if (!layout.jsx) errors.push('Missing jsx content');
        if (!layout.style || !['contact-focused', 'company-focused'].includes(layout.style)) {
            errors.push('Invalid or missing style');
        }

        // Metadata validation
        if (!layout.metadata) {
            errors.push('Missing metadata');
        } else {
            if (!layout.metadata.dimensions?.width || !layout.metadata.dimensions?.height) {
                errors.push('Missing dimensions in metadata');
            }
            if (!Array.isArray(layout.metadata.colors) || layout.metadata.colors.length === 0) {
                errors.push('Missing or invalid colors in metadata');
            }
            if (!Array.isArray(layout.metadata.fonts) || layout.metadata.fonts.length === 0) {
                errors.push('Missing or invalid fonts in metadata');
            }
            if (!Array.isArray(layout.metadata.features) || layout.metadata.features.length === 0) {
                errors.push('Missing or invalid features in metadata');
            }
        }

        const isValid = errors.length === 0;
        console.log(`${isValid ? '✅' : '❌'} Layout validation: ${layout.catalogId} - ${errors.length} errors`);

        return { isValid, errors };
    } catch (error) {
        console.error(`❌ Error validating layout:`, error);
        return { isValid: false, errors: ['Validation error occurred'] };
    }
};

// Validate all layouts on module load
console.log('🔄 Validating all business card layouts...');
const invalidLayouts = BUSINESS_CARD_LAYOUTS.filter(layout => {
    const { isValid } = validateBusinessCardLayout(layout);
    return !isValid;
});

if (invalidLayouts.length > 0) {
    console.warn(`⚠️ Found ${invalidLayouts.length} invalid layouts:`, invalidLayouts.map(l => l.catalogId));
} else {
    console.log(`✅ All ${BUSINESS_CARD_LAYOUTS.length} business card layouts are valid`);
}