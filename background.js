// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "download") {
        console.log("[Background] Download-Anfrage erhalten:", message.filename);

        chrome.downloads.download({
            url: message.url,
            filename: message.filename, // z. B. profilname/dateiname.jpg
            conflictAction: "uniquify"  // bei Duplikaten wird automatisch durchnummeriert
        }, downloadId => {
            if (chrome.runtime.lastError) {
                console.error("[Background] Download-Fehler:", chrome.runtime.lastError.message);
            } else {
                console.log("[Background] Download gestartet, ID:", downloadId);
            }
        });
    }
});
