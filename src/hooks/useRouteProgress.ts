"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Route, RouteStep } from "@/lib/pathfinding";

export interface RouteProgressState {
  currentStep: RouteStep | null;
  nextStep: RouteStep | null;
  progressPercent: number;
  advanceStep: () => void;
  /** Jump turn-by-turn progress to the step for this graph node (e.g. after QR scan). */
  syncStepToNode: (nodeId: string) => void;
  isComplete: boolean;
  currentStepIndex: number;
}

export default function useRouteProgress(route: Route | null): RouteProgressState {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    setCurrentStepIndex(0);
  }, [route?.startId, route?.goalId]);

  const steps = useMemo(() => route?.steps ?? [], [route?.steps]);

  const currentStep = steps[currentStepIndex] ?? null;
  const nextStep = steps[currentStepIndex + 1] ?? null;
  const isComplete = steps.length === 0 ? false : currentStepIndex >= steps.length - 1;
  const progressPercent = steps.length <= 1 ? 1 : Math.min(1, currentStepIndex / (steps.length - 1));

  const advanceStep = useCallback(() => {
    setCurrentStepIndex((previousIndex) => {
      if (previousIndex >= steps.length - 1) return previousIndex;
      return Math.min(previousIndex + 1, steps.length - 1);
    });
  }, [steps.length]);

  const syncStepToNode = useCallback(
    (nodeId: string) => {
      if (!route?.found || !nodeId) return;
      const matchIndex = steps.findIndex((step) => step.nodeId === nodeId);
      if (matchIndex >= 0) {
        setCurrentStepIndex(matchIndex);
        return;
      }
      const graphIndex = route.allNodes.findIndex((node) => node.id === nodeId);
      if (graphIndex < 0) return;
      let bestStepIndex = 0;
      for (let i = 0; i < steps.length; i++) {
        const stepNodeIndex = route.allNodes.findIndex((n) => n.id === steps[i].nodeId);
        if (stepNodeIndex >= 0 && stepNodeIndex <= graphIndex) {
          bestStepIndex = i;
        }
      }
      setCurrentStepIndex(bestStepIndex);
    },
    [route, steps]
  );

  return {
    currentStep,
    nextStep,
    progressPercent,
    advanceStep,
    syncStepToNode,
    isComplete,
    currentStepIndex,
  };
}
