import browser from 'webextension-polyfill';

function calculateGrid(n: number): { rows: number; cols: number } {
  const sqrt = Math.sqrt(n);
  let rows = Math.floor(sqrt);
  let cols = Math.ceil(n / rows);

  while (rows * cols < n) {
    cols++;
  }

  return { rows, cols };
}

export async function tileAllTabs(): Promise<void> {
  try {
    const windows = await browser.windows.getAll({ populate: true });

    const allTabs = windows.flatMap(window => window.tabs || []);

    if (allTabs.length === 0) {
      console.log('No tabs to tile');
      return;
    }

    const grid = calculateGrid(allTabs.length);
    console.log(`Tiling ${allTabs.length} tabs in ${grid.rows}×${grid.cols} grid`);

    const screenWidth = (self as any).screen?.availWidth || 1920;
    const screenHeight = (self as any).screen?.availHeight || 1080;
    const width = Math.floor(screenWidth / grid.cols);
    const height = Math.floor(screenHeight / grid.rows);

    for (let i = 1; i < windows.length; i++) {
      if (windows[i].id) {
        await browser.windows.remove(windows[i].id!);
      }
    }

    for (let i = 0; i < allTabs.length; i++) {
      const tab = allTabs[i];
      const row = Math.floor(i / grid.cols);
      const col = i % grid.cols;
      const left = col * width;
      const top = row * height;

      if (i === 0 && windows[0].id) {
        await browser.windows.update(windows[0].id, {
          left,
          top,
          width,
          height,
          state: 'normal'
        });
      } else if (tab.id) {
        await browser.windows.create({
          tabId: tab.id,
          left,
          top,
          width,
          height
        });
      }
    }

    console.log('Tiling complete');
  } catch (error) {
    console.error('Error tiling tabs:', error);
    throw error;
  }
}
