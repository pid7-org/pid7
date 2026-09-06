export const Animation001 = {
  id: '001-animation',
  render(desc: string): string {
    return `
      <div class="blog-animation-card rounded-xl border border-ctp-surface0 bg-ctp-mantle/70 overflow-hidden shadow-xs font-mono">
        <div class="p-4 sm:p-5 space-y-4">
          <!-- Haystack Text Canvas -->
          <div class="p-3.5 rounded bg-ctp-crust border border-ctp-surface0/40 leading-relaxed text-sm tracking-wide break-words select-none flex flex-wrap gap-y-1 font-mono" id="anim1-haystack"></div>

          <!-- Real-time Logic Log Console -->
          <div class="p-3 rounded bg-ctp-crust/90 text-xs border border-ctp-surface0/40 space-y-1">
            <div class="flex justify-between items-center text-[11px] text-ctp-subtext0 border-b border-ctp-surface0/30 pb-1.5 mb-1.5">
              <span id="anim1-offset" class="font-semibold text-ctp-subtext1">Offset: 0 / 44</span>
            </div>
            <div id="anim1-log" class="font-mono text-xs text-ctp-text truncate">
              Ready — click Run to start scalar scan loop
            </div>
          </div>

          <!-- Bottom Control Bar: Needle Input on Extreme Left, Action Buttons on Extreme Right -->
          <div class="flex items-center justify-between border-t border-ctp-surface0/40 pt-3">
            <!-- Extreme Left: Needle Input -->
            <div class="flex items-center gap-1.5">
              <label for="anim1-needle" class="text-[11px] text-ctp-subtext0 select-none font-semibold">Needle:</label>
              <input
                type="text"
                id="anim1-needle"
                maxlength="1"
                value="x"
                class="w-7 h-6 text-center font-mono font-bold text-xs bg-ctp-surface0/80 border border-ctp-surface1 rounded text-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)] cursor-pointer"
                title="Enter a single character needle to search"
              />
            </div>

            <!-- Extreme Right: Run & Reset Buttons -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                id="anim1-run"
                class="px-3.5 py-1.5 text-xs font-semibold rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/30 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg id="anim1-run-icon" class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span id="anim1-run-label">Run</span>
              </button>

              <button
                type="button"
                id="anim1-reset"
                class="px-3 py-1.5 text-xs rounded border border-ctp-surface0 hover:bg-ctp-surface0/50 text-ctp-subtext0 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        ${desc ? `<div class="anim-desc font-mono italic text-[10px] leading-normal text-ctp-subtext0 border-t border-ctp-surface0/60 pt-2 px-3.5 pb-2 bg-ctp-surface0/20">${desc}</div>` : ''}
      </div>`;
  },
  init(wrapper: Element): void {
    const haystackText = "The quick brown fox jumps over the lazy dog.";
    let currentIndex = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    let isRunning = false;
    let isFinishedNotFound = false;

    const needleInput = wrapper.querySelector('#anim1-needle') as HTMLInputElement | null;
    const haystackContainer = wrapper.querySelector('#anim1-haystack');
    const offsetEl = wrapper.querySelector('#anim1-offset');
    const logEl = wrapper.querySelector('#anim1-log');
    const runBtn = wrapper.querySelector('#anim1-run');
    const runLabel = wrapper.querySelector('#anim1-run-label');
    const runIcon = wrapper.querySelector('#anim1-run-icon');
    const resetBtn = wrapper.querySelector('#anim1-reset');

    const getNeedle = () => {
      return needleInput?.value ?? 'x';
    };

    const stopScan = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      isRunning = false;
      if (runLabel) runLabel.textContent = 'Run';
      if (runIcon) runIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
    };

    const render = () => {
      if (!haystackContainer) return;
      const needle = getNeedle();
      const chars = haystackText.split('');

      haystackContainer.innerHTML = chars.map((char, idx) => {
        const isSpace = char === ' ';
        const displayChar = isSpace ? '&nbsp;' : char;
        const isMatch = char.toLowerCase() === needle.toLowerCase();

        let cls = 'inline-block transition-all duration-150 rounded px-[1.5px] ';

        if (isFinishedNotFound) {
          cls += 'opacity-40 text-ctp-peach border border-ctp-peach/20 bg-ctp-peach/5';
        } else if (idx < currentIndex) {
          cls += 'opacity-35 text-ctp-subtext0';
        } else if (idx === currentIndex) {
          if (isMatch) {
            cls += 'bg-ctp-green/30 text-ctp-green font-bold ring-2 ring-ctp-green/60 scale-125 z-10 shadow-sm';
          } else {
            cls += 'bg-[var(--color-accent)]/30 text-[var(--color-accent)] font-bold ring-1 ring-[var(--color-accent)] scale-110 z-10';
          }
        } else {
          cls += 'text-ctp-text';
        }

        return `<span class="${cls}">${displayChar}</span>`;
      }).join('');

      if (offsetEl) {
        offsetEl.textContent = `Offset: ${Math.min(currentIndex, haystackText.length)} / ${haystackText.length}`;
      }
    };

    const tick = () => {
      const needle = getNeedle();
      if (currentIndex >= haystackText.length) {
        isFinishedNotFound = true;
        stopScan();
        render();
        if (logEl) {
          logEl.innerHTML = `<span class="text-ctp-peach font-semibold">needle '${needle}' NOT FOUND in payload</span>`;
        }
        return;
      }

      const currentChar = haystackText[currentIndex];
      const isMatch = currentChar.toLowerCase() === needle.toLowerCase();
      const displayChar = currentChar === ' ' ? "' '" : `'${currentChar}'`;

      render();

      if (isMatch) {
        stopScan();
        if (logEl) {
          logEl.innerHTML = `<span class="text-ctp-green font-semibold">haystack[+${currentIndex}] (${displayChar}) === '${needle}' → MATCH FOUND</span>`;
        }
      } else {
        if (logEl) {
          logEl.innerHTML = `<span class="text-ctp-subtext0">haystack[+${currentIndex}] (${displayChar}) !== '${needle}' → false</span>`;
        }
        currentIndex++;
      }
    };

    const startScan = () => {
      if (isRunning) {
        stopScan();
        return;
      }

      if (currentIndex >= haystackText.length || isFinishedNotFound) {
        currentIndex = 0;
        isFinishedNotFound = false;
      }

      isRunning = true;
      if (runLabel) runLabel.textContent = 'Pause';
      if (runIcon) runIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';

      tick();
      timer = setInterval(tick, 240);
    };

    const resetScan = () => {
      stopScan();
      currentIndex = 0;
      isFinishedNotFound = false;
      render();
      if (logEl) {
        logEl.textContent = 'Ready — click Run to start scalar scan loop';
      }
    };

    needleInput?.addEventListener('input', () => {
      resetScan();
    });

    runBtn?.addEventListener('click', () => {
      startScan();
    });

    resetBtn?.addEventListener('click', () => {
      resetScan();
    });

    resetScan();
  }
};
