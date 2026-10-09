// Research pages do not load Chirpy's PWA update controls. Retire its old cache here.
(async () => {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    const legacy = registrations.filter(registration => {
      const worker = registration.active || registration.waiting || registration.installing;
      if (!worker) return false;
      const url = new URL(worker.scriptURL);
      return url.origin === location.origin && url.pathname.endsWith('/sw.min.js');
    });
    if (!legacy.length) return;
    await Promise.all(legacy.map(registration => registration.unregister()));
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('chirpy-')).map(name => caches.delete(name)));
    // One reload also replaces CSS or scripts served by the retired worker.
    location.reload();
  } catch {
    // Browsers without storage access can still display the online website.
  }
})();
