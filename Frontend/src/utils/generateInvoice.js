import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateInvoice = (order) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(order.shop_name || 'Shop Invoice', 105, 15, null, null, "center");
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const shopAddress = [order.shop_address, order.shop_city].filter(Boolean).join(', ');
  if (shopAddress) {
    doc.text(shopAddress, 105, 21, null, null, "center");
  }

  doc.setLineWidth(0.5);
  doc.line(14, 25, 196, 25);
  
  // Header Info
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", 105, 30, null, null, "center");

  doc.line(14, 33, 196, 33);
  
  // Left side (Buyer)
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Billed To:", 14, 40);
  doc.setFont("helvetica", "normal");
  doc.text(order.farmer_name || 'Customer', 14, 46);
  doc.text(order.farmer_village || order.delivery_address || '', 14, 52);
  
  if (order.gst_number) {
    doc.text(`GSTIN No: ${order.gst_number}`, 14, 64);
  }

  // Right side (Invoice details)
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No :`, 120, 40);
  doc.text(`Date :`, 120, 46);
  doc.text(`Due Date :`, 120, 52);

  doc.setFont("helvetica", "normal");
  doc.text(`INV-${order.id}`, 145, 40);
  doc.text(`${new Date(order.created_at).toLocaleDateString('en-IN')}`, 145, 46);
  
  const dueDate = new Date(order.created_at);
  dueDate.setDate(dueDate.getDate() + 15);
  doc.text(`${dueDate.toLocaleDateString('en-IN')}`, 145, 52);
  
  // Table
  const tableColumn = ["SrNo", "Product Name", "HSN/SAC", "Qty", "Rate", "GST%", "Amount Rs."];
  const tableRows = [];
  
  let subTotal = 0;

  (order.items || []).forEach((item, index) => {
    const qty = Number(item.quantity);
    const rate = Number(item.price_at_purchase);
    const gstRate = Number(item.gst_rate || 0);
    const amount = qty * rate;
    
    tableRows.push([
      index + 1,
      item.item_name || item.product_name,
      item.hsn_sac || '-',
      qty,
      rate.toFixed(2),
      gstRate.toFixed(2),
      amount.toFixed(2)
    ]);
    
    subTotal += amount;
  });

  autoTable(doc, {
    startY: 70,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  const finalY = doc.lastAutoTable.finalY || 70;
  
  // Totals
  doc.setDrawColor(200);
  doc.rect(14, finalY + 5, 182, 30);
  
  doc.setFont("helvetica", "normal");
  if (order.bank_name) {
    doc.setFont("helvetica", "bold");
    doc.text("Bank Details:", 16, finalY + 11);
    doc.setFont("helvetica", "normal");
    doc.text(`Bank Name: ${order.bank_name}`, 16, finalY + 17);
    doc.text(`Bank A/c No: ${order.bank_account_number}`, 16, finalY + 23);
    doc.text(`IFSC Code: ${order.bank_ifsc}`, 16, finalY + 29);
  }

  doc.text("Sub Total:", 130, finalY + 12);
  doc.text(subTotal.toFixed(2), 190, finalY + 12, { align: "right" });
  
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", 130, finalY + 24);
  doc.text(subTotal.toFixed(2), 190, finalY + 24, { align: "right" });

  doc.line(14, finalY + 35, 196, finalY + 35);
  
  // Terms and conditions
  doc.setFontSize(8);
  doc.text("Terms & Condition:", 14, finalY + 40);
  doc.setFont("helvetica", "normal");
  const terms = order.invoice_terms ? order.invoice_terms.split('\n') : ['1. Goods once sold will not be taken back.', '2. Subject to jurisdiction only.'];
  terms.forEach((t, i) => {
    doc.text(t, 14, finalY + 45 + (i * 4));
  });

  doc.setFont("helvetica", "bold");
  doc.text(`For, ${order.shop_name || 'Authorized Signatory'}`, 130, finalY + 40);

  doc.save(`Invoice_INV-${order.id}.pdf`);
};
