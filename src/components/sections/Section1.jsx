/**
 * Section 1: What Problem Does UMAP Solve?
 *
 * - Interactive 3D point cloud that users can rotate
 * - Demonstrates curse of dimensionality
 * - Animated projection to 2D using UMAP
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, RotateCcw, Layers, Minimize2 } from 'lucide-react';
import { PointCloud3D } from '../PointCloud3D';
import { ScatterPlot } from '../ScatterPlot';
import { ProgressBar } from '../ProgressBar';
import { CodeBlock } from '../CodeBlock';
import { generate3DBlobs, CLUSTER_COLORS } from '../../utils/dataGenerators';
import { useUMAP } from '../../hooks/useUMAP';

export function Section1({ isActive }) {
  const [data3D, setData3D] = useState(null);
  const [labels, setLabels] = useState(null);
  const [showUMAP, setShowUMAP] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const umap = useUMAP();

  // Generate initial 3D data
  useEffect(() => {
    const { data, labels: newLabels } = generate3DBlobs(200, 4, 0.4);
    setData3D(data);
    setLabels(newLabels);
  }, []);

  // Run UMAP projection
  const handleProject = useCallback(async () => {
    if (!data3D || umap.isRunning) return;

    setIsTransitioning(true);
    setShowUMAP(false);

    // Initialize and run UMAP
    umap.initialize({
      data: data3D,
      nNeighbors: 15,
      minDist: 0.1,
      nEpochs: 100,
    });

    // Short delay for visual effect
    await new Promise(resolve => setTimeout(resolve, 300));
    setShowUMAP(true);

    // Run to completion with animation
    await umap.runToCompletion();
    setIsTransitioning(false);
  }, [data3D, umap]);

  // Reset to 3D view
  const handleReset = useCallback(() => {
    umap.reset();
    setShowUMAP(false);
    setIsTransitioning(false);
    // Regenerate data
    const { data, labels: newLabels } = generate3DBlobs(200, 4, 0.4);
    setData3D(data);
    setLabels(newLabels);
  }, [umap]);

  const pythonCode = `import umap
import numpy as np
from sklearn.datasets import make_blobs

# Generate 3D clustered data
X, y = make_blobs(n_samples=200, n_features=3,
                  centers=4, cluster_std=0.4)

# Reduce to 2D with UMAP
reducer = umap.UMAP(n_neighbors=15, min_dist=0.1)
embedding = reducer.fit_transform(X)`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">
          What Problem Does UMAP Solve?
        </h2>
        <p className="text-lg text-slate-300">
          Imagine you have data with hundreds or thousands of measurements per sample.
          How do you visualize it? You can't plot 100 dimensions on a screen.
        </p>
      </div>

      {/* The Problem */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-blue-400" />
          The Curse of Dimensionality
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-slate-300">
              Real-world data is <span className="text-blue-400 font-semibold">high-dimensional</span>:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Gene expression: <span className="font-mono text-purple-400">~20,000 genes</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Images: <span className="font-mono text-purple-400">millions of pixels</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Text embeddings: <span className="font-mono text-purple-400">768-4096 dimensions</span></span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">•</span>
                <span>Single-cell RNA: <span className="font-mono text-purple-400">~30,000 genes × millions of cells</span></span>
              </li>
            </ul>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <p className="text-sm text-slate-400 mb-2">The challenge:</p>
            <p className="text-slate-200">
              We need to <span className="text-green-400 font-semibold">reduce</span> these dimensions
              to 2D for visualization, while <span className="text-yellow-400 font-semibold">preserving</span> the
              meaningful structure and relationships in the data.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Demo */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Minimize2 className="w-5 h-5 text-green-400" />
          Interactive Demo: 3D → 2D Projection
        </h3>

        <p className="text-slate-300 mb-6">
          Below is a 3D point cloud with 4 clusters. Drag to rotate it, then click
          "Project to 2D" to see UMAP find a 2D representation that preserves the cluster structure.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 3D View */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-200">
                Original 3D Data
                <span className="ml-2 text-xs text-slate-400">(drag to rotate)</span>
              </h4>
              <span className="text-xs font-mono text-blue-400">200 points, 4 clusters</span>
            </div>
            {data3D && (
              <PointCloud3D
                data={data3D}
                labels={labels}
                width={400}
                height={350}
                colors={CLUSTER_COLORS}
                autoRotate={!showUMAP}
              />
            )}
          </div>

          {/* 2D UMAP View */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-200">
                UMAP 2D Projection
              </h4>
              {umap.isRunning && (
                <span className="text-xs font-mono text-green-400">
                  Epoch {umap.epoch}/{umap.totalEpochs}
                </span>
              )}
            </div>

            {!showUMAP ? (
              <div className="flex items-center justify-center bg-slate-900/50 rounded-lg" style={{ width: 400, height: 350 }}>
                <div className="text-center space-y-4">
                  <div className="text-slate-400">
                    Click the button below to project
                  </div>
                  <div className="text-6xl opacity-20">→</div>
                </div>
              </div>
            ) : (
              <ScatterPlot
                data={umap.embedding}
                labels={labels}
                width={400}
                height={350}
                colors={CLUSTER_COLORS}
                pointRadius={5}
                showAxes={false}
                animate={true}
              />
            )}

            {umap.isRunning && (
              <ProgressBar
                progress={umap.progress}
                label="Computing UMAP..."
              />
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={handleProject}
            disabled={umap.isRunning || showUMAP}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500
                       disabled:bg-slate-700 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            Project to 2D
          </button>
          <button
            onClick={handleReset}
            disabled={umap.isRunning}
            className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-medium rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-xl p-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-3">
          💡 Key Insight
        </h3>
        <p className="text-slate-200 text-lg">
          UMAP finds a 2D arrangement where <span className="text-blue-400 font-semibold">points that were close
          in high dimensions stay close</span>, and <span className="text-purple-400 font-semibold">points that
          were far apart stay separated</span>. The clusters are preserved!
        </p>
      </div>

      {/* Python Equivalent */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          Equivalent Python Code
        </h4>
        <CodeBlock code={pythonCode} language="python" />
      </div>

      {/* What's Next */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <p className="text-slate-300">
          <span className="text-yellow-400 font-medium">Next up:</span> We'll explore how UMAP
          balances <em>local</em> vs <em>global</em> structure, and why the <code className="px-1 bg-slate-800 rounded text-blue-300">n_neighbors</code> parameter
          is so important.
        </p>
      </div>
    </div>
  );
}

export default Section1;
