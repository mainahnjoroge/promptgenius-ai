const fs = require('fs');
const path = require('path');
const PDF2JSON = require('pdf2json');
const { Document, Packer, Paragraph, HeadingLevel } = require('docx');

async function extractTextFromPDF(pdfPath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDF2JSON();

    pdfParser.on('pdfParser_dataError', (errData) => {
      reject(new Error(errData.parserError));
    });

    pdfParser.on('pdfParser_dataReady', (pdfData) => {
      let text = '';

      // Extract text from pages
      pdfData.Pages.forEach((page) => {
        if (page.Texts) {
          page.Texts.forEach((textObj) => {
            // Get text and decode if needed
            try {
              const rawText = textObj.R[0].T;
              const decodedText = /%/.test(rawText) ? decodeURIComponent(rawText) : rawText;
              text += decodedText + ' ';
            } catch (e) {
              // If decoding fails, use raw text
              text += textObj.R[0].T + ' ';
            }
          });
        }
        text += '\n';
      });

      resolve(text);
    });

    pdfParser.loadPDF(pdfPath);
  });
}

async function convertPDFToDocx(pdfPath, docxPath) {
  try {
    console.log(`📄 Extracting text from: ${path.basename(pdfPath)}`);
    const text = await extractTextFromPDF(pdfPath);

    // Split text into paragraphs
    const lines = text.split('\n');

    const paragraphs = [];
    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.length === 0) {
        continue;
      }

      // Detect headers (all caps, short lines)
      const isAllCaps = /^[A-Z0-9\s\-–—:.,'"()&]+$/.test(trimmed);
      const isShortLine = trimmed.length < 100;
      const isLikelyHeader = isAllCaps && isShortLine && trimmed.length > 5;

      if (isLikelyHeader) {
        paragraphs.push(
          new Paragraph({
            text: trimmed,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 200, after: 100 },
          })
        );
      } else {
        paragraphs.push(
          new Paragraph({
            text: trimmed,
            spacing: { after: 80 },
          })
        );
      }
    }

    const doc = new Document({
      sections: [
        {
          children: paragraphs.length > 0 ? paragraphs : [new Paragraph('No content extracted')],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(docxPath, buffer);
    console.log(`✅ Created: ${path.basename(docxPath)}`);
  } catch (error) {
    console.error(`❌ Error converting ${path.basename(pdfPath)}:`, error.message);
  }
}

async function main() {
  const docsDir = path.join(__dirname, 'docs');

  if (!fs.existsSync(docsDir)) {
    console.error(`❌ Docs directory not found: ${docsDir}`);
    process.exit(1);
  }

  const conversions = [
    {
      pdf: path.join(docsDir, 'PromptGenius-AI-Business-Brief.pdf'),
      docx: path.join(docsDir, 'PromptGenius-AI-Business-Brief.docx'),
    },
    {
      pdf: path.join(docsDir, 'PromptGenius-AI-Explained.pdf'),
      docx: path.join(docsDir, 'PromptGenius-AI-Explained.docx'),
    },
  ];

  console.log('🔄 Converting PDFs to Word documents...\n');

  for (const { pdf: pdfPath, docx: docxPath } of conversions) {
    if (fs.existsSync(pdfPath)) {
      await convertPDFToDocx(pdfPath, docxPath);
    } else {
      console.log(`⚠️  File not found: ${path.basename(pdfPath)}`);
    }
  }

  console.log('\n✨ Conversion complete!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
