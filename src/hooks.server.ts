import type { Handle } from "@sveltejs/kit";
// deno-lint-ignore no-sloppy-imports
import { paraglideMiddleware } from "$lib/paraglide/server";

const handleParaglide: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;

    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace("%paraglide.lang%", locale),
    });
  });

export const handle: Handle = handleParaglide;
