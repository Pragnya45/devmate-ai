(() => {
  if (window.__devmateSidebarInjected) return; // Prevent reinjection
  window.__devmateSidebarInjected = true;
  const devmateSidebarStyles = `
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
    padding-bottom: 30px;
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
    word-wrap: break-word;
overflow-wrap: anywhere;
white-space: normal;
word-break: break-word;
}
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

  #resizer {
    position: absolute;
    left: -5px;
    top: 0;
    width: 10px;
    height: 100%;
    cursor: ew-resize;
    z-index: 1000000;
  }
    .devmate-tooltip {
  position: relative;
  cursor: help;
  border-bottom: 1px dotted #000;
}

.tooltip-text {
  visibility: hidden;
  position: absolute;
  background: #333;
  color: #fff;
  padding: 4px;
  border-radius: 4px;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

.devmate-tooltip:hover .tooltip-text {
  visibility: visible;
}

`;

  if (!document.getElementById("devmate-style-tag")) {
    const styleTag = document.createElement("style");
    styleTag.id = "devmate-style-tag"; // give it a unique ID
    styleTag.textContent = devmateSidebarStyles;
    document.head.appendChild(styleTag);
  }

  const sidebar = document.getElementById("sidebar");
  const resizer = document.getElementById("resizer");
  let isResizing = false;

  resizer?.addEventListener("mousedown", () => {
    isResizing = true;
    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth >= 250 && newWidth <= 800) {
      sidebar.style.width = `${newWidth}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });

  document.getElementById("closeSidebar")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.remove();
  });

  const loadingSpinner = document.getElementById("loadingSpinner");
  const aiResponseContent = document.getElementById("aiResponseContent");
  const aiBox = document.getElementById("aiResponseBox");
  const wikiSummaryDiv = document.getElementById("wikiSummary");
  const wikiContentDiv = document.getElementById("wikiContent");
  const trustedLinksDiv = document.getElementById("trustedLinks");
  const linkList = document.getElementById("linkList");
  const explanationsContainer = document.getElementById(
    "explanations-container"
  );

  loadingSpinner.style.display = "flex";
  aiBox.style.display = "none";
  aiResponseContent.style.display = "none";
  wikiSummaryDiv.style.display = "none";
  trustedLinksDiv.style.display = "none";

  chrome.storage.local.get(["selectedText"], async ({ selectedText }) => {
    if (!selectedText) {
      aiResponseContent.textContent = "No text selected or transcript found.";
      loadingSpinner.style.display = "none";
      document.getElementById("aiResponseBox").style.display = "block";
      aiResponseContent.style.display = "block";
      aiBox.style.display = "block";
      return;
    }
    async function fetchWikipediaSummary(query) {
      try {
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            query
          )}`
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (
          data.description === "Topics referred to by the same term" ||
          !data.extract
        ) {
          return null;
        }
        return data.extract || null;
      } catch {
        return null;
      }
    }

    // Trusted links generator
    function getTrustedLinks(links, query) {
      return [
        ...links,
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
    const mode = selectedText.length > 200 ? "sectioned" : "simple";
    chrome.runtime.sendMessage(
      {
        type: "devmate-get-ai-response",
        prompt: selectedText,
        mode,
      },
      async (response) => {
        const aiResult = response?.result || "No response from AI.";
        const links = response?.links || [];
        loadingSpinner.style.display = "none";
        aiResponseContent.textContent = aiResult;
        if (Array.isArray(aiResult)) {
          renderExplanations(aiResult); // structured sections
          // document.getElementById("explanations-container").style.display =
          //   "block";
        } else {
          aiResponseContent.textContent = aiResult || "No response from AI.";
          aiResponseContent.style.display = "block";
        }
        aiBox.style.display = "block";
        if (mode !== "sectioned") {
          const wikiSummary = await fetchWikipediaSummary(selectedText);
          if (wikiSummary) {
            wikiContentDiv.textContent = wikiSummary;
            wikiSummaryDiv.style.display = "block";
          }

          const trustedLinks =
            Array.isArray(links) && links.length > 0
              ? links // AI-generated links
              : getTrustedLinks([], selectedText); // fallback links if AI doesn't return any

          linkList.innerHTML = "";
          trustedLinks.forEach(({ title, url }) => {
            const li = document.createElement("li");
            li.innerHTML = `<a href="${url}" target="_blank" rel="noopener noreferrer">${title}</a>`;
            linkList.appendChild(li);
          });
          trustedLinksDiv.style.display = "block";
        }
      }
    );
  });

  function renderExplanations(explanations) {
    explanationsContainer.innerHTML = "";
    explanationsContainer.style.display = "block";
    aiResult.forEach(({ id, explanation }) => {
      const section = document.createElement("div");
      section.innerHTML = `
          <button class="toggle-btn">Section ${id}</button>
          <div class="explanation hidden">${explanation}</div>`;
      section.querySelector("button").onclick = () => {
        section.querySelector(".explanation").classList.toggle("hidden");
      };
      explanationsContainer.appendChild(section);
    });
  }
})();
