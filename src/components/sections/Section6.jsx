/**
 * Section 6: Common Pitfalls & Interpretation
 *
 * Interactive examples showing:
 * - Cluster sizes don't mean anything
 * - Distances between clusters can be misleading
 * - Random seed matters
 * - Parameter sensitivity
 */
import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RefreshCw, Scale, Shuffle, Settings, CheckCircle } from 'lucide-react';
import { ScatterPlot } from '../ScatterPlot';
import { ProgressBar } from '../ProgressBar';
import { generateBlobs, CLUSTER_COLORS } from '../../utils/dataGenerators';
import { useUMAP } from '../../hooks/useUMAP';

// Generate data with intentionally different densities
function generateMisleadingData() {
  const data = [];
  const labels = [];

  // Dense cluster (500 points in small area)
  for (let i = 0; i < 150; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = Math.random() * 0.5;
    data.push([
      -3 + r * Math.cos(theta) + Math.random() * 0.1,
      0 + r * Math.sin(theta) + Math.random() * 0.1,
      ...Array(8).fill(0).map(() => Math.random() * 0.2 - 0.1),
    ]);
    labels.push(0);
  }

  // Sparse cluster (same size cluster but spread out)
  for (let i = 0; i < 150; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const r = Math.random() * 2;
    data.push([
      3 + r * Math.cos(theta) + Math.random() * 0.3,
      0 + r * Math.sin(theta) + Math.random() * 0.3,
      ...Array(8).fill(0).map(() => Math.random() * 0.5 - 0.25),
    ]);
    labels.push(1);
  }

  return { data, labels };
}

function PitfallCard({ icon: Icon, title, problem, insight, children, color = 'yellow' }) {
  const colorClasses = {
    yellow: 'border-yellow-500/30 bg-yellow-900/20',
    red: 'border-red-500/30 bg-red-900/20',
    blue: 'border-blue-500/30 bg-blue-900/20',
    orange: 'border-orange-500/30 bg-orange-900/20',
  };

  const iconColors = {
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    blue: 'text-blue-400',
    orange: 'text-orange-400',
  };

  return (
    <div className={`rounded-xl p-6 border ${colorClasses[color]}`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-slate-800/50 ${iconColors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-sm text-slate-300">{problem}</p>
          </div>
          {children}
          <div className="flex items-start gap-2 text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-slate-200">{insight}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Pitfall 1: Cluster sizes
function ClusterSizeDemo() {
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);
  const umap = useUMAP();

  useEffect(() => {
    const { data: newData, labels: newLabels } = generateMisleadingData();
    setData(newData);
    setLabels(newLabels);
  }, []);

  useEffect(() => {
    if (!data) return;
    umap.initialize({ data, nNeighbors: 15, minDist: 0.1, nEpochs: 150 });
    umap.runToCompletion();
  }, [data]);

  const regenerate = () => {
    const { data: newData, labels: newLabels } = generateMisleadingData();
    setData(newData);
    setLabels(newLabels);
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-sm text-slate-400">Both clusters have 150 points each:</p>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-slate-300">Cluster A: 150 pts (dense)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-300">Cluster B: 150 pts (sparse)</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end">
          <button
            onClick={regenerate}
            disabled={umap.isRunning}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600
                       disabled:opacity-50 text-sm text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerate
          </button>
        </div>
      </div>

      {umap.isRunning && <ProgressBar progress={umap.progress} />}

      {umap.embedding && (
        <ScatterPlot
          data={umap.embedding}
          labels={labels}
          width={400}
          height={280}
          colors={CLUSTER_COLORS}
          pointRadius={5}
          showAxes={false}
        />
      )}

      <p className="text-xs text-slate-400">
        Notice how the dense cluster appears smaller in the UMAP, even though both have the same number of points.
      </p>
    </div>
  );
}

// Pitfall 2: Random seed matters
function RandomSeedDemo() {
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);
  const [embeddings, setEmbeddings] = useState([null, null, null]);
  const [isRunning, setIsRunning] = useState(false);

  const umap1 = useUMAP();
  const umap2 = useUMAP();
  const umap3 = useUMAP();

  useEffect(() => {
    const { data: newData, labels: newLabels } = generateBlobs(200, 4, 8, 1.5);
    setData(newData);
    setLabels(newLabels);
  }, []);

  const runAllThree = async () => {
    if (!data) return;
    setIsRunning(true);

    // Initialize all three with same parameters but different random states
    umap1.initialize({ data, nNeighbors: 15, minDist: 0.1, nEpochs: 150 });
    umap2.initialize({ data, nNeighbors: 15, minDist: 0.1, nEpochs: 150 });
    umap3.initialize({ data, nNeighbors: 15, minDist: 0.1, nEpochs: 150 });

    // Run all to completion
    await Promise.all([
      umap1.runToCompletion(),
      umap2.runToCompletion(),
      umap3.runToCompletion(),
    ]);

    setEmbeddings([umap1.embedding, umap2.embedding, umap3.embedding]);
    setIsRunning(false);
  };

  const regenerate = () => {
    const { data: newData, labels: newLabels } = generateBlobs(200, 4, 8, 1.5);
    setData(newData);
    setLabels(newLabels);
    setEmbeddings([null, null, null]);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Same data, same parameters, three different runs:</p>
        <div className="flex items-center gap-2">
          <button
            onClick={runAllThree}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500
                       disabled:opacity-50 text-sm text-white rounded-lg transition-colors"
          >
            <Shuffle className="w-3 h-3" />
            Run 3x
          </button>
          <button
            onClick={regenerate}
            disabled={isRunning}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600
                       disabled:opacity-50 text-sm text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            New Data
          </button>
        </div>
      </div>

      {isRunning && <ProgressBar progress={Math.max(umap1.progress, umap2.progress, umap3.progress)} />}

      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="space-y-1">
            <p className="text-xs text-slate-500 text-center">Run #{i + 1}</p>
            {embeddings[i] ? (
              <ScatterPlot
                data={embeddings[i]}
                labels={labels}
                width={180}
                height={150}
                colors={CLUSTER_COLORS}
                pointRadius={3}
                showAxes={false}
              />
            ) : (
              <div className="flex items-center justify-center bg-slate-900/50 rounded-lg"
                   style={{ width: 180, height: 150 }}>
                <span className="text-xs text-slate-500">-</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400">
        Different runs produce different arrangements! The clusters are preserved, but their positions and orientations vary.
      </p>
    </div>
  );
}

// Pitfall 3: Parameter sensitivity
function ParameterSensitivityDemo() {
  const [data, setData] = useState(null);
  const [labels, setLabels] = useState(null);
  const [embeddings, setEmbeddings] = useState({});
  const [isRunning, setIsRunning] = useState(false);

  const umaps = {
    'n5': useUMAP(),
    'n15': useUMAP(),
    'n50': useUMAP(),
  };

  const nNeighborsValues = [5, 15, 50];

  useEffect(() => {
    const { data: newData, labels: newLabels } = generateBlobs(250, 4, 10, 1.5);
    setData(newData);
    setLabels(newLabels);
  }, []);

  const runAll = async () => {
    if (!data) return;
    setIsRunning(true);

    // Initialize with different n_neighbors
    umaps.n5.initialize({ data, nNeighbors: 5, minDist: 0.1, nEpochs: 150 });
    umaps.n15.initialize({ data, nNeighbors: 15, minDist: 0.1, nEpochs: 150 });
    umaps.n50.initialize({ data, nNeighbors: 50, minDist: 0.1, nEpochs: 150 });

    await Promise.all([
      umaps.n5.runToCompletion(),
      umaps.n15.runToCompletion(),
      umaps.n50.runToCompletion(),
    ]);

    setEmbeddings({
      n5: umaps.n5.embedding,
      n15: umaps.n15.embedding,
      n50: umaps.n50.embedding,
    });
    setIsRunning(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">Same data, varying n_neighbors:</p>
        <button
          onClick={runAll}
          disabled={isRunning}
          className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500
                     disabled:opacity-50 text-sm text-white rounded-lg transition-colors"
        >
          <Settings className="w-3 h-3" />
          Compare
        </button>
      </div>

      {isRunning && <ProgressBar progress={Math.max(umaps.n5.progress, umaps.n15.progress, umaps.n50.progress)} />}

      <div className="grid grid-cols-3 gap-4">
        {nNeighborsValues.map((n, i) => {
          const key = `n${n}`;
          return (
            <div key={n} className="space-y-1">
              <p className="text-xs text-slate-500 text-center">n_neighbors = {n}</p>
              {embeddings[key] ? (
                <ScatterPlot
                  data={embeddings[key]}
                  labels={labels}
                  width={180}
                  height={150}
                  colors={CLUSTER_COLORS}
                  pointRadius={3}
                  showAxes={false}
                />
              ) : (
                <div className="flex items-center justify-center bg-slate-900/50 rounded-lg"
                     style={{ width: 180, height: 150 }}>
                  <span className="text-xs text-slate-500">-</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400">
        Low n_neighbors may fragment clusters; high values may merge them. There's often no single "correct" choice.
      </p>
    </div>
  );
}

export function Section6({ isActive }) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white">
          Common Pitfalls & Interpretation
        </h2>
        <p className="text-lg text-slate-300">
          UMAP is a powerful tool, but its visualizations can be misleading if you don't know
          what to watch out for. Here are the most common interpretation mistakes.
        </p>
      </div>

      {/* Pitfall 1: Cluster Sizes */}
      <PitfallCard
        icon={Scale}
        title="Cluster Sizes Don't Mean Anything"
        problem="In a UMAP embedding, one cluster appearing larger than another does NOT mean
                 it has more points or is more important. UMAP's local distance normalization
                 can dramatically change apparent cluster sizes."
        insight="Never interpret the visual size of clusters as meaningful. Always check the
                 actual point counts!"
        color="yellow"
      >
        <ClusterSizeDemo />
      </PitfallCard>

      {/* Pitfall 2: Random Seeds */}
      <PitfallCard
        icon={Shuffle}
        title="Random Seed Matters"
        problem="UMAP is stochastic — the random initialization and negative sampling mean that
                 different runs produce different embeddings. The relative positions and orientations
                 of clusters will vary."
        insight="If a pattern only appears in one run, it might be an artifact. Run UMAP multiple
                 times to verify that patterns are consistent."
        color="blue"
      >
        <RandomSeedDemo />
      </PitfallCard>

      {/* Pitfall 3: Parameter Sensitivity */}
      <PitfallCard
        icon={Settings}
        title="Embeddings Are Parameter-Sensitive"
        problem="The same data can look dramatically different with different parameters.
                 There's no universal 'correct' setting — the best parameters depend on
                 what you're trying to see."
        insight="Always try multiple parameter settings. If a pattern only appears with very
                 specific parameters, be skeptical of its biological/real-world significance."
        color="orange"
      >
        <ParameterSensitivityDemo />
      </PitfallCard>

      {/* Pitfall 4: Global Distances (Text only) */}
      <PitfallCard
        icon={AlertTriangle}
        title="Distances Between Clusters Can Be Misleading"
        problem="UMAP preserves local structure, not global structure. Two clusters that
                 appear far apart in the embedding might not actually be 'more different'
                 than two clusters that appear close together."
        insight="Don't interpret the distance between clusters as a measure of biological
                 or semantic similarity. UMAP optimizes for local neighborhood preservation,
                 not global distance preservation."
        color="red"
      >
        <div className="bg-slate-900/50 rounded-lg p-4 text-sm text-slate-300">
          <p>
            Unlike methods like MDS (Multi-Dimensional Scaling), UMAP doesn't try to preserve
            all pairwise distances. It focuses on keeping nearby points together and pushing
            unrelated points apart — but "apart" doesn't have a specific distance meaning.
          </p>
        </div>
      </PitfallCard>

      {/* Best Practices */}
      <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-xl p-6 border border-green-500/30">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-400" />
          Best Practices for UMAP
        </h3>
        <ul className="space-y-3 text-slate-200">
          <li className="flex items-start gap-3">
            <span className="text-green-400 font-bold">1.</span>
            <span>
              <strong>Validate with known labels:</strong> If you have ground truth labels,
              color your points by them to check if UMAP captures meaningful structure.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 font-bold">2.</span>
            <span>
              <strong>Try multiple parameter settings:</strong> Don't just use defaults.
              Explore n_neighbors from 5 to 100 and min_dist from 0 to 0.5.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 font-bold">3.</span>
            <span>
              <strong>Run multiple times:</strong> Confirm that patterns are consistent
              across different random seeds.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 font-bold">4.</span>
            <span>
              <strong>Use UMAP for exploration, not conclusions:</strong> UMAP is great
              for generating hypotheses, but always validate findings with other methods.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-green-400 font-bold">5.</span>
            <span>
              <strong>Report your parameters:</strong> When sharing UMAP visualizations,
              always include n_neighbors, min_dist, and any other non-default settings.
            </span>
          </li>
        </ul>
      </div>

      {/* Summary */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          What You've Learned
        </h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-blue-400">UMAP Fundamentals</h4>
            <ul className="space-y-1 text-slate-300">
              <li>• Reduces high-dimensional data to 2D for visualization</li>
              <li>• Preserves local neighborhood structure</li>
              <li>• Uses a two-phase algorithm: graph construction + optimization</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-purple-400">Key Parameters</h4>
            <ul className="space-y-1 text-slate-300">
              <li>• <code className="text-blue-300">n_neighbors</code>: local/global tradeoff</li>
              <li>• <code className="text-blue-300">min_dist</code>: point packing density</li>
              <li>• <code className="text-blue-300">n_epochs</code>: optimization iterations</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-green-400">Critical Insights</h4>
            <ul className="space-y-1 text-slate-300">
              <li>• Local distance normalization adapts to data density</li>
              <li>• Fuzzy graph symmetrization creates robust connections</li>
              <li>• Cross-entropy optimization balances attraction/repulsion</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium text-yellow-400">Important Caveats</h4>
            <ul className="space-y-1 text-slate-300">
              <li>• Cluster sizes are NOT meaningful</li>
              <li>• Inter-cluster distances are NOT preserved</li>
              <li>• Results are stochastic (depend on random seed)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="text-center space-y-4 py-8">
        <h3 className="text-2xl font-bold text-white">
          You're Now a UMAP Expert!
        </h3>
        <p className="text-lg text-slate-300 max-w-2xl mx-auto">
          Go back to the <strong>Interactive Playground</strong> and experiment with your
          new understanding. Try to predict how changing parameters will affect the embedding
          before you run it!
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <a
            href="https://umap-learn.readthedocs.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
          >
            UMAP Documentation
          </a>
          <a
            href="https://arxiv.org/abs/1802.03426"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Read the Paper
          </a>
        </div>
      </div>
    </div>
  );
}

export default Section6;
