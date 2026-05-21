import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

export type PageSize = 'A4' | 'A4_LANDSCAPE';

interface GridOptions {
  pageSize: PageSize;
  rows: number;
  cols: number;
  showGrid?: boolean;
}

interface NameTagOptions extends GridOptions {}

interface MealCouponOptions extends GridOptions {
  colored: boolean;
}

const getPageDimensions = (pageSize: PageSize) => {
  if (pageSize === 'A4_LANDSCAPE') {
    return { width: PageSizes.A4[1], height: PageSizes.A4[0] };
  }
  return { width: PageSizes.A4[0], height: PageSizes.A4[1] };
};

const colorPalette = [
  { fill: [0.86, 0.28, 0.2], text: [1, 1, 1] }, // red
  { fill: [0.12, 0.53, 0.9], text: [1, 1, 1] }, // blue
  { fill: [0.12, 0.7, 0.2], text: [0, 0, 0] }, // green
  { fill: [0.96, 0.62, 0.06], text: [1, 1, 1] }, // amber
  { fill: [0.55, 0.33, 0.96], text: [1, 1, 1] }, // purple
  { fill: [0.93, 0.29, 0.6], text: [1, 1, 1] }, // pink
];

const getColorForMenu = (menuValue: string, allMenus: string[]): { fill: number[]; text: number[] } => {
  const uniqueMenus = Array.from(new Set(allMenus)).sort();
  const index = uniqueMenus.indexOf(menuValue);
  return colorPalette[index % colorPalette.length];
};

const drawGridLines = (
  page: any,
  margin: number,
  width: number,
  height: number,
  rows: number,
  cols: number,
  cellWidth: number,
  cellHeight: number,
) => {
  const lineColor = rgb(0.8, 0.8, 0.8);
  
  // Draw vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = margin + i * cellWidth;
    page.drawLine({
      start: { x, y: margin },
      end: { x, y: height - margin },
      color: lineColor,
      thickness: 0.5,
    });
  }
  
  // Draw horizontal lines
  for (let i = 0; i <= rows; i++) {
    const y = height - margin - i * cellHeight;
    page.drawLine({
      start: { x: margin, y },
      end: { x: width - margin, y },
      color: lineColor,
      thickness: 0.5,
    });
  }
};

function createGridPage(pdfDoc: PDFDocument, options: GridOptions) {
  const { width, height } = getPageDimensions(options.pageSize);
  const page = pdfDoc.addPage([width, height]);
  const margin = 20;
  const cellWidth = (width - margin * 2) / options.cols;
  const cellHeight = (height - margin * 2) / options.rows;
  return { page, cellWidth, cellHeight, margin, width, height };
}

export async function generateNameTagPdf(
  names: Array<{ firstName: string; lastName: string }>,
  options: NameTagOptions,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let pageData = createGridPage(pdfDoc, options);
  let itemIndex = 0;

  const drawName = (item: { firstName: string; lastName: string }, row: number, col: number) => {
    const x = pageData.margin + col * pageData.cellWidth + pageData.cellWidth / 2;
    const y = pageData.height - pageData.margin - row * pageData.cellHeight - pageData.cellHeight / 2;
    const text = `${item.firstName} ${item.lastName}`;
    
    const textWidth = font.widthOfTextAtSize(text, 14);
    const canFitAtSize14 = textWidth <= pageData.cellWidth - 20;
    const fontSize = canFitAtSize14 ? 14 : 12;
    
    pageData.page.drawText(text, {
      x: x - (font.widthOfTextAtSize(text, fontSize) / 2),
      y: y - 6,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: pageData.cellWidth - 20,
    });
  };

  while (itemIndex < names.length) {
    const cellsPerPage = options.rows * options.cols;
    const pageItems = names.slice(itemIndex, itemIndex + cellsPerPage);
    
    if (options.showGrid) {
      drawGridLines(
        pageData.page,
        pageData.margin,
        pageData.width,
        pageData.height,
        options.rows,
        options.cols,
        pageData.cellWidth,
        pageData.cellHeight,
      );
    }
    
    pageItems.forEach((item, index) => {
      const row = Math.floor(index / options.cols);
      const col = index % options.cols;
      drawName(item, row, col);
    });
    
    itemIndex += pageItems.length;
    if (itemIndex < names.length) {
      pageData = createGridPage(pdfDoc, options);
    }
  }

  return pdfDoc.save();
}

export async function generateMealCouponPdf(
  menus: Array<{ value: string }>,
  options: MealCouponOptions,
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  let pageData = createGridPage(pdfDoc, options);
  let itemIndex = 0;
  
  const allMenuValues = menus.map((m) => m.value);

  const drawMenu = (item: { value: string }, row: number, col: number) => {
    const x = pageData.margin + col * pageData.cellWidth;
    const y = pageData.height - pageData.margin - row * pageData.cellHeight;
    const text = item.value;

    if (options.colored) {
      const color = getColorForMenu(item.value, allMenuValues);
      pageData.page.drawRectangle({
        x,
        y: y - pageData.cellHeight,
        width: pageData.cellWidth,
        height: pageData.cellHeight,
        color: rgb(...color.fill),
      });
      
      const textWidth = font.widthOfTextAtSize(text, 12);
      const canFitAtSize12 = textWidth <= pageData.cellWidth - 20;
      const fontSize = canFitAtSize12 ? 12 : 10;
      
      pageData.page.drawText(text, {
        x: x + (pageData.cellWidth - font.widthOfTextAtSize(text, fontSize)) / 2,
        y: y - pageData.cellHeight / 2 - 6,
        size: fontSize,
        font,
        color: rgb(...color.text),
        maxWidth: pageData.cellWidth - 20,
      });
    } else {
      const textWidth = font.widthOfTextAtSize(text, 12);
      const canFitAtSize12 = textWidth <= pageData.cellWidth - 20;
      const fontSize = canFitAtSize12 ? 12 : 10;
      
      pageData.page.drawText(text, {
        x: x + (pageData.cellWidth - font.widthOfTextAtSize(text, fontSize)) / 2,
        y: y - pageData.cellHeight / 2 - 6,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
        maxWidth: pageData.cellWidth - 20,
      });
    }
  };

  while (itemIndex < menus.length) {
    const cellsPerPage = options.rows * options.cols;
    const pageItems = menus.slice(itemIndex, itemIndex + cellsPerPage);
    
    if (options.showGrid) {
      drawGridLines(
        pageData.page,
        pageData.margin,
        pageData.width,
        pageData.height,
        options.rows,
        options.cols,
        pageData.cellWidth,
        pageData.cellHeight,
      );
    }
    
    pageItems.forEach((item, index) => {
      const row = Math.floor(index / options.cols);
      const col = index % options.cols;
      drawMenu(item, row, col);
    });
    
    itemIndex += pageItems.length;
    if (itemIndex < menus.length) {
      pageData = createGridPage(pdfDoc, options);
    }
  }

  return pdfDoc.save();
}
