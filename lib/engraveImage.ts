import { HistoryItem } from '../types';

/**
 * Loads an image from a URL as an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Renders the official ZEN AI Co. engraved hallmark onto an infographic canvas
 * and returns the engraved data URL or blob.
 */
export async function createEngravedInfographic(
  imageUrl: string,
  options: {
    title?: string;
    model?: string;
    timestamp?: number;
    format?: 'image/png' | 'image/jpeg';
    quality?: number;
    customLogoUrl?: string;
    brandName?: string;
  } = {}
): Promise<string> {
  return new Promise(async (resolve) => {
    let img: HTMLImageElement;
    try {
      img = await loadImage(imageUrl);
    } catch {
      resolve(imageUrl);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width || 1024;
      canvas.height = img.naturalHeight || img.height || 1024;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(imageUrl);
        return;
      }

      // 1. Draw base image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Compute scalable engraving dimensions relative to canvas size
      const scale = Math.max(canvas.width, canvas.height) / 1024;
      const badgeWidth = 270 * scale;
      const badgeHeight = 62 * scale;
      const margin = 28 * scale;
      const x = canvas.width - badgeWidth - margin;
      const y = canvas.height - badgeHeight - margin;
      const cornerRadius = 14 * scale;

      // 3. Draw frosted glass obsidian backplate with subtle inner metallic glow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 20 * scale;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 6 * scale;

      // Rounded backplate path
      ctx.beginPath();
      ctx.roundRect(x, y, badgeWidth, badgeHeight, cornerRadius);
      ctx.fillStyle = 'rgba(8, 12, 22, 0.92)';
      ctx.fill();
      ctx.restore();

      // Subtle metallic hairline border with gradient
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(x, y, badgeWidth, badgeHeight, cornerRadius);
      const gradBorder = ctx.createLinearGradient(x, y, x + badgeWidth, y + badgeHeight);
      gradBorder.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
      gradBorder.addColorStop(0.5, 'rgba(255, 255, 255, 0.18)');
      gradBorder.addColorStop(1, 'rgba(59, 130, 246, 0.45)');
      ctx.strokeStyle = gradBorder;
      ctx.lineWidth = Math.max(1, 1.2 * scale);
      ctx.stroke();
      ctx.restore();

      // 4. Draw Official Brand Logo (PNG asset / Custom logo or Vector Fallback)
      const iconSize = 38 * scale;
      const iconX = x + 12 * scale;
      const iconY = y + (badgeHeight - iconSize) / 2;

      let customOrBrandLogo: string | null = null;
      try {
        customOrBrandLogo = options.customLogoUrl || localStorage.getItem('zen_custom_brand_logo') || '/zen-brand-logo.png';
      } catch {
        customOrBrandLogo = '/zen-brand-logo.png';
      }

      let logoDrawn = false;
      if (customOrBrandLogo) {
        try {
          const logoImg = await loadImage(customOrBrandLogo);
          ctx.save();
          // Clip to rounded square for icon
          ctx.beginPath();
          ctx.roundRect(iconX, iconY, iconSize, iconSize, 8 * scale);
          ctx.clip();
          ctx.drawImage(logoImg, iconX, iconY, iconSize, iconSize);
          ctx.restore();
          logoDrawn = true;
        } catch {
          logoDrawn = false;
        }
      }

      if (!logoDrawn) {
        // High-precision vector representation of ZEN logo
        ctx.save();
        ctx.translate(iconX, iconY);
        const iconScale = iconSize / 1000;
        ctx.scale(iconScale, iconScale);

        // Dark icon backdrop
        ctx.fillStyle = '#05070d';
        ctx.beginPath();
        ctx.roundRect(0, 0, 1000, 1000, 160);
        ctx.fill();

        // White metallic geometric ZEN logo paths
        ctx.fillStyle = '#ffffff';

        // Top-Left L-notch and Upper Diagonal
        ctx.beginPath();
        ctx.moveTo(120, 75);
        ctx.lineTo(980, 75);
        ctx.lineTo(820, 235);
        ctx.lineTo(500, 235);
        ctx.lineTo(120, 615);
        ctx.lineTo(120, 525);
        ctx.lineTo(410, 235);
        ctx.lineTo(195, 235);
        ctx.lineTo(195, 340);
        ctx.lineTo(120, 340);
        ctx.closePath();
        ctx.fill();

        // Center Parallel Diagonal Stripe
        ctx.beginPath();
        ctx.moveTo(288, 748);
        ctx.lineTo(748, 288);
        ctx.lineTo(824, 364);
        ctx.lineTo(364, 824);
        ctx.closePath();
        ctx.fill();

        // Bottom-Right L-notch and Lower Diagonal
        ctx.beginPath();
        ctx.moveTo(880, 925);
        ctx.lineTo(20, 925);
        ctx.lineTo(180, 765);
        ctx.lineTo(500, 765);
        ctx.lineTo(880, 385);
        ctx.lineTo(880, 475);
        ctx.lineTo(590, 765);
        ctx.lineTo(805, 765);
        ctx.lineTo(805, 660);
        ctx.lineTo(880, 660);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      // 5. Engraved Typography
      ctx.save();
      const textX = iconX + iconSize + 12 * scale;
      
      // Brand Title: Customizable or Studio Archive
      const displayBrand = options.brandName || 
        (typeof localStorage !== 'undefined' ? localStorage.getItem('studio_custom_brand_name') : null) || 
        'INFOGRAPHIC STUDIO';
      ctx.fillStyle = '#ffffff';
      ctx.font = `900 ${14 * scale}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      ctx.fillText(displayBrand, textX, y + 24 * scale);

      // Verification Line
      ctx.fillStyle = 'rgba(147, 197, 253, 0.95)';
      ctx.font = `700 ${8.5 * scale}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const modelLabel = options.model ? options.model.toUpperCase() : 'STUDIO 4K';
      ctx.fillText(`VERIFIED VISUAL · ${modelLabel}`, textX, y + 37 * scale);

      // Subtitle / Certificate
      ctx.fillStyle = 'rgba(148, 163, 184, 0.75)';
      ctx.font = `600 ${7.5 * scale}px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif`;
      const dateStr = options.timestamp ? new Date(options.timestamp).toLocaleDateString() : new Date().toLocaleDateString();
      ctx.fillText(`PUBLICATION READY · ${dateStr}`, textX, y + 49 * scale);
      ctx.restore();

      const outFormat = options.format || 'image/png';
      const quality = options.quality ?? 0.98;
      const dataUrl = canvas.toDataURL(outFormat, quality);
      resolve(dataUrl);
    } catch (err) {
      console.error('Failed to engrave image', err);
      resolve(imageUrl); // Graceful fallback
    }
  });
}

/**
 * Downloads an image file to user's device
 */
export async function downloadInfographicImage(
  imageUrl: string,
  filename: string,
  options: { engrave?: boolean; title?: string; model?: string; timestamp?: number; customLogoUrl?: string; brandName?: string } = {}
) {
  let targetUrl = imageUrl;
  if (options.engrave) {
    try {
      targetUrl = await createEngravedInfographic(imageUrl, options);
    } catch (e) {
      console.warn("Engraving canvas step failed, proceeding with direct download:", e);
      targetUrl = imageUrl;
    }
  }

  // Create temporary link and trigger download
  const link = document.createElement('a');
  link.href = targetUrl;
  link.download = filename || `infographic_${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
