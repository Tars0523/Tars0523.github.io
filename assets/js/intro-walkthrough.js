// Stop drawing the animated hero while it is outside the viewport.
(() => {
  const viewer = document.getElementById('intro-walkthrough');
  if (!viewer || !('IntersectionObserver' in window)) return;
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
