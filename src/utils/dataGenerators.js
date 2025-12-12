/**
 * Data generation utilities for UMAP tutorial
 * Generates various synthetic datasets for visualization
 */

// Generate random number from normal distribution using Box-Muller transform
function randomNormal(mean = 0, std = 1) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * std + mean;
}

/**
 * Generate Gaussian blob clusters
 * @param {number} nSamples - Total number of samples
 * @param {number} nClusters - Number of clusters
 * @param {number} nDimensions - Number of dimensions
 * @param {number} clusterStd - Standard deviation within clusters
 * @returns {Object} { data, labels, centers }
 */
export function generateBlobs(nSamples = 300, nClusters = 5, nDimensions = 10, clusterStd = 1.0) {
  const data = [];
  const labels = [];
  const samplesPerCluster = Math.floor(nSamples / nClusters);

  // Generate random cluster centers
  const centers = [];
  for (let c = 0; c < nClusters; c++) {
    const center = [];
    for (let d = 0; d < nDimensions; d++) {
      center.push(randomNormal(0, 5));
    }
    centers.push(center);
  }

  // Generate points around centers
  for (let c = 0; c < nClusters; c++) {
    const numPoints = c === nClusters - 1 ? nSamples - data.length : samplesPerCluster;
    for (let i = 0; i < numPoints; i++) {
      const point = [];
      for (let d = 0; d < nDimensions; d++) {
        point.push(randomNormal(centers[c][d], clusterStd));
      }
      data.push(point);
      labels.push(c);
    }
  }

  return { data, labels, centers };
}

/**
 * Generate 3D Gaussian blobs for 3D visualization
 * @param {number} nSamples - Total number of samples
 * @param {number} nClusters - Number of clusters
 * @param {number} clusterStd - Standard deviation within clusters
 * @returns {Object} { data, labels }
 */
export function generate3DBlobs(nSamples = 200, nClusters = 4, clusterStd = 0.5) {
  const data = [];
  const labels = [];
  const samplesPerCluster = Math.floor(nSamples / nClusters);

  // Predefined cluster centers for nice visualization
  const centers = [
    [2, 2, 2],
    [-2, 2, -2],
    [2, -2, -2],
    [-2, -2, 2],
    [0, 3, 0],
  ].slice(0, nClusters);

  for (let c = 0; c < nClusters; c++) {
    const numPoints = c === nClusters - 1 ? nSamples - data.length : samplesPerCluster;
    for (let i = 0; i < numPoints; i++) {
      const point = [
        randomNormal(centers[c][0], clusterStd),
        randomNormal(centers[c][1], clusterStd),
        randomNormal(centers[c][2], clusterStd),
      ];
      data.push(point);
      labels.push(c);
    }
  }

  return { data, labels };
}

/**
 * Generate concentric circles (rings)
 * @param {number} nSamples - Total number of samples
 * @param {number} nRings - Number of rings
 * @param {number} noise - Amount of noise to add
 * @returns {Object} { data, labels }
 */
export function generateCircles(nSamples = 300, nRings = 3, noise = 0.05) {
  const data = [];
  const labels = [];
  const samplesPerRing = Math.floor(nSamples / nRings);

  for (let ring = 0; ring < nRings; ring++) {
    const radius = 1 + ring * 0.8;
    const numPoints = ring === nRings - 1 ? nSamples - data.length : samplesPerRing;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI + randomNormal(0, 0.1);
      const r = radius + randomNormal(0, noise);
      data.push([
        r * Math.cos(angle),
        r * Math.sin(angle),
      ]);
      labels.push(ring);
    }
  }

  return { data, labels };
}

/**
 * Generate two interleaving moons
 * @param {number} nSamples - Total number of samples
 * @param {number} noise - Amount of noise to add
 * @returns {Object} { data, labels }
 */
export function generateMoons(nSamples = 300, noise = 0.1) {
  const data = [];
  const labels = [];
  const samplesPerMoon = Math.floor(nSamples / 2);

  // First moon (upper)
  for (let i = 0; i < samplesPerMoon; i++) {
    const angle = (i / samplesPerMoon) * Math.PI;
    data.push([
      Math.cos(angle) + randomNormal(0, noise),
      Math.sin(angle) + randomNormal(0, noise),
    ]);
    labels.push(0);
  }

  // Second moon (lower, shifted)
  for (let i = 0; i < nSamples - samplesPerMoon; i++) {
    const angle = (i / (nSamples - samplesPerMoon)) * Math.PI;
    data.push([
      1 - Math.cos(angle) + randomNormal(0, noise),
      0.5 - Math.sin(angle) + randomNormal(0, noise),
    ]);
    labels.push(1);
  }

  return { data, labels };
}

/**
 * Generate Swiss Roll dataset
 * @param {number} nSamples - Total number of samples
 * @param {number} noise - Amount of noise to add
 * @returns {Object} { data, labels, data2D } - data is 3D, data2D is the unrolled version
 */
export function generateSwissRoll(nSamples = 500, noise = 0.5) {
  const data = [];
  const data2D = [];
  const labels = [];

  for (let i = 0; i < nSamples; i++) {
    const t = 1.5 * Math.PI * (1 + 2 * Math.random());
    const height = 21 * Math.random();

    data.push([
      t * Math.cos(t) + randomNormal(0, noise),
      height + randomNormal(0, noise),
      t * Math.sin(t) + randomNormal(0, noise),
    ]);

    // Unrolled position for coloring
    data2D.push([t, height]);
    labels.push(Math.floor(t)); // Color by angle
  }

  // Normalize labels to 0-4 range
  const minLabel = Math.min(...labels);
  const maxLabel = Math.max(...labels);
  const normalizedLabels = labels.map(l =>
    Math.floor(((l - minLabel) / (maxLabel - minLabel)) * 4)
  );

  return { data, labels: normalizedLabels, data2D };
}

/**
 * Generate simplified MNIST-like digit patterns
 * Each "digit" is a 16-dimensional vector representing a simplified pattern
 * @param {number} nSamples - Total number of samples
 * @returns {Object} { data, labels }
 */
export function generateDigits(nSamples = 500) {
  const data = [];
  const labels = [];
  const samplesPerDigit = Math.floor(nSamples / 10);

  // Create prototype patterns for each digit (16D representation)
  const prototypes = [
    [1,1,1,1, 1,0,0,1, 1,0,0,1, 1,1,1,1], // 0
    [0,1,1,0, 0,0,1,0, 0,0,1,0, 0,1,1,1], // 1
    [1,1,1,1, 0,0,1,1, 1,1,0,0, 1,1,1,1], // 2
    [1,1,1,1, 0,0,1,1, 0,0,1,1, 1,1,1,1], // 3
    [1,0,0,1, 1,1,1,1, 0,0,0,1, 0,0,0,1], // 4
    [1,1,1,1, 1,1,0,0, 0,0,1,1, 1,1,1,1], // 5
    [1,1,1,1, 1,0,0,0, 1,1,1,1, 1,1,1,1], // 6
    [1,1,1,1, 0,0,0,1, 0,0,1,0, 0,1,0,0], // 7
    [1,1,1,1, 1,1,1,1, 1,0,0,1, 1,1,1,1], // 8
    [1,1,1,1, 1,1,1,1, 0,0,0,1, 1,1,1,1], // 9
  ];

  for (let digit = 0; digit < 10; digit++) {
    const numPoints = digit === 9 ? nSamples - data.length : samplesPerDigit;
    for (let i = 0; i < numPoints; i++) {
      const point = prototypes[digit].map(v =>
        v + randomNormal(0, 0.2) // Add noise
      );
      data.push(point);
      labels.push(digit);
    }
  }

  return { data, labels };
}

/**
 * Generate a 2D dataset for demonstrating k-NN (visible clusters)
 * @param {number} nSamples - Total number of samples
 * @param {number} nClusters - Number of clusters
 * @returns {Object} { data, labels }
 */
export function generate2DClusters(nSamples = 100, nClusters = 4) {
  const data = [];
  const labels = [];
  const samplesPerCluster = Math.floor(nSamples / nClusters);

  // Spread out cluster centers
  const centers = [
    [2, 2],
    [-2, 2],
    [-2, -2],
    [2, -2],
    [0, 0],
  ].slice(0, nClusters);

  for (let c = 0; c < nClusters; c++) {
    const numPoints = c === nClusters - 1 ? nSamples - data.length : samplesPerCluster;
    for (let i = 0; i < numPoints; i++) {
      data.push([
        randomNormal(centers[c][0], 0.5),
        randomNormal(centers[c][1], 0.5),
      ]);
      labels.push(c);
    }
  }

  return { data, labels };
}

/**
 * Generate dataset with varying density clusters
 * @param {number} nSamples - Total number of samples
 * @returns {Object} { data, labels }
 */
export function generateVaryingDensity(nSamples = 300) {
  const data = [];
  const labels = [];

  // Dense cluster (lots of points, small area)
  const denseCount = Math.floor(nSamples * 0.4);
  for (let i = 0; i < denseCount; i++) {
    data.push([
      randomNormal(-2, 0.3),
      randomNormal(0, 0.3),
    ]);
    labels.push(0);
  }

  // Medium density cluster
  const mediumCount = Math.floor(nSamples * 0.35);
  for (let i = 0; i < mediumCount; i++) {
    data.push([
      randomNormal(2, 0.7),
      randomNormal(0, 0.7),
    ]);
    labels.push(1);
  }

  // Sparse cluster (few points, large area)
  const sparseCount = nSamples - denseCount - mediumCount;
  for (let i = 0; i < sparseCount; i++) {
    data.push([
      randomNormal(0, 1.5),
      randomNormal(3, 1.5),
    ]);
    labels.push(2);
  }

  return { data, labels };
}

// Color palettes for visualization
export const CLUSTER_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#22c55e', // green
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

export const DIGIT_COLORS = [
  '#3b82f6', // 0 - blue
  '#ef4444', // 1 - red
  '#22c55e', // 2 - green
  '#f59e0b', // 3 - amber
  '#8b5cf6', // 4 - purple
  '#ec4899', // 5 - pink
  '#06b6d4', // 6 - cyan
  '#f97316', // 7 - orange
  '#84cc16', // 8 - lime
  '#6366f1', // 9 - indigo
];

/**
 * Compute Euclidean distance between two points
 */
export function euclideanDistance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += (a[i] - b[i]) ** 2;
  }
  return Math.sqrt(sum);
}

/**
 * Find k nearest neighbors for a point
 * @param {Array} data - Dataset
 * @param {number} pointIndex - Index of the query point
 * @param {number} k - Number of neighbors
 * @returns {Array} Array of { index, distance } objects
 */
export function findKNN(data, pointIndex, k) {
  const distances = [];

  for (let i = 0; i < data.length; i++) {
    if (i !== pointIndex) {
      distances.push({
        index: i,
        distance: euclideanDistance(data[pointIndex], data[i]),
      });
    }
  }

  distances.sort((a, b) => a.distance - b.distance);
  return distances.slice(0, k);
}

/**
 * Compute pairwise distance matrix
 * @param {Array} data - Dataset
 * @returns {Array} 2D array of distances
 */
export function computeDistanceMatrix(data) {
  const n = data.length;
  const distances = Array(n).fill(null).map(() => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = euclideanDistance(data[i], data[j]);
      distances[i][j] = d;
      distances[j][i] = d;
    }
  }

  return distances;
}

/**
 * Simple PCA implementation for comparison with UMAP
 * @param {Array} data - 2D array of data points
 * @param {number} nComponents - Number of components to return
 * @returns {Array} Projected data
 */
export function simplePCA(data, nComponents = 2) {
  const n = data.length;
  const d = data[0].length;

  // Compute mean
  const mean = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      mean[j] += data[i][j] / n;
    }
  }

  // Center data
  const centered = data.map(point =>
    point.map((val, j) => val - mean[j])
  );

  // Compute covariance matrix
  const cov = Array(d).fill(null).map(() => Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      let sum = 0;
      for (let k = 0; k < n; k++) {
        sum += centered[k][i] * centered[k][j];
      }
      cov[i][j] = sum / (n - 1);
    }
  }

  // Power iteration for top eigenvectors (simplified)
  const eigenvectors = [];
  for (let comp = 0; comp < nComponents; comp++) {
    let vec = new Array(d).fill(0).map(() => Math.random() - 0.5);

    // Orthogonalize against previous eigenvectors
    for (let prev = 0; prev < eigenvectors.length; prev++) {
      const dot = vec.reduce((sum, v, i) => sum + v * eigenvectors[prev][i], 0);
      vec = vec.map((v, i) => v - dot * eigenvectors[prev][i]);
    }

    // Power iteration
    for (let iter = 0; iter < 100; iter++) {
      // Matrix-vector multiply
      const newVec = new Array(d).fill(0);
      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
          newVec[i] += cov[i][j] * vec[j];
        }
      }

      // Orthogonalize
      for (let prev = 0; prev < eigenvectors.length; prev++) {
        const dot = newVec.reduce((sum, v, i) => sum + v * eigenvectors[prev][i], 0);
        for (let i = 0; i < d; i++) {
          newVec[i] -= dot * eigenvectors[prev][i];
        }
      }

      // Normalize
      const norm = Math.sqrt(newVec.reduce((sum, v) => sum + v * v, 0));
      vec = newVec.map(v => v / norm);
    }

    eigenvectors.push(vec);
  }

  // Project data
  const projected = centered.map(point => {
    return eigenvectors.map(ev =>
      point.reduce((sum, val, i) => sum + val * ev[i], 0)
    );
  });

  return projected;
}

/**
 * Normalize data to [0, 1] range per dimension
 */
export function normalizeData(data) {
  const d = data[0].length;
  const mins = new Array(d).fill(Infinity);
  const maxs = new Array(d).fill(-Infinity);

  for (const point of data) {
    for (let i = 0; i < d; i++) {
      mins[i] = Math.min(mins[i], point[i]);
      maxs[i] = Math.max(maxs[i], point[i]);
    }
  }

  return data.map(point =>
    point.map((val, i) =>
      maxs[i] - mins[i] > 0 ? (val - mins[i]) / (maxs[i] - mins[i]) : 0.5
    )
  );
}
