/**
 * Section 2: The Core Intuition - Local vs Global Structure
 *
 * - Interactive comparison: PCA vs UMAP
 * - Sliders to adjust n_neighbors parameter
 * - Visualization of how k-NN graph changes
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, RotateCcw, Eye, Network } from 'lucide-react';
import { ScatterPlot } from '../ScatterPlot';
import { Slider } from '../Slider';
import { ProgressBar } from '../ProgressBar';
import { CodeBlock } from '../CodeBlock';
import {
  generateBlobs,
  generate2DClusters,
  simplePCA,
  findKNN,
  CLUSTER_COLORS
} from '../../utils/dataGenerators';
import { useUMAP } from '../../hooks/useUMAP';
import { useDebounce } from '../../hooks/useDebounce';

// Generate high-dimensional data once
function generateComparisonData() {
  const { data, labels } = generateBlobs(300, 5, 15, 1.5);
  return { data, labels };
}

export function Section2({ isActive }) {
  const [dataset, setDataset] = useState(null);
  const [pcaResult, setPcaResult] = useState(null);
  const [nNeighbors, setNNeighbors] = useState(15);
  const debouncedNNeighbors = useDebounce(nNeighbors, 300);

  const umap = useUMAP();

  // Demo data for k-NN visualization
  const [demoData, setDemoData] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [demoNNeighbors, setDemoNNeighbors] = useState(5);

  // Generate initial data
  useEffect(() => {
    const newData = generateComparisonData();
    setDataset(newData);

    // Compute PCA
    const pca = simplePCA(newData.data, 2);
    setPcaResult(pca);

    // Generate demo data for k-NN visualization
    const demo = generate2DClusters(60, 4);
    setDemoData(demo);
    setSelectedPoint(15); // Select a middle point
  }, []);

  // Run UMAP when n_neighbors changes
  useEffect(() => {
    if (!dataset) return;

    umap.initialize({
      data: dataset.data,
      nNeighbors: debouncedNNeighbors,
      minDist: 0.1,
      nEpochs: 150,
    });

    umap.runToCompletion();
  }, [dataset, debouncedNNeighbors]);

  // Compute k-NN for selected point in demo
  const { knnIndices, knnEdges } = useMemo(() => {
    if (!demoData || selectedPoint === null) {
      return { knnIndices: [], knnEdges: [] };
    }

    const knn = findKNN(demoData.data, selectedPoint, demoNNeighbors);
    const indices = knn.map(k => k.index);
    const maxDist = Math.max(...knn.map(k => k.distance));

    const edges = knn.map(k => ({
      source: selectedPoint,
      target: k.index,
      weight: 1 - (k.distance / maxDist) * 0.7, // Normalize weight
    }));

    return { knnIndices: indices, knnEdges: edges };
  }, [demoData, selectedPoint, demoNNeighbors]);

  const handleDemoPointClick = useCallback((index) => {
    setSelectedPoint(index);
  }, []);

  const regenerateData = useCallback(() => {
    const newData = generateComparisonData();
    setDataset(newData);

    const pca = simplePCA(newData.data, 2);
    setPcaResult(pca);
  }, []);

  const pythonCode = `import umap

# Compare different n_neighbors values
for n_neighbors in [5, 15, 50, 100]:
    reducer = umap.UMAP(n_neighbors=n_neighbors)
    embedding = reducer.fit_transform(X)
    # Plot and compare results...`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">
          The Core Intuition: Local vs Global Structure
        </h2>
        <p className="text-lg text-slate-300">
          UMAP's most important parameter is <code className="px-1.5 py-0.5 bg-slate-800 rounded text-blue-300">n_neighbors</code>.
          It controls whether UMAP focuses on preserving <em>local</em> neighborhoods or <em>global</em> relationships.
        </p>
      </div>

      {/* PCA vs UMAP Comparison */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-400" />
          PCA vs UMAP Comparison
        </h3>

        <p className="text-slate-300 mb-6">
          PCA is a <em>linear</em> method that finds orthogonal directions of maximum variance.
          UMAP is <em>nonlinear</em> and preserves local neighborhood structure. Notice how UMAP
          separates the clusters more cleanly.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* PCA Result */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-200">PCA (2 components)</h4>
              <span className="text-xs px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded">Linear</span>
            </div>
            {pcaResult && (
              <ScatterPlot
                data={pcaResult}
                labels={dataset?.labels}
                width={380}
                height={320}
                colors={CLUSTER_COLORS}
                pointRadius={4}
              />
            )}
            <p className="text-xs text-slate-400">
              PCA projects onto directions of maximum variance. Clusters may overlap.
            </p>
          </div>

          {/* UMAP Result */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-200">UMAP (n_neighbors={nNeighbors})</h4>
              <span className="text-xs px-2 py-1 bg-blue-900/50 text-blue-400 rounded">Nonlinear</span>
            </div>
            {umap.embedding ? (
              <ScatterPlot
                data={umap.embedding}
                labels={dataset?.labels}
                width={380}
                height={320}
                colors={CLUSTER_COLORS}
                pointRadius={4}
              />
            ) : (
              <div className="flex items-center justify-center bg-slate-900/50 rounded-lg" style={{ width: 380, height: 320 }}>
                <span className="text-slate-400">Computing...</span>
              </div>
            )}
            {umap.isRunning && (
              <ProgressBar progress={umap.progress} />
            )}
            <p className="text-xs text-slate-400">
              UMAP preserves local neighborhood relationships. Clusters are more separated.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={regenerateData}
            disabled={umap.isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600
                       disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate Data
          </button>
        </div>
      </div>

      {/* n_neighbors Slider Demo */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Network className="w-5 h-5 text-green-400" />
          Understanding n_neighbors
        </h3>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <p className="text-slate-300">
              The <code className="px-1 bg-slate-800 rounded text-blue-300">n_neighbors</code> parameter
              tells UMAP how many neighbors to consider for each point when building its
              representation of the data structure.
            </p>

            <Slider
              label="n_neighbors"
              value={nNeighbors}
              onChange={setNNeighbors}
              min={2}
              max={100}
              step={1}
              description="Adjust to see how the embedding changes"
            />

            <div className="space-y-4">
              <div className={`p-4 rounded-lg border transition-colors ${
                nNeighbors <= 10 ? 'bg-red-900/30 border-red-500/50' : 'bg-slate-900/50 border-slate-700'
              }`}>
                <h5 className="font-medium text-red-400 mb-1">Low n_neighbors (2-10)</h5>
                <p className="text-sm text-slate-300">
                  Focus on <em>immediate</em> neighbors. Captures fine local structure but may
                  fragment continuous manifolds. Good for finding small, tight clusters.
                </p>
              </div>

              <div className={`p-4 rounded-lg border transition-colors ${
                nNeighbors > 10 && nNeighbors <= 50 ? 'bg-green-900/30 border-green-500/50' : 'bg-slate-900/50 border-slate-700'
              }`}>
                <h5 className="font-medium text-green-400 mb-1">Medium n_neighbors (15-50)</h5>
                <p className="text-sm text-slate-300">
                  Balanced view. The default of 15 works well for most datasets.
                  Preserves both local neighborhoods and broader structure.
                </p>
              </div>

              <div className={`p-4 rounded-lg border transition-colors ${
                nNeighbors > 50 ? 'bg-blue-900/30 border-blue-500/50' : 'bg-slate-900/50 border-slate-700'
              }`}>
                <h5 className="font-medium text-blue-400 mb-1">High n_neighbors (50-200)</h5>
                <p className="text-sm text-slate-300">
                  Broader, more <em>global</em> view. Preserves global structure but may lose
                  fine local detail. Clusters become more uniform in appearance.
                </p>
              </div>
            </div>
          </div>

          {/* k-NN Visualization */}
          <div className="space-y-4">
            <h4 className="font-medium text-slate-200">
              Visualizing k-Nearest Neighbors
            </h4>
            <p className="text-sm text-slate-400">
              Click a point to select it and see its k nearest neighbors connected with lines.
              The line thickness indicates connection strength.
            </p>

            <Slider
              label="k (neighbors to show)"
              value={demoNNeighbors}
              onChange={setDemoNNeighbors}
              min={2}
              max={20}
              step={1}
            />

            {demoData && (
              <ScatterPlot
                data={demoData.data}
                labels={demoData.labels}
                width={380}
                height={300}
                colors={CLUSTER_COLORS}
                pointRadius={6}
                selectedPoint={selectedPoint}
                highlightedPoints={knnIndices}
                edges={knnEdges}
                edgeOpacity={0.6}
                onPointClick={handleDemoPointClick}
              />
            )}

            <p className="text-xs text-slate-400">
              With k={demoNNeighbors}, the selected point (highlighted) is connected to its
              {demoNNeighbors} nearest neighbors. This forms the basis of UMAP's graph structure.
            </p>
          </div>
        </div>
      </div>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-xl p-6 border border-green-500/30">
        <h3 className="text-lg font-semibold text-white mb-3">
          💡 Key Insight
        </h3>
        <p className="text-slate-200 text-lg">
          <code className="px-1.5 py-0.5 bg-slate-800/80 rounded text-blue-300">n_neighbors</code> controls
          the <span className="text-green-400 font-semibold">local/global trade-off</span>. Small values
          emphasize local structure (fine details), large values emphasize global structure
          (big picture). There's no universally "correct" value—it depends on what you want to see!
        </p>
      </div>

      {/* Python Code */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          Experimenting with n_neighbors in Python
        </h4>
        <CodeBlock code={pythonCode} language="python" />
      </div>

      {/* What's Next */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <p className="text-slate-300">
          <span className="text-yellow-400 font-medium">Next up:</span> Let's dive deeper into
          how UMAP actually builds its high-dimensional graph, including the crucial concept of
          <em> local distance normalization</em>.
        </p>
      </div>
    </div>
  );
}

export default Section2;
