/* WebAnnotator — Background Service Worker (MV3)
 * Relays mode/color changes from the top-frame toolbar to every frame in the tab.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender.tab) return;

  const tabId = sender.tab.id;

  switch (message.action) {
    case 'wa-setMode':
      chrome.tabs.sendMessage(tabId, { action: 'wa-modeChanged', mode: message.mode });
      break;

    case 'wa-setColor':
      chrome.tabs.sendMessage(tabId, { action: 'wa-colorChanged', color: message.color });
      break;

    case 'wa-clearAll':
      chrome.tabs.sendMessage(tabId, { action: 'wa-clearAll' });
      break;
  }
});
