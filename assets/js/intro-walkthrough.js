// Fit the embedded viewer and pause animation while it is outside the viewport.
(() => {
  const viewer = document.getElementById('intro-walkthrough');
  if (!viewer) return;
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== viewer.contentWindow) return;
    if (event.data?.type !== 'walkthrough-height' || !Number.isFinite(event.data.height)) return;
    viewer.style.height = `${Math.max(200, Math.min(700, event.data.height))}px`;
  });
  if (!('IntersectionObserver' in window)) return;
  let visible = true;
  const notify = () => viewer.contentWindow?.postMessage(
    { type: 'walkthrough-visibility', visible }, window.location.origin
  );
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    notify();
  }).observe(viewer);
  viewer.addEventListener('load', notify);
})();
