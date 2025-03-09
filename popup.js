document.addEventListener("DOMContentLoaded", function () {
  // Get UI elements
  const themeToggle = document.getElementById("themeToggle");
  const newTabToggle = document.getElementById("newTabToggle");
  const removePaywallBtn = document.getElementById("removePaywall");
  const paywallBusterBtn = document.getElementById("paywallBuster");
  const archiveTodayBtn = document.getElementById("archiveToday");
  const archiveIsBtn = document.getElementById("archiveIs");
  const archivePhBtn = document.getElementById("archivePh");

  // AI service UI elements
  const chatGptTab = document.getElementById("chatgpt-tab");
  const perplexityTab = document.getElementById("perplexity-tab");
  const aiKeywordsBtn = document.getElementById("aiKeywords");
  const aiSummaryBtn = document.getElementById("aiSummary");
  const aiFactCheckBtn = document.getElementById("aiFactCheck");
  const aiCounterBtn = document.getElementById("aiCounter");

  // Initialize default settings if not present
  // This ensures consistent behavior on first run
  chrome.storage.sync.get(
    ["darkMode", "openInNewTab", "aiService"],
    function (result) {
      // Set defaults if undefined
      if (result.darkMode === undefined) {
        chrome.storage.sync.set({ darkMode: false });
        result.darkMode = false;
      }
      if (result.openInNewTab === undefined) {
        chrome.storage.sync.set({ openInNewTab: true });
        result.openInNewTab = true;
      }
      if (result.aiService === undefined) {
        chrome.storage.sync.set({ aiService: "chatgpt" });
        result.aiService = "chatgpt";
      }

      // Apply theme
      applyTheme(result.darkMode);

      // Set theme toggle checkbox state
      themeToggle.checked = result.darkMode;

      // Set toggle state
      newTabToggle.checked = result.openInNewTab;

      // Set active AI tab
      updateAiTabs(result.aiService);
    }
  );

  /**
   * Applies dark or light theme to the popup based on user preference
   * @param {boolean} isDark - Whether to use dark theme
   */
  function applyTheme(isDark) {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
    }
  }

  /**
   * Updates the active tab for AI services (ChatGPT or Perplexity)
   * @param {string} service - The AI service to set as active ("chatgpt" or "perplexity")
   */
  function updateAiTabs(service) {
    if (service === "chatgpt") {
      chatGptTab.classList.add("active");
      perplexityTab.classList.remove("active");
    } else {
      perplexityTab.classList.add("active");
      chatGptTab.classList.remove("active");
    }
  }

  // Theme toggle handler - updated for checkbox
  themeToggle.addEventListener("change", function () {
    const newMode = themeToggle.checked;
    applyTheme(newMode);
    chrome.storage.sync.set({ darkMode: newMode });
  });

  // Save toggle state when changed
  newTabToggle.addEventListener("change", function () {
    chrome.storage.sync.set(
      { openInNewTab: newTabToggle.checked },
      function () {
        if (chrome.runtime.lastError) {
          console.error(
            "Error saving tab preference:",
            chrome.runtime.lastError
          );
        }
      }
    );
  });

  // AI Service tab handlers
  chatGptTab.addEventListener("click", function () {
    updateAiTabs("chatgpt");
    chrome.storage.sync.set({ aiService: "chatgpt" });
  });

  perplexityTab.addEventListener("click", function () {
    updateAiTabs("perplexity");
    chrome.storage.sync.set({ aiService: "perplexity" });
  });

  /**
   * Opens a URL either in the current tab or a new tab based on user preferences
   * @param {string} url - The URL to open
   */
  function openLink(url) {
    chrome.storage.sync.get(["openInNewTab"], function (result) {
      const openInNewTab = result.openInNewTab !== false; // Default to true if not set

      try {
        if (openInNewTab) {
          // Open in new tab
          chrome.tabs.create({ url: url });
        } else {
          // Open in current tab
          chrome.tabs.query(
            { active: true, currentWindow: true },
            function (tabs) {
              if (tabs && tabs[0] && tabs[0].id) {
                chrome.tabs.update(tabs[0].id, { url: url });
              } else {
                console.error("Cannot find current tab");
                // Fallback to new tab
                chrome.tabs.create({ url: url });
              }
            }
          );
        }
      } catch (error) {
        console.error("Error opening link:", error);
        // Fallback to opening in new window
        window.open(url, "_blank");
      }
    });
  }

  /**
   * Creates a ChatGPT URL with the provided prompt
   * @param {string} prompt - The prompt to send to ChatGPT
   * @returns {string} The constructed ChatGPT URL
   */
  function buildChatGptUrl(prompt) {
    const encodedPrompt = encodeURIComponent(prompt);
    return `https://chat.openai.com/?model=gpt-4&q=${encodedPrompt}`;
  }

  /**
   * Creates a Perplexity URL with the provided prompt
   * @param {string} prompt - The prompt to send to Perplexity
   * @returns {string} The constructed Perplexity URL
   */
  function buildPerplexityUrl(prompt) {
    return `https://www.perplexity.ai/?q=${encodeURIComponent(prompt)}`;
  }

  /**
   * Creates an AI service URL based on the selected service and action
   * @param {string} url - The current page URL to analyze
   * @param {string} action - The type of analysis to perform (keywords, summary, factcheck, counter)
   * @returns {Promise<string>} A promise that resolves to the AI service URL
   */
  function createAiUrl(url, action) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(["aiService"], function (result) {
        const aiService = result.aiService || "chatgpt";

        // Double encode the URL for nesting within the prompt
        const encodedUrl = encodeURIComponent(encodeURIComponent(url));
        let prompt = "";

        switch (action) {
          case "keywords":
            prompt = `Extract and categorize the most significant keywords from this article: ${url}. Classify them into the following categories where applicable: Main Topics, People (only if mentioned), Places (only if mentioned), Events, and Key Concepts. Present the output as a list with each applicable category clearly labeled and the keywords listed under each. If the article does not mention any people or places, exclude those categories from the output. For example:
    - If the article mentions people and places:
      - Main Topics: climate change, renewable energy
      - People: Greta Thunberg, Elon Musk
      - Places: Paris, California
      - Events: COP26
      - Key Concepts: carbon footprint, sustainability
    - If the article does not mention any people or places:
      - Main Topics: climate change, renewable energy
      - Events: COP26
      - Key Concepts: carbon footprint, sustainability`;
            break;

          case "summary":
            prompt = `Provide a concise bullet list summary of this article based solely on its content: ${url}. The summary should include the following elements where applicable:
  - Context or background: The setting or circumstances that led to the article's topic.
  - Main points or findings: The core arguments, discoveries, or information presented.
  - Conclusion or implications: The outcomes, significance, or future impact of the topic.
  
  Additionally, if the article contains any of the following, include them as separate bullets:
  - Interesting connection: When the article relates its topic to another concept, event, or trend in a way that provides additional insight or context.
  - Aha moment: A point where a surprising conclusion is drawn, or a complex idea is clarified in a way that might lead to a new understanding.
  - Unexpected detail: A specific fact, statistic, or example that is particularly striking or counter to common assumptions.
  
  Each bullet should be a single, clear sentence. Only include the additional elements if they are clearly present in the article.
  
  For example:
  - Context or background: Rising global temperatures have spurred climate action debates.
  - Main points or findings: The article highlights new solar energy breakthroughs.
  - Conclusion or implications: These innovations could reduce carbon emissions significantly.
  - Interesting connection: The development of solar technology is linked to historical advancements in renewable energy.
  - Aha moment: The article reveals that solar energy could be more cost-effective than previously thought, challenging common perceptions.
  - Unexpected detail: A little-known startup is leading the innovation in solar technology, which is surprising given the dominance of larger companies in the field.`;
            break;

          case "factcheck":
            prompt = `Fact-check this article: ${url}. Identify the key claims made in the article and present them in a list. For each claim, provide the following: - Plausibility: State whether the claim aligns with known facts, contradicts known facts, or is not verifiable with current knowledge. - Any logical fallacies or inconsistencies noted in the claim or its supporting arguments. - Suggestions for sources or methods to further verify the claim. After assessing all claims, provide an overall evaluation of the article's reliability based on the assessments. For example, your response should be structured like this:
    - Claim 1: [State the claim]
      - Plausibility: [Assessment]
      - Fallacies/Inconsistencies: [Noted issues]
      - Verification suggestions: [Sources or methods]
    - Claim 2: [State the claim]
      - Plausibility: [Assessment]
      - Fallacies/Inconsistencies: [Noted issues]
      - Verification suggestions: [Sources or methods]
    - Overall evaluation: [Summary of reliability]`;
            break;
          case "counter":
            prompt = `Critically analyze the article at ${url} to counter its main arguments. Identify two key claims made in the article. For each claim, provide a short counterargument (one sentence) focusing on the most critical flaw or alternative view. Conclude with a one-sentence summary of the article's main weakness.

Structure your response as follows:

**Claim 1**: [State the claim briefly]
**Counter**: [One sentence]
**Claim 2**: [State the claim briefly]
**Counter**: [One sentence]
**Summary**: [One-sentence conclusion]`;
            break;
        }

        const aiUrl =
          aiService === "chatgpt"
            ? buildChatGptUrl(prompt)
            : buildPerplexityUrl(prompt);

        resolve(aiUrl);
      });
    });
  }

  // Button click handlers
  removePaywallBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = encodeURIComponent(tabs[0].url);
        openLink(`https://www.removepaywall.com/search?url=${currentUrl}`);
      }
    });
  });

  paywallBusterBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = encodeURIComponent(tabs[0].url);
        openLink(`https://paywallbuster.com/articles/?article=${currentUrl}`);
      }
    });
  });

  archiveTodayBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        openLink(
          `https://archive.today/submit/?url=${encodeURIComponent(currentUrl)}`
        );
      }
    });
  });

  archiveIsBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        openLink(
          `https://archive.is/submit/?url=${encodeURIComponent(currentUrl)}`
        );
      }
    });
  });

  archivePhBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        openLink(
          `https://archive.ph/submit/?url=${encodeURIComponent(currentUrl)}`
        );
      }
    });
  });

  // AI service button handlers
  aiKeywordsBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        createAiUrl(currentUrl, "keywords").then((aiUrl) => {
          openLink(aiUrl);
        });
      }
    });
  });

  aiSummaryBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        createAiUrl(currentUrl, "summary").then((aiUrl) => {
          openLink(aiUrl);
        });
      }
    });
  });

  aiFactCheckBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        createAiUrl(currentUrl, "factcheck").then((aiUrl) => {
          openLink(aiUrl);
        });
      }
    });
  });

  aiCounterBtn.addEventListener("click", function () {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs && tabs[0] && tabs[0].url) {
        const currentUrl = tabs[0].url;
        createAiUrl(currentUrl, "counter").then((aiUrl) => {
          openLink(aiUrl);
        });
      }
    });
  });
});
