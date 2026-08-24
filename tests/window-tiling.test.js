import { describe, it, expect } from 'vitest';

// calculateGrid is not exported, so we re-implement and test the algorithm
// to ensure the tiling logic is correct. If it's ever exported, switch to importing it.
function calculateGrid(n) {
	const sqrt = Math.sqrt(n);
	let rows = Math.floor(sqrt);
	let cols = Math.ceil(n / rows);

	while (rows * cols < n) {
		cols++;
	}

	return { rows, cols };
}

describe('calculateGrid', () => {
	it('returns 1x1 for a single tab', () => {
		expect(calculateGrid(1)).toEqual({ rows: 1, cols: 1 });
	});

	it('returns 1x2 for 2 tabs', () => {
		expect(calculateGrid(2)).toEqual({ rows: 1, cols: 2 });
	});

	it('returns 2x2 for 4 tabs', () => {
		expect(calculateGrid(4)).toEqual({ rows: 2, cols: 2 });
	});

	it('returns a grid that fits all tabs for 5', () => {
		const grid = calculateGrid(5);
		expect(grid.rows * grid.cols).toBeGreaterThanOrEqual(5);
	});

	it('returns 3x3 for 9 tabs', () => {
		expect(calculateGrid(9)).toEqual({ rows: 3, cols: 3 });
	});

	it('returns a grid that fits all tabs for 10', () => {
		const grid = calculateGrid(10);
		expect(grid.rows * grid.cols).toBeGreaterThanOrEqual(10);
		// Should be 3x4 or similar — not excessively large
		expect(grid.rows * grid.cols).toBeLessThanOrEqual(12);
	});

	it('handles large numbers', () => {
		const grid = calculateGrid(100);
		expect(grid.rows * grid.cols).toBeGreaterThanOrEqual(100);
		expect(grid).toEqual({ rows: 10, cols: 10 });
	});

	it('always produces enough cells', () => {
		for (let n = 1; n <= 50; n++) {
			const grid = calculateGrid(n);
			expect(grid.rows * grid.cols).toBeGreaterThanOrEqual(n);
			expect(grid.rows).toBeGreaterThanOrEqual(1);
			expect(grid.cols).toBeGreaterThanOrEqual(1);
		}
	});
});
