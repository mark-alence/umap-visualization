/**
 * UMAP Web Worker
 * Runs UMAP computation in a separate thread to keep UI responsive
 */
import { UMAP } from 'umap-js';

let umap = null;
let currentEpoch = 0;
let targetEpochs = 0;
let isRunning = false;

self.onmessage = function(e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      initializeUMAP(payload);
      break;
    case 'step':
      runStep();
      break;
    case 'runAll':
      runAllEpochs(payload.epochs);
      break;
    case 'stop':
      isRunning = false;
      break;
    case 'getEmbedding':
      if (umap) {
        self.postMessage({
          type: 'embedding',
          embedding: umap.getEmbedding(),
          epoch: currentEpoch,
        });
      }
      break;
  }
};

function initializeUMAP({ data, nNeighbors, minDist, nComponents, metric, spread, nEpochs }) {
  try {
    currentEpoch = 0;
    targetEpochs = nEpochs || 200;
    isRunning = false;

    umap = new UMAP({
      nNeighbors: nNeighbors || 15,
      minDist: minDist || 0.1,
      nComponents: nComponents || 2,
      spread: spread || 1.0,
      nEpochs: targetEpochs,
    });

    // Initialize the fit (creates the initial graph and random embedding)
    umap.initializeFit(data);

    self.postMessage({
      type: 'initialized',
      embedding: umap.getEmbedding(),
      totalEpochs: targetEpochs,
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message,
    });
  }
}

function runStep() {
  if (!umap) {
    self.postMessage({ type: 'error', message: 'UMAP not initialized' });
    return;
  }

  try {
    if (currentEpoch < targetEpochs) {
      umap.step();
      currentEpoch++;

      self.postMessage({
        type: 'step',
        embedding: umap.getEmbedding(),
        epoch: currentEpoch,
        totalEpochs: targetEpochs,
        progress: currentEpoch / targetEpochs,
      });
    } else {
      self.postMessage({
        type: 'complete',
        embedding: umap.getEmbedding(),
        epoch: currentEpoch,
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message,
    });
  }
}

async function runAllEpochs(epochs) {
  if (!umap) {
    self.postMessage({ type: 'error', message: 'UMAP not initialized' });
    return;
  }

  isRunning = true;
  const totalEpochs = epochs || targetEpochs;
  const reportEvery = Math.max(1, Math.floor(totalEpochs / 50)); // Report ~50 times

  try {
    while (currentEpoch < totalEpochs && isRunning) {
      umap.step();
      currentEpoch++;

      if (currentEpoch % reportEvery === 0 || currentEpoch === totalEpochs) {
        self.postMessage({
          type: 'progress',
          embedding: umap.getEmbedding(),
          epoch: currentEpoch,
          totalEpochs: totalEpochs,
          progress: currentEpoch / totalEpochs,
        });
      }

      // Yield to allow message handling
      if (currentEpoch % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (isRunning) {
      self.postMessage({
        type: 'complete',
        embedding: umap.getEmbedding(),
        epoch: currentEpoch,
      });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error.message,
    });
  }

  isRunning = false;
}
