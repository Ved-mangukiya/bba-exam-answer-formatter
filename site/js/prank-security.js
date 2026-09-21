/**
 * ==========================================================================
 * Ved Mangukiya Security & Prank Engine (v1.0)
 * 5-Minute Recurring Paywall + Anti-Copy + Anti-Screenshot Defense System
 * Author: Ved Mangukiya (SSASIT FY BBA Class Coordinator)
 * ==========================================================================
 */

(function () {
  'use strict';

  // --- Configuration ---
  const PAYWALL_INTERVAL_MS = 5 * 60 * 1000; // Exactly 5 minutes (300,000 ms)
  const MERCY_COUNTDOWN_SECONDS = 15;        // 15-second mandatory lock before unlock
  const STORAGE_LAST_SHOWN = 'ved_last_paywall_timestamp';
  const VED_NAME = 'Ved Mangukiya';
  const PUNCHLINE_GUJARATI = 'યાદ રાખજે લંડ 💀';
  const PUNCHLINE_ENG = 'yaad rakhje lund';

  let isPaywallActive = false;
  let mercyTimerInterval = null;
  let paywallIntervalTimer = null;
  let domObserver = null;

  // --- Toast Notification Manager ---
  function getOrCreateToastContainer() {
    let container = document.getElementById('vedToastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'vedToastContainer';
      document.body.appendChild(container);
    }
    return container;
  }

  function showSecurityToast(title, subtitle, isWarning = false) {
    const container = getOrCreateToastContainer();
    const toast = document.createElement('div');
    toast.className = `ved-toast ${isWarning ? 'toast-warning' : ''}`;
    toast.innerHTML = `
      <div class="ved-toast-icon">${isWarning ? '⚠️' : '🛡️'}</div>
      <div class="ved-toast-content">
        <div class="ved-toast-title">${title}</div>
        <div class="ved-toast-sub">${subtitle}</div>
      </div>
    `;
    container.appendChild(toast);

    // Audio cue (web audio API beep)
    try {
      playBeep(isWarning ? 320 : 520, 0.08);
    } catch (_) {}

    setTimeout(() => {
      toast.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function playBeep(freq = 440, duration = 0.1) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (_) {}
  }

  // --- 1. Anti-Copy, Anti-Paste, & Selection Protection ---
  function initCopyProtection() {
    // Intercept copy event
    window.addEventListener('copy', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      const trollMessage = `ચોરી ના કર ભાઈ! Content strictly protected by ${VED_NAME}.\n${PUNCHLINE_GUJARATI} (${PUNCHLINE_ENG}) 😉\nPay ₹500 to read freely.`;
      if (e.clipboardData) {
        e.clipboardData.setData('text/plain', trollMessage);
      }
      showSecurityToast(
        `🚫 COPYING BLOCKED!`,
        `${PUNCHLINE_GUJARATI} — Protected by ${VED_NAME}`,
        true
      );
    }, true);

    // Intercept cut event
    window.addEventListener('cut', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      showSecurityToast(
        `🚫 CUTTING BLOCKED!`,
        `${PUNCHLINE_GUJARATI} — Protected by ${VED_NAME}`,
        true
      );
    }, true);

    // Intercept paste event
    window.addEventListener('paste', function (e) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }, true);

    // Intercept right click (context menu)
    window.addEventListener('contextmenu', function (e) {
      // Don't block if user is clicking within an active paywall button
      if (e.target.closest('#vedPaywallModal')) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showSecurityToast(
        `🖱️ RIGHT CLICK DISABLED!`,
        `Nice try! ${PUNCHLINE_GUJARATI} — ${VED_NAME}`,
        true
      );
    }, true);

    // Block text selection drag
    window.addEventListener('selectstart', function (e) {
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    }, true);

    // Block drag and drop of text or images
    window.addEventListener('dragstart', function (e) {
      e.preventDefault();
    }, true);
  }

  // --- 2. Anti-Screenshot & Screen Capture Deterrent ---
  function initScreenshotDefense() {
    // Create the persistent capture shield DOM node
    let shield = document.getElementById('vedCaptureShield');
    if (!shield) {
      shield = document.createElement('div');
      shield.id = 'vedCaptureShield';
      shield.innerHTML = `
        <div class="capture-shield-badge">🔒 SECURE ANTIGRAVITY ENGINE</div>
        <div class="capture-shield-title">📸 SCREENSHOT DETECTED & BLOCKED!</div>
        <div class="capture-shield-sub">
          Screen capture and window blur detected. Content has been blurred and locked to protect GTU SSASIT answer sheets.
        </div>
        <div class="capture-shield-quote">
          ${PUNCHLINE_GUJARATI} &nbsp;•&nbsp; ${VED_NAME}
        </div>
      `;
      document.body.appendChild(shield);
    }

    let blurTimer = null;

    // Detect Windows Snipping Tool / Alt-Tab / Window Blur
    window.addEventListener('blur', function () {
      document.body.classList.add('screenshot-shield-active');
      const s = document.getElementById('vedCaptureShield');
      if (s) s.classList.add('active');
    });

    window.addEventListener('focus', function () {
      clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        document.body.classList.remove('screenshot-shield-active');
        const s = document.getElementById('vedCaptureShield');
        if (s) s.classList.remove('active');
      }, 400);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        document.body.classList.add('screenshot-shield-active');
        const s = document.getElementById('vedCaptureShield');
        if (s) s.classList.add('active');
      } else {
        clearTimeout(blurTimer);
        blurTimer = setTimeout(() => {
          document.body.classList.remove('screenshot-shield-active');
          const s = document.getElementById('vedCaptureShield');
          if (s) s.classList.remove('active');
        }, 400);
      }
    });

    // Detect PrintScreen and DevTools Shortcuts
    window.addEventListener('keydown', function (e) {
      // PrintScreen key
      if (e.key === 'PrintScreen' || e.code === 'PrintScreen') {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(`Screenshot blocked! ${PUNCHLINE_GUJARATI} — ${VED_NAME}`);
          }
        } catch (_) {}
        document.body.classList.add('screenshot-shield-active');
        const s = document.getElementById('vedCaptureShield');
        if (s) s.classList.add('active');
        showSecurityToast(
          `📸 SCREENSHOT INTERCEPTED!`,
          `Clipboard wiped! ${PUNCHLINE_GUJARATI} — ${VED_NAME}`,
          true
        );
        setTimeout(() => {
          document.body.classList.remove('screenshot-shield-active');
          if (s) s.classList.remove('active');
        }, 1200);
        return;
      }

      // Block F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      const isDevTools =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'));

      // Block Ctrl+U (View Source), Ctrl+S (Save Page), Ctrl+P (Print Page)
      const isInspectOrPrint =
        e.ctrlKey && (e.key === 'u' || e.key === 'U' || e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P');

      if (isDevTools || isInspectOrPrint) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showSecurityToast(
          `🔒 DEVTOOLS & SHORTCUT BLOCKED!`,
          `Nice try! ${PUNCHLINE_GUJARATI} — ${VED_NAME}`,
          true
        );
        return false;
      }

      // Secret Master Key for Ved: Ctrl + Alt + V (Triggers or tests paywall immediately)
      if (e.ctrlKey && e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        showSecurityToast(
          `⚡ VED MASTER TRIGGER`,
          `Triggering 5-minute Paywall Modal manually for testing...`
        );
        triggerPaywall();
      }
    }, true);
  }

  // --- 3. Hard-Encoded 5-Minute Troll Paywall Modal ---
  function getPaywallMarkup() {
    return `
      <div class="ved-paywall-modal" id="vedPaywallModal" role="dialog" aria-modal="true">
        <div class="ved-paywall-header">
          <div class="ved-paywall-badge">🚨 5-MINUTE FREE READING LIMIT EXPIRED</div>
          <h2 class="ved-paywall-title">
            <span>💸 PAY TO READ AGAIN!</span>
          </h2>
        </div>

        <div class="ved-paywall-body">
          <div class="ved-paywall-quote-box">
            <div class="ved-paywall-gujarati">${PUNCHLINE_GUJARATI}</div>
            <div class="ved-paywall-author">— Official Notice by <strong>${VED_NAME}</strong> (SSASIT BBA)</div>
          </div>

          <p class="ved-paywall-desc">
            તમારો 5 મિનિટનો મફત વાંચવાનો સમય પૂરો થઈ ગયો છે! GTU SSASIT Question Bank & Answers આગળ વાંચવા માટે Ved Mangukiya નું ₹500 VIP સબ્સ્ક્રિપ્શન ખરીદો.
          </p>

          <div class="ved-paywall-qr-container">
            <div class="ved-fake-qr" title="Scan UPI to pay Ved">
              <!-- High fidelity simulated SVG QR Code -->
              <svg viewBox="0 0 100 100" fill="#0f172a">
                <rect width="100" height="100" fill="#ffffff"/>
                <!-- Corner 1 -->
                <rect x="5" y="5" width="30" height="30" fill="#0f172a" rx="4"/>
                <rect x="10" y="10" width="20" height="20" fill="#ffffff" rx="2"/>
                <rect x="15" y="15" width="10" height="10" fill="#e11d48" rx="2"/>
                <!-- Corner 2 -->
                <rect x="65" y="5" width="30" height="30" fill="#0f172a" rx="4"/>
                <rect x="70" y="10" width="20" height="20" fill="#ffffff" rx="2"/>
                <rect x="75" y="15" width="10" height="10" fill="#e11d48" rx="2"/>
                <!-- Corner 3 -->
                <rect x="5" y="65" width="30" height="30" fill="#0f172a" rx="4"/>
                <rect x="10" y="70" width="20" height="20" fill="#ffffff" rx="2"/>
                <rect x="15" y="75" width="10" height="10" fill="#e11d48" rx="2"/>
                <!-- Data blocks -->
                <rect x="42" y="10" width="6" height="15" fill="#0f172a"/>
                <rect x="52" y="18" width="8" height="8" fill="#0f172a"/>
                <rect x="40" y="32" width="20" height="6" fill="#0f172a"/>
                <rect x="15" y="42" width="8" height="18" fill="#0f172a"/>
                <rect x="30" y="42" width="12" height="12" fill="#0f172a"/>
                <rect x="48" y="45" width="10" height="10" fill="#e11d48"/>
                <rect x="65" y="42" width="25" height="8" fill="#0f172a"/>
                <rect x="75" y="55" width="15" height="10" fill="#0f172a"/>
                <rect x="42" y="68" width="14" height="8" fill="#0f172a"/>
                <rect x="42" y="80" width="8" height="15" fill="#0f172a"/>
                <rect x="55" y="78" width="20" height="8" fill="#0f172a"/>
                <rect x="80" y="75" width="12" height="18" fill="#0f172a"/>
              </svg>
            </div>

            <div class="ved-paywall-pricing">
              <div class="ved-paywall-price">₹500.00</div>
              <div class="ved-paywall-plan">⚡ Ved VIP Pass (5 Mins Access)</div>
              <div class="ved-upi-id">UPI: ved.mangukiya@paytm</div>
            </div>
          </div>

          <div class="ved-paywall-timer-box" id="vedPaywallTimerNotice">
            ⏳ Mercy button locked! Begging cooldown: <span id="vedMercyCountdown">${MERCY_COUNTDOWN_SECONDS}</span>s remaining...
          </div>

          <div class="ved-paywall-actions">
            <button class="ved-btn-pay" id="vedBtnPayNow">
              💳 Pay ₹500 via Google Pay / Paytm
            </button>

            <button class="ved-btn-mercy" id="vedBtnMercy" disabled>
              🙏 હું વેદ નો આભારી છું (Grant 5 More Mins)
            </button>

            <!-- Slippery runaway button that dodges cursor -->
            <button class="ved-runaway-btn" id="vedRunawayBtn" type="button">
              ✕ Close
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function shakeModal() {
    const modal = document.getElementById('vedPaywallModal');
    if (modal) {
      modal.classList.remove('ved-shake');
      void modal.offsetWidth; // trigger reflow
      modal.classList.add('ved-shake');
    }
    showSecurityToast(
      `❌ Escape નથી થવાનું ભાઈ!`,
      `Ved Mangukiya ને પૈસા ચૂકવ! ${PUNCHLINE_GUJARATI}`,
      true
    );
  }

  function triggerPaywall() {
    if (isPaywallActive) return;
    isPaywallActive = true;

    // Save timestamp of paywall trigger
    try {
      sessionStorage.setItem(STORAGE_LAST_SHOWN, Date.now().toString());
    } catch (_) {}

    // Lock body scrolling
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    // Create or show Backdrop
    let backdrop = document.getElementById('vedPaywallBackdrop');
    if (!backdrop) {
      backdrop = document.createElement('div');
      backdrop.id = 'vedPaywallBackdrop';
      backdrop.innerHTML = getPaywallMarkup();
      document.body.appendChild(backdrop);
    } else {
      backdrop.innerHTML = getPaywallMarkup();
      backdrop.style.display = 'flex';
    }

    attachPaywallInteractions();
    startHardAntiTamperObserver();
    startMercyCountdown();

    // Audio cue
    playBeep(260, 0.4);
  }

  function attachPaywallInteractions() {
    const backdrop = document.getElementById('vedPaywallBackdrop');
    const payBtn = document.getElementById('vedBtnPayNow');
    const mercyBtn = document.getElementById('vedBtnMercy');
    const runawayBtn = document.getElementById('vedRunawayBtn');

    // Clicking outside modal does not close it — it shakes!
    if (backdrop) {
      backdrop.onclick = function (e) {
        if (e.target === backdrop) {
          shakeModal();
        }
      };
    }

    // Pay button troll prompt
    if (payBtn) {
      payBtn.onclick = function () {
        alert(
          `🏦 UPI Gateway Error:\n\nOnline servers are busy! Please meet Ved Mangukiya in person at SSASIT and hand over ₹500 cash in hand.\n\n${PUNCHLINE_GUJARATI}`
        );
      };
    }

    // Runaway "Close" button dodges mouse hover!
    if (runawayBtn) {
      const dodge = function () {
        const randomX = (Math.random() - 0.5) * 260;
        const randomY = (Math.random() - 0.5) * 80;
        runawayBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
        runawayBtn.innerText = '🏃‍♂️ પકડ મને!';
      };
      runawayBtn.onmouseenter = dodge;
      runawayBtn.ontouchstart = dodge;
      runawayBtn.onclick = function (e) {
        e.preventDefault();
        dodge();
        shakeModal();
      };
    }

    // Mercy button logic
    if (mercyBtn) {
      mercyBtn.onclick = function () {
        dismissPaywall();
      };
    }
  }

  function startMercyCountdown() {
    clearInterval(mercyTimerInterval);
    let remaining = MERCY_COUNTDOWN_SECONDS;
    const countEl = document.getElementById('vedMercyCountdown');
    const noticeEl = document.getElementById('vedPaywallTimerNotice');
    const mercyBtn = document.getElementById('vedBtnMercy');

    mercyTimerInterval = setInterval(() => {
      remaining--;
      if (countEl) countEl.textContent = remaining.toString();

      if (remaining <= 0) {
        clearInterval(mercyTimerInterval);
        if (noticeEl) {
          noticeEl.style.background = 'rgba(16, 185, 129, 0.15)';
          noticeEl.style.borderColor = 'rgba(16, 185, 129, 0.4)';
          noticeEl.style.color = '#34d399';
          noticeEl.innerHTML = `✅ વેદે દયા બતાવી! નીચે આપેલા બટન પર ક્લિક કરીને 5 મિનિટ અનલોક કરો.`;
        }
        if (mercyBtn) {
          mercyBtn.disabled = false;
          mercyBtn.classList.add('ved-btn-unlocked');
        }
      }
    }, 1000);
  }

  function dismissPaywall() {
    isPaywallActive = false;
    clearInterval(mercyTimerInterval);

    // Stop observer temporarily to avoid resurrecting during clean dismiss
    if (domObserver) {
      domObserver.disconnect();
    }

    const backdrop = document.getElementById('vedPaywallBackdrop');
    if (backdrop) {
      backdrop.remove();
    }

    // Unlock scrolling
    document.documentElement.style.overflow = '';
    document.body.style.overflow = '';

    // Show celebration / troll toast
    showSecurityToast(
      `🎉 વેદે દયા કરી! (Mercy Granted)`,
      `Next 5 minutes of study time unlocked. ${PUNCHLINE_GUJARATI}!`
    );

    // Reset 5-minute timer from now
    try {
      sessionStorage.setItem(STORAGE_LAST_SHOWN, Date.now().toString());
    } catch (_) {}

    resetIntervalTimer();
  }

  // --- 4. Anti-Tamper MutationObserver (Cannot be deleted or hidden in DevTools) ---
  function startHardAntiTamperObserver() {
    if (domObserver) domObserver.disconnect();

    domObserver = new MutationObserver(function (mutations) {
      if (!isPaywallActive) return;

      const backdrop = document.getElementById('vedPaywallBackdrop');
      const modal = document.getElementById('vedPaywallModal');

      // If someone removed the backdrop element from DOM:
      if (!backdrop || !document.body.contains(backdrop)) {
        console.warn('Tamper detected: Recreating Ved Mangukiya Paywall...');
        const newBackdrop = document.createElement('div');
        newBackdrop.id = 'vedPaywallBackdrop';
        newBackdrop.innerHTML = getPaywallMarkup();
        document.body.appendChild(newBackdrop);
        attachPaywallInteractions();
        shakeModal();
        return;
      }

      // If someone set display: none or visibility: hidden or opacity: 0 via DevTools
      if (
        backdrop.style.display === 'none' ||
        backdrop.style.visibility === 'hidden' ||
        backdrop.style.opacity === '0'
      ) {
        backdrop.style.display = 'flex';
        backdrop.style.visibility = 'visible';
        backdrop.style.opacity = '1';
        shakeModal();
      }

      // If someone removed modal contents
      if (!modal || !backdrop.contains(modal)) {
        backdrop.innerHTML = getPaywallMarkup();
        attachPaywallInteractions();
        shakeModal();
      }
    });

    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'hidden']
    });
  }

  // Escape Key Block on Paywall
  window.addEventListener('keydown', function (e) {
    if (isPaywallActive && (e.key === 'Escape' || e.code === 'Escape')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      shakeModal();
    }
  }, true);

  // --- 5. Recurring 5-Minute Scheduler ---
  function resetIntervalTimer() {
    if (paywallIntervalTimer) clearInterval(paywallIntervalTimer);

    // Schedule next paywall trigger in exactly 5 minutes
    paywallIntervalTimer = setInterval(() => {
      triggerPaywall();
    }, PAYWALL_INTERVAL_MS);
  }

  function initScheduler() {
    let lastShown = 0;
    try {
      const stored = sessionStorage.getItem(STORAGE_LAST_SHOWN);
      if (stored) lastShown = parseInt(stored, 10) || 0;
    } catch (_) {}

    const now = Date.now();
    const elapsed = now - lastShown;

    if (lastShown > 0 && elapsed >= PAYWALL_INTERVAL_MS) {
      // If 5 minutes already elapsed since last show in this session, trigger immediately
      setTimeout(() => triggerPaywall(), 1500);
    } else {
      // Calculate remaining milliseconds until 5 minutes
      const remaining = lastShown > 0 ? PAYWALL_INTERVAL_MS - elapsed : PAYWALL_INTERVAL_MS;
      setTimeout(() => {
        triggerPaywall();
        resetIntervalTimer();
      }, remaining);
    }
  }

  // --- Initializer on DOM Ready ---
  function init() {
    initCopyProtection();
    initScreenshotDefense();
    initScheduler();

    // Log credit badge in console
    console.log(
      `%c🛡️ Ved Mangukiya Security & Prank Engine Active\n%c${PUNCHLINE_GUJARATI} (${PUNCHLINE_ENG})\nInterval: 5 Minutes | Hard-Encoded Paywall`,
      'color: #f43f5e; font-size: 16px; font-weight: bold;',
      'color: #fbbf24; font-size: 13px; font-weight: bold;'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
