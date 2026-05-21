import { PDFDocument, rgb, StandardFonts, PageSizes } from 'pdf-lib';

export type PageSize = 'A4' | 'A4_LANDSCAPE';

interface GridOptions {
  pageSize: PageSize;
  rows: number;
  cols: number;
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

const menuColors: Record<string, { fill: number[]; text: number[] }> = {
  'menu 1': { fill: [0.86, 0.28, 0.2], text: [1, 1, 1] },
  'menu 2': { fill: [0.12, 0.53, 0.9], text: [1, 1, 1] },
  'menu 3': { fill: [0.12, 0.7, 0.2], text: [0, 0, 0] },
};

const pickColor = (value: string) => {
  const normalized = value.toLowerCase();
  const key = Object.keys(menuColors).find((name) => normalized.includes(name)) ?? 'menu 1';
  return menuColors[key];
};

function createGridPage(pdfDoc: PDFDocument, options: GridOptions) {
  const { width, height } = getPageDimensions(options.pageSize);
  const page = pdfDoc.addPage([width, height]);
  const margin = 20;
  const cellWidth = (width - margin * 2) / options.cols;
  const cellHeight = (height - margin * 2) / options.rows;
  return { page, cellWidth, cellHeight, margin };
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
    pageData.page.drawText(text, {
      x: x - 10,
      y: y - 12,
      size: 16,
      font,
      color: rgb(0, 0, 0),
      maxWidth: pageData.cellWidth - 20,
    });
  };

  while (itemIndex < names.length) {
    const cellsPerPage = options.rows * options.cols;
    const pageItems = names.slice(itemIndex, itemIndex + cellsPerPage);
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

  const drawMenu = (item: { value: string }, row: number, col: number) => {
    const x = pageData.margin + col * pageData.cellWidth;
    const y = pageData.height - pageData.margin - row * pageData.cellHeight;
    const text = item.value;

    if (options.colored) {
      const color = pickColor(item.value);
      pageData.page.drawRectangle({
        x,
        y: y - pageData.cellHeight,
        width: pageData.cellWidth,
        height: pageData.cellHeight,
        color: rgb(...color.fill),
      });
      pageData.page.drawText(text, {
        x: x + 10,
        y: y - 30,
        size: 14,
        font,
        color: rgb(...color.text),
        maxWidth: pageData.cellWidth - 20,
      });
    } else {
      pageData.page.drawText(text, {
        x: x + 10,
        y: y - 30,
        size: 14,
        font,
        color: rgb(0, 0, 0),
        maxWidth: pageData.cellWidth - 20,
      });
    }
  };

  while (itemIndex < menus.length) {
    const cellsPerPage = options.rows * options.cols;
    const pageItems = menus.slice(itemIndex, itemIndex + cellsPerPage);
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
