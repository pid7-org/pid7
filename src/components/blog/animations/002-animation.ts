export const Animation002 = {
  id: '002-animation',
  render(desc: string): string {
    return `
      <div class="blog-animation-card rounded-xl border border-ctp-surface0 bg-ctp-mantle/70 overflow-hidden shadow-xs font-mono">
        <div class="p-4 sm:p-5 space-y-4">
          <div class="flex items-center justify-between text-xs text-ctp-subtext0">
            <span>SWAR 64-bit GPR (8-Byte Parallel Scan):</span>
            <span>Mask: <strong class="text-[var(--color-accent)]">trailing_zeros() / 8</strong></span>
          </div>
          <div class="grid grid-cols-4 sm:grid-cols-8 gap-1.5" id="anim2-track"></div>
          <div class="p-3 rounded bg-ctp-crust text-xs space-y-1 border border-ctp-surface0/30">
            <div class="flex justify-between" id="anim2-status">
              <span class="text-ctp-subtext1">Broadcast needle across 64-bit GPR</span>
              <span class="text-[var(--color-accent)] font-semibold">8 bytes / iter</span>
            </div>
            <div class="text-[11px] text-ctp-subtext0 font-mono truncate" id="anim2-mask">match_mask: 0x0000000000000000</div>
          </div>
          <div class="flex items-center justify-between border-t border-ctp-surface0/40 pt-3">
            <div class="flex items-center gap-2">
              <button type="button" id="anim2-step" class="px-3 py-1.5 text-xs font-semibold rounded bg-ctp-surface0 hover:bg-ctp-surface1 text-ctp-text cursor-pointer">Step</button>
              <button type="button" id="anim2-reset" class="px-3 py-1.5 text-xs rounded border border-ctp-surface0 hover:bg-ctp-surface0/50 text-ctp-subtext0 cursor-pointer">Reset</button>
            </div>
            <span class="text-[11px] text-ctp-subtext0 select-none hidden sm:inline">Click Step to execute vector mask</span>
          </div>
        </div>
        ${desc ? `<div class="anim-desc font-mono italic text-[10px] leading-normal text-ctp-subtext0 border-t border-ctp-surface0/60 pt-2 px-3.5 pb-2 bg-ctp-surface0/20">${desc}</div>` : ''}
      </div>`;
  },
  init(wrapper: Element): void {
    const lanes = ['0x41', '0x42', '0x43', '0x58', '0x45', '0x46', '0x47', '0x48'];
    let step = 0;

    const track = wrapper.querySelector('#anim2-track');
    const status = wrapper.querySelector('#anim2-status');
    const maskEl = wrapper.querySelector('#anim2-mask');
    const stepBtn = wrapper.querySelector('#anim2-step');
    const resetBtn = wrapper.querySelector('#anim2-reset');

    const update = () => {
      if (!track) return;
      track.innerHTML = lanes.map((val, idx) => {
        const isMatch = val === '0x58';
        const active = step > 0 && isMatch;
        const bg = active ? 'bg-ctp-green/30 border-ctp-green text-ctp-green font-bold' : 'bg-ctp-surface0/40 border-ctp-surface0 text-ctp-subtext1';
        return `<div class="flex flex-col items-center justify-center p-1.5 sm:p-2 rounded border text-xs font-mono ${bg}">
          <span class="text-[9px] text-ctp-subtext0">L${idx}</span>
          <span class="text-[11px] font-semibold">${val}</span>
        </div>`;
      }).join('');

      if (step === 0) {
        if (status) status.innerHTML = '<span class="text-ctp-subtext1">Load 8 bytes into 64-bit GPR</span>';
        if (maskEl) maskEl.textContent = 'match_mask: 0x0000000000000000';
      } else {
        if (status) status.innerHTML = '<span class="text-ctp-green font-semibold">SWAR XOR & Bitmask: Match in Lane 3!</span>';
        if (maskEl) maskEl.textContent = 'match_mask: 0x0000008000000000 -> Index = 3';
      }
    };

    stepBtn?.addEventListener('click', () => {
      step = step === 0 ? 1 : 0;
      update();
    });
    resetBtn?.addEventListener('click', () => {
      step = 0;
      update();
    });
    update();
  }
};
