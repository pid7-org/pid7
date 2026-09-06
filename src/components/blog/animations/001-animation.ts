export const Animation001 = {
  id: '001-animation',
  render(desc: string): string {
    return `
      <div class="blog-animation-card rounded-xl border border-ctp-surface0 bg-ctp-mantle/70 overflow-hidden shadow-xs font-mono">
        <div class="p-4 sm:p-5 space-y-4">
          <div class="flex items-center justify-between text-xs text-ctp-subtext0">
            <span>Haystack Window (Scalar Byte Scan):</span>
            <span>Target Needle: <strong class="text-[var(--color-accent)] font-bold">'X'</strong></span>
          </div>
          <div class="grid grid-cols-8 gap-1.5 sm:gap-2" id="anim1-track"></div>
          <div class="p-3 rounded bg-ctp-crust text-xs flex justify-between items-center border border-ctp-surface0/30">
            <span id="anim1-status" class="text-ctp-subtext1">Step 0: Ready</span>
            <span class="text-[11px] text-ctp-subtext0">1 byte / iter</span>
          </div>
          <div class="flex items-center justify-between border-t border-ctp-surface0/40 pt-3">
            <div class="flex items-center gap-2">
              <button type="button" id="anim1-step" class="px-3 py-1.5 text-xs font-semibold rounded bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text cursor-pointer">Step</button>
              <button type="button" id="anim1-reset" class="px-3 py-1.5 text-xs rounded border border-ctp-surface0 hover:bg-ctp-surface0/50 text-ctp-subtext0 cursor-pointer">Reset</button>
            </div>
            <span class="text-[11px] text-ctp-subtext0 select-none hidden sm:inline">Click Step to advance scan</span>
          </div>
        </div>
        ${desc ? `<div class="anim-desc font-mono italic text-[10px] leading-normal text-ctp-subtext0 border-t border-ctp-surface0/60 pt-2 px-3.5 pb-2 bg-ctp-surface0/20">${desc}</div>` : ''}
      </div>`;
  },
  init(wrapper: Element): void {
    const haystack = ['A', 'B', 'C', 'D', 'E', 'X', 'F', 'G'];
    const needle = 'X';
    let step = 0;

    const track = wrapper.querySelector('#anim1-track');
    const status = wrapper.querySelector('#anim1-status');
    const stepBtn = wrapper.querySelector('#anim1-step');
    const resetBtn = wrapper.querySelector('#anim1-reset');

    const update = () => {
      if (!track) return;
      track.innerHTML = haystack.map((char, idx) => {
        let bg = 'bg-ctp-surface0/40 border-ctp-surface0 text-ctp-subtext0';
        if (idx < step) bg = 'bg-ctp-surface0/20 border-ctp-surface0/30 text-ctp-subtext0/50';
        if (idx === step) bg = char === needle ? 'bg-ctp-green/30 border-ctp-green text-ctp-green font-bold ring-2 ring-ctp-green/50 scale-105' : 'bg-[var(--color-accent)]/20 border-[var(--color-accent)] text-[var(--color-accent)] font-bold scale-105';

        return `<div class="flex flex-col items-center justify-center p-2 rounded border transition-all text-xs font-mono ${bg}">
          <span class="text-[10px] text-ctp-subtext0 mb-1">[${idx}]</span>
          <span class="text-sm font-bold">${char}</span>
        </div>`;
      }).join('');

      if (status) {
        if (step < haystack.length) {
          if (haystack[step] === needle) {
            status.innerHTML = `<span class="text-ctp-green font-semibold">MATCH FOUND at index ${step}! ('${needle}')</span>`;
          } else {
            status.textContent = `Step ${step + 1}: Index ${step} ('${haystack[step]}') !== '${needle}'`;
          }
        } else {
          status.textContent = 'Scan finished.';
        }
      }
    };

    stepBtn?.addEventListener('click', () => {
      step = (step + 1) % haystack.length;
      update();
    });
    resetBtn?.addEventListener('click', () => {
      step = 0;
      update();
    });
    update();
  }
};
