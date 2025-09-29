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



// Main print endpoint
app.post('/print', async (req, res) => {
  const startTime = Date.now();
  const { 
    htmlContent, 
    printerName, 
    typeName,
    printOptions = {}
  } = req.body;
  const timestamp = Date.now();

  // save HTML file
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
    // 👉 Your existing PDF generation + printing logic goes here
    // Example:
    // await generatePdfAndPrint(htmlFile, printerName, typeName, printOptions);

    res.send({ 
      message: 'Printed successfully!',
      time: ((Date.now() - startTime) / 1000).toFixed(2) + 's'
    });

  } catch (err) {
    console.error('Print error:', err);
    res.status(500).send({ error: 'Print failed: ' + err.message });
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
app.listen(port, () => {
  console.log(`Print Server running at http://localhost:${port}`);
  console.log(`Available endpoints:`);
  console.log(`   POST /print - Print documents with forced repeating headers/footers`);
  console.log(`   GET /health - Health check`);
});