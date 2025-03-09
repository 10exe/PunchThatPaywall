// Initialize default settings when extension is installed
chrome.runtime.onInstalled.addListener(function () {
  chrome.storage.sync.get(
    ["darkMode", "openInNewTab", "aiService"],
    function (result) {
      // Set default values if they don't exist
      if (result.darkMode === undefined) {
        chrome.storage.sync.set({ darkMode: false });
      }
      if (result.openInNewTab === undefined) {
        chrome.storage.sync.set({ openInNewTab: true });
      }
      if (result.aiService === undefined) {
        chrome.storage.sync.set({ aiService: "chatgpt" });
      }
    }
  );
});
