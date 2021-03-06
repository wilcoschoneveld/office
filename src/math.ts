import * as math from "mathjs";

export function transpose(matrix: number[][]): number[][] {
    return matrix[0].map((_, i) => matrix.map((row) => row[i]));
}

export function matmul(matrix1: number[][], matrix2: number[][]): number[][] {
    return matrix1.map((row, r) =>
        matrix2[0].map((___, c) => row.map((v, i) => v * matrix2[i][c]).reduce((a, b) => a + b, 0))
    );
}

export function invert(matrix: number[][]): number[][] {
    const determinant = matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0];

    if (determinant == 0) {
        throw new Error("Matrix cannot be inverted");
    }

    const result = [
        [matrix[1][1] / determinant, -matrix[0][1] / determinant],
        [-matrix[1][0] / determinant, matrix[0][0] / determinant],
    ];

    return result;
}

export function linearRegression(points: number[][], point_times: number[]): number[][] {
    const X = point_times.map((t) => [1, t]);
    const Xt = transpose(X);
    const theta = matmul(matmul(invert(matmul(Xt, X)), Xt), points);
    return theta;
}

export function linearRegression3(points: number[][], point_times: number[]): number[][] {
    const X = point_times.map((t) => [1, t, t * t]);
    const Xt = math.transpose(X);
    const theta = math.multiply(math.multiply(math.inv(math.multiply(Xt, X)), Xt), points);
    return theta;
}
