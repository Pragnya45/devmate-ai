let apiKey = "";

async function loadConfig() {
  const res = await fetch(chrome.runtime.getURL("config.json"));
  const config = await res.json();
  apiKey = config.OPENAI_API_KEY;
}

async function askOpenAI(prompt) {
  if (!apiKey) await loadConfig();
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  console.log("Full OpenAI API response:", data);

  if (
    !response.ok ||
    !data.choices ||
    !Array.isArray(data.choices) ||
    !data.choices[0]
  ) {
    const errorMsg = data?.error?.message || "Unexpected API response format.";
    return window.alert(`OpenAI API Error: ${errorMsg}`);
  }

  return data.choices[0].message.content;
}
