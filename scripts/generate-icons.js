const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate icons
function generateIcons() {
  console.log('Generating PWA icons...');
  
  iconSizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Create a gradient background
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#6366f1');
    gradient.addColorStop(1, '#4f46e5');
    
    // Fill the background
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Draw a white circle
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(size / 2, size * 0.4, size * 0.25, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw a line
    ctx.strokeStyle = 'white';
    ctx.lineWidth = size * 0.05;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    ctx.moveTo(size * 0.3, size * 0.6);
    ctx.lineTo(size * 0.45, size * 0.75);
    ctx.lineTo(size * 0.55, size * 0.65);
    ctx.lineTo(size * 0.7, size * 0.8);
    ctx.stroke();
    
    // Add text
    if (size >= 144) {
      ctx.fillStyle = 'white';
      ctx.font = `bold ${size * 0.15}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('LOGO', size / 2, size * 0.87);
    }
    
    // Save the icon
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(iconsDir, `icon-${size}x${size}.png`), buffer);
    console.log(`Generated icon-${size}x${size}.png`);
  });
  
  // Create a maskable icon
  const maskableSize = 192;
  const maskableCanvas = createCanvas(maskableSize, maskableSize);
  const maskableCtx = maskableCanvas.getContext('2d');
  
  // For maskable icons, ensure important content is inside safe zone
  // Use solid color
  maskableCtx.fillStyle = '#6366f1';
  maskableCtx.fillRect(0, 0, maskableSize, maskableSize);
  
  // Draw logo in safe zone (central 80%)
  const safeInset = maskableSize * 0.1;
  const safeSize = maskableSize * 0.8;
  
  // Circle
  maskableCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  maskableCtx.beginPath();
  maskableCtx.arc(
    maskableSize / 2, 
    maskableSize * 0.4, 
    maskableSize * 0.2, 
    0, 
    Math.PI * 2
  );
  maskableCtx.fill();
  
  // Line
  maskableCtx.strokeStyle = 'white';
  maskableCtx.lineWidth = maskableSize * 0.05;
  maskableCtx.lineCap = 'round';
  maskableCtx.lineJoin = 'round';
  
  maskableCtx.beginPath();
  maskableCtx.moveTo(maskableSize * 0.35, maskableSize * 0.6);
  maskableCtx.lineTo(maskableSize * 0.45, maskableSize * 0.7);
  maskableCtx.lineTo(maskableSize * 0.55, maskableSize * 0.65);
  maskableCtx.lineTo(maskableSize * 0.65, maskableSize * 0.75);
  maskableCtx.stroke();
  
  // Text
  maskableCtx.fillStyle = 'white';
  maskableCtx.font = `bold ${maskableSize * 0.15}px Arial`;
  maskableCtx.textAlign = 'center';
  maskableCtx.textBaseline = 'middle';
  maskableCtx.fillText('LOGO', maskableSize / 2, maskableSize * 0.87);
  
  // Save the maskable icon
  const maskableBuffer = maskableCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, 'maskable-icon.png'), maskableBuffer);
  console.log('Generated maskable-icon.png');
  
  // Create Apple touch icon (square with rounded corners)
  const appleSize = 180;
  const appleCanvas = createCanvas(appleSize, appleSize);
  const appleCtx = appleCanvas.getContext('2d');
  
  // Fill background
  const appleGradient = appleCtx.createLinearGradient(0, 0, appleSize, appleSize);
  appleGradient.addColorStop(0, '#6366f1');
  appleGradient.addColorStop(1, '#4f46e5');
  
  appleCtx.fillStyle = appleGradient;
  appleCtx.fillRect(0, 0, appleSize, appleSize);
  
  // Draw a white circle
  appleCtx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  appleCtx.beginPath();
  appleCtx.arc(appleSize / 2, appleSize * 0.4, appleSize * 0.25, 0, Math.PI * 2);
  appleCtx.fill();
  
  // Draw a line
  appleCtx.strokeStyle = 'white';
  appleCtx.lineWidth = appleSize * 0.05;
  appleCtx.lineCap = 'round';
  appleCtx.lineJoin = 'round';
  
  appleCtx.beginPath();
  appleCtx.moveTo(appleSize * 0.3, appleSize * 0.6);
  appleCtx.lineTo(appleSize * 0.45, appleSize * 0.75);
  appleCtx.lineTo(appleSize * 0.55, appleSize * 0.65);
  appleCtx.lineTo(appleSize * 0.7, appleSize * 0.8);
  appleCtx.stroke();
  
  // Add text
  appleCtx.fillStyle = 'white';
  appleCtx.font = `bold ${appleSize * 0.15}px Arial`;
  appleCtx.textAlign = 'center';
  appleCtx.textBaseline = 'middle';
  appleCtx.fillText('LOGO', appleSize / 2, appleSize * 0.87);
  
  // Save the Apple touch icon
  const appleBuffer = appleCanvas.toBuffer('image/png');
  fs.writeFileSync(path.join(iconsDir, 'apple-icon-180x180.png'), appleBuffer);
  console.log('Generated apple-icon-180x180.png');
  
  console.log('All PWA icons generated successfully!');
}

generateIcons();