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

describe("extractText (old Reddit)", () => {
  it("extracts comment body text", () => {
    const el = makeOldRedditComment("This is a great comment about cats");
    expect(extractText(el)).toBe("This is a great comment about cats");
  });

  it("extracts post title text", () => {
    const el = makeOldRedditPost("My interesting post title");
    expect(extractText(el)).toBe("My interesting post title");
  });

  it("returns null when no text found", () => {
    const el = document.createElement("div");
    expect(extractText(el)).toBeNull();
  });
});
