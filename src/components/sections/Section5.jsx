/**
 * Section 5: Interactive Playground
 *
 * Full parameter exploration with:
 * - Dataset selector
 * - Parameter controls
 * - Real-time computation
 * - Side-by-side comparison
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, RotateCcw, Settings, Columns, Layers } from 'lucide-react';
import { ScatterPlot } from '../ScatterPlot';
import { Slider, SliderGroup } from '../Slider';
import { ProgressBar } from '../ProgressBar';
import { CodeBlock } from '../CodeBlock';
import {
  generateBlobs,
  generateMoons,
  generateCircles,
  generateSwissRoll,
  generateDigits,
  findKNN,
  CLUSTER_COLORS,
  DIGIT_COLORS,
} from '../../utils/dataGenerators';
import { useUMAP, useUMAPComparison } from '../../hooks/useUMAP';
import { useDebounce } from '../../hooks/useDebounce';

const DATASETS = {
  blobs: {
    name: 'Gaussian Blobs',
    description: '5 clusters in 10D',
    generate: () => generateBlobs(400, 5, 10, 1.5),
    colors: CLUSTER_COLORS,
  },
  moons: {
    name: 'Two Moons',
    description: 'Interleaving crescents in 2D',
    generate: () => generateMoons(400, 0.1),
    colors: CLUSTER_COLORS,
  },
  circles: {
    name: 'Concentric Circles',
    description: '3 concentric rings in 2D',
    generate: () => generateCircles(400, 3, 0.05),
    colors: CLUSTER_COLORS,
  },
  swissRoll: {
    name: 'Swiss Roll',
    description: 'Classic 3D manifold',
    generate: () => generateSwissRoll(500, 0.5),
    colors: CLUSTER_COLORS,
  },
  digits: {
    name: 'Digit Patterns',
    description: 'Synthetic 16D digit-like data',
    generate: () => generateDigits(500),
    colors: DIGIT_COLORS,
  },
};

function DatasetSelector({ value, onChange }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-200">Dataset</label>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {Object.entries(DATASETS).map(([key, dataset]) => (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={`p-3 rounded-lg border text-left transition-all ${
              value === key
                ? 'bg-blue-600/30 border-blue-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="font-medium text-sm">{dataset.name}</div>
            <div className="text-xs text-slate-400">{dataset.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function ParameterPanel({
  nNeighbors,
  setNNeighbors,
  minDist,
  setMinDist,
  nEpochs,
  setNEpochs,
  disabled = false,
  title = 'Parameters',
}) {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">{title}</h4>
      <SliderGroup>
        <Slider
          label="n_neighbors"
          value={nNeighbors}
          onChange={setNNeighbors}
          min={2}
          max={100}
          step={1}
          description="Local/global balance"
          disabled={disabled}
        />
        <Slider
          label="min_dist"
          value={minDist}
          onChange={setMinDist}
          min={0}
          max={1}
          step={0.05}
          description="Point packing density"
          valueFormatter={(v) => v.toFixed(2)}
          disabled={disabled}
        />
        <Slider
          label="n_epochs"
          value={nEpochs}
          onChange={setNEpochs}
          min={50}
          max={500}
          step={50}
          description="Optimization iterations"
          disabled={disabled}
        />
      </SliderGroup>
    </div>
  );
}

// Single UMAP view
function SingleView({ isActive }) {
  const [datasetKey, setDatasetKey] = useState('blobs');
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);

  const [nNeighbors, setNNeighbors] = useState(15);
  const [minDist, setMinDist] = useState(0.1);
  const [nEpochs, setNEpochs] = useState(200);

  const debouncedNNeighbors = useDebounce(nNeighbors, 500);
  const debouncedMinDist = useDebounce(minDist, 500);
  const debouncedNEpochs = useDebounce(nEpochs, 500);

  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [autoRun, setAutoRun] = useState(true);

  const umap = useUMAP();

  // Generate data when dataset changes
  useEffect(() => {
    const dataset = DATASETS[datasetKey];
    const { data: newData, labels: newLabels } = dataset.generate();
    setData(newData);
    setLabels(newLabels);
    setHoveredPoint(null);
  }, [datasetKey]);

  // Run UMAP when parameters change
  useEffect(() => {
    if (!data || !autoRun) return;

    umap.initialize({
      data,
      nNeighbors: debouncedNNeighbors,
      minDist: debouncedMinDist,
      nEpochs: debouncedNEpochs,
    });

    umap.runToCompletion();
  }, [data, debouncedNNeighbors, debouncedMinDist, debouncedNEpochs, autoRun]);

  // Find neighbors for hovered point
  const highlightedPoints = useMemo(() => {
    if (hoveredPoint === null || !data) return [];
    const knn = findKNN(data, hoveredPoint, Math.min(nNeighbors, 20));
    return knn.map(k => k.index);
  }, [data, hoveredPoint, nNeighbors]);

  const handleRunUMAP = () => {
    if (!data) return;
    umap.initialize({
      data,
      nNeighbors,
      minDist,
      nEpochs,
    });
    umap.runToCompletion();
  };

  const pythonCode = `import umap
from sklearn.datasets import make_blobs

# Generate data
X, y = make_blobs(n_samples=400, centers=5,
                  n_features=10, cluster_std=1.5)

# Create and fit UMAP
reducer = umap.UMAP(
    n_neighbors=${nNeighbors},
    min_dist=${minDist.toFixed(2)},
    n_epochs=${nEpochs},
    metric='euclidean'
)

embedding = reducer.fit_transform(X)`;

  return (
    <div className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel: Controls */}
        <div className="space-y-6">
          <DatasetSelector value={datasetKey} onChange={setDatasetKey} />

          <ParameterPanel
            nNeighbors={nNeighbors}
            setNNeighbors={setNNeighbors}
            minDist={minDist}
            setMinDist={setMinDist}
            nEpochs={nEpochs}
            setNEpochs={setNEpochs}
            disabled={umap.isRunning}
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRun"
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800"
            />
            <label htmlFor="autoRun" className="text-sm text-slate-300">
              Auto-run on parameter change
            </label>
          </div>

          {!autoRun && (
            <button
              onClick={handleRunUMAP}
              disabled={umap.isRunning}
              className="w-full flex items-center justify-center gap-2 px-4 py-2
                         bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700
                         text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Run UMAP
            </button>
          )}

          {umap.isRunning && (
            <ProgressBar
              progress={umap.progress}
              label={`Epoch ${umap.epoch}/${umap.totalEpochs}`}
            />
          )}
        </div>

        {/* Center/Right: Visualization */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-200">
              UMAP Embedding ({DATASETS[datasetKey].name})
            </h4>
            <span className="text-xs font-mono text-blue-400">
              {data?.length || 0} points
            </span>
          </div>

          {umap.embedding ? (
            <ScatterPlot
              data={umap.embedding}
              labels={labels}
              width={600}
              height={450}
              colors={DATASETS[datasetKey].colors}
              pointRadius={5}
              showAxes={false}
              selectedPoint={hoveredPoint}
              highlightedPoints={highlightedPoints}
              onPointHover={(i) => setHoveredPoint(i)}
              className="mx-auto"
            />
          ) : (
            <div className="flex items-center justify-center bg-slate-900/50 rounded-lg mx-auto"
                 style={{ width: 600, height: 450 }}>
              <span className="text-slate-400">
                {umap.isRunning ? 'Computing...' : 'Select dataset and run'}
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center">
            Hover over a point to highlight its {Math.min(nNeighbors, 20)} nearest neighbors
          </p>
        </div>
      </div>

      {/* Python Code */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          Equivalent Python Code
        </h4>
        <CodeBlock code={pythonCode} language="python" />
      </div>
    </div>
  );
}

// Side-by-side comparison view
function ComparisonView({ isActive }) {
  const [datasetKey, setDatasetKey] = useState('blobs');
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);

  // Parameters for each UMAP
  const [params1, setParams1] = useState({ nNeighbors: 5, minDist: 0.1, nEpochs: 200 });
  const [params2, setParams2] = useState({ nNeighbors: 50, minDist: 0.1, nEpochs: 200 });

  const comparison = useUMAPComparison();

  // Generate data
  useEffect(() => {
    const dataset = DATASETS[datasetKey];
    const { data: newData, labels: newLabels } = dataset.generate();
    setData(newData);
    setLabels(newLabels);
  }, [datasetKey]);

  const handleRunBoth = () => {
    if (!data) return;

    comparison.initializeBoth(
      data,
      { nNeighbors: params1.nNeighbors, minDist: params1.minDist, nEpochs: params1.nEpochs },
      { nNeighbors: params2.nNeighbors, minDist: params2.minDist, nEpochs: params2.nEpochs }
    );

    comparison.runBothAnimated(20);
  };

  const handleReset = () => {
    comparison.resetBoth();
  };

  return (
    <div className="space-y-6">
      <DatasetSelector value={datasetKey} onChange={setDatasetKey} />

      <div className="grid lg:grid-cols-2 gap-6">
        {/* UMAP 1 */}
        <div className="space-y-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-400">UMAP #1</h4>
            {comparison.umap1.isRunning && (
              <span className="text-xs font-mono text-green-400">
                Epoch {comparison.umap1.epoch}/{comparison.umap1.totalEpochs}
              </span>
            )}
          </div>

          <ParameterPanel
            nNeighbors={params1.nNeighbors}
            setNNeighbors={(v) => setParams1({ ...params1, nNeighbors: v })}
            minDist={params1.minDist}
            setMinDist={(v) => setParams1({ ...params1, minDist: v })}
            nEpochs={params1.nEpochs}
            setNEpochs={(v) => setParams1({ ...params1, nEpochs: v })}
            disabled={comparison.umap1.isRunning}
            title="Parameters #1"
          />

          {comparison.umap1.isRunning && (
            <ProgressBar progress={comparison.umap1.progress} />
          )}

          {comparison.umap1.embedding ? (
            <ScatterPlot
              data={comparison.umap1.embedding}
              labels={labels}
              width={380}
              height={300}
              colors={DATASETS[datasetKey].colors}
              pointRadius={4}
              showAxes={false}
            />
          ) : (
            <div className="flex items-center justify-center bg-slate-900/50 rounded-lg"
                 style={{ width: 380, height: 300 }}>
              <span className="text-slate-400">Click Run to compute</span>
            </div>
          )}
        </div>

        {/* UMAP 2 */}
        <div className="space-y-4 bg-slate-800/30 rounded-xl p-4 border border-slate-700">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-purple-400">UMAP #2</h4>
            {comparison.umap2.isRunning && (
              <span className="text-xs font-mono text-green-400">
                Epoch {comparison.umap2.epoch}/{comparison.umap2.totalEpochs}
              </span>
            )}
          </div>

          <ParameterPanel
            nNeighbors={params2.nNeighbors}
            setNNeighbors={(v) => setParams2({ ...params2, nNeighbors: v })}
            minDist={params2.minDist}
            setMinDist={(v) => setParams2({ ...params2, minDist: v })}
            nEpochs={params2.nEpochs}
            setNEpochs={(v) => setParams2({ ...params2, nEpochs: v })}
            disabled={comparison.umap2.isRunning}
            title="Parameters #2"
          />

          {comparison.umap2.isRunning && (
            <ProgressBar progress={comparison.umap2.progress} />
          )}

          {comparison.umap2.embedding ? (
            <ScatterPlot
              data={comparison.umap2.embedding}
              labels={labels}
              width={380}
              height={300}
              colors={DATASETS[datasetKey].colors}
              pointRadius={4}
              showAxes={false}
            />
          ) : (
            <div className="flex items-center justify-center bg-slate-900/50 rounded-lg"
                 style={{ width: 380, height: 300 }}>
              <span className="text-slate-400">Click Run to compute</span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={handleRunBoth}
          disabled={comparison.umap1.isRunning || comparison.umap2.isRunning}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500
                     disabled:bg-slate-700 disabled:cursor-not-allowed
                     text-white font-medium rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Run Both
        </button>
        <button
          onClick={handleReset}
          disabled={comparison.umap1.isRunning || comparison.umap2.isRunning}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     text-white font-medium rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  );
}

export function Section5({ isActive }) {
  const [viewMode, setViewMode] = useState('single');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">
          Interactive Playground
        </h2>
        <p className="text-lg text-slate-300">
          Now it's your turn to experiment! Try different datasets and parameters to build
          intuition for how UMAP behaves.
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setViewMode('single')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'single'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Settings className="w-4 h-4" />
          Single View
        </button>
        <button
          onClick={() => setViewMode('comparison')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            viewMode === 'comparison'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          <Columns className="w-4 h-4" />
          Side-by-Side Comparison
        </button>
      </div>

      {/* Main Content */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        {viewMode === 'single' ? (
          <SingleView isActive={isActive} />
        ) : (
          <ComparisonView isActive={isActive} />
        )}
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-xl p-6 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-3">
          💡 Things to Try
        </h3>
        <ul className="space-y-2 text-slate-200">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong>Swiss Roll:</strong> Compare low (5) vs high (50) n_neighbors.
              Low values may break the manifold into pieces.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong>Concentric Circles:</strong> See how UMAP separates the rings.
              Try different min_dist values.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong>Digit Patterns:</strong> Hover over points to see which digits
              cluster together.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 mt-1">•</span>
            <span>
              <strong>Comparison mode:</strong> Run the same data with different
              n_neighbors to see the local/global tradeoff.
            </span>
          </li>
        </ul>
      </div>

      {/* What's Next */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <p className="text-slate-300">
          <span className="text-yellow-400 font-medium">Final section:</span> Before you go,
          let's cover some important caveats about interpreting UMAP embeddings.
          Not all visual patterns are meaningful!
        </p>
      </div>
    </div>
  );
}

export default Section5;
