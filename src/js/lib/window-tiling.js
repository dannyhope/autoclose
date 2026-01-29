/**
 * Calculates optimal grid dimensions for tiling windows
 * @param {number} n - Number of windows to tile
 * @returns {{rows: number, cols: number}} Grid dimensions
 */
function calculateGrid(n) {
  const sqrt = Math.sqrt(n);
  let rows = Math.floor(sqrt);
  let cols = Math.ceil(n / rows);

  // Adjust if we need more columns
  while (rows * cols < n) {
    cols++;
  }

  return { rows, cols };
}

/**
 * Tiles all open tabs into individual windows arranged in a grid
 */
export async function tileAllTabs() {
  try {
    // Get all windows with their tabs
    const windows = await chrome.windows.getAll({ populate: true });

    // Collect all tabs from all windows
    const allTabs = [];
    for (const window of windows) {
      allTabs.push(...window.tabs);
    }

    if (allTabs.length === 0) {
      console.log('No tabs to tile');
      return;
    }

    // Calculate grid dimensions
    const grid = calculateGrid(allTabs.length);
    console.log(`Tiling ${allTabs.length} tabs in ${grid.rows}×${grid.cols} grid`);

    // Get screen dimensions (with fallbacks for background context)
    const screenWidth = self.screen?.availWidth || 1920;
    const screenHeight = self.screen?.availHeight || 1080;
    const width = Math.floor(screenWidth / grid.cols);
    const height = Math.floor(screenHeight / grid.rows);

    // Close all windows except the first one
    for (let i = 1; i < windows.length; i++) {
      await chrome.windows.remove(windows[i].id);
    }

    // Create individual windows for each tab and position them
    for (let i = 0; i < allTabs.length; i++) {
      const tab = allTabs[i];
      const row = Math.floor(i / grid.cols);
      const col = i % grid.cols;
      const left = col * width;
      const top = row * height;

      if (i === 0) {
        // Reuse the first window
        await chrome.windows.update(windows[0].id, {
          left,
          top,
          width,
          height,
          state: 'normal'
        });
      } else {
        // Create new window for each remaining tab
        await chrome.windows.create({
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
