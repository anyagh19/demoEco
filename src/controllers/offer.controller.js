import { Offer } from "../models/offer.model.js";
import { apiResponse } from '../utils/apiResponse.js';
import apiError from '../utils/apiError.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import getStream from 'get-stream';

// Helper: Format number with commas
const formatCurrency = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const generatePDF = async (data) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  // Collect chunks of PDF as buffer
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });

    // ====== PAGE 1 ======

    // Header: Logo & Company Info
    doc.image('public/logo.png', 50, 50, { width: 80 }); // Replace with path to your server logo
    doc.fontSize(18).text('Ecomatrix Solutions', 150, 50, { align: 'center' });
    doc.fontSize(10).text(
      'Registered Address: Flat no 3, Second Floor, Golande Building,\nNear Chhatrapati Shivaji Maharaj Statue, Pimpri, Pune - 411017, Maharashtra, India',
      { align: 'center' }
    );
    doc.moveDown();
    doc.fontSize(9).text('Contact: +91 9766474241   |   Email: sachin@ecomatrix.in   |   www.ecomatrix.in', {
      align: 'center'
    });

    doc.moveDown().moveDown();

    // Title
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text('Techno - Commercial Offer for Garbage Chutes System', { align: 'center', underline: true });

    doc.moveDown();

    // Offer Details (Ref No., Date, etc.)
    const offerIdShort = data._id?.toString().slice(-3) || '001';
    doc.fontSize(10);
    doc.text(`Proposal Ref No: GCS/${new Date().getFullYear()}/${offerIdShort}`, { continued: true }).text('   ', {
      continued: true
    });
    doc.text(`Revision No: 2`, { continued: true }).text('   ');
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`);

    doc.moveDown();

    // PROJECT DETAILS
    doc.font('Helvetica-Bold').text('PROJECT DETAILS', { align: 'center' });
    doc.moveDown(0.5);

    const detailRow = (label1, val1, label2, val2) => {
      doc
        .font('Helvetica-Bold')
        .text(`${label1}: `, { continued: true })
        .font('Helvetica')
        .text(`${val1 || '-'}`, { continued: true })
        .text('    ', { continued: true })
        .font('Helvetica-Bold')
        .text(`${label2}: `, { continued: true })
        .font('Helvetica')
        .text(`${val2 || '-'}`);
    };

    detailRow('Client Name', data.clientName, 'Type of Garbage Chutes', data.typeOfChute);
    detailRow('Project Name', data.projectName, 'MOC of Garbage Chutes', data.materialOfChute);
    detailRow('Project Location', data.projectLocation, 'Diameter of Chutes (mm)', data.diameterOfChute);
    detailRow('No. of Towers', data.numberOfTower, 'Thickness (mm)', data.thicknessOfChute);
    detailRow('Tower Name', data.towerName, 'No. of Openings', data.numberOfOpening);

    doc.moveDown();

    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Kind Attn: Mr. ${data.clientName || 'Client Name'}`)
      .moveDown()
      .text('Subject: Offer for Garbage Chute System')
      .moveDown();

    doc.text(
      `Dear Sir,\n\nWith reference to your requirement for the Garbage Chute System and our discussion with your goodself, we are pleased to submit our Techno-commercial proposal for the same.\n\nWe hope you find our proposal in line with your requirements and look forward to receiving your valued order at the earliest.\n\nOur offer consists of the following:\n\n1. Bill of Quantities\n2. Commercial Terms\n3. Client's Scope / Schedule of Exclusions\n4. Other Terms\n5. Few Esteemed Customers\n`
    );

    doc.text(
      `Assuring you of our best services at all times. Kindly get in touch with us for any queries. Also, please visit our website www.ecomatrix.in to know more about us.\n\nThanks and Regards,\n\nSachin Talreja\nPartner\nMob No: +91 9766474241`,
      { align: 'left' }
    );

    // ===== PAGE BREAK for BOQ =====
    doc.addPage();

    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('1. BILL OF QUANTITIES (BOQ)', { align: 'center' })
      .moveDown();

    // Table headers
    const tableTop = doc.y + 10;
    const itemX = 60;
    const descX = 130;
    const unitX = 320;
    const qtyX = 370;
    const rateX = 430;
    const amountX = 500;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Sr.', itemX, tableTop);
    doc.text('Item', itemX + 20, tableTop);
    doc.text('Description', descX, tableTop);
    doc.text('Unit', unitX, tableTop);
    doc.text('Qty', qtyX, tableTop);
    doc.text('Rate', rateX, tableTop);
    doc.text('Total', amountX, tableTop);
    doc.moveDown();

    // Items
    doc.font('Helvetica');
    const items = data.items || [];
    let y = tableTop + 15;

    items.forEach((item, i) => {
      doc.text(`${i + 1}`, itemX, y);
      doc.text(item.itemName || '-', itemX + 20, y);
      doc.text(item.description || '-', descX, y, { width: 180 });
      doc.text(item.unit || '-', unitX, y);
      doc.text(item.qty?.toString() || '0', qtyX, y);
      doc.text(formatCurrency(item.rate), rateX, y, { align: 'right' });
      doc.text(formatCurrency(item.totalAmount), amountX, y, { align: 'right' });
      y += 20;

      if (y > 700) {
        doc.addPage();
        y = 60;
      }
    });

    // Totals
    doc.moveDown().moveTo(60, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc
      .font('Helvetica-Bold')
      .text('Subtotal:', 430, doc.y, { continued: true })
      .text(formatCurrency(data.subTotal), { align: 'right' });

    doc
      .text(`Tax (${data.taxPercentage}%):`, 430, doc.y, { continued: true })
      .text(formatCurrency(data.taxAmount), { align: 'right' });

    doc
      .fontSize(12)
      .text(`Grand Total:`, 430, doc.y, { continued: true })
      .text(formatCurrency(data.grandTotal), { align: 'right' });

    doc.end(); // Finalize PDF
  });
};





const createOffer = asyncHandler(async (req, res) => {
  const {
    projectName,
    clientName,
    projectLocation,
    numberOfTower,
    towerName,
    typeOfChute,
    materialOfChute,
    diameterOfChute,
    thicknessOfChute,
    numberOfOpening,
    items
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new apiError(400, "At least one item is required");
  }

  const processedItems = items.map((item) => {
    const qty = Number(item.qty) || 0;
    const rate = Number(item.rate) || 0;
    const totalAmount = qty * rate;

    return {
      itemName: item.itemName,
      description: item.description,
      unit: item.unit,
      qty,
      rate,
      totalAmount,
    };
  });

  const subTotal = processedItems.reduce((sum, item) => sum + item.totalAmount, 0);
  const taxPercentage = 18;
  const taxAmount = (subTotal * taxPercentage) / 100;
  const grandTotal = subTotal + taxAmount;

  const newOffer = await Offer.create({
    projectName,
    clientName,
    projectLocation,
    numberOfTower,
    towerName,
    typeOfChute,
    materialOfChute,
    diameterOfChute,
    thicknessOfChute,
    numberOfOpening,
    items: processedItems,
    subTotal,
    taxPercentage,
    taxAmount,
    grandTotal,
    createdBy: req.user._id
  });

  const pdfData = { ...newOffer.toObject() };
  const pdfBuffer = await generatePDF(pdfData);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename=offer.pdf',
  });
  res.send(pdfBuffer);
});


const getOffer = asyncHandler(async (req, res) => {
  const offers = await Offer.find().sort({ createdAt: -1 });
  return res.status(200).render("allOffer", { offers });
});


const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) {
    throw new apiError(404, "Offer not found");
  }

  const pdfData = { ...offer.toObject() };
  const pdfBuffer = await generatePDF(pdfData);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline; filename=offer.pdf'
  });
  res.send(pdfBuffer);
});


const getOfferByUserId = asyncHandler(async (req, res) => {
  const offers = await Offer.find({ createdBy: req.user._id });
  return res.render("allOffer", { offers });
});


export {
  createOffer,
  generatePDF,
  getOffer,
  getOfferById,
  getOfferByUserId
};
