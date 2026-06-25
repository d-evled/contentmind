export interface ScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  threshold?: number;
}

export interface ScrollState {
  atBottom: boolean;
  showJumpButton: boolean;
  shouldAutoScroll: boolean;
}

export function computeScrollState({
  scrollTop,
  scrollHeight,
  clientHeight,
  threshold = 24
}: ScrollMetrics): ScrollState {
  const distanceFromBottom = scrollHeight - clientHeight - scrollTop;
  const atBottom = distanceFromBottom <= threshold;
  return {
    atBottom,
    showJumpButton: !atBottom,
    shouldAutoScroll: atBottom
  };
}
