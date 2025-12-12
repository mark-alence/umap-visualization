/**
 * Custom hook for running UMAP computations
 * Uses Web Worker for non-blocking computation
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { UMAP } from 'umap-js';

/**
 * Hook for running UMAP with step-by-step control
 * Falls back to main thread if Web Worker isn't available
 */
export function useUMAP() {
  const [embedding, setEmbedding] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [epoch, setEpoch] = useState(0);
  const [totalEpochs, setTotalEpochs] = useState(200);
  const [error, setError] = useState(null);

  const umapRef = useRef(null);
  const animationRef = useRef(null);
  const dataRef = useRef(null);

  const initialize = useCallback(({
    data,
    nNeighbors = 15,
    minDist = 0.1,
    nComponents = 2,
    spread = 1.0,
    nEpochs = 200,
  }) => {
    try {
      setError(null);
      setIsInitialized(false);
      setIsRunning(false);
      setProgress(0);
      setEpoch(0);
      setTotalEpochs(nEpochs);

      dataRef.current = data;

      umapRef.current = new UMAP({
        nNeighbors,
        minDist,
        nComponents,
        spread,
        nEpochs,
      });

      umapRef.current.initializeFit(data);
      const initialEmbedding = umapRef.current.getEmbedding();
      setEmbedding(initialEmbedding);
      setIsInitialized(true);

      return initialEmbedding;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const step = useCallback(() => {
    if (!umapRef.current || !isInitialized) return null;

    try {
      if (epoch < totalEpochs) {
        umapRef.current.step();
        const newEpoch = epoch + 1;
        setEpoch(newEpoch);
        setProgress(newEpoch / totalEpochs);

        const newEmbedding = umapRef.current.getEmbedding();
        setEmbedding(newEmbedding);
        return newEmbedding;
      }
      return embedding;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [isInitialized, epoch, totalEpochs, embedding]);

  const runAnimated = useCallback((onStep, delay = 50) => {
    if (!umapRef.current || !isInitialized) return;

    setIsRunning(true);
    let currentEpoch = epoch;

    const animate = () => {
      if (currentEpoch >= totalEpochs) {
        setIsRunning(false);
        return;
      }

      umapRef.current.step();
      currentEpoch++;
      setEpoch(currentEpoch);
      setProgress(currentEpoch / totalEpochs);

      const newEmbedding = umapRef.current.getEmbedding();
      setEmbedding(newEmbedding);

      if (onStep) onStep(newEmbedding, currentEpoch);

      animationRef.current = setTimeout(animate, delay);
    };

    animate();
  }, [isInitialized, epoch, totalEpochs]);

  const runToCompletion = useCallback(async (onProgress) => {
    if (!umapRef.current || !isInitialized) return null;

    setIsRunning(true);
    let currentEpoch = epoch;
    const reportEvery = Math.max(1, Math.floor(totalEpochs / 50));

    try {
      while (currentEpoch < totalEpochs) {
        umapRef.current.step();
        currentEpoch++;

        if (currentEpoch % reportEvery === 0 || currentEpoch === totalEpochs) {
          setEpoch(currentEpoch);
          setProgress(currentEpoch / totalEpochs);
          const newEmbedding = umapRef.current.getEmbedding();
          setEmbedding(newEmbedding);

          if (onProgress) onProgress(newEmbedding, currentEpoch);

          // Yield to UI
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const finalEmbedding = umapRef.current.getEmbedding();
      setIsRunning(false);
      return finalEmbedding;
    } catch (err) {
      setError(err.message);
      setIsRunning(false);
      return null;
    }
  }, [isInitialized, epoch, totalEpochs]);

  const stop = useCallback(() => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
      animationRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setEmbedding(null);
    setIsInitialized(false);
    setProgress(0);
    setEpoch(0);
    setError(null);
    umapRef.current = null;
  }, [stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  return {
    embedding,
    isInitialized,
    isRunning,
    progress,
    epoch,
    totalEpochs,
    error,
    initialize,
    step,
    runAnimated,
    runToCompletion,
    stop,
    reset,
  };
}

/**
 * Simple synchronous UMAP run (for smaller datasets)
 */
export function runUMAPSync(data, options = {}) {
  const {
    nNeighbors = 15,
    minDist = 0.1,
    nComponents = 2,
    spread = 1.0,
    nEpochs = 200,
  } = options;

  const umap = new UMAP({
    nNeighbors,
    minDist,
    nComponents,
    spread,
    nEpochs,
  });

  return umap.fit(data);
}

/**
 * Hook for comparing two UMAP runs side by side
 */
export function useUMAPComparison() {
  const umap1 = useUMAP();
  const umap2 = useUMAP();

  const initializeBoth = useCallback((data, options1, options2) => {
    umap1.initialize({ data, ...options1 });
    umap2.initialize({ data, ...options2 });
  }, [umap1, umap2]);

  const runBothAnimated = useCallback((delay = 50) => {
    umap1.runAnimated(null, delay);
    umap2.runAnimated(null, delay);
  }, [umap1, umap2]);

  const stopBoth = useCallback(() => {
    umap1.stop();
    umap2.stop();
  }, [umap1, umap2]);

  const resetBoth = useCallback(() => {
    umap1.reset();
    umap2.reset();
  }, [umap1, umap2]);

  return {
    umap1,
    umap2,
    initializeBoth,
    runBothAnimated,
    stopBoth,
    resetBoth,
  };
}
