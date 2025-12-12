/**
 * Section 3: Building the High-Dimensional Graph
 *
 * Step-by-step visualization of UMAP's first phase:
 * - Find k-Nearest Neighbors
 * - Local Distance Normalization
 * - Symmetrize the Graph
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Play, Pause, RotateCcw, CircleDot, Link2, Scale } from 'lucide-react';
import { ScatterPlot } from '../ScatterPlot';
import { Slider } from '../Slider';
import { CodeBlock, InlineCode } from '../CodeBlock';
import {
  generate2DClusters,
  generateVaryingDensity,
  findKNN,
  euclideanDistance,
  CLUSTER_COLORS
} from '../../utils/dataGenerators';

// Sub-step components
function Step3A({ data, labels, nNeighbors, selectedPoint, setSelectedPoint }) {
  // Compute k-NN for selected point
  const { knnData, edges } = useMemo(() => {
    if (!data || selectedPoint === null) {
      return { knnData: null, edges: [] };
    }

    const knn = findKNN(data, selectedPoint, nNeighbors);
    const maxDist = Math.max(...knn.map(k => k.distance), 0.001);

    return {
      knnData: knn,
      edges: knn.map(k => ({
        source: selectedPoint,
        target: k.index,
        weight: 1 - (k.distance / maxDist) * 0.7,
        distance: k.distance.toFixed(2),
      })),
    };
  }, [data, selectedPoint, nNeighbors]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-200">
            Step 3a: Find k-Nearest Neighbors
          </h4>
          <p className="text-sm text-slate-300">
            For each point, UMAP finds its <InlineCode>n_neighbors</InlineCode> closest
            points using the distance metric (usually Euclidean distance).
          </p>
          <p className="text-sm text-slate-300">
            Click on any point to see its k-nearest neighbors. The connecting lines
            show the neighborhood relationships.
          </p>

          <Slider
            label="n_neighbors"
            value={nNeighbors}
            onChange={() => {}} // Read-only here
            min={2}
            max={15}
            step={1}
            disabled
          />

          {knnData && (
            <div className="bg-slate-900/50 rounded-lg p-4 space-y-2">
              <h5 className="text-sm font-medium text-slate-400">
                Neighbors of point {selectedPoint}:
              </h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {knnData.map((neighbor, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Point {neighbor.index}</span>
                    <span className="font-mono text-blue-400">
                      d = {neighbor.distance.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Click a point to select it</span>
            <span className="text-xs font-mono text-blue-400">
              {data?.length || 0} points
            </span>
          </div>
          {data && (
            <ScatterPlot
              data={data}
              labels={labels}
              width={380}
              height={320}
              colors={CLUSTER_COLORS}
              pointRadius={6}
              selectedPoint={selectedPoint}
              highlightedPoints={knnData?.map(k => k.index) || []}
              edges={edges}
              edgeOpacity={0.7}
              onPointClick={(i) => setSelectedPoint(i)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Step3B({ data, labels }) {
  const [showNormalized, setShowNormalized] = useState(false);

  // Compute local density (distance to nearest neighbor) for each point
  const localDensity = useMemo(() => {
    if (!data) return [];

    return data.map((point, i) => {
      const knn = findKNN(data, i, 1);
      return knn[0]?.distance || 0;
    });
  }, [data]);

  // Normalize for visualization (0-1 scale)
  const normalizedDensity = useMemo(() => {
    if (!localDensity.length) return [];
    const max = Math.max(...localDensity);
    const min = Math.min(...localDensity);
    return localDensity.map(d => (d - min) / (max - min + 0.001));
  }, [localDensity]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-200">
            Step 3b: Local Distance Normalization
          </h4>
          <p className="text-sm text-slate-300">
            <strong className="text-yellow-400">This is UMAP's key insight:</strong> It normalizes distances
            <em> locally</em> for each point based on its neighborhood density.
          </p>

          <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
            <p className="text-sm text-slate-300">
              UMAP computes edge weights using:
            </p>
            <div className="bg-slate-950 rounded p-3 font-mono text-sm text-center">
              <span className="text-blue-400">w(i,j)</span>
              <span className="text-slate-400"> = exp(-(</span>
              <span className="text-green-400">d(i,j)</span>
              <span className="text-slate-400"> - </span>
              <span className="text-yellow-400">ρᵢ</span>
              <span className="text-slate-400">) / </span>
              <span className="text-purple-400">σᵢ</span>
              <span className="text-slate-400">)</span>
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>
                <span className="text-yellow-400 font-mono">ρᵢ</span> = distance to nearest neighbor
                <span className="text-slate-400"> (ensures at least one strong connection)</span>
              </li>
              <li>
                <span className="text-purple-400 font-mono">σᵢ</span> = local scaling factor
                <span className="text-slate-400"> (adapts to local density)</span>
              </li>
            </ul>
          </div>

          <button
            onClick={() => setShowNormalized(!showNormalized)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
          >
            {showNormalized ? 'Show Original' : 'Show Local Density'}
          </button>

          <p className="text-xs text-slate-400">
            Points in <span className="text-red-400">dense regions</span> have small ρᵢ (nearby neighbors),
            while points in <span className="text-green-400">sparse regions</span> have large ρᵢ.
            This normalization ensures every point has meaningful connections.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {showNormalized ? 'Colored by local density' : 'Colored by cluster'}
            </span>
          </div>
          {data && (
            <div className="relative">
              <ScatterPlot
                data={data}
                labels={showNormalized ? normalizedDensity.map(d => Math.floor(d * 4)) : labels}
                width={380}
                height={320}
                colors={showNormalized
                  ? ['#22c55e', '#84cc16', '#f59e0b', '#ef4444', '#dc2626']
                  : CLUSTER_COLORS
                }
                pointRadius={8}
              />
              {showNormalized && (
                <div className="absolute bottom-2 right-2 bg-slate-900/90 rounded p-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">●</span>
                    <span className="text-slate-300">Dense</span>
                    <span className="text-yellow-400 mx-1">→</span>
                    <span className="text-red-400">●</span>
                    <span className="text-slate-300">Sparse</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Step3C({ data, labels, nNeighbors }) {
  const [showSymmetrized, setShowSymmetrized] = useState(false);

  // Compute asymmetric and symmetric edges for visualization
  const { asymmetricEdges, symmetricEdges } = useMemo(() => {
    if (!data) return { asymmetricEdges: [], symmetricEdges: [] };

    // Just show edges for a subset of points for clarity
    const samplePoints = [0, 10, 20, 30, 40];
    const asymmetric = [];
    const edgeMap = new Map();

    samplePoints.forEach(i => {
      const knn = findKNN(data, i, Math.min(nNeighbors, 5));
      knn.forEach(({ index: j, distance }) => {
        asymmetric.push({
          source: i,
          target: j,
          weight: 0.8,
        });

        // Track for symmetrization
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!edgeMap.has(key)) {
          edgeMap.set(key, { i: Math.min(i, j), j: Math.max(i, j), wij: 0, wji: 0 });
        }
        if (i < j) {
          edgeMap.get(key).wij = 0.8;
        } else {
          edgeMap.get(key).wji = 0.8;
        }
      });
    });

    // Symmetrize: w = w_ij + w_ji - w_ij * w_ji
    const symmetric = Array.from(edgeMap.values()).map(({ i, j, wij, wji }) => ({
      source: i,
      target: j,
      weight: wij + wji - wij * wji,
    }));

    return { asymmetricEdges: asymmetric, symmetricEdges: symmetric };
  }, [data, nNeighbors]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-200">
            Step 3c: Symmetrize the Graph
          </h4>
          <p className="text-sm text-slate-300">
            The k-NN relationship is <em>asymmetric</em>: point A might consider B a neighbor,
            but B might not consider A a neighbor.
          </p>

          <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
            <p className="text-sm text-slate-300">
              UMAP symmetrizes using a <em>fuzzy union</em>:
            </p>
            <div className="bg-slate-950 rounded p-3 font-mono text-sm text-center">
              <span className="text-blue-400">w(A,B)</span>
              <span className="text-slate-400"> = </span>
              <span className="text-green-400">wₐ(B)</span>
              <span className="text-slate-400"> + </span>
              <span className="text-purple-400">w_B(A)</span>
              <span className="text-slate-400"> - </span>
              <span className="text-green-400">wₐ(B)</span>
              <span className="text-slate-400">·</span>
              <span className="text-purple-400">w_B(A)</span>
            </div>
            <p className="text-xs text-slate-400">
              This ensures: if either A→B or B→A is strong, the final edge A↔B is strong.
              It's the probability "at least one considers the other a neighbor."
            </p>
          </div>

          <button
            onClick={() => setShowSymmetrized(!showSymmetrized)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm"
          >
            {showSymmetrized ? 'Show Asymmetric' : 'Show Symmetrized'}
          </button>

          <p className="text-xs text-slate-400">
            {showSymmetrized
              ? 'Symmetrized graph: bidirectional edges with combined weights'
              : 'Asymmetric graph: directed edges showing one-way k-NN relationships'
            }
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">
              {showSymmetrized ? 'Symmetrized edges' : 'Asymmetric k-NN edges'}
            </span>
            <span className="text-xs font-mono text-blue-400">
              Sample edges shown
            </span>
          </div>
          {data && (
            <ScatterPlot
              data={data}
              labels={labels}
              width={380}
              height={320}
              colors={CLUSTER_COLORS}
              pointRadius={5}
              edges={showSymmetrized ? symmetricEdges : asymmetricEdges}
              edgeOpacity={0.5}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function Section3({ isActive }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);
  const [nNeighbors, setNNeighbors] = useState(5);
  const [selectedPoint, setSelectedPoint] = useState(15);

  const steps = [
    { id: 'a', title: 'Find k-Nearest Neighbors', icon: CircleDot },
    { id: 'b', title: 'Local Distance Normalization', icon: Scale },
    { id: 'c', title: 'Symmetrize the Graph', icon: Link2 },
  ];

  // Generate data with varying density to better illustrate concepts
  useEffect(() => {
    const { data: newData, labels: newLabels } = generateVaryingDensity(80);
    setData(newData);
    setLabels(newLabels);
  }, []);

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const regenerateData = () => {
    const { data: newData, labels: newLabels } = generateVaryingDensity(80);
    setData(newData);
    setLabels(newLabels);
    setSelectedPoint(15);
  };

  const pythonCode = `# UMAP constructs a weighted k-NN graph
# This happens internally, but you can inspect it:

from umap.umap_ import fuzzy_simplicial_set
from sklearn.neighbors import NearestNeighbors

# Step 1: Find k-nearest neighbors
nn = NearestNeighbors(n_neighbors=15)
nn.fit(X)
knn_indices = nn.kneighbors(return_distance=False)

# Steps 2-3: UMAP builds the fuzzy graph internally
# The fuzzy_simplicial_set function does the heavy lifting`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">
          Building the High-Dimensional Graph
        </h2>
        <p className="text-lg text-slate-300">
          UMAP's first phase constructs a weighted graph that captures the structure of your data.
          This happens in three steps.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Phase 1: Graph Construction
          </h3>
          <button
            onClick={regenerateData}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600
                       text-sm text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            New Data
          </button>
        </div>

        {/* Step Indicators */}
        <div className="flex items-center gap-4 mb-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isCompleted = i < currentStep;

            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : isCompleted
                    ? 'bg-green-900/50 text-green-400 border border-green-600/50'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">Step 3{step.id}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Title */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-blue-400">
            Step 3{steps[currentStep].id}: {steps[currentStep].title}
          </h4>
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 0 && (
            <Step3A
              data={data}
              labels={labels}
              nNeighbors={nNeighbors}
              selectedPoint={selectedPoint}
              setSelectedPoint={setSelectedPoint}
            />
          )}
          {currentStep === 1 && (
            <Step3B
              data={data}
              labels={labels}
            />
          )}
          {currentStep === 2 && (
            <Step3C
              data={data}
              labels={labels}
              nNeighbors={nNeighbors}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Step
          </button>

          <div className="flex items-center gap-2 text-sm text-slate-400">
            Step {currentStep + 1} of {steps.length}
          </div>

          <button
            onClick={handleNextStep}
            disabled={currentStep === steps.length - 1}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white rounded-lg transition-colors"
          >
            Next Step
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Key Insight */}
      <div className="bg-gradient-to-r from-yellow-900/50 to-orange-900/50 rounded-xl p-6 border border-yellow-500/30">
        <h3 className="text-lg font-semibold text-white mb-3">
          💡 Key Insight
        </h3>
        <p className="text-slate-200 text-lg">
          The local distance normalization (Step 3b) is what makes UMAP work well on data with
          <span className="text-yellow-400 font-semibold"> varying density</span>. Points in dense regions
          use smaller distance scales than points in sparse regions. This creates a
          <span className="text-orange-400 font-semibold"> "fuzzy simplicial set"</span> — a fancy
          way of saying each point has a fuzzy notion of who its neighbors are.
        </p>
      </div>

      {/* Technical Note */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide mb-2">
          Technical Note
        </h4>
        <p className="text-sm text-slate-300">
          The term "fuzzy simplicial set" comes from algebraic topology. Don't worry if it sounds
          intimidating — the intuition is simple: instead of a point either being a neighbor or not
          (binary), each potential neighbor has a <em>degree of membership</em> (0 to 1). This
          "fuzzy" approach is more robust to noise and varying data density.
        </p>
      </div>

      {/* Python Code */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          Under the Hood in Python
        </h4>
        <CodeBlock code={pythonCode} language="python" />
      </div>

      {/* What's Next */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <p className="text-slate-300">
          <span className="text-yellow-400 font-medium">Next up:</span> Now that we have a graph
          representing the high-dimensional structure, we need to find a 2D layout that preserves it.
          This is where the <em>optimization</em> phase comes in.
        </p>
      </div>
    </div>
  );
}

export default Section3;
