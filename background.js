fetch(chrome.runtime.getURL("config.json"))
  .then((res) => res.json())
  .then((config) => {
    chrome.storage.local.set({ openaiKey: config.OPENAI_API_KEY });
  });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "devmate-analyze",
    title: "Ask DevMate AI",
    contexts: ["selection"],
  });
  chrome.contextMenus.create({
    id: "summarize-page",
    title: "🧠 Summarize This Page",
    contexts: ["page"],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const tabId = tab.id;
  if (info.menuItemId === "devmate-analyze") {
    const selectedText = info.selectionText;
    await chrome.storage.local.set({ selectedText });
    await injectSidebar(tabId);
  }
  if (info.menuItemId === "summarize-page") {
    await chrome.storage.local.remove("selectedText");
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
    await injectSidebar(tabId);
  }
});
async function injectSidebar(tabId) {
  // Inject sidebar.html if not already present
  await chrome.scripting.executeScript({
    target: { tabId },
    func: async () => {
      if (!document.getElementById("sidebar")) {
        const res = await fetch(chrome.runtime.getURL("sidebar.html"));
        const html = await res.text();
        const div = document.createElement("div");
        div.innerHTML = html;
        document.body.appendChild(div.firstElementChild);
      }
    },
  });

  // Inject sidebar.js
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["sidebar.js"],
  });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "devmate-get-ai-response") {
    chrome.storage.local.get("openaiKey", async (data) => {
      const apiKey = data.openaiKey;
      const result = await analyzeWithOpenAI(
        message.prompt,
        message.mode,
        apiKey
      );
      const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
      const links = [];
      let match;
      while ((match = linkRegex.exec(result)) !== null) {
        links.push({ title: match[1], url: match[2] });
      }
      sendResponse({ result, links });
    });

    return true; // Required for async sendResponse
  }
  if (message.type === "prepare-summary") {
    const sectionedText = extractSections(); // assuming this function exists
    chrome.storage.local.set({ selectedSections: sectionedText });
  }
});

async function analyzeWithOpenAI(text, mode, apiKey) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "X-Title": "DevMate AI",
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-r1-0528:free",
          messages: [
            {
              role: "system",
              content:
                "You are an expert web assistant that explains content and finds trusted links on a topic.",
            },
            {
              role: "user",
              content: `Explain the following text and give 3 trusted links (titles + URLs) about it:\n\n"${text}"`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4089,
        }),
      }
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();

    return content && content.length > 0
      ? content
      : "⚠️ The AI response was empty. Try again or check your API quota.";
  } catch (err) {
    return "Error: " + err.message;
  }
}
