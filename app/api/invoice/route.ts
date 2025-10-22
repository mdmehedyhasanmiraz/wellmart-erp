import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    console.log('Invoice API called with orderId:', orderId);

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Create admin client with service role key to bypass RLS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch the order details first
    const { data: orders, error: orderError } = await supabase
      .from('sales_orders')
      .select('*')
      .eq('id', orderId);

    console.log('Order fetch result:', { orders, orderError });

    if (orderError) {
      console.error('Order fetch error:', orderError);
      return NextResponse.json({ 
        error: 'Failed to fetch order details', 
        details: orderError.message 
      }, { status: 500 });
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({ 
        error: 'Order not found',
        orderId: orderId 
      }, { status: 404 });
    }

    // Get the first (and should be only) order
    const order = orders[0];

    console.log('Order found:', { 
      orderId: order.id, 
      status: order.status, 
      customer: order.customer_name,
      branch_id: order.branch_id,
      party_id: order.party_id,
      employee_id: order.employee_id
    });

    // Fetch branch details separately with fallback
    let branchData = null;
    if (order.branch_id) {
      console.log('Fetching branch for ID:', order.branch_id);
      
      // First try to get active branch
      let { data: branch, error: branchError } = await supabase
        .from('branches')
        .select('id, name, address, phone, email')
        .eq('id', order.branch_id)
        .eq('is_active', true)
        .single();
      
      // If not found or inactive, try without is_active filter
      if (branchError) {
        console.log('Active branch not found, trying without is_active filter');
        const { data: inactiveBranch, error: inactiveError } = await supabase
          .from('branches')
          .select('id, name, address, phone, email')
          .eq('id', order.branch_id)
          .single();
        
        if (!inactiveError && inactiveBranch) {
          branch = inactiveBranch;
          branchError = null;
          console.log('Found inactive branch:', inactiveBranch);
        }
      }
      
      console.log('Branch fetch result:', { branch, branchError });
      
      if (branchError || !branch) {
        console.error('Branch fetch error:', branchError);
        // Don't fail the entire invoice if branch is not found
        branchData = { 
          id: order.branch_id, 
          name: 'Branch Not Found', 
          address: 'Address not available', 
          phone: null, 
          email: null 
        };
      } else {
        branchData = branch;
      }
    } else {
      console.log('No branch_id found in order');
      branchData = { 
        id: '', 
        name: 'No Branch Assigned', 
        address: 'No address available', 
        phone: null, 
        email: null 
      };
    }

    // Fetch party details separately
    let partyData = null;
    if (order.party_id) {
      const { data: party, error: partyError } = await supabase
        .from('parties')
        .select('id, name, party_code, contact_person, phone, email, shop_no, address_line1, address_line2, city, state, postal_code, country')
        .eq('id', order.party_id)
        .single();
      
      if (!partyError) {
        partyData = party;
      }
    }

    // Fetch employee details separately
    let employeeData = null;
    if (order.employee_id) {
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id, name, employee_code')
        .eq('id', order.employee_id)
        .single();
      
      if (!employeeError) {
        employeeData = employee;
      }
    }

    // Add the related data to the order object
    const orderWithDetails = {
      ...order,
      branches: branchData,
      parties: partyData
    };

    // Fetch order items separately (without batch join for now)
    const { data: items, error: itemsError } = await supabase
      .from('sales_order_items')
      .select('*')
      .eq('order_id', orderId);

    console.log('Items fetch result:', { items, itemsError });

    if (itemsError) {
      console.error('Items fetch error:', itemsError);
      return NextResponse.json({ 
        error: 'Failed to fetch order items', 
        details: itemsError.message 
      }, { status: 500 });
    }

    // Fetch payment history
    const { data: payments, error: paymentsError } = await supabase
      .from('sales_payments')
      .select('*')
      .eq('order_id', orderId)
      .order('paid_at', { ascending: true });

    console.log('Payments fetch result:', { payments, paymentsError });

    if (paymentsError) {
      console.error('Payments fetch error:', paymentsError);
      return NextResponse.json({ 
        error: 'Failed to fetch payment history', 
        details: paymentsError.message 
      }, { status: 500 });
    }

    // Fetch product details for each item
    const itemsWithProducts = await Promise.all(
      (items || []).map(async (item) => {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('name, sku, tp, mrp')
          .eq('id', item.product_id)
          .single();
        
        return {
          ...item,
          products: productError ? null : product
        };
      })
    );

  // Calculate payment status based on paid amount and due amount
  const calculatePaymentStatus = (paidTotal: number, dueTotal: number, grandTotal: number): string => {
    if (dueTotal <= 0) {
      return 'PAID';
    } else if (paidTotal > 0) {
      return 'PARTLY PAID';
    } else {
      return 'UNPAID';
    }
  };

  // Generate PDF invoice
  console.log('Generating PDF for order:', orderWithDetails.id);
  console.log('Branch data for PDF:', branchData);
  const paymentStatus = calculatePaymentStatus(order.paid_total, order.due_total, order.grand_total);
  
  try {
    const pdfBytes = await generatePDFInvoice(
      orderWithDetails, 
      itemsWithProducts, 
      payments || [], 
      branchData || { id: '', name: 'Unknown Branch' }, 
      partyData, 
      employeeData,
      paymentStatus
    );
    
    console.log('PDF generated successfully, size:', pdfBytes.length);

    // Return PDF
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${orderId.slice(0, 8)}.pdf"`
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
    console.error('Invoice generation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

interface InvoiceOrder {
  id: string;
  branch_id: string;
  party_id?: string;
  employee_id?: string;
  customer_name?: string;
  customer_phone?: string;
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
  branches?: InvoiceBranch | null;
  parties?: InvoiceParty | null;
}

interface InvoiceItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  discount_percent: number;
  total: number;
  products?: {
    name: string;
  };
}

interface InvoicePayment {
  id: string;
  order_id: string;
  amount: number;
  method: string;
  reference?: string;
  paid_at: string;
  received_by?: string;
}

interface InvoiceBranch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

interface InvoiceParty {
  id: string;
  name: string;
  party_code?: string;
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

interface InvoiceEmployee {
  id: string;
  name: string;
  employee_code: string;
}

async function generatePDFInvoice(
  order: InvoiceOrder, 
  items: InvoiceItem[], 
  payments: InvoicePayment[], 
  branch: InvoiceBranch, 
  party: InvoiceParty | null, 
  employee: InvoiceEmployee | null,
  paymentStatus: string
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
  
  // Payment status colors
  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return rgb(0.0, 0.6, 0.0); // Green
      case 'PARTLY PAID':
        return rgb(0.8, 0.4, 0.0); // Orange
      case 'UNPAID':
        return rgb(0.8, 0.0, 0.0); // Red
      default:
        return textColor;
    }
  };

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
  // page.drawText('INVOICE', {
  //   x: 50,
  //   y: yPos,
  //   size: 28,
  //   font: boldFont,
  //   color: accentColor,
  // });

  yPos -= 50;

  // Two-column layout for invoice details and customer info
  const leftColumnX = 50;
  const rightColumnX = width / 2 + 25;
  const columnWidth = (width - 100) / 2 - 25;

  // Left column - Invoice Details
  page.drawText('Invoice Details', {
    x: leftColumnX,
    y: yPos,
    size: 12,
    font: boldFont,
    color: accentColor,
  });

  let leftYPos = yPos - 25;
  const invoiceDetails = [
    { label: 'Invoice #:', value: invoiceNumber },
    { label: 'Date:', value: invoiceDate },
    { label: 'Payment Status:', value: paymentStatus },
    { label: 'MPO Code:', value: employee?.employee_code || 'N/A' },
  ];

  invoiceDetails.forEach((detail) => {
    page.drawText(detail.label, {
      x: leftColumnX,
      y: leftYPos,
      size: 10,
      font: font,
      color: textColor,
    });
    
    // Use special color for payment status
    const valueColor = detail.label === 'Payment Status:' ? getPaymentStatusColor(detail.value) : textColor;
    
    page.drawText(detail.value, {
      x: leftColumnX + 80,
      y: leftYPos,
      size: 10,
      font: boldFont,
      color: valueColor,
    });
    leftYPos -= 15;
  });

  // Bill To section in left column
  leftYPos -= 20;
  page.drawText('Bill To:', {
    x: leftColumnX,
    y: leftYPos,
    size: 12,
    font: boldFont,
    color: textColor,
  });

  leftYPos -= 20;
  page.drawText(`Branch: ${order.branches?.name || 'N/A'}`, {
    x: leftColumnX,
    y: leftYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  leftYPos -= 15;
  page.drawText(`Address: ${order.branches?.address || 'N/A'}`, {
    x: leftColumnX,
    y: leftYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  // Right column - Customer Information
  page.drawText('Customer Information', {
    x: rightColumnX,
    y: yPos,
    size: 12,
    font: boldFont,
    color: accentColor,
  });

  let rightYPos = yPos - 25;
  page.drawText(`Name:`, {
    x: rightColumnX,
    y: rightYPos,
    size: 10,
    font: font,
    color: textColor,
  });
  page.drawText(`${order.customer_name || 'Walk-in Customer'}`, {
    x: rightColumnX + 80,
    y: rightYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  rightYPos -= 15;
  page.drawText(`Phone:`, {
    x: rightColumnX,
    y: rightYPos,
    size: 10,
    font: font,
    color: textColor,
  });
  page.drawText(`${order.customer_phone || 'N/A'}`, {
    x: rightColumnX + 80,
    y: rightYPos,
    size: 10,
    font: font,
    color: textColor,
  });

  if (order.parties) {
    rightYPos -= 15;
    page.drawText(`Party Code:`, {
      x: rightColumnX,
      y: rightYPos,
      size: 10,
      font: font,
      color: textColor,
    });
    page.drawText(`${order.parties.party_code || 'N/A'}`, {
      x: rightColumnX + 80,
      y: rightYPos,
      size: 10,
      font: font,
      color: textColor,
    });

    if (order.parties.contact_person) {
      rightYPos -= 15;
      page.drawText(`Contact Person:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.contact_person}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.email) {
      rightYPos -= 15;
      page.drawText(`Email:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.email}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.shop_no) {
      rightYPos -= 15;
      page.drawText(`Shop No:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.shop_no}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.address_line1) {
      rightYPos -= 15;
      page.drawText(`Address:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.address_line1}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.address_line2) {
      rightYPos -= 15;
      page.drawText(`Address Line 2:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.address_line2}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.city) {
      rightYPos -= 15;
      page.drawText(`City:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.city}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.state) {
      rightYPos -= 15;
      page.drawText(`State:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.state}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.postal_code) {
      rightYPos -= 15;
      page.drawText(`Postal Code:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.postal_code}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }

    if (order.parties.country) {
      rightYPos -= 15;
      page.drawText(`Country:`, {
        x: rightColumnX,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
      page.drawText(`${order.parties.country}`, {
        x: rightColumnX + 80,
        y: rightYPos,
        size: 10,
        font: font,
        color: textColor,
      });
    }
  }

  // Reset yPos to the lower of the two columns for items section
  yPos = Math.min(leftYPos, rightYPos) - 20;

  // Items table section
  yPos -= 20;
  const tableStartY = yPos;
  const tableWidth = width - 100;
  const colWidths = [150, 80, 40, 80, 80, 30, 120]; // Product, Batch, Qty, Unit Price, Discount, Total

  // Draw table header background
  page.drawRectangle({
    x: 50,
    y: yPos - 20,
    width: tableWidth,
    height: 20,
    color: lightGray,
  });

  // Table headers
  const headers = ['Product', 'Batch', 'Qty', 'Unit TP', 'Discount', 'Total'];
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
    page.drawText(item.products?.name || 'N/A', {
      x: 55,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Batch number (will show '-' until batch tracking is implemented)
    page.drawText('-', {
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
    page.drawText(`${item.unit_price.toFixed(2)}`, {
      x: 325,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Discount
    page.drawText(`${item.discount_amount.toFixed(2)}`, {
      x: 405,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    // Total
    page.drawText(`${item.total.toFixed(2)}`, {
      x: 465,
      y: yPos - 12,
      size: 9,
      font: font,
      color: textColor,
    });

    yPos -= 20;
  });

  // Totals section with clean design
  // yPos -= 30;
  
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
  page.drawText(`${order.subtotal.toFixed(2)}`, {
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
  page.drawText(`-${order.discount_total.toFixed(2)}`, {
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
  page.drawText(`${order.tax_total.toFixed(2)}`, {
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
  page.drawText(`${order.shipping_total.toFixed(2)}`, {
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

  page.drawText(`${order.grand_total.toFixed(2)}`, {
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

  page.drawText(`${order.paid_total.toFixed(2)}`, {
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

  page.drawText(`${order.due_total.toFixed(2)}`, {
    x: width - 130,
    y: yPos,
    size: 9,
    font: boldFont,
    color: textColor,
  });

  // Payment Status Indicator
  yPos -= 20;
  page.drawText('Payment Status:', {
    x: width - 240,
    y: yPos,
    size: 10,
    font: boldFont,
    color: textColor,
  });

  page.drawText(paymentStatus, {
    x: width - 130,
    y: yPos,
    size: 10,
    font: boldFont,
    color: getPaymentStatusColor(paymentStatus),
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
      
      page.drawText(`${payment.amount.toFixed(2)}`, {
        x: 400,
        y: yPos,
        size: 9,
        font: font,
        color: textColor,
      });
      
      yPos -= 18;
    });
  }

  // Notes
  if (order.note) {
    yPos -= 40;
    page.drawText('Notes:', {
      x: 50,
      y: yPos,
      size: 12,
      font: boldFont,
      color: textColor,
    });
    yPos -= 20;
    page.drawText(order.note, {
      x: 50,
      y: yPos,
      size: 10,
      font: font,
      color: textColor,
    });
  }

  // Signature Section
  yPos -= 60;
  
  // Check if we need a new page for signatures
  if (checkPageSpace(80)) {
    addNewPage();
  }
  
  // Left signature area - Created By
  const leftSigX = 50;
  const rightSigX = width / 2 + 25;
  const sigWidth = (width - 100) / 2 - 25;
  const sigHeight = 60;
  
  // Draw signature box for Created By
  page.drawRectangle({
    x: leftSigX,
    y: yPos - sigHeight,
    width: sigWidth,
    height: sigHeight,
    borderColor: lightGray,
    borderWidth: 1,
  });
  
  // Created By label
  page.drawText('Created By:', {
    x: leftSigX + 5,
    y: yPos - 15,
    size: 10,
    font: boldFont,
    color: textColor,
  });
  
  // Signature line
  page.drawLine({
    start: { x: leftSigX + 5, y: yPos - 35 },
    end: { x: leftSigX + sigWidth - 5, y: yPos - 35 },
    thickness: 1,
    color: textColor,
  });
  
  // Date line
  page.drawText('Date: _______________', {
    x: leftSigX + 5,
    y: yPos - 50,
    size: 9,
    font: font,
    color: textColor,
  });
  
  // Right signature area - Authorized By
  page.drawRectangle({
    x: rightSigX,
    y: yPos - sigHeight,
    width: sigWidth,
    height: sigHeight,
    borderColor: lightGray,
    borderWidth: 1,
  });
  
  // Authorized By label
  page.drawText('Authorized By:', {
    x: rightSigX + 5,
    y: yPos - 15,
    size: 10,
    font: boldFont,
    color: textColor,
  });
  
  // Signature line
  page.drawLine({
    start: { x: rightSigX + 5, y: yPos - 35 },
    end: { x: rightSigX + sigWidth - 5, y: yPos - 35 },
    thickness: 1,
    color: textColor,
  });
  
  // Date line
  page.drawText('Date: _______________', {
    x: rightSigX + 5,
    y: yPos - 50,
    size: 9,
    font: font,
    color: textColor,
  });

  // Footer
  // yPos = 50;
  // page.drawText('Thank you for your business!', {
  //   x: 50,
  //   y: yPos,
  //   size: 10,
  //   font: font,
  //   color: textColor,
  // });

  // page.drawText(`Generated on ${new Date().toLocaleString()}`, {
  //   x: 50,
  //   y: yPos - 15,
  //   size: 8,
  //   font: font,
  //   color: lightGray,
  // });

  // Return PDF bytes
  return await pdfDoc.save();
}