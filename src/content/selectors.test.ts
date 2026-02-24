import { describe, expect, it } from "vitest";
import { extractText } from "./selectors";

function makeOldRedditComment(bodyText: string): Element {
  const thing = document.createElement("div");
  thing.classList.add("thing");
  thing.dataset.fullname = "t1_abc123";
  thing.dataset.type = "comment";

  const usertext = document.createElement("div");
  usertext.classList.add("usertext-body");
  const md = document.createElement("div");
  md.classList.add("md");
  md.textContent = bodyText;
  usertext.appendChild(md);
  thing.appendChild(usertext);

  return thing;
}

function makeOldRedditPost(titleText: string): Element {
  const thing = document.createElement("div");
  thing.classList.add("thing");
  thing.dataset.fullname = "t3_abc123";
  thing.dataset.type = "link";

  const entry = document.createElement("div");
  entry.classList.add("entry");
  const titleDiv = document.createElement("p");
  titleDiv.classList.add("title");
  const a = document.createElement("a");
  a.classList.add("title");
  a.textContent = titleText;
  titleDiv.appendChild(a);
  entry.appendChild(titleDiv);
  thing.appendChild(entry);

  return thing;
}

function makeOldRedditSelfPost(titleText: string, bodyText: string): Element {
  const thing = makeOldRedditPost(titleText);

  const usertext = document.createElement("div");
  usertext.classList.add("usertext-body");
  const md = document.createElement("div");
  md.classList.add("md");
  md.textContent = bodyText;
  usertext.appendChild(md);
  thing.appendChild(usertext);

  return thing;
}

function makeNewRedditPost({
  title,
  body,
}: { title?: string; body?: string }): Element {
  const post = document.createElement("shreddit-post");

  if (title) {
    const a = document.createElement("a");
    a.slot = "title";
    a.textContent = title;
    post.appendChild(a);
  }

  if (body) {
    const div = document.createElement("div");
    div.slot = "text-body";
    div.textContent = body;
    post.appendChild(div);
  }

  return post;
}

function makeNewRedditComment(bodyText: string): Element {
  const comment = document.createElement("shreddit-comment");
  const div = document.createElement("div");
  div.slot = "comment";
  div.textContent = bodyText;
  comment.appendChild(div);
  return comment;
}

describe("extractText (old Reddit)", () => {
  it("extracts comment body text", () => {
    const el = makeOldRedditComment("This is a great comment about cats");
    expect(extractText(el)).toBe("This is a great comment about cats");
  });

  it("extracts post title text", () => {
    const el = makeOldRedditPost("My interesting post title");
    expect(extractText(el)).toBe("My interesting post title");
  });

  it("extracts self-post body text and prefers it over title", () => {
    const el = makeOldRedditSelfPost("Post title", "This is the self-text body of the post.");
    expect(extractText(el)).toBe("This is the self-text body of the post.");
  });

  it("returns null when no text found", () => {
    const el = document.createElement("div");
    expect(extractText(el)).toBeNull();
  });
});

describe("extractText (new Reddit)", () => {
  it("extracts comment body text", () => {
    const el = makeNewRedditComment("A new Reddit comment body");
    expect(extractText(el)).toBe("A new Reddit comment body");
  });

  it("extracts post self-text body and prefers it over title", () => {
    const el = makeNewRedditPost({ title: "Post title", body: "The post body text." });
    expect(extractText(el)).toBe("The post body text.");
  });

  it("falls back to post title when no body", () => {
    const el = makeNewRedditPost({ title: "Link post title" });
    expect(extractText(el)).toBe("Link post title");
  });

  it("returns null when no text found", () => {
    const el = document.createElement("shreddit-post");
    expect(extractText(el)).toBeNull();
  });
});
