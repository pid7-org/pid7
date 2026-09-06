export const Animation002 = {
  id: '002-animation',
  render(desc: string): string {
    return `
      <div class="blog-animation-card rounded-xl border border-ctp-surface0 bg-ctp-mantle/70 overflow-hidden shadow-xs font-mono">
        <div class="p-4 sm:p-5 space-y-4">
          <!-- Haystack Text Canvas (Normal flowing paragraph text) -->
          <div class="p-3.5 rounded bg-ctp-crust border border-ctp-surface0/40 leading-relaxed text-sm tracking-wide whitespace-pre-wrap break-words select-none font-mono" id="anim2-haystack"></div>

          <!-- Real-time SWAR Logic Console -->
          <div class="p-3 rounded bg-ctp-crust/90 text-xs border border-ctp-surface0/40 space-y-1 font-mono">
            <div class="flex justify-between items-center text-xs text-ctp-subtext0 border-b border-ctp-surface0/30 pb-1.5 mb-1.5 font-mono">
              <span id="anim2-offset" class="font-semibold text-ctp-subtext1">Chunk: 0 / 25 (Bytes 0..7)</span>
              <span class="text-[var(--color-accent)] font-semibold">Throughput: ~9.25 GiB/s (4.3x speedup)</span>
            </div>
            <div id="anim2-log" class="text-xs text-ctp-text break-words">
              Ready — click Run to start 8-byte SWAR scan
            </div>
          </div>

          <!-- Bottom Control Bar: Extreme Left = Needle, Extreme Right = Run & Reset -->
          <div class="flex items-center justify-between border-t border-ctp-surface0/40 pt-3">
            <!-- Extreme Left: Needle Input -->
            <div class="flex items-center gap-1.5">
              <label for="anim2-needle" class="text-xs text-ctp-subtext0 select-none font-semibold">Needle:</label>
              <input
                type="text"
                id="anim2-needle"
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
                id="anim2-run"
                class="px-3.5 py-1.5 text-xs font-semibold rounded bg-ctp-surface0 text-ctp-subtext1 border border-ctp-surface1 hover:bg-ctp-surface1 hover:text-ctp-text transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <svg id="anim2-run-icon" class="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                <span id="anim2-run-label">Run</span>
              </button>

              <button
                type="button"
                id="anim2-reset"
                class="px-3 py-1.5 text-xs rounded border border-ctp-surface0 hover:bg-ctp-surface0/50 text-ctp-subtext0 transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        ${desc ? `<div class="anim-desc font-mono italic text-xs leading-normal text-ctp-subtext0 border-t border-ctp-surface0/60 pt-2 px-3.5 pb-2 bg-ctp-surface0/20">${desc}</div>` : ''}
      </div>`;
  },
  init(wrapper: Element): void {
    const haystackText = "Coined in 1996 by Hank Dietz and Randy Fisher at Purdue University, SWAR repurposes general-purpose scalar registers to execute parallel sub-word bitwise arithmetic before dedicated SIMD extensions existed.";
    const CHUNK_SIZE = 8;
    const totalChunks = Math.ceil(haystackText.length / CHUNK_SIZE);

    let currentChunk = 0;
    let timer: ReturnType<typeof setInterval> | null = null;
    let isRunning = false;
    let isFinishedNotFound = false;

    const needleInput = wrapper.querySelector('#anim2-needle') as HTMLInputElement | null;
    const haystackContainer = wrapper.querySelector('#anim2-haystack');
    const offsetEl = wrapper.querySelector('#anim2-offset');
    const logEl = wrapper.querySelector('#anim2-log');
    const runBtn = wrapper.querySelector('#anim2-run') as HTMLButtonElement | null;
    const runLabel = wrapper.querySelector('#anim2-run-label');
    const runIcon = wrapper.querySelector('#anim2-run-icon');
    const resetBtn = wrapper.querySelector('#anim2-reset');

    const getNeedle = () => {
      return needleInput?.value ?? 'x';
    };

    const updateRunButtonState = (running: boolean) => {
      isRunning = running;
      if (!runBtn) return;
      if (running) {
        if (runLabel) runLabel.textContent = 'Pause';
        if (runIcon) runIcon.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
        runBtn.className = 'px-3.5 py-1.5 text-xs font-semibold rounded bg-[var(--color-accent)]/20 text-[var(--color-accent)] border border-[var(--color-accent)]/40 hover:bg-[var(--color-accent)]/30 transition-colors cursor-pointer flex items-center gap-1.5';
      } else {
        if (runLabel) runLabel.textContent = 'Run';
        if (runIcon) runIcon.innerHTML = '<path d="M8 5v14l11-7z"/>';
        runBtn.className = 'px-3.5 py-1.5 text-xs font-semibold rounded bg-ctp-surface0 text-ctp-subtext1 border border-ctp-surface1 hover:bg-ctp-surface1 hover:text-ctp-text transition-colors cursor-pointer flex items-center gap-1.5';
      }
    };

    const stopScan = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      updateRunButtonState(false);
    };

    const render = () => {
      if (!haystackContainer) return;
      const needle = getNeedle().toLowerCase();
      const chars = haystackText.split('');

      haystackContainer.innerHTML = chars.map((char, idx) => {
        const isMatch = char.toLowerCase() === needle;

        const chunkIndex = Math.floor(idx / CHUNK_SIZE);
        const isCurrentChunk = chunkIndex === currentChunk;
        const isFirstInChunk = idx === currentChunk * CHUNK_SIZE;
        const isLastInChunk = idx === (currentChunk + 1) * CHUNK_SIZE - 1 || idx === chars.length - 1;

        let cls = 'transition-colors duration-150 ';

        if (isFinishedNotFound) {
          cls += 'opacity-40 text-ctp-peach';
        } else if (chunkIndex < currentChunk) {
          cls += 'opacity-35 text-ctp-subtext0';
        } else if (isCurrentChunk) {
          if (isMatch) {
            cls += 'bg-ctp-green/35 text-ctp-green font-bold ring-1 ring-ctp-green/70 z-10 ';
          } else {
            cls += 'bg-[var(--color-accent)]/25 text-[var(--color-accent)] font-semibold ';
          }

          if (isFirstInChunk) cls += 'rounded-l-xs pl-0.5 ';
          if (isLastInChunk) cls += 'rounded-r-xs pr-0.5 ';
        } else {
          cls += 'text-ctp-text';
        }

        return `<span class="${cls}">${char}</span>`;
      }).join('');

      if (offsetEl) {
        const startByte = Math.min(currentChunk * CHUNK_SIZE, haystackText.length);
        const endByte = Math.min((currentChunk + 1) * CHUNK_SIZE - 1, haystackText.length - 1);
        offsetEl.textContent = `Chunk: ${Math.min(currentChunk, totalChunks - 1)} / ${totalChunks} (Bytes ${startByte}..${endByte})`;
      }
    };

    const tick = () => {
      const needle = getNeedle();
      const needleLower = needle.toLowerCase();

      if (currentChunk >= totalChunks) {
        isFinishedNotFound = true;
        stopScan();
        render();
        if (logEl) {
          const displayNeedle = needle === ' ' ? "' '" : `'${needle}'`;
          logEl.innerHTML = `<span class="text-ctp-peach font-semibold">needle ${displayNeedle} NOT FOUND in payload</span>`;
        }
        return;
      }

      const startIdx = currentChunk * CHUNK_SIZE;
      const endIdx = Math.min(startIdx + CHUNK_SIZE - 1, haystackText.length - 1);
      const chunkChars = haystackText.slice(startIdx, startIdx + CHUNK_SIZE).split('');
      const matchLane = chunkChars.findIndex((char) => char.toLowerCase() === needleLower);

      render();

      const displayNeedle = needle === ' ' ? "' '" : `'${needle}'`;

      if (matchLane !== -1) {
        const matchByteOffset = startIdx + matchLane;
        const matchedChar = chunkChars[matchLane];
        const displayChar = matchedChar === ' ' ? "' '" : `'${matchedChar}'`;
        stopScan();

        if (logEl) {
          logEl.innerHTML = `<span class="text-ctp-green font-semibold">haystack[${startIdx}..${endIdx}] === ${displayNeedle} → MATCH FOUND at byte ${matchByteOffset} (${displayChar})</span>`;
        }
      } else {
        if (logEl) {
          logEl.innerHTML = `<span class="text-ctp-subtext0">haystack[${startIdx}..${endIdx}] !== ${displayNeedle} → 0 matches in 8 bytes (i += 8)</span>`;
        }
        currentChunk++;
      }
    };

    const startScan = () => {
      if (isRunning) {
        stopScan();
        return;
      }

      if (currentChunk >= totalChunks || isFinishedNotFound) {
        currentChunk = 0;
        isFinishedNotFound = false;
      }

      updateRunButtonState(true);
      tick();
      timer = setInterval(tick, 320);
    };

    const resetScan = () => {
      stopScan();
      currentChunk = 0;
      isFinishedNotFound = false;
      render();
      if (logEl) {
        logEl.textContent = 'Ready — click Run to start 8-byte SWAR scan';
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
