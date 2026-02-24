/**
 * Selectors for Reddit DOM elements.
 *
 * We target data attributes (data-fullname, data-type) rather than class names
 * since class names are volatile and RES adds/modifies them freely.
 *
 * Old Reddit structure (primary target — RES users skew here):
 *   .thing[data-fullname]        → post or comment wrapper
 *   .thing[data-type="comment"]  → comment
 *   .thing[data-type="link"]     → top-level post
 *   .usertext-body .md           → the actual text content
 *
 * New Reddit (secondary):
 *   shreddit-comment             → comment web component
 *   shreddit-post                → post web component
 */

export const OLD_REDDIT = {
  thing: ".thing[data-fullname]",
  comment: ".thing[data-type='comment']",
  post: ".thing[data-type='link']",
  body: ".usertext-body .md",
  title: ".entry .title a.title",
  selfText: ".usertext-body .md",
} as const;

export const NEW_REDDIT = {
  comment: "shreddit-comment",
  post: "shreddit-post",
  commentBody: "[slot='comment']",
  postTitle: "a[slot='title']",
  postBody: "[slot='text-body']",
} as const;

export function isOldReddit(): boolean {
  return (
    document.documentElement.classList.contains("res") ||
    !!document.querySelector(".thing[data-fullname]")
  );
}

/**
 * Returns true if the element itself looks like an old Reddit thing.
 * Safe for detached elements (e.g. in tests).
 */
function isOldRedditElement(el: Element): boolean {
  return el.classList.contains("thing") && el.hasAttribute("data-fullname");
}

/**
 * Extracts the scoreable text from a Reddit element.
 * Returns null if no usable text is found.
 */
export function extractText(el: Element): string | null {
  if (isOldRedditElement(el) || isOldReddit()) {
    const body = el.querySelector(OLD_REDDIT.selfText);
    if (body?.textContent?.trim()) return body.textContent.trim();

    const title = el.querySelector(OLD_REDDIT.title);
    if (title?.textContent?.trim()) return title.textContent.trim();

    return null;
  }

  // New Reddit
  const commentBody = el.querySelector(NEW_REDDIT.commentBody);
  if (commentBody?.textContent?.trim()) return commentBody.textContent.trim();

  // Self-text post body takes priority over title for scoring
  const postBody = el.querySelector(NEW_REDDIT.postBody);
  if (postBody?.textContent?.trim()) return postBody.textContent.trim();

  const postTitle = el.querySelector(NEW_REDDIT.postTitle);
  if (postTitle?.textContent?.trim()) return postTitle.textContent.trim();

  return null;
}

/**
 * Returns all scoreable elements currently in the document.
 */
export function findThings(root: Document | Element = document): Element[] {
  if (isOldReddit()) {
    return Array.from(root.querySelectorAll(OLD_REDDIT.thing));
  }
  return Array.from(root.querySelectorAll(`${NEW_REDDIT.comment}, ${NEW_REDDIT.post}`));
}
