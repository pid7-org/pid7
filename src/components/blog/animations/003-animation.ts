export const Animation003 = {
  id: '003-animation',
  render(desc: string): string {
    return `
      <div class="blog-animation-card rounded-xl border border-ctp-surface0 bg-ctp-mantle/70 overflow-hidden shadow-xs font-mono">
        <div class="p-4 sm:p-5 space-y-4">
          <div class="flex items-center justify-between text-xs text-ctp-subtext0">
            <span>AVX-512BW (64-Byte Cache Line Single-Instruction Vector Scan):</span>
            <span class="text-[var(--color-accent)] font-semibold">vpcmpeqb -&gt; __mmask64</span>
          </div>
          <div class="grid grid-cols-16 gap-1" id="anim3-track"></div>
          <div class="p-3 rounded bg-ctp-crust text-xs flex justify-between items-center border border-ctp-surface0/30">
            <span id="anim3-status" class="text-ctp-green font-semibold">Full 64-byte Cache Line evaluated in 1 instruction cycle!</span>
            <span class="text-xs text-[var(--color-accent)] font-bold">~150 GiB/sec</span>
          </div>
          <div class="flex items-center justify-between border-t border-ctp-surface0/40 pt-3">
            <div class="flex items-center gap-2">
              <button type="button" id="anim3-step" class="px-3 py-1.5 text-xs font-semibold rounded bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text cursor-pointer">Evaluate</button>
              <button type="button" id="anim3-reset" class="px-3 py-1.5 text-xs rounded border border-ctp-surface0 hover:bg-ctp-surface0/50 text-ctp-subtext0 cursor-pointer">Reset</button>
            </div>
            <span class="text-[11px] text-ctp-subtext0 select-none hidden sm:inline">Click Evaluate to run SIMD instruction</span>
          </div>
        </div>
        ${desc ? `<div class="anim-desc font-mono italic text-[10px] leading-normal text-ctp-subtext0 border-t border-ctp-surface0/60 pt-2 px-3.5 pb-2 bg-ctp-surface0/20">${desc}</div>` : ''}
      </div>`;
  },
  init(wrapper: Element): void {
    let state = 0;
    const activeIndex = 37;

    const track = wrapper.querySelector('#anim3-track');
    const stepBtn = wrapper.querySelector('#anim3-step');
    const resetBtn = wrapper.querySelector('#anim3-reset');

    const update = () => {
      if (!track) return;
      const items = [];
      for (let i = 0; i < 64; i++) {
        let bg = 'bg-ctp-surface0/30 border-ctp-surface0/50';
        if (state === 1) {
          bg = i === activeIndex ? 'bg-ctp-green border-ctp-green shadow-md scale-125 z-10' : 'bg-ctp-surface0/60 border-ctp-surface0 opacity-40';
        }
        items.push(`<div class="h-4 rounded-[2px] border transition-all duration-300 ${bg}" title="Byte ${i}"></div>`);
      }
      track.innerHTML = items.join('');
    };

    stepBtn?.addEventListener('click', () => {
      state = state === 0 ? 1 : 0;
      update();
    });
    resetBtn?.addEventListener('click', () => {
      state = 0;
      update();
    });
    update();
  }
};
