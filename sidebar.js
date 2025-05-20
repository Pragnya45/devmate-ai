console.log("[sidebar.js] Script loaded");

// Inject CSS styles for sidebar UI
const styleContent = `
  #sidebar {
    position: fixed;
    top: 0;
    right: 0;
    width: 320px;
    height: 100%;
    background: linear-gradient(135deg, #4a90e2, #50e3c2);
    box-shadow: -2px 0px 5px rgba(0, 0, 0, 0.2);
    padding: 20px;
    overflow-y: auto;
    z-index: 999999;
    box-sizing: border-box;
    font-family: Arial, sans-serif;
    padding-bottom:30px;
  }
  #container {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h3 {
    margin-bottom: 15px;
    font-size: 22px;
    font-weight: bold;
    color: #fff;
  }
  #closeSidebar {
    padding: 10px 15px;
    background-color: #50e3c2;
    color: #fff;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  #closeSidebar:hover {
    background-color: #357ab7;
  }
  #loadingSpinner {
    width: 100%;
    height: 80vh;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
  }
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #50e3c2;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
    #aiResponseBox {
  background: rgba(255, 255, 255, 0.12);
  padding: 15px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  margin-top: 15px;
}

#aiResponseBox h4 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #fff;
}
  #aiResponseContent {
    background-color: #fff;
    color: #333;
    padding: 15px;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 400;
    white-space: pre-wrap;
    word-wrap: break-word;
    margin-top: 20px;
    box-sizing: border-box;
    overflow-y: auto;
    border: 1px solid #ddd;
    display: none;
    max-height: calc(85vh - 20px);
  }
  #wikiSummary {
    background: rgba(255, 255, 255, 0.12);
    padding: 15px;
    border-radius: 12px;
    color: #fff;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  }

  #wikiSummary h4 {
    font-size: 18px;
    margin-bottom: 10px;
    color: #fff;
  }

  #wikiContent {
    background: #fff;
    color: #333;
    padding: 12px;
    font-size: 15px;
    border-radius: 8px;
    line-height: 1.5;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  #trustedLinks {
   background: rgba(255, 255, 255, 0.12);
  padding: 15px;
  border-radius: 12px;
  color: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  margin-top: 15px;
  margin-bottom: 20px;
}

#trustedLinks h4 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #fff;
}

  #linkList {
    list-style-type: disc;
    padding-left: 20px;
    background: #fff;
     border-radius: 8px;
     padding: 12px;

  }

  #linkList li {
    margin-bottom: 8px;
  }

 #linkList a {
  color: #000;
  font-size: 14px;
  font-weight: 500;
  text-decoration: underline;
  transition: color 0.3s ease;
}

#linkList a:hover {
  color: #0077ff; 
}
`;

const styleTag = document.createElement("style");
styleTag.textContent = styleContent;
document.head.appendChild(styleTag);
console.log("[sidebar.js] Styles injected");
// Close sidebar when user clicks the close button
document.getElementById("closeSidebar").addEventListener("click", () => {
  console.log("[sidebar.js] Close button clicked, removing sidebar");
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.remove();
});

const loadingSpinner = document.getElementById("loadingSpinner");
const aiResponseContent = document.getElementById("aiResponseContent");
const wikiSummaryDiv = document.getElementById("wikiSummary");
const wikiContentDiv = document.getElementById("wikiContent");
const trustedLinksDiv = document.getElementById("trustedLinks");
const linkList = document.getElementById("linkList");

console.log("[sidebar.js] DOM elements fetched");

// Initially hide content and show spinner
loadingSpinner.style.display = "flex";
aiResponseContent.style.display = "none";
wikiSummaryDiv.style.display = "none";
trustedLinksDiv.style.display = "none";

chrome.storage.local.get("selectedText", async ({ selectedText }) => {
  console.log("[sidebar.js] Retrieved selectedText:", selectedText);

  if (!selectedText) {
    aiResponseContent.textContent = "No text selected.";
    loadingSpinner.style.display = "none";
    document.getElementById("aiResponseBox").style.display = "block";
    aiResponseContent.style.display = "block";
    return;
  }

  // Function to fetch Wikipedia summary
  async function fetchWikipediaSummary(query) {
    console.log("[sidebar.js] Fetching Wikipedia summary for:", query);

    try {
      const res = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          query
        )}`
      );
      console.log("[sidebar.js] Wikipedia API response:", res);
      if (!res.ok) return null;
      const data = await res.json();
      console.log("[sidebar.js] Wikipedia API JSON data:", data);
      if (
        data.description === "Topics referred to by the same term" ||
        !data.extract
      ) {
        console.log("[sidebar.js] Skipping disambiguation or empty summary.");
        return null;
      }
      return data.extract || null;
    } catch {
      return null;
    }
  }

  // Trusted links generator
  function getTrustedLinks(query) {
    console.log("[sidebar.js] Generating trusted links for:", query);
    return [
      {
        title: `Google Search: ${query}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
      },
      {
        title: `Wikipedia: ${query}`,
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
      },
      {
        title: `PubMed Search: ${query}`,
        url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(
          query
        )}`,
      },
    ];
  }
  console.log("[sidebar.js] Sending message to background for AI response");
  // Request AI explanation from background
  const aiResult = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { type: "devmate-get-ai-response", prompt: selectedText },
      (response) => {
        console.log("[sidebar.js] Received AI response:", response);
        resolve(response?.result || "No response from AI.");
      }
    );
  });

  loadingSpinner.style.display = "none";
  aiResponseContent.textContent = aiResult;
  document.getElementById("aiResponseBox").style.display = "block";
  aiResponseContent.style.display = "block";
  // Fetch and show Wikipedia summary
  const wikiSummary = await fetchWikipediaSummary(selectedText);
  if (wikiSummary) {
    console.log("[sidebar.js] Wikipedia summary displayed");
    wikiContentDiv.textContent = wikiSummary;
    wikiSummaryDiv.style.display = "block";
  }

  // Generate and show trusted links
  const trustedLinks = getTrustedLinks(selectedText);
  linkList.innerHTML = "";
  trustedLinks.forEach(({ title, url }) => {
    const li = document.createElement("li");
    li.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`;
    linkList.appendChild(li);
  });
  trustedLinksDiv.style.display = "block";
  console.log("[sidebar.js] Trusted links rendered");
});
