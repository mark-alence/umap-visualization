/**
 * Section 4: The Low-Dimensional Embedding
 *
 * Step-by-step visualization of UMAP's optimization phase:
 * - Initialize points randomly
 * - Define low-dimensional similarity
 * - Optimize via cross-entropy
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, ChevronRight, ChevronLeft, Zap, Target } from 'lucide-react';
import { ScatterPlot } from '../ScatterPlot';
import { Slider } from '../Slider';
import { ProgressBar, EpochCounter } from '../ProgressBar';
import { CodeBlock } from '../CodeBlock';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { generateBlobs, CLUSTER_COLORS } from '../../utils/dataGenerators';
import { useUMAP } from '../../hooks/useUMAP';

// Sub-step components
function Step4A({ embedding, labels, isRandom }) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-200">
            Step 4a: Initialize Points Randomly
          </h4>
          <p className="text-sm text-slate-300">
            UMAP starts by placing all points at <em>random positions</em> in 2D space.
            At this stage, there's no structure — just random scatter.
          </p>

          <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
            <p className="text-sm text-slate-300">
              The initial positions come from a scaled random distribution:
            </p>
            <div className="bg-slate-950 rounded p-3 font-mono text-sm text-center">
              <span className="text-blue-400">embedding</span>
              <span className="text-slate-400">[i] = </span>
              <span className="text-green-400">random</span>
              <span className="text-slate-400">() × 10</span>
            </div>
            <p className="text-xs text-slate-400">
              Some implementations use spectral initialization (from the graph Laplacian)
              for a better starting point, but random works surprisingly well.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className={`w-3 h-3 rounded-full ${isRandom ? 'bg-yellow-400' : 'bg-green-400'}`} />
            <span className="text-slate-300">
              {isRandom ? 'Random initialization' : 'After optimization'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Current embedding</span>
          </div>
          {embedding && (
            <ScatterPlot
              data={embedding}
              labels={labels}
              width={380}
              height={320}
              colors={CLUSTER_COLORS}
              pointRadius={5}
              showAxes={false}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Step4B({ minDist, setMinDist }) {
  // Generate curve data for visualization
  const curveData = [];
  for (let d = 0; d <= 3; d += 0.05) {
    // Simplified version of UMAP's similarity function
    const a = 1.93; // Approximate values for default min_dist
    const b = 0.79;
    const similarity = d < minDist
      ? 1
      : 1 / (1 + a * Math.pow(d, 2 * b));
    curveData.push({ distance: d, similarity });
  }

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-200">
            Step 4b: Low-Dimensional Similarity Function
          </h4>
          <p className="text-sm text-slate-300">
            UMAP uses a smooth curve to measure similarity between points in the 2D embedding.
            Points closer than <code className="px-1 bg-slate-800 rounded text-blue-300">min_dist</code> are
            considered "maximally similar."
          </p>

          <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
            <p className="text-sm text-slate-300">
              The similarity function:
            </p>
            <div className="bg-slate-950 rounded p-3 font-mono text-sm text-center">
              <span className="text-blue-400">sim(d)</span>
              <span className="text-slate-400"> = </span>
              <span className="text-green-400">1</span>
              <span className="text-slate-400"> / (1 + </span>
              <span className="text-purple-400">a</span>
              <span className="text-slate-400"> × d</span>
              <span className="text-slate-400 align-super text-xs">2b</span>
              <span className="text-slate-400">)</span>
            </div>
            <p className="text-xs text-slate-400">
              Parameters <span className="text-purple-400">a</span> and <span className="text-purple-400">b</span> are
              derived from <code className="text-blue-300">min_dist</code> and <code className="text-blue-300">spread</code>.
            </p>
          </div>

          <Slider
            label="min_dist"
            value={minDist}
            onChange={setMinDist}
            min={0}
            max={1}
            step={0.05}
            description="Controls how tightly points can pack together"
            valueFormatter={(v) => v.toFixed(2)}
          />

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className={`p-3 rounded-lg border transition-colors ${
              minDist <= 0.1 ? 'bg-purple-900/30 border-purple-500/50' : 'bg-slate-900/50 border-slate-700'
            }`}>
              <h5 className="font-medium text-purple-400 mb-1">Low min_dist</h5>
              <p className="text-xs text-slate-300">
                Points pack tightly. Reveals fine-grained structure.
              </p>
            </div>
            <div className={`p-3 rounded-lg border transition-colors ${
              minDist >= 0.5 ? 'bg-blue-900/30 border-blue-500/50' : 'bg-slate-900/50 border-slate-700'
            }`}>
              <h5 className="font-medium text-blue-400 mb-1">High min_dist</h5>
              <p className="text-xs text-slate-300">
                Points spread out. Smoother visualization.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h5 className="text-sm text-slate-400">Similarity vs Distance Curve</h5>
          <div className="bg-slate-900/50 rounded-lg p-4" style={{ height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData} margin={{ top: 10, right: 20, bottom: 30, left: 40 }}>
                <XAxis
                  dataKey="distance"
                  label={{ value: 'Distance', position: 'bottom', fill: '#94a3b8' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <YAxis
                  domain={[0, 1]}
                  label={{ value: 'Similarity', angle: -90, position: 'left', fill: '#94a3b8' }}
                  tick={{ fill: '#64748b', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px' }}
                  labelFormatter={(val) => `Distance: ${val.toFixed(2)}`}
                  formatter={(val) => [val.toFixed(3), 'Similarity']}
                />
                <Line
                  type="monotone"
                  dataKey="similarity"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={false}
                />
                {/* min_dist reference line */}
                <Line
                  data={[{ distance: minDist, similarity: 0 }, { distance: minDist, similarity: 1 }]}
                  type="linear"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-slate-400 text-center">
            The <span className="text-yellow-400">dashed line</span> shows min_dist = {minDist.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Step4C({
  embedding,
  labels,
  epoch,
  totalEpochs,
  isRunning,
  progress,
  onStart,
  onStop,
  onStep,
  onReset,
  lossHistory
}) {
  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-slate-200">
            Step 4c: Optimize via Cross-Entropy
          </h4>
          <p className="text-sm text-slate-300">
            UMAP uses stochastic gradient descent to minimize the cross-entropy between
            the high-dimensional graph and the low-dimensional embedding.
          </p>

          <div className="bg-slate-900/70 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-400" />
                <span className="text-slate-300">Attractive forces</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="text-slate-300">Repulsive forces</span>
              </div>
            </div>
            <p className="text-xs text-slate-400">
              • <span className="text-blue-400">Attractive:</span> Pull neighbors together
              (points connected in high-D graph)
            </p>
            <p className="text-xs text-slate-400">
              • <span className="text-red-400">Repulsive:</span> Push non-neighbors apart
              (sample random points, push away)
            </p>
          </div>

          <EpochCounter current={epoch} total={totalEpochs} />
          <ProgressBar progress={progress} label="Optimization progress" />

          {/* Controls */}
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                onClick={onStart}
                disabled={epoch >= totalEpochs}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           text-white rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" />
                {epoch === 0 ? 'Start' : 'Resume'}
              </button>
            ) : (
              <button
                onClick={onStop}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500
                           text-white rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
            )}

            <button
              onClick={onStep}
              disabled={isRunning || epoch >= totalEpochs}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
              Step
            </button>

            <button
              onClick={onReset}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600
                         disabled:opacity-50 disabled:cursor-not-allowed
                         text-white rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-400">Embedding (epoch {epoch})</span>
          </div>
          {embedding && (
            <ScatterPlot
              data={embedding}
              labels={labels}
              width={380}
              height={280}
              colors={CLUSTER_COLORS}
              pointRadius={5}
              showAxes={false}
            />
          )}

          {/* Loss chart */}
          {lossHistory.length > 0 && (
            <div className="bg-slate-900/50 rounded-lg p-2" style={{ height: 100 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossHistory} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
                  <XAxis dataKey="epoch" hide />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Line
                    type="monotone"
                    dataKey="loss"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-xs text-slate-500 text-center">Loss over epochs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Section4({ isActive }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);
  const [minDist, setMinDist] = useState(0.1);
  const [lossHistory, setLossHistory] = useState([]);

  const umap = useUMAP();

  const steps = [
    { id: 'a', title: 'Initialize Randomly', icon: Target },
    { id: 'b', title: 'Similarity Function', icon: Zap },
    { id: 'c', title: 'Gradient Descent', icon: FastForward },
  ];

  // Generate data
  useEffect(() => {
    const { data: newData, labels: newLabels } = generateBlobs(200, 5, 10, 1.5);
    setData(newData);
    setLabels(newLabels);
  }, []);

  // Initialize UMAP when data changes or step changes to optimization
  useEffect(() => {
    if (!data) return;

    umap.initialize({
      data,
      nNeighbors: 15,
      minDist,
      nEpochs: 150,
    });
    setLossHistory([]);
  }, [data, minDist]);

  const handleStartOptimization = () => {
    umap.runAnimated((embedding, epoch) => {
      // Simulate loss (decreasing with some noise)
      const simulatedLoss = 5 / (1 + epoch * 0.1) + Math.random() * 0.2;
      setLossHistory(prev => [...prev, { epoch, loss: simulatedLoss }]);
    }, 30);
  };

  const handleStopOptimization = () => {
    umap.stop();
  };

  const handleStepOptimization = () => {
    umap.step();
    const epoch = umap.epoch + 1;
    const simulatedLoss = 5 / (1 + epoch * 0.1) + Math.random() * 0.2;
    setLossHistory(prev => [...prev, { epoch, loss: simulatedLoss }]);
  };

  const handleResetOptimization = () => {
    if (!data) return;
    umap.initialize({
      data,
      nNeighbors: 15,
      minDist,
      nEpochs: 150,
    });
    setLossHistory([]);
  };

  const regenerateData = () => {
    const { data: newData, labels: newLabels } = generateBlobs(200, 5, 10, 1.5);
    setData(newData);
    setLabels(newLabels);
    setLossHistory([]);
  };

  const pythonCode = `import umap

# Control the low-D embedding parameters
reducer = umap.UMAP(
    n_neighbors=15,
    min_dist=0.1,      # Controls point packing
    spread=1.0,        # Scale of embedding
    n_epochs=200,      # Optimization iterations
    learning_rate=1.0, # SGD learning rate
)

# Fit and transform
embedding = reducer.fit_transform(X)

# You can also step through epochs manually:
reducer.fit(X)
for epoch in range(200):
    embedding = reducer.transform(X)  # Current state`;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">
          The Low-Dimensional Embedding
        </h2>
        <p className="text-lg text-slate-300">
          With the high-dimensional graph constructed, UMAP now finds a 2D layout
          that preserves its structure through iterative optimization.
        </p>
      </div>

      {/* Step Navigation */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Phase 2: Optimization
          </h3>
          <button
            onClick={regenerateData}
            disabled={umap.isRunning}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600
                       disabled:opacity-50 text-sm text-white rounded-lg transition-colors"
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
                <span className="text-sm font-medium">Step 4{step.id}</span>
              </button>
            );
          })}
        </div>

        {/* Current Step Title */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-blue-400">
            Step 4{steps[currentStep].id}: {steps[currentStep].title}
          </h4>
        </div>

        {/* Step Content */}
        <div className="min-h-[420px]">
          {currentStep === 0 && (
            <Step4A
              embedding={umap.embedding}
              labels={labels}
              isRandom={umap.epoch === 0}
            />
          )}
          {currentStep === 1 && (
            <Step4B
              minDist={minDist}
              setMinDist={setMinDist}
            />
          )}
          {currentStep === 2 && (
            <Step4C
              embedding={umap.embedding}
              labels={labels}
              epoch={umap.epoch}
              totalEpochs={umap.totalEpochs}
              isRunning={umap.isRunning}
              progress={umap.progress}
              onStart={handleStartOptimization}
              onStop={handleStopOptimization}
              onStep={handleStepOptimization}
              onReset={handleResetOptimization}
              lossHistory={lossHistory}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={() => setCurrentStep(prev => Math.max(prev - 1, 0))}
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
            onClick={() => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))}
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
      <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-6 border border-purple-500/30">
        <h3 className="text-lg font-semibold text-white mb-3">
          💡 Key Insight
        </h3>
        <p className="text-slate-200 text-lg">
          The optimization is a balance between two forces:
          <span className="text-blue-400 font-semibold"> attractive forces</span> pull connected
          points together, while <span className="text-red-400 font-semibold">repulsive forces</span> push
          random pairs apart. This negative sampling trick makes UMAP much faster than
          methods that compute all pairwise interactions.
        </p>
      </div>

      {/* Python Code */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wide">
          Python Parameters
        </h4>
        <CodeBlock code={pythonCode} language="python" />
      </div>

      {/* What's Next */}
      <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50">
        <p className="text-slate-300">
          <span className="text-yellow-400 font-medium">Next up:</span> Now you understand
          how UMAP works! Let's put it all together in an interactive playground where you can
          experiment with different datasets and parameters.
        </p>
      </div>
    </div>
  );
}

export default Section4;
