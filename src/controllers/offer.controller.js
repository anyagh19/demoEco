import { Offer } from "../models/offer.model.js";
import apiError from '../utils/apiError.js';
import { asyncHandler } from "../utils/asyncHandler.js";
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';

// Helper: Format number with commas
const formatCurrency = (n) => n?.toLocaleString('en-IN', { maximumFractionDigits: 2 });

const generatePDF = async (data) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 }); // Initial margin of 50

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    return new Promise((resolve, reject) => {
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });

        doc.on('error', reject);

        // Define content area margins for consistent layout
        const contentLeft = 50;
        const contentRight = doc.page.width - 50;
        const contentWidth = contentRight - contentLeft; // 595.28 - 100 = 495.28

        // --- Helper to draw a full page content wrapper border ---
        const drawContentWrapperBorder = () => {
            doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke('#000000');
        };

        // Helper to calculate text height for a given width
        const getTextHeight = (text, width, fontSize = 10, font = 'Helvetica') => {
            doc.font(font).fontSize(fontSize);
            return doc.heightOfString(text, { width: width });
        };


        // ============== PAGE 1 ==============
        drawContentWrapperBorder();

        // Load logo
        const logoPath = path.join(process.cwd(), 'public', '12577-comp-image.png');
        if (fs.existsSync(logoPath)) {
            doc.image(logoPath, contentLeft, 50, { width: 80 });
        } else {
            console.warn('Logo image not found at:', logoPath);
            doc.fontSize(10).text('Logo Missing', contentLeft, 50);
        }

        // Company Name
        doc.fontSize(18).font('Helvetica-Bold').text('Ecomatrix Solutions', contentLeft + 100, 50, { width: contentWidth - 100, align: 'center' }); // Adjusted X and width

        // Address details
        doc.fontSize(10).font('Helvetica').text(
            'Registered Address: Flat no 3, Second Floor, Golande Building,\nNear Chhatrapati Shivaji Maharaj Statue, Pimpri, Pune - 411017, Maharashtra, India',
            contentLeft, // Start at contentLeft
            80,
            { align: 'center', width: contentWidth } // Confine to content width
        );

        // Contact info line
        doc.fontSize(9).text('Contact: +91 9766474241    |    Email: sachin@ecomatrix.in    |    www.ecomatrix.in',
            contentLeft,
            120,
            { align: 'center', width: contentWidth }
        );

        // Line under contact info
        doc.moveTo(contentLeft, doc.y + 10)
            .lineTo(contentRight, doc.y + 10)
            .stroke();
        doc.moveDown(1.5);

        // Main Title
        doc.fontSize(14).font('Helvetica-Bold')
            .text('Techno - Commercial Offer for Garbage Chutes System', contentLeft, doc.y, { align: 'center', width: contentWidth, underline: true });
        doc.moveDown();

        // Offer Details (Ref No., Date, etc.)
        const offerIdShort = data._id?.toString().slice(-3) || '001';
        doc.fontSize(10).font('Helvetica');
        const proposalRefY = doc.y;

        // Using precise positioning for these elements to avoid overflow
        doc.text(`Proposal Ref No: GCS/${new Date().getFullYear()}/${offerIdShort}`, contentLeft, proposalRefY);
        doc.text(`Revision No: 2`, contentLeft + contentWidth / 2 - doc.widthOfString('Revision No: 2') / 2, proposalRefY); // Center within its column
        doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, contentRight - doc.widthOfString(`Date: ${new Date().toLocaleDateString('en-GB')}`), proposalRefY);
        doc.moveDown();


        // Line under offer details
        doc.moveTo(contentLeft, doc.y + 10)
            .lineTo(contentRight, doc.y + 10)
            .stroke();
        doc.moveDown(1.5);

        // PROJECT DETAILS header with background
        const projectDetailsHeaderY = doc.y;
        doc.rect(contentLeft, projectDetailsHeaderY, contentWidth, 20)
            .fill('#f3f4f6')
            .fillColor('black');
        doc.font('Helvetica-Bold').fontSize(12).text('PROJECT DETAILS', contentLeft, projectDetailsHeaderY + 5, { align: 'center', width: contentWidth });
        doc.moveDown(2);

        // Project details table
        let currentY = doc.y;
        const cellPadding = 5;
        const col1Start = contentLeft;
        const col2Start = contentLeft + contentWidth / 2; // Exactly half the content width
        const defaultRowHeight = 18; // Default, but can be overridden

        const eachColWidth = contentWidth / 2;

        const drawDetailRowWithBorders = (y, label1, val1, label2, val2) => {
            const currentFont = 'Helvetica'; // Assume Helvetica for content
            const currentFontSize = 10;
            const labelFont = 'Helvetica-Bold';

            // Calculate height for each cell's content
            const val1Content = `${label1}: ${val1 || '-'}`;
            const val2Content = `${label2}: ${val2 || '-'}`;

            const val1Height = getTextHeight(val1Content, eachColWidth - cellPadding * 2, currentFontSize, currentFont);
            const val2Height = getTextHeight(val2Content, eachColWidth - cellPadding * 2, currentFontSize, currentFont);

            // Row height is determined by the tallest cell content
            const calculatedRowHeight = Math.max(val1Height, val2Height) + cellPadding * 2; // Add padding top/bottom


            // Left cell
            doc.rect(col1Start, y, eachColWidth, calculatedRowHeight).stroke();
            const val1TextY = y + (calculatedRowHeight - val1Height) / 2; // Vertically center
            doc.font(labelFont).fontSize(currentFontSize).text(`${label1}: `, col1Start + cellPadding, val1TextY, { continued: true });
            doc.font(currentFont).text(`${val1 || '-'}`, { width: eachColWidth - doc.widthOfString(label1 + ': ') - cellPadding * 2 });


            // Right cell
            doc.rect(col2Start, y, eachColWidth, calculatedRowHeight).stroke();
            const val2TextY = y + (calculatedRowHeight - val2Height) / 2; // Vertically center
            doc.font(labelFont).fontSize(currentFontSize).text(`${label2}: `, col2Start + cellPadding, val2TextY, { continued: true });
            doc.font(currentFont).text(`${val2 || '-'}`, { width: eachColWidth - doc.widthOfString(label2 + ': ') - cellPadding * 2 });

            return calculatedRowHeight; // Return the height used for this row
        };

        currentY += drawDetailRowWithBorders(currentY, 'Client Name', data.clientName, 'Type of Garbage Chutes', data.typeOfChute);
        currentY += drawDetailRowWithBorders(currentY, 'Project Name', data.projectName, 'MOC of Garbage Chutes', data.materialOfChute);
        currentY += drawDetailRowWithBorders(currentY, 'Project Location', data.projectLocation, 'Diameter of Chutes (mm)', data.diameterOfChute);
        currentY += drawDetailRowWithBorders(currentY, 'No. of Towers', data.numberOfTower, 'Thickness (mm)', data.thicknessOfChute);
        currentY += drawDetailRowWithBorders(currentY, 'Tower Name', data.towerName, 'No. of Openings', data.numberOfOpening);


        doc.moveDown(2);

        // Letter section - crucial for controlling text flow
        doc.fontSize(10).font('Helvetica');
        const textIndent = 20; // Matches your desired indent
        const letterTextWidth = contentWidth - textIndent * 2; // Calculate available width for the indented text

        doc.text(`Kind Attn: Mr. ${data.clientName || 'Client Name'}`, contentLeft + textIndent, doc.y, { width: letterTextWidth });
        doc.moveDown();
        doc.text('Subject: Offer for Garbage Chute System', contentLeft + textIndent, doc.y, { width: letterTextWidth });
        doc.moveDown();
        doc.text(
            `Dear Sir,\n\nWith reference to your requirement for the Garbage Chute System and our discussion with your goodself, we are pleased to submit our Techno-commercial proposal for the same.\n\nWe hope you find our proposal in line with your requirements and look forward to receiving your valued order at the earliest.\n\nOur offer consists of the following:\n\n1. Bill of Quantities\n2. Commercial Terms\n3. Client's Scope / Schedule of Exclusions\n4. Other Terms\n5. Few Esteemed Customers\n`,
            contentLeft + textIndent, doc.y, // Explicitly set x, y for the start of the block
            { width: letterTextWidth, align: 'justify' }
        );
        doc.moveDown();
        doc.text(
            `Assuring you of our best services at all times. Kindly get in touch with us for any queries. Also, please visit our website www.ecomatrix.in to know more about us.\n\nThanks and Regards,\n\nSachin Talreja\nPartner\nMob No: +91 9766474241`,
            contentLeft + textIndent, doc.y, // Explicitly set x, y for the start of the block
            { align: 'left', width: letterTextWidth }
        );


        // ============== PAGE 2: BOQ SECTION ==============
        doc.addPage();
        drawContentWrapperBorder(); // Apply border to the new page

        // Title for BOQ
        const boqTitleY = doc.y;
        doc.rect(contentLeft, boqTitleY - 5, contentWidth, 20)
            .fill('#f3f4f6')
            .fillColor('black');
        doc.fontSize(13).font('Helvetica-Bold')
            .text('1. BILL OF QUANTITIES (BOQ)', contentLeft, boqTitleY, { align: 'center', width: contentWidth })
            .moveDown(1.5);

        // Table configuration
        const tableTop = doc.y;
        const tableLeft = contentLeft;
        const boqCellPadding = 5; // Padding inside BOQ table cells

        // Column widths - Ensure these sum up to contentWidth
        const col = {
            sr: 30,
            item: 70,
            description: 190,
            unit: 50,
            qty: 40,
            rate: 60,
            total: 55,
        };

        const totalTableWidth = Object.values(col).reduce((a, b) => a + b, 0);

        if (Math.abs(totalTableWidth - contentWidth) > 1) {
            console.warn(`BOQ table column widths (${totalTableWidth}) do not sum to contentWidth (${contentWidth}). Adjusting.`);
        }


        // --- Draw BOQ Header ---
        const boqHeaderRowHeight = 20;
        doc.rect(tableLeft, tableTop, contentWidth, boqHeaderRowHeight).fill('#f3f4f6').fillColor('black');

        doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
        let currentHeaderX = tableLeft;
        const headerTextY = tableTop + (boqHeaderRowHeight - getTextHeight('Sr.', col.sr - boqCellPadding * 2, 10, 'Helvetica-Bold')) / 2; // Vertically center header text

        doc.text('Sr.', currentHeaderX + boqCellPadding, headerTextY, { width: col.sr - boqCellPadding * 2, align: 'center' });
        doc.rect(currentHeaderX, tableTop, col.sr, boqHeaderRowHeight).stroke();
        currentHeaderX += col.sr;

        doc.text('Item', currentHeaderX + boqCellPadding, headerTextY, { width: col.item - boqCellPadding * 2, align: 'left' });
        doc.rect(currentHeaderX, tableTop, col.item, boqHeaderRowHeight).stroke();
        currentHeaderX += col.item;

        doc.text('Description', currentHeaderX + boqCellPadding, headerTextY, { width: col.description - boqCellPadding * 2, align: 'left' });
        doc.rect(currentHeaderX, tableTop, col.description, boqHeaderRowHeight).stroke();
        currentHeaderX += col.description;

        doc.text('Unit', currentHeaderX + boqCellPadding, headerTextY, { width: col.unit - boqCellPadding * 2, align: 'center' });
        doc.rect(currentHeaderX, tableTop, col.unit, boqHeaderRowHeight).stroke();
        currentHeaderX += col.unit;

        doc.text('Qty', currentHeaderX + boqCellPadding, headerTextY, { width: col.qty - boqCellPadding * 2, align: 'center' });
        doc.rect(currentHeaderX, tableTop, col.qty, boqHeaderRowHeight).stroke();
        currentHeaderX += col.qty;

        doc.text('Rate (INR)', currentHeaderX + boqCellPadding, headerTextY, { width: col.rate - boqCellPadding * 2, align: 'right' });
        doc.rect(currentHeaderX, tableTop, col.rate, boqHeaderRowHeight).stroke();
        currentHeaderX += col.rate;

        doc.text('Total (INR)', currentHeaderX + boqCellPadding, headerTextY, { width: col.total - boqCellPadding * 2, align: 'right' });
        doc.rect(currentHeaderX, tableTop, col.total, boqHeaderRowHeight).stroke();

        // --- Table rows for items ---
        doc.font('Helvetica').fontSize(10);
        let currentBoqY = tableTop + boqHeaderRowHeight;

        (data.items || []).forEach((item, i) => {
            // Calculate height for each cell's content, especially Description
            const srHeight = getTextHeight(`${i + 1}`, col.sr - boqCellPadding * 2);
            const itemHeight = getTextHeight(item.itemName || '-', col.item - boqCellPadding * 2);
            const descriptionHeight = getTextHeight(item.description || '-', col.description - boqCellPadding * 2);
            const unitHeight = getTextHeight(item.unit || '-', col.unit - boqCellPadding * 2);
            const qtyHeight = getTextHeight(item.qty?.toString() || '0', col.qty - boqCellPadding * 2);
            const rateHeight = getTextHeight(formatCurrency(item.rate), col.rate - boqCellPadding * 2);
            const totalHeight = getTextHeight(formatCurrency(item.totalAmount), col.total - boqCellPadding * 2);

            // Determine the maximum height required for this row
            const maxContentHeight = Math.max(srHeight, itemHeight, descriptionHeight, unitHeight, qtyHeight, rateHeight, totalHeight);
            const actualBoqRowHeight = maxContentHeight + boqCellPadding * 2; // Add top/bottom padding


            // Check for page break before drawing row
            if (currentBoqY + actualBoqRowHeight > doc.page.height - 70) {
                doc.addPage();
                drawContentWrapperBorder();
                currentBoqY = 50; // Reset Y for new page

                // Re-draw header on new page
                doc.rect(tableLeft, currentBoqY, contentWidth, boqHeaderRowHeight).fill('#f3f4f6').fillColor('black');
                doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
                let newPageHeaderX = tableLeft;
                const newPageHeaderTextY = currentBoqY + (boqHeaderRowHeight - getTextHeight('Sr.', col.sr - boqCellPadding * 2, 10, 'Helvetica-Bold')) / 2;

                doc.text('Sr.', newPageHeaderX + boqCellPadding, newPageHeaderTextY, { width: col.sr - boqCellPadding * 2, align: 'center' });
                doc.rect(newPageHeaderX, currentBoqY, col.sr, boqHeaderRowHeight).stroke();
                newPageHeaderX += col.sr;

                doc.text('Item', newPageHeaderX + boqCellPadding, newPageHeaderTextY, { width: col.item - boqCellPadding * 2, align: 'left' });
                doc.rect(newPageHeaderX, currentBoqY, col.item, boqHeaderRowHeight).stroke();
                newPageHeaderX += col.item;

                doc.text('Description', newPageHeaderX + boqCellPadding, newPageHeaderTextY, { width: col.description - boqCellPadding * 2, align: 'left' });
                doc.rect(newPageHeaderX, currentBoqY, col.description, boqHeaderRowHeight).stroke();
                newPageHeaderX += col.description;

                doc.text('Unit', newPageHeaderX + boqCellPadding, newPageHeaderTextY, { width: col.unit - boqCellPadding * 2, align: 'center' });
                doc.rect(newPageHeaderX, currentBoqY, col.unit, boqHeaderRowHeight).stroke();
                newPageHeaderX += col.unit;

                doc.text('Qty', newPageHeaderX + boqCellPadding, newPageHeaderTextY, { width: col.qty - boqCellPadding * 2, align: 'center' });
                doc.rect(newPageHeaderX, currentBoqY, col.qty, boqHeaderRowHeight).stroke();
                newPageHeaderX += col.qty;

                doc.text('Rate (INR)', newPageHeaderX + boqCellPadding, newPageHeaderTextY, { width: col.rate - boqCellPadding * 2, align: 'right' });
                doc.rect(newPageHeaderX, currentBoqY, col.rate, boqHeaderRowHeight).stroke();
                newPageHeaderX += col.rate;

                doc.text('Total (INR)', newPageHeaderX + boqCellPadding, newPageHeaderTextY, { width: col.total - boqCellPadding * 2, align: 'right' });
                doc.rect(newPageHeaderX, currentBoqY, col.total, boqHeaderRowHeight).stroke();

                currentBoqY += boqHeaderRowHeight; // Adjust y after re-drawing header
            }

            // Draw background for alternate rows
            if (i % 2 === 1) {
                doc.rect(tableLeft, currentBoqY, contentWidth, actualBoqRowHeight).fill('#f9fafb').fillColor('black');
            } else {
                doc.fillColor('black');
            }

            let itemColX = tableLeft;

            // Draw content and individual cell borders, vertically centered
            const drawCell = (text, width, align, textHeight) => {
                const textY = currentBoqY + (actualBoqRowHeight - textHeight) / 2;
                doc.text(text, itemColX + boqCellPadding, textY, { width: width - boqCellPadding * 2, align: align });
                doc.rect(itemColX, currentBoqY, width, actualBoqRowHeight).stroke();
                itemColX += width;
            };

            drawCell(`${i + 1}`, col.sr, 'center', srHeight);
            drawCell(item.itemName || '-', col.item, 'left', itemHeight);
            drawCell(item.description || '-', col.description, 'left', descriptionHeight);
            drawCell(item.unit || '-', col.unit, 'center', unitHeight);
            drawCell(item.qty?.toString() || '0', col.qty, 'center', qtyHeight);
            drawCell(formatCurrency(item.rate), col.rate, 'right', rateHeight);
            drawCell(formatCurrency(item.totalAmount), col.total, 'right', totalHeight);

            currentBoqY += actualBoqRowHeight;
        });

        // --- Totals section ---
        doc.font('Helvetica').fontSize(10); // Reset font after table items

        const totalLabelColStartX = contentLeft + col.sr + col.item + col.description + col.unit + col.qty; // Where the labels start
        const totalValueColStartX = totalLabelColStartX + col.rate; // Where the values start

        const totalLabelWidth = col.rate; // The space for "Sub Total", "Tax", "Grand Total"
        const totalValueWidth = col.total; // The space for the actual amounts


        // Subtotal row
        const subTotalLabel = 'Sub Total';
        const subTotalHeight = Math.max(
            getTextHeight(subTotalLabel, totalLabelWidth - boqCellPadding * 2, 10, 'Helvetica-Bold'),
            getTextHeight(formatCurrency(data.subTotal), totalValueWidth - boqCellPadding * 2)
        ) + boqCellPadding * 2;

        doc.rect(tableLeft, currentBoqY, contentWidth, subTotalHeight).stroke();
        doc.font('Helvetica-Bold').fillColor('black');
        doc.text(subTotalLabel, totalLabelColStartX + boqCellPadding, currentBoqY + (subTotalHeight - getTextHeight(subTotalLabel, totalLabelWidth - boqCellPadding * 2, 10, 'Helvetica-Bold')) / 2, { width: totalLabelWidth - boqCellPadding * 2, align: 'right' });
        doc.font('Helvetica').text(formatCurrency(data.subTotal), totalValueColStartX + boqCellPadding, currentBoqY + (subTotalHeight - getTextHeight(formatCurrency(data.subTotal), totalValueWidth - boqCellPadding * 2)) / 2, { width: totalValueWidth - boqCellPadding * 2, align: 'right' });
        currentBoqY += subTotalHeight;

        // Tax row
        const taxLabel = `Tax (${data.taxPercentage}%)`;
        const taxHeight = Math.max(
            getTextHeight(taxLabel, totalLabelWidth - boqCellPadding * 2, 10, 'Helvetica-Bold'),
            getTextHeight(formatCurrency(data.taxAmount), totalValueWidth - boqCellPadding * 2)
        ) + boqCellPadding * 2;

        doc.rect(tableLeft, currentBoqY, contentWidth, taxHeight).stroke();
        doc.font('Helvetica-Bold').fillColor('black');
        doc.text(taxLabel, totalLabelColStartX + boqCellPadding, currentBoqY + (taxHeight - getTextHeight(taxLabel, totalLabelWidth - boqCellPadding * 2, 10, 'Helvetica-Bold')) / 2, { width: totalLabelWidth - boqCellPadding * 2, align: 'right' });
        doc.font('Helvetica').text(formatCurrency(data.taxAmount), totalValueColStartX + boqCellPadding, currentBoqY + (taxHeight - getTextHeight(formatCurrency(data.taxAmount), totalValueWidth - boqCellPadding * 2)) / 2, { width: totalValueWidth - boqCellPadding * 2, align: 'right' });
        currentBoqY += taxHeight;


        // Grand Total row
        const grandTotalLabel = 'Grand Total';
        const grandTotalFontSize = 12;
        const grandTotalHeight = Math.max(
            getTextHeight(grandTotalLabel, totalLabelWidth - boqCellPadding * 2, grandTotalFontSize, 'Helvetica-Bold'),
            getTextHeight(formatCurrency(data.grandTotal), totalValueWidth - boqCellPadding * 2, grandTotalFontSize)
        ) + boqCellPadding * 2;

        doc.font('Helvetica-Bold').fontSize(grandTotalFontSize);
        doc.rect(tableLeft, currentBoqY, contentWidth, grandTotalHeight).fill('#e5e7eb').stroke('#000000');
        doc.fillColor('black');
        doc.text(grandTotalLabel, totalLabelColStartX + boqCellPadding, currentBoqY + (grandTotalHeight - getTextHeight(grandTotalLabel, totalLabelWidth - boqCellPadding * 2, grandTotalFontSize, 'Helvetica-Bold')) / 2, { width: totalLabelWidth - boqCellPadding * 2, align: 'right' });
        doc.text(formatCurrency(data.grandTotal), totalValueColStartX + boqCellPadding, currentBoqY + (grandTotalHeight - getTextHeight(formatCurrency(data.grandTotal), totalValueWidth - boqCellPadding * 2, grandTotalFontSize)) / 2, { width: totalValueWidth - boqCellPadding * 2, align: 'right' });

        doc.end();
    });
};

// ... (rest of your controllers remain unchanged) ...
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