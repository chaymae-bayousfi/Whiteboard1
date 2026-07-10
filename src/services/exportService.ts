import type { CanvasElement } from '@/types';
import { downloadFile } from '@/utils';

class ExportService {
  async exportToPNG(elements: CanvasElement[], filename: string = 'canvas.png'): Promise<void> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const el of elements) {
      const w = el.width || 200;
      const h = el.height || 100;
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + w);
      maxY = Math.max(maxY, el.y + h);
    }

    const padding = 50;
    const width = Math.max(maxX - minX + padding * 2, 800);
    const height = Math.max(maxY - minY + padding * 2, 600);

    canvas.width = width;
    canvas.height = height;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const offsetX = padding - minX;
    const offsetY = padding - minY;

    ctx.translate(offsetX, offsetY);

    for (const el of elements) {
      this.renderElement(ctx, el);
    }

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  exportToJSON(elements: CanvasElement[], filename: string = 'canvas.json'): void {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      elements,
    };
    downloadFile(JSON.stringify(data, null, 2), filename, 'application/json');
  }

  importFromJSON(file: File): Promise<CanvasElement[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (data.elements && Array.isArray(data.elements)) {
            resolve(data.elements);
          } else {
            reject(new Error('Invalid JSON format'));
          }
        } catch {
          reject(new Error('Failed to parse JSON'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  private renderElement(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
    ctx.save();
    ctx.rotate(el.rotation);
    ctx.globalAlpha = el.opacity;

    switch (el.type) {
      case 'rectangle':
        this.renderRectangle(ctx, el);
        break;
      case 'ellipse':
        this.renderEllipse(ctx, el);
        break;
      case 'pencil':
        this.renderPencil(ctx, el);
        break;
      case 'line':
        this.renderLine(ctx, el);
        break;
      case 'arrow':
        this.renderArrow(ctx, el);
        break;
      case 'text':
        this.renderText(ctx, el);
        break;
    }

    ctx.restore();
  }

  private renderRectangle(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
    const w = el.width || 0;
    const h = el.height || 0;

    if (el.fill && el.fill !== 'transparent') {
      ctx.fillStyle = el.fill;
      ctx.fillRect(el.x, el.y, w, h);
    }

    if (el.stroke) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth || 2;
      ctx.strokeRect(el.x, el.y, w, h);
    }
  }

  private renderEllipse(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
    const w = el.width || 0;
    const h = el.height || 0;
    const rx = w / 2;
    const ry = h / 2;

    ctx.beginPath();
    ctx.ellipse(el.x + rx, el.y + ry, rx, ry, 0, 0, Math.PI * 2);

    if (el.fill && el.fill !== 'transparent') {
      ctx.fillStyle = el.fill;
      ctx.fill();
    }

    if (el.stroke) {
      ctx.strokeStyle = el.stroke;
      ctx.lineWidth = el.strokeWidth || 2;
      ctx.stroke();
    }
  }

  private renderPencil(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
    if (!el.points || el.points.length < 4) return;

    ctx.beginPath();
    ctx.moveTo(el.x + el.points[0], el.y + el.points[1]);

    for (let i = 2; i < el.points.length; i += 2) {
      ctx.lineTo(el.x + el.points[i], el.y + el.points[i + 1]);
    }

    ctx.strokeStyle = el.stroke || '#000';
    ctx.lineWidth = el.strokeWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  private renderLine(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
    if (!el.points || el.points.length < 4) return;

    ctx.beginPath();
    ctx.moveTo(el.points[0], el.points[1]);
    ctx.lineTo(el.points[2], el.points[3]);

    ctx.strokeStyle = el.stroke || '#000';
    ctx.lineWidth = el.strokeWidth || 2;
    ctx.stroke();
  }

  private renderArrow(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
    if (!el.points || el.points.length < 4) return;

    const x1 = el.points[0];
    const y1 = el.points[1];
    const x2 = el.points[2];
    const y2 = el.points[3];

    const headlen = 15;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle - Math.PI / 6), y2 - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headlen * Math.cos(angle + Math.PI / 6), y2 - headlen * Math.sin(angle + Math.PI / 6));

    ctx.strokeStyle = el.stroke || '#000';
    ctx.lineWidth = el.strokeWidth || 2;
    ctx.stroke();
  }

  private renderText(ctx: CanvasRenderingContext2D, el: CanvasElement): void {
    ctx.font = `${el.fontSize || 16}px ${el.fontFamily || 'Inter, sans-serif'}`;
    ctx.fillStyle = el.stroke || '#000';
    ctx.textBaseline = 'top';
    ctx.fillText(el.text || '', el.x, el.y);
  }
}

export const exportService = new ExportService();
