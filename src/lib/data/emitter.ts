// Shared change-notification bus. Both adapters call `emit()` after a
// mutation; the useData hook subscribes so the dashboard updates live.
type Listener = () => void;

const listeners = new Set<Listener>();
let scheduled = false;

export function emit(): void {
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    listeners.forEach((l) => l());
  });
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
