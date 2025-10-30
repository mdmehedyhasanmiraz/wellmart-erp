import { NextRequest, NextResponse } from 'next/server';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = supabase;

    // Fetch purchase order details with branch join (same as PurchaseService)
    const { data: orders, error: orderError } = await supabaseClient
      .from('purchase_orders')
      .select(`
        *,
        branches:branch_id(id, name, address, phone, email, is_active),
        suppliers:supplier_id(id, name, supplier_code, contact_person, phone, email),
        employees:employee_id(id, name, employee_code)
      `)
      .eq('id', orderId);

    if (orderError || !orders || orders.length === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    console.log('Purchase order data:', { 
      id: order.id, 
      branch_id: order.branch_id, 
      branches: order.branches,
      branch_id_type: typeof order.branch_id,
      branch_id_length: order.branch_id?.length 
    });

    // Extract branch data from joined query (same as PurchaseService approach)
    let branchData = null;
    if (order.branches) {
      console.log('Branch data from join:', order.branches);
      branchData = {
        id: order.branches.id,
        name: order.branches.name,
        address: order.branches.address,
        phone: order.branches.phone,
        email: order.branches.email
      };
    } else if (order.branch_id) {
      console.log('No branch data from join, branch_id exists:', order.branch_id);
      // Fallback: branch exists but join failed
      branchData = { 
        id: order.branch_id, 
        name: 'Branch Data Unavailable', 
        address: 'Address not available', 
        phone: null, 
        email: null 
      };
    } else {
      console.log('No branch_id found in purchase order');
      branchData = { 
        id: '', 
        name: 'No Branch Assigned', 
        address: 'No address available', 
        phone: null, 
        email: null 
      };
    }

    // Extract supplier data from joined query
    let suppliers = null;
    if (order.suppliers) {
      console.log('Supplier data from join:', order.suppliers);
      suppliers = order.suppliers;
    } else if (order.supplier_id) {
      console.log('No supplier data from join, supplier_id exists:', order.supplier_id);
      // Fallback: supplier exists but join failed
      suppliers = {
        id: order.supplier_id,
        name: 'Supplier Data Unavailable',
        supplier_code: null,
        contact_person: null,
        phone: null,
        email: null
      };
    }

    // Extract employee data from joined query
    let employees = null;
    if (order.employees) {
      console.log('Employee data from join:', order.employees);
      employees = order.employees;
    } else if (order.employee_id) {
      console.log('No employee data from join, employee_id exists:', order.employee_id);
      // Fallback: employee exists but join failed
      employees = {
        id: order.employee_id,
        name: 'Employee Data Unavailable',
        employee_code: 'N/A'
      };
    }

    // Fetch purchase order items
    const { data: items, error: itemsError } = await supabaseClient
      .from('purchase_order_items')
      .select('*')
      .eq('order_id', orderId);

    if (itemsError) {
      return NextResponse.json({ error: 'Failed to fetch order items' }, { status: 500 });
    }

    // Fetch product details for each item
    const productIds = items?.map(item => item.product_id) || [];
    let products = [];
    if (productIds.length > 0) {
      const { data: productData, error: productError } = await supabaseClient
        .from('products')
        .select('*')
        .in('id', productIds);
      
      if (!productError && productData) {
        products = productData;
      }
    }

    // Fetch purchase payments
    const { data: payments, error: paymentsError } = await supabaseClient
      .from('purchase_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('paid_at', { ascending: false });

    if (paymentsError) {
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Generate PDF with error handling
    try {
      const pdfBytes = await generatePDFInvoice(
        order, 
        items || [], 
        payments || [], 
        branchData || { id: '', name: 'Unknown Branch' }, 
        suppliers, 
        employees, 
        products
      );
      
      console.log('Purchase invoice PDF generated successfully, size:', pdfBytes.length);

      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="purchase-invoice-${orderId.slice(0, 8)}.pdf"`
        }
      });
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      return NextResponse.json({ 
        error: 'Failed to generate PDF', 
        details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF error',
        branchData: branchData
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error generating purchase invoice:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

interface PurchaseInvoiceOrder {
  id: string;
  branch_id: string;
  supplier_id?: string;
  employee_id?: string;
  supplier_name?: string;
  supplier_phone?: string;
  status: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  shipping_total: number;
  grand_total: number;
  paid_total: number;
  due_total: number;
  note?: string;
  created_at: string;
}

interface PurchaseInvoiceItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  total: number;
  batch_number?: string;
}

interface PurchaseInvoicePayment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  reference?: string;
  paid_at: string;
  received_by?: string;
}

interface PurchaseInvoiceBranch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface PurchaseInvoiceSupplier {
  id: string;
  name: string;
  supplier_code?: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  shop_no?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

interface PurchaseInvoiceEmployee {
  id: string;
  name: string;
  employee_code: string;
}

interface PurchaseInvoiceProduct {
  id: string;
  name: string;
  sku?: string;
  pp?: number;
  tp?: number;
  mrp?: number;
}

async function generatePDFInvoice(
  order: PurchaseInvoiceOrder, 
  items: PurchaseInvoiceItem[], 
  payments: PurchaseInvoicePayment[], 
  branch: PurchaseInvoiceBranch, 
  supplier: PurchaseInvoiceSupplier | null, 
  employee: PurchaseInvoiceEmployee | null, 
  products: PurchaseInvoiceProduct[]
) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Colors
  const primaryColor = rgb(0.2, 0.2, 0.2); // Dark gray
  const textColor = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.9, 0.9, 0.9);
  const accentColor = rgb(0.1, 0.1, 0.1);

  // Helper function to check if we need a new page
  const checkPageSpace = (requiredSpace: number) => {
    return yPos - requiredSpace < 100; // 100 points margin from bottom
  };

  // Helper function to add a new page
  const addNewPage = () => {
    page = pdfDoc.addPage([595.28, 841.89]);
    yPos = height - 72; // Reset to top margin
    return page;
  };

  // 1 inch = 72 points margin from top
  const topMargin = 72;
  let yPos = height - topMargin;

  // Invoice header with clean design
  const invoiceNumber = order.id.slice(0, 8).toUpperCase();
  const invoiceDate = new Date(order.created_at).toLocaleDateString();

  // Main invoice title
  page.drawText('PURCHASE ORDER', {
    x: 50,
    y: yPos,
    size: 28,
    font: boldFont,
    color: accentColor,
  });

  yPos -= 50;

  // Two-column layout for supplier info and invoice details
  const leftColumnX = 50;
  const rightColumnX = width / 2 + 25;
  const columnWidth = (width - 100) / 2 - 25;

  // Left column - Supplier Information
  page.drawText('Supplier Information', {
    x: leftColumnX,
    y: yPos,
    size: 14,
    font: boldFont,
    color: accentColor,
  });

  let leftYPos = yPos - 25;
  page.drawText(`Name:`, {
    x: leftColumnX,
    y: leftYPos,
    size: 10,
    font: font,
    color: textColor,
  });
  page.drawText(`${order.supplier_name || 'Walk-in Supplier'}`, {
    x: leftColumnX + 80,
    y: leftYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  leftYPos -= 15;
  page.drawText(`Phone:`, {
    x: leftColumnX,
    y: leftYPos,
    size: 10,
    font: font,
    color: textColor,
  });
  page.drawText(`${order.supplier_phone || 'N/A'}`, {
    x: leftColumnX + 80,
    y: leftYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  if (supplier) {
    leftYPos -= 15;
    page.drawText(`Supplier Code:`, {
      x: leftColumnX,
      y: leftYPos,
      size: 10,
      font: font,
      color: textColor,
    });
    page.drawText(`${supplier.supplier_code || 'N/A'}`, {
      x: leftColumnX + 80,
      y: leftYPos,
      size: 10,
      font: font,
      color: textColor,
    });

    if (supplier.contact_person) {
      leftYPos -= 15;
      page.drawText(`Contact Person:`, {
        x: leftColumnX,
        y: leftYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${supplier.contact_person}`, {
        x: leftColumnX + 80,
        y: leftYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (supplier.email) {
      leftYPos -= 15;
      page.drawText(`Email:`, {
        x: leftColumnX,
        y: leftYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${supplier.email}`, {
        x: leftColumnX + 80,
        y: leftYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (supplier.address_line1) {
      leftYPos -= 15;
      page.drawText(`Address:`, {
        x: leftColumnX,
        y: leftYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${supplier.address_line1}`, {
        x: leftColumnX + 80,
        y: leftYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }
  }

  // Right column - Invoice Details
  const rightColumnY = yPos;
  page.drawText('Purchase Details', {
    x: rightColumnX,
    y: rightColumnY,
    size: 14,
    font: boldFont,
    color: accentColor,
  });

  let rightYPos = rightColumnY - 25;
  const invoiceDetails = [
    { label: 'Order #:', value: invoiceNumber },
    { label: 'Date:', value: invoiceDate },
    { label: 'Status:', value: order.status.toUpperCase() },
    { label: 'Employee:', value: employee?.name || 'N/A' },
  ];

  invoiceDetails.forEach((detail) => {
    page.drawText(detail.label, {
      x: rightColumnX,
      y: rightYPos,
      size: 10,
      font: font,
      color: textColor,
    });
    page.drawText(detail.value, {
      x: rightColumnX + 80,
      y: rightYPos,
      size: 10,
      font: boldFont,
      color: textColor,
    });
    rightYPos -= 20;
  });

  // Bill From section in right column
  rightYPos -= 20;
  page.drawText('Bill From:', {
    x: rightColumnX,
    y: rightYPos,
    size: 12,
    font: boldFont,
    color: textColor,
  });

  rightYPos -= 20;
  page.drawText(`Branch: ${branch.name}`, {
    x: rightColumnX,
    y: rightYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  rightYPos -= 15;
  page.drawText(`Address: ${branch.address || 'N/A'}`, {
    x: rightColumnX,
    y: rightYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  // Reset yPos to the lower of the two columns for items section
  yPos = Math.min(leftYPos, rightYPos) - 20;

  // Items table section
  yPos -= 20;
  const tableStartY = yPos;
  const tableWidth = width - 100;
  const colWidths = [150, 80, 40, 80, 80, 30, 120]; // Product, Batch, Qty, Unit PP, Discount, Total

  // Draw table header background
  page.drawRectangle({
    x: 50,
    y: yPos - 20,
    width: tableWidth,
    height: 20,
    color: lightGray,
  });

  // Table headers
  const headers = ['Product', 'Batch', 'Qty', 'Unit PP', 'Discount', 'Total'];
  let xPos = 50;
  headers.forEach((header, index) => {
    page.drawText(header, {
      x: xPos + 5,
      y: yPos - 15,
      size: 10,
      font: boldFont,
      color: textColor,
    });
    xPos += colWidths[index];
  });

  // Items
  yPos -= 24;
  items.forEach((item) => {
    // Check if we need a new page for each item row
    if (checkPageSpace(20)) {
      addNewPage();
      // Redraw table header on new page
      page.drawRectangle({
        x: 50,
        y: yPos - 20,
        width: tableWidth,
        height: 20,
        color: lightGray,
      });
      
      let headerXPos = 50;
      headers.forEach((header, index) => {
        page.drawText(header, {
          x: headerXPos + 5,
          y: yPos - 15,
          size: 10,
          font: boldFont,
          color: textColor,
        });
        headerXPos += colWidths[index];
      });
      yPos -= 24;
    }
    
    // Draw row background
    page.drawRectangle({
      x: 50,
      y: yPos - 15,
      width: tableWidth,
      height: 15,
      color: rgb(0.98, 0.98, 0.98),
    });

    // Product name
    const product = products.find(p => p.id === item.product_id);
    page.drawText(product?.name || 'N/A', {
      x: 55,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Batch number
    page.drawText(item.batch_number || '-', {
      x: 205,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Quantity
    page.drawText(item.quantity.toString(), {
      x: 285,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Unit price
    page.drawText(`BDT ${item.unit_price.toFixed(2)}`, {
      x: 325,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Discount
    page.drawText(`BDT ${item.discount_amount.toFixed(2)}`, {
      x: 405,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Total
    page.drawText(`BDT ${item.total.toFixed(2)}`, {
      x: 465,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    yPos -= 20;
  });

  // Totals section with clean design
  yPos -= 30;
  
  // Draw a subtle line separator
  page.drawLine({
    start: { x: 50, y: yPos },
    end: { x: width - 50, y: yPos },
    thickness: 1,
    color: lightGray,
  });
  
  yPos -= 20;

  // Subtotal
  page.drawText('Subtotal:', {
    x: width - 240,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });
  page.drawText(`BDT ${order.subtotal.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });

  yPos -= 15;
  page.drawText('Discount:', {
    x: width - 240,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });
  page.drawText(`-BDT ${order.discount_total.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });

  yPos -= 15;
  page.drawText('Tax:', {
    x: width - 240,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });
  page.drawText(`BDT ${order.tax_total.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });

  yPos -= 15;
  page.drawText('Shipping:', {
    x: width - 240,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });
  page.drawText(`BDT ${order.shipping_total.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });

  // Grand total with emphasis
  yPos -= 5;
  page.drawLine({
    start: { x: width - 300, y: yPos },
    end: { x: width - 50, y: yPos },
    thickness: 1,
    color: lightGray,
  });
  
  yPos -= 15;
  page.drawText('Grand Total:', {
    x: width - 240,
    y: yPos,
    size: 10,
    font: boldFont,
    color: accentColor,
  });

  page.drawText(`BDT ${order.grand_total.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 10,
    font: boldFont,
    color: accentColor,
  });
  
  yPos -= 15;
  page.drawText(`Paid Amount:`, {
    x: width - 240,
    y: yPos,
    size: 9,
    font: font,
    color: textColor,
  });

  page.drawText(`BDT ${order.paid_total.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 9,
    font: boldFont,
    color: textColor,
  });

  yPos -= 15;
  page.drawText(`Due Amount:`, {
    x: width - 240,
    y: yPos,
    size: 9,
    font: boldFont,
    color: textColor,
  });

  page.drawText(`BDT ${order.due_total.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 9,
    font: boldFont,
    color: textColor,
  });

  // Payment History Section
  if (payments && payments.length > 0) {
    // Calculate required space for payment history
    const paymentHistorySpace = 50 + (payments.length * 20) + 50; // Header + rows + footer
    
    // Check if we need a new page for payment history
    if (checkPageSpace(paymentHistorySpace)) {
      addNewPage();
    }
    
    yPos -= 20;
    
    // Payment History Header
    page.drawText('Payment History', {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
      color: accentColor,
    });
    
    yPos -= 15;
    
    // Payment History Table Header with background
    page.drawRectangle({
      x: 50,
      y: yPos - 20,
      width: width - 100,
      height: 20,
      color: lightGray,
    });
    
    page.drawText('Date', {
      x: 50,
      y: yPos - 15,
      size: 10,
      font: boldFont,
      color: textColor,
    });
    page.drawText('Method', {
      x: 150,
      y: yPos - 15,
      size: 10,
      font: boldFont,
      color: textColor,
    });
    page.drawText('Reference', {
      x: 250,
      y: yPos - 15,
      size: 10,
      font: boldFont,
      color: textColor,
    });
    page.drawText('Amount', {
      x: 400,
      y: yPos - 15,
      size: 10,
      font: boldFont,
      color: textColor,
    });
    
    yPos -= 35;
    
    // Payment History Rows
    payments.forEach((payment) => {
      // Check if we need a new page for each payment row
      if (checkPageSpace(20)) {
        addNewPage();
      }
      
      const paymentDate = new Date(payment.paid_at).toLocaleDateString();
      
      page.drawText(paymentDate, {
        x: 50,
        y: yPos,
        size: 9,
        font: font,
        color: textColor,
      });
      
      page.drawText(payment.method || 'Cash', {
        x: 150,
        y: yPos,
        size: 9,
        font: font,
        color: textColor,
      });
      
      page.drawText(payment.reference || '-', {
        x: 250,
        y: yPos,
        size: 9,
        font: font,
        color: textColor,
      });
      
      page.drawText(`BDT ${payment.amount.toFixed(2)}`, {
        x: 400,
        y: yPos,
        size: 9,
        font: font,
        color: textColor,
      });
      
      yPos -= 18;
    });
  }

  // Signature Section (Purchased by, Accountant’s Signature, Authorized by)
  yPos -= 60;
  // Ensure space for signatures; add page if needed
  if (checkPageSpace(80)) {
    addNewPage();
  }

  const sigTopY = yPos - 20;
  const sigLabelY = sigTopY - 18;
  const marginX = 50;
  const totalSigWidth = width - marginX * 2;
  const colWidth = totalSigWidth / 3;
  const linePadding = 10;
  const sigLabels = ['Purchased by', 'Accountant’s Signature', 'Authorized by'];

  for (let i = 0; i < 3; i++) {
    const colX = marginX + i * colWidth;
    // Line
    page.drawLine({
      start: { x: colX + linePadding, y: sigTopY },
      end: { x: colX + colWidth - linePadding, y: sigTopY },
      thickness: 1,
      color: textColor,
    });
    // Label under line
    page.drawText(sigLabels[i], {
      x: colX + linePadding,
      y: sigLabelY,
      size: 10,
      font: boldFont,
      color: textColor,
    });
  }

  // Return PDF bytes
  return await pdfDoc.save();
}
