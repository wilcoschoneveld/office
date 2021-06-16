import { invert, linearRegression, matmul, transpose } from "./math";

function assertMatrix(matrix: number[][], expected: number[][]) {
    for (const [ri, row] of matrix.entries()) {
        for (const [ci, val] of row.entries()) {
            expect(val).toBeCloseTo(expected[ri][ci], 5);
        }
    }
}

test("adds 1 + 2 to equal 3", () => {
    expect(1 + 2).toBe(3);
});

test("transpose", () => {
    const matrix = [
        [1, 2],
        [5, 2],
    ];

    const result = transpose(matrix);

    expect(result).toStrictEqual([
        [1, 5],
        [2, 2],
    ]);
});

test("transpose bigger", () => {
    const matrix = [
        [1, 2, 5],
        [5, 2, 3],
        [1, 3, 5],
        [0, 1, 2],
    ];

    const result = transpose(matrix);

    expect(result).toStrictEqual([
        [1, 5, 1, 0],
        [2, 2, 3, 1],
        [5, 3, 5, 2],
    ]);
});

test("matmul", () => {
    const matrix1 = [
        [1, 1],
        [0.5, 2],
    ];

    const matrix2 = [
        [1, 0.5],
        [1, 2],
    ];

    const result = matmul(matrix1, matrix2);

    expect(result).toStrictEqual([
        [2, 2.5],
        [2.5, 4.25],
    ]);
});

test("matmul bigger", () => {
    const matrix1 = [
        [2.25, -0.75, -1.25, 0.75],
        [-1.55, 1.15, 1.35, -0.95],
        [0.25, -0.25, -0.25, 0.25],
    ];
    const matrix2 = [
        [-0.5, 0.8, 2],
        [-0.3, 0.5, 2.4],
        [-0.2, 0.4, 2.8],
        [0.1, 0.3, 2.9],
    ];

    const result = matmul(matrix1, matrix2);

    const expected = [
        [-0.575, 1.15, 1.375],
        [0.065, -0.41, 0.685],
        [0.025, 0.05, -0.075],
    ];

    assertMatrix(result, expected);
});

test("invert", () => {
    const matrix = [
        [1, 2],
        [3, 4],
    ];

    const result = invert(matrix);

    const expected = [
        [-2, 1],
        [1.5, -0.5],
    ];

    assertMatrix(result, expected);
});

test("linear regression", () => {
    const points = [
        [-0.5, 0.8, 2],
        [0.1, 0.3, 2.9],
    ];

    const points_time = [1, 4];

    const theta = linearRegression(points, points_time);

    const X_expect = [
        // each row is [1, t]
        [1, 1],
        [1, 4],
    ];

    const result = matmul(X_expect, theta);

    assertMatrix(points, result);
});

test("linear regression same point", () => {
    const points = [
        [-0.5, 0.8, 2],
        [-0.5, 0.8, 2],
    ];

    const points_time = [1, 4];

    const theta = linearRegression(points, points_time);

    const expected = [points[0], [0, 0, 0]];

    assertMatrix(theta, expected);
});

test("linear regression fail", () => {
    const points = [
        [-0.5, 0.8, 2],
        [0.1, 0.3, 2.9],
    ];

    const points_time = [1, 1];

    expect(() => linearRegression(points, points_time)).toThrow(Error);
});

export {};
