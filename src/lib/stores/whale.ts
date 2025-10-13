import type { WHALE_CURVE_TYPE, WHALE_SECTIONS } from '$lib/types/whale';
import { writable, derived } from 'svelte/store';

export const whale_sections_state = writable<WHALE_SECTIONS>({
  life: 0,
  project_one: 0,
  project_two: 0,
  project_three: 0,
  project_four: 0,
});

export const whale_section_type = derived(whale_sections_state, ($pos): WHALE_CURVE_TYPE => {
  if ($pos.life < 1 && $pos.project_one === 0) return 'LIFE';

  if ($pos.project_one > 0 && $pos.project_two === 0) return 'PROJECT_ONE';
  if ($pos.project_two > 0 && $pos.project_three === 0) return 'PROJECT_TWO';
  if ($pos.project_three > 0 && $pos.project_four === 0) return 'PROJECT_THREE';
  if ($pos.project_four > 0 && $pos.project_four < 1) return 'PROJECT_FOUR';
  return 'Null';
});
