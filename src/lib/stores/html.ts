import type { HEADER_CONTENT } from "$lib/types/life";
import { writable } from "svelte/store";

export let header_content = writable<HEADER_CONTENT>({
  info: "",
  render: false
})