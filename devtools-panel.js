const port = chrome.runtime.connect({ name: "devtools" });
port.postMessage({ type: "INIT" });

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "DEV_LOG" && message.data) {
    const errorText = message.data.join(" ");
    if (/error|exception|failed/i.test(errorText)) {
      const explanation = await getAIExplanation(errorText);
      const container = document.getElementById("log-container");
      container.innerText += `\n🔍 ${errorText}\n→ ${explanation}\n`;
    }
  }
});

async function getAIExplanation(error) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer YOUR_OPENAI_API_KEY",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "user", content: `Explain this JavaScript error:\n${error}` },
      ],
    }),
  });
  const json = await res.json();
  return json.choices[0].message.content;
}
