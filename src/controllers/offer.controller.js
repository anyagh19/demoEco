import { Offer } from "../models/offer.model.js";
import { apiResponse } from '../utils/apiResponse.js'
import apiError from '../utils/apiError.js'
import { asyncHandler } from "../utils/asyncHandler.js";
import puppeteer from 'puppeteer';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const generatePDF = async (data) => {
  // Render HTML from EJS template and data
  const templatePath = path.join(__dirname, '../templates/offerPDF.ejs');
  const html = await ejs.renderFile(templatePath, data);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = await page.pdf({ format: 'A4' });
  await browser.close();
  return pdfBuffer;
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
  } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new apiError(400, "atleast one item is required")
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
      totalAmount
    };
  })

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
    grandTotal
  });

  const pdfData = {
    ...newOffer.toObject()
  };
  const pdfBuffer = await generatePDF(pdfData);

  // Optionally: save PDF to disk or return for download/email
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename=offer.pdf',
  });
  res.send(pdfBuffer);
})

const getOffer = asyncHandler(async (req, res) => {
  const offers = await Offer.find().sort({ createdAt: -1 }); // optional: newest first
  return res
          .status(200)
          .render("allOffer", {offers})
});

// Get single offer by ID and generate PDF
const getOfferById = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) {
    throw new apiError(404, "Offer not found");
  }

  const pdfData = {
    ...offer.toObject()
  };

  const pdfBuffer = await generatePDF(pdfData);
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'inline; filename=offer_<%= offer.projectName %>.pdf'
  });
  res.send(pdfBuffer);
});



export {
  createOffer,
  generatePDF,
  getOffer,
  getOfferById
}