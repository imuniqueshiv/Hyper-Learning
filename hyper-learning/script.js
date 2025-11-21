// -------------------- Universal RGPV Question System --------------------
const BACKEND_URL = 'https://hyper-learning-backend.vercel.app/api/ask';
const CACHE_API_URL = 'https://hyper-learning-backend.vercel.app/api/cache'; // Global cache endpoint
const LOCAL_CACHE_KEY = 'rgpv_universal_answers_v1';
const CACHE_TTL_DAYS = 30;
const REGENERATE_LIMIT = 7;

// Complete subject mapping for all 10 subjects
const SUBJECT_MAP = {
  'BT-101': { name: 'Engineering Chemistry', type: 'CHEMISTRY' },
  'BT-102': { name: 'Mathematics-I', type: 'MATH' },
  'BT-103': { name: 'English for Communication', type: 'ENGLISH' },
  'BT-104': { name: 'Basic Electrical & Electronics Engineering', type: 'ELECTRICAL' },
  'BT-105': { name: 'Engineering Graphics', type: 'GRAPHICS' },
  'BT-201': { name: 'Engineering Physics', type: 'PHYSICS' },
  'BT-202': { name: 'Mathematics-II', type: 'MATH' },
  'BT-203': { name: 'Basic Mechanical Engineering', type: 'MECHANICAL' },
  'BT-204': { name: 'Basic Civil Engineering & Mechanics', type: 'CIVIL' },
  'BT-205': { name: 'Basic Computer Engineering', type: 'COMPUTER' }
};

// -------------------- Global Cache API Functions --------------------
async function getGlobalCache(questionId) {
  try {
    const response = await fetch(`${CACHE_API_URL}?questionId=${encodeURIComponent(questionId)}`);
    if (response.ok) {
      const data = await response.json();
      return data.cached ? data : null;
    }
  } catch (e) {
    console.warn('Global cache fetch failed', e);
  }
  return null;
}

async function setGlobalCache(questionId, answer, metadata) {
  try {
    await fetch(CACHE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        questionId,
        answer,
        metadata: {
          ...metadata,
          timestamp: Date.now()
        }
      })
    });
  } catch (e) {
    console.warn('Global cache save failed', e);
  }
}

async function getGlobalRegenerateCount(questionId) {
  try {
    const response = await fetch(`${CACHE_API_URL}/regenerate?questionId=${encodeURIComponent(questionId)}`);
    if (response.ok) {
      const data = await response.json();
      return data.count || 0;
    }
  } catch (e) {
    console.warn('Failed to fetch regenerate count', e);
  }
  return 0;
}

async function incrementGlobalRegenerateCount(questionId) {
  try {
    const response = await fetch(`${CACHE_API_URL}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId })
    });
    if (response.ok) {
      const data = await response.json();
      return data.count || 1;
    }
  } catch (e) {
    console.warn('Failed to increment regenerate count', e);
  }
  return 1;
}

// -------------------- Core Utilities --------------------
function loadLocalCache() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_CACHE_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function saveLocalCache(cache) {
  try {
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    console.warn('Cache save failed', e);
  }
}

function getSubjectInfo(questionId) {
  const subjectCode = questionId?.split('_')[0];
  return SUBJECT_MAP[subjectCode] || { name: 'General', type: 'GENERAL' };
}

function generateQuestionId(questionContainer) {
  // Generate unique ID from page and question structure
  const pageTitle = document.title;
  const subjectCode = pageTitle.match(/BT-\d+/)?.[0] || 'GENERAL';
  const examDate = pageTitle.match(/\w+ \d{4}/)?.[0]?.replace(' ', '_').toLowerCase() || 'unknown';
  
  const summary = questionContainer.querySelector('summary');
  const questionNumber = summary?.textContent.match(/Q\.?\s*(\d+)/)?.[1] || '0';
  
  // Check if it has parts (a/b)
  const allAnswerPs = questionContainer.querySelectorAll('p[style*="margin-left"]');
  const hasMultipleParts = allAnswerPs.length > 1 || summary?.innerHTML.includes('<hr>');
  
  if (hasMultipleParts) {
    return [`${subjectCode}_${examDate}_Q${questionNumber}a`, `${subjectCode}_${examDate}_Q${questionNumber}b`];
  } else {
    return [`${subjectCode}_${examDate}_Q${questionNumber}`];
  }
}

function extractQuestionText(questionContainer, partIndex = 0) {
    const summary = questionContainer.querySelector('summary');
    if (!summary) return '';

    // Get ALL paragraphs within the summary
    const allPs = Array.from(summary.querySelectorAll('p'));
    
    // Find the "main" paragraphs (those that likely start with a), b), etc.)
    // We can identify these as paragraphs that are NOT indented.
    const mainPartPs = allPs.filter(p => !p.style.marginLeft);

    // Check if the requested part index is valid
    if (partIndex >= mainPartPs.length) {
        return ''; // No such part found
    }

    // This is the starting paragraph for our section (e.g., the line with "b)...")
    const startP = mainPartPs[partIndex];
    let combinedText = [startP.textContent.trim()];

    // Find where the next main section begins, which is our stopping point
    const endP = (partIndex + 1 < mainPartPs.length) ? mainPartPs[partIndex + 1] : null;

    // Find the position of our starting paragraph in the list of ALL paragraphs
    let currentIndex = allPs.indexOf(startP) + 1;

    // Keep reading subsequent paragraphs...
    while (currentIndex < allPs.length) {
        const currentP = allPs[currentIndex];

        // ...until we hit the next main part.
        if (currentP === endP) {
            break;
        }

        // Add the text from indented sub-questions
        if (currentP.style.marginLeft) {
            combinedText.push(currentP.textContent.trim());
        } else {
            // If we hit another non-indented paragraph that wasn't our target, stop.
            break;
        }
        currentIndex++;
    }

    // Join all the collected lines together
    return combinedText.join('\n');
}

function createSubjectPrompt(subjectInfo, questionText) {
  const prompts = {
    'MATH': 'You are an expert mathematics tutor for RGPV B.Tech students. Provide detailed step-by-step solutions with proper LaTeX formatting ($ for inline, $$ for display). Show all mathematical steps clearly: ',
    'ENGLISH': 'You are an expert English communication tutor for RGPV B.Tech students. Provide comprehensive answers with proper grammar explanations, examples, and clear formatting: ',
    'GRAPHICS': 'You are an expert engineering graphics tutor for RGPV B.Tech students. Provide detailed explanations of drawing principles, projection methods, and construction steps: ',
    'COMPUTER': 'You are an expert computer engineering tutor for RGPV B.Tech students. Provide detailed technical explanations with code examples, algorithms, and programming concepts: ',
    'PHYSICS': 'You are an expert physics tutor for RGPV B.Tech students. Provide detailed solutions with proper physics concepts, formulas, and diagrams where needed: ',
    'CHEMISTRY': 'You are an expert chemistry tutor for RGPV B.Tech students. Provide detailed answers with chemical equations, reactions, and scientific explanations: ',
    'ELECTRICAL': 'You are an expert electrical engineering tutor for RGPV B.Tech students. Provide detailed technical answers with circuit analysis and engineering principles: ',
    'MECHANICAL': 'You are an expert mechanical engineering tutor for RGPV B.Tech students. Provide detailed answers with engineering principles and practical applications: ',
    'CIVIL': 'You are an expert civil engineering tutor for RGPV B.Tech students. Provide detailed answers with engineering concepts and calculations: ',
  };
  
  return prompts[subjectInfo.type] + questionText;
}

function formatAnswerAsHtml(str) {
  if (!str) return '';
  
  const escaped = String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  let formatted = escaped
    .replace(/^### (.*$)/gim, '<h3 style="font-size: 1.1rem; margin: 1rem 0 0.5rem;">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 style="font-size: 1.25rem; margin: 1rem 0 0.5rem;">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 style="font-size: 1.4rem; margin: 1rem 0 0.5rem;">$1</h1>')
    .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/```([^`]+)```/g, '<pre style="background:#f3f4f6;padding:0.75rem;border-radius:6px;overflow-x:auto;font-size:0.85rem;max-width:100%;"><code>$1</code></pre>')
    .replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 4px;border-radius:3px;font-size:0.9em;">$1</code>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 0.5rem;">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li style="margin-bottom: 0.5rem;">$2</li>')
    .replace(/\n\n/g, '</p><p style="margin-bottom: 0.75rem; line-height: 1.6; font-size: 0.95rem;">')
    .replace(/\n/g, '<br>');

  if (!formatted.includes('<p>') && !formatted.includes('<h')) {
    formatted = '<p style="margin-bottom: 0.75rem; line-height: 1.6; font-size: 0.95rem;">' + formatted + '</p>';
  }

  return formatted;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

// -------------------- API Functions --------------------
const controllers = new WeakMap();

async function fetchAnswerStream(question, onChunk, signal) {
  const url = `${BACKEND_URL}?question=${encodeURIComponent(question)}`;
  const resp = await fetch(url, { method: 'GET', signal });
  const ct = resp.headers.get('content-type') || '';

  if (ct.includes('application/json')) {
    const data = await resp.json();
    const text = data.answer || '';
    onChunk(text, { done: true, backendCached: !!data.cached });
    return { fullText: text, backendCached: !!data.cached };
  }

  if (resp.body && typeof resp.body.getReader === 'function') {
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let full = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      onChunk(chunk, { done: false });
    }
    const backendCached = resp.headers.get('x-cached') === 'true' || false;
    onChunk('', { done: true, backendCached });
    return { fullText: full, backendCached };
  }

  const text = await resp.text();
  onChunk(text, { done: true, backendCached: resp.headers.get('x-cached') === 'true' });
  return { fullText: text, backendCached: resp.headers.get('x-cached') === 'true' };
}

// -------------------- Universal Answer Display Function --------------------
async function displayAnswer(targetElement, questionId, questionText, opts = { forceRefresh: false }) {
  const TTL = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;
  const regenCount = await getGlobalRegenerateCount(questionId);
  const regenRemaining = REGENERATE_LIMIT - regenCount;

  // Check global cache first
  if (!opts.forceRefresh) {
    const globalCache = await getGlobalCache(questionId);
    if (globalCache && globalCache.answer) {
      const subjectInfo = getSubjectInfo(questionId);
      const isLimitReached = regenCount >= REGENERATE_LIMIT;
      
      targetElement.innerHTML = `
       <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid #0ea5e9; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
          <div style="margin-bottom: 0.5rem;">
            <span style="font-size: 12px; background: #dcfce7; color: #15803d; padding: 4px 8px; border-radius: 999px;">
              Global cached (${subjectInfo.name})
            </span>
            <span style="font-size: 12px; color: #6b7280; margin-left: 8px;">
              Saved ${timeAgo(globalCache.metadata?.timestamp || Date.now())}
            </span>
          </div>
          ${formatAnswerAsHtml(globalCache.answer)}
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; flex-wrap: wrap;">
            <button onclick="copyText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Copy</button>
            <button onclick="downloadText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Download</button>
            <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                    ${isLimitReached ? 'disabled' : ''} 
                    style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: ${isLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isLimitReached ? '0.5' : '1'};"
                    title="${isLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${regenCount}/${REGENERATE_LIMIT}`}">
              ${isLimitReached ? 'Limit Reached' : `Regenerate (${regenRemaining} left)`}
            </button>
          </div>
        </div>
      `;
      
      // Save to local cache as well
      const localCache = loadLocalCache();
      localCache[questionId] = {
        answer: globalCache.answer,
        ts: Date.now(),
        backendCached: true,
        subject: subjectInfo.name,
        questionText: questionText
      };
      saveLocalCache(localCache);
      
      if (window.MathJax && window.MathJax.typesetPromise) {
        MathJax.typesetPromise([targetElement]).catch(console.warn);
      }
      return;
    }
  }

  // Show loading - FIXED: Better layout for mobile
  const subjectInfo = getSubjectInfo(questionId);
  const abortController = new AbortController();
  
  targetElement.innerHTML = `
    <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f0f9ff; border-left: 4px solid #0ea5e9;">
      <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 0;">
          <div style="width: 16px; height: 16px; border: 2px solid #e5e7eb; border-top-color: #0ea5e9; border-radius: 50%; animation: spin 0.8s linear infinite; flex-shrink: 0;"></div>
          <span style="font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis;">Generating ${subjectInfo.name} solution...</span>
        </div>
        <button onclick="window.cancelGeneration_${questionId.replace(/[^a-zA-Z0-9]/g, '_')}()" style="padding: 0.3rem 0.6rem; border-radius: 4px; border: 1px solid #ccc; background: #fff; cursor: pointer; flex-shrink: 0; font-size: 0.85rem;">Cancel</button>
      </div>
      <div id="streaming-${questionId}" style="margin-top: 1rem;"></div>
    </div>
  `;

  // Set up cancel function
  window[`cancelGeneration_${questionId.replace(/[^a-zA-Z0-9]/g, '_')}`] = () => {
    abortController.abort();
    targetElement.innerHTML = '<p style="color: #dc2626; padding: 1rem;">Generation cancelled</p>';
  };

  const streamingDiv = document.getElementById(`streaming-${questionId}`);

  try {
    const fullQuery = createSubjectPrompt(subjectInfo, questionText);
    let streamed = '';
    let finalBackendCached = false;

    await fetchAnswerStream(fullQuery, (chunk, meta) => {
      if (meta.done && chunk === '') {
        finalBackendCached = !!meta.backendCached;
        
        // Save to global cache
        setGlobalCache(questionId, streamed, {
          subject: subjectInfo.name,
          questionText: questionText,
          backendCached: finalBackendCached
        });
        
        getGlobalRegenerateCount(questionId).then(finalRegenCount => {
          const finalRegenRemaining = REGENERATE_LIMIT - finalRegenCount;
          const isFinalLimitReached = finalRegenCount >= REGENERATE_LIMIT;
          
          // Final display
          targetElement.innerHTML = `
            <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid #0ea5e9; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
              <div style="margin-bottom: 0.5rem;">
                <span style="font-size: 12px; background: ${finalBackendCached ? '#dcfce7' : '#eef2ff'}; color: ${finalBackendCached ? '#15803d' : '#4338ca'}; padding: 4px 8px; border-radius: 999px;">
                  ${finalBackendCached ? 'Server cached' : 'Fresh answer'} (${subjectInfo.name})
                </span>
              </div>
              ${formatAnswerAsHtml(streamed)}
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button onclick="copyText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Copy</button>
                <button onclick="downloadText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Download</button>
                <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                        ${isFinalLimitReached ? 'disabled' : ''} 
                        style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: ${isFinalLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isFinalLimitReached ? '0.5' : '1'};"
                        title="${isFinalLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${finalRegenCount}/${REGENERATE_LIMIT}`}">
                  ${isFinalLimitReached ? 'Limit Reached' : `Regenerate (${finalRegenRemaining} left)`}
                </button>
              </div>
            </div>
          `;
          
          // Save to local cache
          const localCache = loadLocalCache();
          localCache[questionId] = { 
            answer: streamed, 
            ts: Date.now(), 
            backendCached: finalBackendCached,
            subject: subjectInfo.name,
            questionText: questionText
          };
          saveLocalCache(localCache);
          
          if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([targetElement]).catch(console.warn);
          }
        });
        return;
      }

      streamed += chunk;
      if (streamingDiv) {
        streamingDiv.innerHTML = formatAnswerAsHtml(streamed) + '<span style="display: inline-block; width: 8px; background: #111; margin-left: 2px; height: 1em; animation: blink 1s steps(2) infinite;">|</span>';
      }

      if (meta.done) {
        // Handle immediate completion
        finalBackendCached = !!meta.backendCached;
        
        // Save to global cache
        setGlobalCache(questionId, streamed, {
          subject: subjectInfo.name,
          questionText: questionText,
          backendCached: finalBackendCached
        });
        
        getGlobalRegenerateCount(questionId).then(immRegenCount => {
          const immRegenRemaining = REGENERATE_LIMIT - immRegenCount;
          const isImmLimitReached = immRegenCount >= REGENERATE_LIMIT;
          
          targetElement.innerHTML = `
            <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #f8f9fa; border-left: 4px solid #0ea5e9; max-width: 100%; overflow-wrap: break-word; word-wrap: break-word; word-break: break-word;">
              ${formatAnswerAsHtml(streamed)}
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button onclick="copyText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Copy</button>
                <button onclick="downloadText('${questionId}')" style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: pointer;">Download</button>
                <button onclick="regenerateAnswer('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                        ${isImmLimitReached ? 'disabled' : ''} 
                        style="padding: 0.4rem 0.6rem; border-radius: 6px; border: 1px solid #ccc; background: #f9f9f9; cursor: ${isImmLimitReached ? 'not-allowed' : 'pointer'}; opacity: ${isImmLimitReached ? '0.5' : '1'};"
                        title="${isImmLimitReached ? 'Regenerate limit reached (7/7)' : `Regenerations used: ${immRegenCount}/${REGENERATE_LIMIT}`}">
                  ${isImmLimitReached ? 'Limit Reached' : `Regenerate (${immRegenRemaining} left)`}
                </button>
              </div>
            </div>
          `;
          
          const localCache = loadLocalCache();
          localCache[questionId] = { 
            answer: streamed, 
            ts: Date.now(), 
            backendCached: finalBackendCached,
            subject: subjectInfo.name,
            questionText: questionText
          };
          saveLocalCache(localCache);
          
          if (window.MathJax && window.MathJax.typesetPromise) {
            MathJax.typesetPromise([targetElement]).catch(console.warn);
          }
        });
      }
    }, abortController.signal);
    
  } catch (err) {
    if (err.name === 'AbortError') {
      targetElement.innerHTML = `
        <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #fef2f2; border-left: 4px solid #f59e0b;">
          <p style="color: #d97706; margin: 0;">Generation cancelled</p>
        </div>
      `;
    } else {
      targetElement.innerHTML = `
        <div style="margin: 1rem 0; padding: 1rem; border-radius: 8px; background: #fef2f2; border-left: 4px solid #ef4444;">
          <p style="color: #dc2626; margin: 0;">Error: ${err.message}</p>
        </div>
      `;
    }
  }
}

// -------------------- Universal Main Functions --------------------

// FOR STRUCTURE WITH EXISTING data-question ATTRIBUTES (BT-202, etc.)
async function showAnswer(button, questionId, opts = { forceRefresh: false }) {
  const answerBox = button.nextElementSibling;
  if (!answerBox) return;

  const questionContainer = button.closest('.question');

  const partChar = questionId.slice(-1); 
  
  const partIndex = (partChar >= 'a' && partChar <= 'z') 
                      ? partChar.charCodeAt(0) - 'a'.charCodeAt(0) 
                      : 0;

  const questionText = extractQuestionText(questionContainer, partIndex);

  if (!questionText) {
    console.error("Could not extract question text for ID:", questionId);
    answerBox.innerHTML = "<p>Error: Could not find the question text.</p>";
    return;
  }
  
  answerBox.style.display = 'block';
  await displayAnswer(answerBox, questionId, questionText, opts);
}

// For structures without data-question (BT-103, BT-105, BT-205)
function enableQuestionAnswering() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes blink { 50% { opacity: 0; } }
  `;
  document.head.appendChild(style);

  document.querySelectorAll('.question').forEach(questionContainer => {
    const questionIds = generateQuestionId(questionContainer);
    
    const answerPs = Array.from(questionContainer.querySelectorAll('p[style*="margin-left"], p:not([style])')).filter(p => 
      p.innerHTML.includes('Answer') && p.innerHTML.includes('To be posted here')
    );
    
    answerPs.forEach((answerP, index) => {
      if (index < questionIds.length) {
        const questionId = questionIds[index];
        const questionText = extractQuestionText(questionContainer, index);
        
        answerP.innerHTML = `
          <strong>${answerP.innerHTML.split(':')[0]}:</strong>
          <button onclick="handleAnswerClick('${questionId}', \`${questionText.replace(/`/g, '\\`')}\`, this)" 
                  style="margin-left: 10px; padding: 0.5rem 1rem; background: #0ea5e9; color: white; border: none; border-radius: 6px; cursor: pointer;">
            Generate Answer with AI
          </button>
          <div class="ai-answer-container"></div>
        `;
      }
    });
  });
}

// Global function to handle answer button clicks
window.handleAnswerClick = async function(questionId, questionText, button) {
  const container = button.nextElementSibling;
  button.style.display = 'none';
  await displayAnswer(container, questionId, questionText);
};

// Utility functions for buttons
window.copyText = function(questionId) {
  const localCache = loadLocalCache();
  if (localCache[questionId]) {
    navigator.clipboard.writeText(localCache[questionId].answer).then(() => {
      alert('Answer copied to clipboard!');
    }).catch(() => {
      alert('Failed to copy to clipboard');
    });
  }
};

window.downloadText = function(questionId) {
  const localCache = loadLocalCache();
  if (localCache[questionId]) {
    const blob = new Blob([localCache[questionId].answer], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${questionId}-solution.txt`;
    a.click();
  }
};

window.regenerateAnswer = async function(questionId, questionText, button) {
  const currentCount = await getGlobalRegenerateCount(questionId);
  
  if (currentCount >= REGENERATE_LIMIT) {
    alert(`Regenerate limit reached for this question (${REGENERATE_LIMIT}/${REGENERATE_LIMIT}). The cached answer is optimized for your exam preparation. If you need additional help, please contact support.`);
    return;
  }
  
  const remaining = REGENERATE_LIMIT - currentCount;
  const confirmMsg = `Regenerate this answer?\n\n• Global regenerations used: ${currentCount}/${REGENERATE_LIMIT}\n• Remaining: ${remaining}\n\nNote: This will use one regeneration attempt globally for all users.`;
  
  if (!confirm(confirmMsg)) {
    return;
  }
  
  // Increment global regenerate count
  const newCount = await incrementGlobalRegenerateCount(questionId);
  
  // Clear both local and trigger global cache refresh
  const localCache = loadLocalCache();
  delete localCache[questionId];
  saveLocalCache(localCache);
  
  const container = button.closest('div').parentElement;
  await displayAnswer(container, questionId, questionText, { forceRefresh: true });
};

// -------------------- Initialization --------------------
document.addEventListener('DOMContentLoaded', function() {
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }
  
  const hasDataQuestions = document.querySelector('[data-question]');
  
  if (!hasDataQuestions) {
    enableQuestionAnswering();
    console.log('Enabled universal question answering system');
  } else {
    console.log('Using existing data-question structure');
  }
  
  console.log('RGPV Universal System Ready - Global Cache Enabled');
});

// Debug utilities (Developer only)
window.RGPVSystem = {
  clearLocalCache: () => {
    localStorage.removeItem(LOCAL_CACHE_KEY);
    console.log('Local cache cleared');
  },
  showLocalCacheStats: () => {
    const cache = loadLocalCache();
    console.log('Total locally cached:', Object.keys(cache).length);
    Object.keys(cache).forEach(key => {
      const item = cache[key];
      console.log(`${key}: ${item.subject} (${timeAgo(item.ts)} ago)`);
    });
  },
  async showGlobalCacheStats() {
    console.log('Fetching global cache statistics...');
    console.log('Note: Global cache is managed server-side');
  },
  async checkGlobalCache(questionId) {
    const cached = await getGlobalCache(questionId);
    if (cached) {
      console.log(`Question ${questionId} is globally cached`);
      console.log('Metadata:', cached.metadata);
    } else {
      console.log(`Question ${questionId} is NOT in global cache`);
    }
  },
  async checkGlobalRegenerateCount(questionId) {
    const count = await getGlobalRegenerateCount(questionId);
    console.log(`Question ${questionId}: ${count}/${REGENERATE_LIMIT} regenerations used globally`);
  },
  developerNote: () => {
    console.log(`
=== RGPV System - Global Cache Implementation ===

Features:
1. Global Cache: All answers cached server-side
2. Global Regeneration Tracking: Shared across all users
3. Mobile-Responsive Loading UI

Developer Controls:
- Only accessible via source code modifications
- Global cache resets must be done server-side
- Regeneration limits enforced globally

API Endpoints Required:
- GET ${CACHE_API_URL}?questionId=XXX
- POST ${CACHE_API_URL} (body: {questionId, answer, metadata})
- GET ${CACHE_API_URL}/regenerate?questionId=XXX
- POST ${CACHE_API_URL}/regenerate (body: {questionId})

Note: Ensure backend implements these endpoints for full functionality.
    `);
  }
};