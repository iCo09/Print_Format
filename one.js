const cors = require('cors');
const express = require('express');
const app = express();
const port = 3000;

// Middleware setup
app.use(express.json({ limit: '10mb' }));
app.use(cors({ origin: "*" }));

const puppeteer = require('puppeteer');
const printer = require('pdf-to-printer');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { JSDOM } = require('jsdom');

// PDF Generation Function (extracted from your generate-pdf-enhanced.js)
async function generatePDF(htmlFilePath) {
  const html = fs.readFileSync(htmlFilePath, 'utf8');

  // Parse HTML to extract header information
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const headerDiv = document.querySelector('.page-header');
  let headerData = { one: '', two: '' ,three:'',four:'',five:'',six:'',seven:'',eight:''};
  let cleanHtml;
  
  if (headerDiv) {
    const divs = headerDiv.querySelectorAll('div');
    if (divs.length >= 8) {
      headerData.one = divs[0].textContent.trim();
      headerData.two = divs[1].textContent.trim();
      headerData.three = divs[2].textContent.trim();
      headerData.four = divs[3].textContent.trim();
      headerData.five = divs[4].textContent.trim();
      headerData.six = divs[5].textContent.trim();
      headerData.seven = divs[6].textContent.trim();
      headerData.eight = divs[7].textContent.trim();
    }
    
    console.log('Extracted header data:', headerData);
    
    // Save header data to a JSON file
    fs.writeFileSync(
      path.join(__dirname, 'header-data.json'), 
      JSON.stringify(headerData, null, 2)
    );
    
    // Remove the header from the document
    headerDiv.parentNode.removeChild(headerDiv);
    
    // Get the cleaned HTML
    cleanHtml = dom.serialize();
  } else {
    cleanHtml = html;
    console.log('No page-header div found in the HTML');
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 900 });
    await page.setContent(cleanHtml, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');

    const pdfPath = path.join(__dirname, 'output.pdf');

    await page.pdf({
      path: pdfPath,
      printBackground: true,
      format: 'A4',
      margin: { top: '54mm', right: '8mm', bottom: '25mm', left: '8mm' },
      preferCSSPageSize: true,
      displayHeaderFooter: true,

      // Custom header using extracted data
      headerTemplate: `
    <table style="width:100%; border-collapse:collapse; margin-right:38px;margin-left:38px;border:4px solid #000;">
  <tr>
    <td style="padding:4px;">
      <!-- inner frame -->
      <table style="width:100%; border-collapse:collapse; border:2px solid #000;">
        <!-- Top row: Logo + Company Name -->
        <tr>
          <td style="width:18%; padding:6px; text-align:center; vertical-align:middle; border-right:2px solid #000;">
            <div style="font-size:11px; font-weight:bold;">COMPANY</div>
            <div style="font-size:11px; font-weight:bold;">LOGO</div>
          </td>
          <td style="padding:6px; text-align:center; font-size:16px; font-weight:bold;">
            ABCD PHARMACEUTICALS PVT. LTD.<br>
            <span style="font-size:11px; font-weight:normal;">Address</span>
          </td>
        </tr>

        <!-- Section title -->
        <tr>
          <td colspan="2" style="padding:3px; text-align:center; font-weight:bold; font-size:12px; border-top:2px solid #000; border-bottom:2px solid #000;">
            BATCH PRODUCTION AND CONTROL RECORD
          </td>
        </tr>

        <!-- Product / Batch / MFG / Expiry row -->
        <tr>
          <td colspan="2" style="padding:0;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="width:55%; border:1px solid #000; padding:6px; text-align:left;">
                  <div style="font-size:11px; font-weight:bold;">PRODUCT NAME</div>
                  <div style="font-size:12px; font-weight:bold;">${headerData.one}</div>
                </td>
                <td style="width:15%; border:1px solid #000; padding:6px; text-align:left;">
                  <div style="font-size:11px; font-weight:bold;">BATCH No.</div>
                  <div style="font-size:12px; font-weight:bold;">${headerData.two}</div>
                </td>
                <td style="width:15%; border:1px solid #000; padding:6px; text-align:left;">
                  <div style="font-size:11px; font-weight:bold;">MFG DATE</div>
                  <div style="font-size:12px; font-weight:bold;">${headerData.three}</div>
                </td>
                <td style="width:15%; border:1px solid #000; padding:6px; text-align:left;">
                  <div style="font-size:11px; font-weight:bold;">EXPIRY DATE</div>
                  <div style="font-size:12px; font-weight:bold;">${headerData.four}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Bottom details row -->
        <tr>
          <td colspan="2" style="padding:0;">
            <table style="width:100%; border-collapse:collapse;">
              <tr>
                <td style="width:25%; border:1px solid #000; padding:6px; text-align:center;">
                  <div style="font-size:10px;">MFR No.</div>
                  <div style="font-size:11px; font-weight:bold;">${headerData.five}</div>
                </td>
                <td style="width:25%; border:1px solid #000; padding:6px; text-align:center;">
                  <div style="font-size:10px;">BPCR No.</div>
                  <div style="font-size:11px; font-weight:bold;">${headerData.six}</div>
                </td>
                <td style="width:25%; border:1px solid #000; padding:6px; text-align:center;">
                  <div style="font-size:10px;">BATCH SIZE</div>
                  <div style="font-size:11px; font-weight:bold;">${headerData.seven}</div>
                </td>
                <td style="width:25%; border:1px solid #000; padding:6px; text-align:center;">
                  <div style="font-size:10px; text-align:center; width:100%; font-family:Arial;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

      `,

      // Footer with page numbers
      footerTemplate: `
        <div style="font-size:10px; text-align:center; width:100%; font-family:Arial;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });

    console.log('PDF generated:', pdfPath);
    console.log('Header data saved to: header-data.json');
    
    return pdfPath;
  } catch (err) {
    console.error('Error generating PDF:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

// Optional: Function to print the generated PDF
async function printPDF(pdfPath, printerName, printOptions = {}) {
  try {
    const options = {
      printer: printerName,
      ...printOptions
    };
    
    await printer.print(pdfPath, options);
    console.log(`PDF printed successfully to: ${printerName}`);
  } catch (err) {
    console.error('Error printing PDF:', err);
    throw err;
  }
}

app.get("/hi", (req, res) => {
  res.send("Hi, the API is working!");
});

// Main print endpoint
app.post('/print', async (req, res) => {
  const startTime = Date.now();
  const { 
    htmlContent, 
    printerName, 
    typeName,
    printOptions = {},
    generateOnly = false // Optional flag to only generate PDF without printing
  } = req.body;

  // Save HTML file
  const htmlFile = path.join(__dirname, `document1.html`);
  fs.writeFileSync(htmlFile, htmlContent, "utf8");

  console.log(`HTML saved at location: ${htmlFile}`);
  
  const hostName = os.hostname();
  console.log(`Host: ${hostName} // Printer: ${printerName}`);
  console.log(`HTML size: ${(Buffer.byteLength(htmlContent) / 1024).toFixed(2)} KB`);

  if (!htmlContent) {
    return res.status(400).send({ error: 'htmlContent is required' });
  }

  try {
    // Generate PDF from the saved HTML file
    const pdfPath = await generatePDF(htmlFile);
    
    let message = 'PDF generated successfully!';
    
    // If printer name is provided and generateOnly is false, also print the PDF
    if (printerName && !generateOnly) {
      await printPDF(pdfPath, printerName, printOptions);
      message = 'PDF generated and printed successfully!';
    }

    res.send({ 
      message,
      pdfPath,
      time: ((Date.now() - startTime) / 1000).toFixed(2) + 's'
    });

  } catch (err) {
    console.error('Process error:', err);
    res.status(500).send({ error: 'Process failed: ' + err.message });
  }
});

// New endpoint to only generate PDF without printing
app.post('/generate-pdf', async (req, res) => {
  const startTime = Date.now();
  const { htmlContent } = req.body;

  if (!htmlContent) {
    return res.status(400).send({ error: 'htmlContent is required' });
  }

  // Save HTML file
  const htmlFile = path.join(__dirname, `document1.html`);
  fs.writeFileSync(htmlFile, htmlContent, "utf8");

  try {
    const pdfPath = await generatePDF(htmlFile);
    
    res.send({ 
      message: 'PDF generated successfully!',
      pdfPath,
      time: ((Date.now() - startTime) / 1000).toFixed(2) + 's'
    });

  } catch (err) {
    console.error('PDF generation error:', err);
    res.status(500).send({ error: 'PDF generation failed: ' + err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    host: os.hostname()
  });
});

// Start server
// app.listen(port, () => {
//   console.log(`Print Server running at http://0.0.0.0:${port}`);
//   console.log(`Available endpoints:`);
//   console.log(`   POST /print - Generate PDF and optionally print with headers/footers`);
//   console.log(`   POST /generate-pdf - Generate PDF only (no printing)`);
//   console.log(`   GET /health - Health check`);
// });


app.listen(port, '0.0.0.0', () => {
  console.log(`Print Server running at http://0.0.0.0:${port}`);
  console.log(`Available endpoints:`);
  console.log(`   POST /print - Generate PDF and optionally print with headers/footers`);
  console.log(`   POST /generate-pdf - Generate PDF only (no printing)`);
  console.log(`   GET /health - Health check`);
  
  // Log network interfaces for debugging
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  console.log('\nServer accessible on:');
  Object.keys(networkInterfaces).forEach(interfaceName => {
    networkInterfaces[interfaceName].forEach(interface => {
      if (interface.family === 'IPv4' && !interface.internal) {
        console.log(`   http://${interface.address}:${port}`);
      }
    });
  });
});
