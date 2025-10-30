import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transferId = searchParams.get('transferId');

    if (!transferId) {
      return NextResponse.json({ error: 'transferId is required' }, { status: 400 });
    }

    // Use service role to bypass RLS on server
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
    const admin = serviceKey ? createClient(supabaseUrl, serviceKey, { db: { schema: 'public' } }) : supabase;

    const { data: transfer, error: tErr } = await admin
      .from('branch_transfers')
      .select('*')
      .eq('id', transferId)
      .single();
    if (tErr || !transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    const { data: items } = await admin
      .from('branch_transfer_items')
      .select('*')
      .eq('transfer_id', transferId);

    const fromBranchId = transfer.from_branch_id as string;
    const toBranchId = transfer.to_branch_id as string;

    const [{ data: fromBranch }, { data: toBranch }] = await Promise.all([
      admin.from('branches').select('*').eq('id', fromBranchId).single(),
      admin.from('branches').select('*').eq('id', toBranchId).single(),
    ]);

    // Load products and batches map for display
    const productIds = (items || []).map(i => i.product_id);
    const batchIds = (items || []).map(i => i.batch_id).filter(Boolean);
    const [{ data: products = [] }, { data: batches = [] }] = await Promise.all([
      productIds.length ? admin.from('products').select('id,name,sku').in('id', productIds) : Promise.resolve({ data: [] as any[] }),
      batchIds.length ? admin.from('product_batches').select('id,batch_number,expiry_date').in('id', batchIds as string[]) : Promise.resolve({ data: [] as any[] }),
    ]);

    const productMap = new Map<string, any>((products as any[]).map(p => [p.id, p]));
    const batchMap = new Map<string, any>((batches as any[]).map(b => [b.id, b]));

    // Build PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const text = rgb(0.2, 0.2, 0.2);
    const light = rgb(0.9, 0.9, 0.9);
    let y = height - 72;

    // Title
    page.drawText('TRANSFER NOTE', { x: 50, y, size: 24, font: bold, color: text });
    y -= 40;

    // Two columns: From and To
    const leftX = 50;
    const rightX = width / 2 + 25;
    page.drawText('From Branch', { x: leftX, y, size: 12, font: bold, color: text });
    page.drawText('To Branch', { x: rightX, y, size: 12, font: bold, color: text });
    y -= 20;

    const rowsLeft = [
      ['Name:', fromBranch?.name || ''],
      ['Code:', fromBranch?.code || ''],
      ['Address:', fromBranch?.address || ''],
      ['Phone:', fromBranch?.phone || ''],
    ];
    const rowsRight = [
      ['Name:', toBranch?.name || ''],
      ['Code:', toBranch?.code || ''],
      ['Address:', toBranch?.address || ''],
      ['Phone:', toBranch?.phone || ''],
    ];

    let yl = y;
    rowsLeft.forEach(([label, value]) => {
      page.drawText(label, { x: leftX, y: yl, size: 10, font, color: text });
      page.drawText(String(value || 'N/A'), { x: leftX + 70, y: yl, size: 10, font, color: text });
      yl -= 15;
    });

    let yr = y;
    rowsRight.forEach(([label, value]) => {
      page.drawText(label, { x: rightX, y: yr, size: 10, font, color: text });
      page.drawText(String(value || 'N/A'), { x: rightX + 70, y: yr, size: 10, font, color: text });
      yr -= 15;
    });

    y = Math.min(yl, yr) - 20;

    // Items table
    page.drawRectangle({ x: 50, y: y - 20, width: width - 100, height: 20, color: light });
    const headers = ['Product', 'Batch', 'Qty'];
    const cols = [width - 100 - 160, 100, 60];
    let x = 50;
    headers.forEach((h, i) => {
      page.drawText(h, { x: x + 5, y: y - 15, size: 10, font: bold, color: text });
      x += cols[i];
    });

    let rowY = y - 24;
    (items || []).forEach((it) => {
      page.drawRectangle({ x: 50, y: rowY - 15, width: width - 100, height: 15, color: rgb(0.98, 0.98, 0.98) });
      const prod = productMap.get(it.product_id);
      const batch = it.batch_id ? batchMap.get(it.batch_id) : null;
      let colX = 50;
      page.drawText(prod?.name || 'N/A', { x: colX + 5, y: rowY - 12, size: 9, font, color: text });
      colX += cols[0];
      page.drawText(batch?.batch_number || '-', { x: colX + 5, y: rowY - 12, size: 9, font, color: text });
      colX += cols[1];
      page.drawText(String(it.quantity), { x: colX + 5, y: rowY - 12, size: 9, font, color: text });
      rowY -= 18;
    });

    // Note and meta
    y = rowY - 20;
    if (transfer.note) {
      page.drawText('Note', { x: 50, y, size: 12, font: bold, color: text });
      y -= 16;
      page.drawText(String(transfer.note), { x: 50, y, size: 10, font, color: text });
      y -= 10;
    }

    // Simple signature row for transfer
    y -= 40;
    const sigTopY = y;
    const marginX = 50;
    const totalSigWidth = width - marginX * 2;
    const colWidth = totalSigWidth / 3;
    const linePadding = 10;
    const sigLabels = ['Prepared by', 'Authorized by', 'Receiver Signature'];
    for (let i = 0; i < 3; i++) {
      const colX = marginX + i * colWidth;
      page.drawLine({
        start: { x: colX + linePadding, y: sigTopY },
        end: { x: colX + colWidth - linePadding, y: sigTopY },
        thickness: 1,
        color: text,
      });
      page.drawText(sigLabels[i], { x: colX + linePadding, y: sigTopY - 16, size: 10, font: bold, color: text });
    }

    const bytes = await pdfDoc.save();
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="transfer-${transferId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate transfer invoice' }, { status: 500 });
  }
}


