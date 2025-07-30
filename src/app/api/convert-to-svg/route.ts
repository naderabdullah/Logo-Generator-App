import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('image');

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    const raw = await file.arrayBuffer();
    const buffer = Buffer.from(raw);
    const meta = await sharp(buffer).metadata();
    const width = meta.width || 800;
    const height = meta.height || 600;
    const base64 = buffer.toString('base64');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${width}" height="${height}"
     viewBox="0 0 ${width} ${height}"
     preserveAspectRatio="xMidYMid meet"
     style="display:block;margin:auto;">
  <image href="data:image/png;base64,${base64}"
         width="${width}" height="${height}"
         preserveAspectRatio="xMidYMid meet"/>
</svg>`;

    return NextResponse.json({ svg });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Embedding failed' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
