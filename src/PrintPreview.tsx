import { PageSize } from './pdf';

interface PreviewPageProps {
  items: Array<{ [key: string]: string }>;
  itemsPerPage: number;
  rows: number;
  cols: number;
  pageSize: PageSize;
  showGrid: boolean;
  renderCell: (item: { [key: string]: string }) => React.ReactNode;
}

export function PrintPreview({
  items,
  itemsPerPage,
  rows,
  cols,
  pageSize,
  showGrid,
  renderCell,
}: PreviewPageProps) {
  const isLandscape = pageSize === 'A4_LANDSCAPE';
  const pages: Array<Array<{ [key: string]: string } | null>> = [];

  let currentPage: Array<{ [key: string]: string } | null> = [];
  for (let i = 0; i < items.length; i++) {
    currentPage.push(items[i]);
    if (currentPage.length === itemsPerPage) {
      pages.push(currentPage);
      currentPage = [];
    }
  }
  if (currentPage.length > 0) {
    while (currentPage.length < itemsPerPage) {
      currentPage.push(null);
    }
    pages.push(currentPage);
  }

  const aspectRatio = isLandscape ? 297 / 210 : 210 / 297; // A4 dimensions
  const pageWidth = 600;
  const pageHeight = pageWidth / aspectRatio;
  const cellWidth = (pageWidth - 40) / cols;
  const cellHeight = (pageHeight - 40) / rows;

  return (
    <div className="print-preview">
      <div className="print-preview-controls">
        <p className="print-info">
          {pages.length} page{pages.length !== 1 ? 's' : ''} ({items.length} item{items.length !== 1 ? 's' : ''})
        </p>
      </div>
      <div className="print-pages">
        {pages.map((pageItems, pageIndex) => (
          <div
            key={pageIndex}
            className={`print-page ${isLandscape ? 'landscape' : 'portrait'}`}
            style={{
              width: pageWidth,
              height: pageHeight,
              aspectRatio: isLandscape ? '297/210' : '210/297',
            }}
          >
            <div
              className="print-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gridTemplateRows: `repeat(${rows}, 1fr)`,
                gap: 0,
                padding: '20px',
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              {pageItems.map((item, index) => (
                <div
                  key={index}
                  className="print-cell"
                  style={{
                    border: showGrid ? '1px solid #ccc' : '1px solid #f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '8px',
                    overflow: 'hidden',
                    backgroundColor: item ? '#fff' : '#f9f9f9',
                  }}
                >
                  {item && renderCell(item)}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
