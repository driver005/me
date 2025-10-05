import { writable, derived } from 'svelte/store';


export type CAMERA_CURVE_TYPE = "START" | "ME" | "LIFE_IN" | "LIFE_OUT" | "PROJECT_IN" | "PROJECT_ROTATE" | "PROJECT_OUT" | "Null";
export type CAMERA_SECTIONS = {
  start: number,
  me: number,
  life_in: number,
  life_out: number,
  project_in: number,
  project_rotate: number,
  project_out: number
};

export const camera_sections_state = writable<CAMERA_SECTIONS>({
  start: 0,
  me: 0,
  life_in: 0,
  life_out: 0,
  project_in: 0,
  project_rotate: 0,
  project_out: 0,
});

export const camera_section_type = derived(camera_sections_state, ($pos): CAMERA_CURVE_TYPE => {
  if ($pos.start < 1 && $pos.me === 0) return 'START';
  if ($pos.me > 0 && $pos.life_in === 0) return 'ME';
  // LIFE
  if ($pos.life_in > 0 && $pos.life_out === 0) return 'LIFE_IN';
  if ($pos.life_out > 0 && $pos.project_in === 0) return 'LIFE_OUT';
  // PROJECT
  if ($pos.project_in > 0 && ($pos.project_rotate === 0 && $pos.project_out === 0)) return 'PROJECT_IN';
  if ($pos.project_rotate > 0 && ($pos.project_in === 1 && $pos.project_out === 0)) return 'PROJECT_ROTATE';
  if ($pos.project_out > 0 && ($pos.project_in === 1 && $pos.project_rotate === 1)) return 'PROJECT_OUT';
  return 'Null';
});
