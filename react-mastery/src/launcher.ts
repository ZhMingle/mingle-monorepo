// Keep an open tab available to the launcher, including while it is in the background.
async function listenForLaunch() {
  for (;;) {
    try {
      const response = await fetch('/api/browser/wait', {
        method: 'POST', headers: {'Content-Type':'application/json','X-Clarity-Request':'1'}, body: '{}',
      });
      if (!response.ok) throw new Error('Launcher unavailable');
      const message = await response.json();
      if (message.refresh) {
        const url = new URL(location.href);
        url.searchParams.set('launch', String(Date.now()));
        location.replace(url.href);
        return;
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
void listenForLaunch();
