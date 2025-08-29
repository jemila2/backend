// services/pdfService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');

const generateInvoicePDF = (invoice, customer, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    // Header
    doc.fontSize(20).text('LAUNDRY SERVICE', { align: 'center' });
    doc.fontSize(10).text('123 Clean Street, Laundry City', { align: 'center' });
    doc.moveDown();
    
    // Invoice info
    doc.fontSize(14).text(`Invoice #${invoice.invoiceNumber}`, { underline: true });
    doc.fontSize(10).text(`Date: ${invoice.createdAt.toDateString()}`);
    doc.text(`Due Date: ${invoice.dueDate.toDateString()}`);
    doc.moveDown();
    
    // Customer info
    doc.text(`Customer: ${customer.name}`);
    doc.text(`Phone: ${customer.phone}`);
    doc.text(`Address: ${customer.address}`);
    doc.moveDown();
    
    // Invoice items table
    const tableTop = doc.y;
    doc.font('Helvetica-Bold');
    doc.text('Description', 50, tableTop);
    doc.text('Qty', 300, tableTop, { width: 50, align: 'right' });
    doc.text('Price', 350, tableTop, { width: 100, align: 'right' });
    doc.text('Total', 450, tableTop, { width: 100, align: 'right' });
    doc.font('Helvetica');
    
    let y = tableTop + 25;
    invoice.items.forEach(item => {
      doc.text(item.description, 50, y);
      doc.text(item.quantity.toString(), 300, y, { width: 50, align: 'right' });
      doc.text(`$${item.price.toFixed(2)}`, 350, y, { width: 100, align: 'right' });
      doc.text(`$${item.total.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
      y += 20;
    });
    
    // Totals
    doc.moveTo(50, y).lineTo(550, y).stroke();
    y += 20;
    doc.text('Subtotal:', 350, y, { width: 100, align: 'right' });
    doc.text(`$${invoice.subtotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
    y += 20;
    doc.text(`Tax (${invoice.taxRate || 0}%):`, 350, y, { width: 100, align: 'right' });
    doc.text(`$${invoice.tax.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
    y += 20;
    doc.text('Discount:', 350, y, { width: 100, align: 'right' });
    doc.text(`-$${invoice.discount.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
    y += 20;
    doc.font('Helvetica-Bold');
    doc.text('GRAND TOTAL:', 350, y, { width: 100, align: 'right' });
    doc.text(`$${invoice.grandTotal.toFixed(2)}`, 450, y, { width: 100, align: 'right' });
    
    doc.end();
    
    stream.on('finish', () => resolve(filePath));
    stream.on('error', reject);
  });
};

module.exports = { generateInvoicePDF };