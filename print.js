// generate-pdf-enhanced.js
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { JSDOM } = require('jsdom');

(async () => {
  const htmlPath = path.join(__dirname, 'document1.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  // Parse HTML to extract header information
  const dom = new JSDOM(html);
  const document = dom.window.document;
  
  const headerDiv = document.querySelector('.page-header');
  let headerData = { left: '', right: '' };
  
  if (headerDiv) {
    const divs = headerDiv.querySelectorAll('div');
    if (divs.length >= 2) {
      headerData.left = divs[0].textContent.trim();
      headerData.right = divs[1].textContent.trim();
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

    await page.pdf({
      path: 'output.pdf',
      printBackground: true,
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '25mm', left: '20mm' },
      preferCSSPageSize: true,
      displayHeaderFooter: true,

      // Custom header using extracted data
      headerTemplate: `
        <div style="font-size:10px; text-align:left; width:100%; padding:5px 20px; font-family:Arial;">
          <div style="font-size:12px; text-align:center; font-weight:bold;">
            ${headerData.left || 'NESTORBIRD PVT LTD.'}
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:4px;">
            <span>PRODUCT NAME: ${headerData.left || 'NESTORBIRD PVT LTD.'}</span>
            <span>BATCH No.: XYZ2500X</span>
            <span>MFG DATE: JAN 2025</span>
            <span>EXPIRY DATE: DEC 2026</span>
          </div>
          <div style="display:flex; justify-content:space-between; margin-top:2px;">
            <span>MFR No.: ABCDE/MFR/PL/001</span>
            <span>BPCR No.: ABCDE/MFR/PL/001</span>
            <span>BATCH SIZE: 5000 ltrs.</span>
          </div>
        </div>
      `,

      // Footer with page numbers
      footerTemplate: `
        <div style="font-size:10px; text-align:center; width:100%; font-family:Arial;">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `
    });

    console.log('PDF generated: output.pdf');
    console.log('Header data saved to: header-data.json');
  } catch (err) {
    console.error('Error generating PDF:', err);
  } finally {
    await browser.close();
  }
})();