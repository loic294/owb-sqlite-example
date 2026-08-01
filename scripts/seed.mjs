import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openSqliteDatabase } from "open-website-builder";

const siteRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const databasePath = resolve(siteRoot, "data/site.sqlite");

function text(id, html) {
  return { id, type: "text", content: html, settings: {} };
}

function shared(id) {
  return {
    id: `shared-${id}`,
    type: "shared",
    settings: { shared_component_id: id },
    content: [],
  };
}

function section(id, content) {
  return { id, type: "section", content, settings: {} };
}

function collectionTemplate(id) {
  return [
    section(`section-${id}-navigation`, [shared("site-header")]),
    section(`section-${id}-header`, [
      text(`text-${id}-title`, "<h1>{{title}}</h1><p>{{excerpt}}</p>"),
    ]),
    section(`section-${id}-content`, [
      { id: `collection-content-${id}`, type: "collection-content" },
    ]),
    section(`section-${id}-footer`, [shared("site-footer")]),
  ];
}

function item(id, title, url, excerpt, body) {
  return {
    id,
    title,
    url,
    excerpt,
    seo: { title, description: excerpt, image: "", noIndex: false },
    content: [section(`section-${id}`, [text(`text-${id}`, `<p>${body}</p>`)])],
  };
}

await rm(databasePath, { force: true });
await rm(`${databasePath}-shm`, { force: true });
await rm(`${databasePath}-wal`, { force: true });
const database = openSqliteDatabase(databasePath);

try {
  const header = {
    id: "site-header",
    type: "shared",
    title: "Site header",
    content: [
      section("section-site-header", [
        text(
          "text-site-header",
          '<header><nav aria-label="Primary navigation"><a href="/">Home</a> · <a href="/about">About</a></nav></header>',
        ),
      ]),
    ],
  };

  const footer = {
    id: "site-footer",
    type: "shared",
    title: "Site footer",
    content: [
      section("section-site-footer", [
        text(
          "text-site-footer",
          "<footer><p>OWB SQLite Example · Content stored in SQLite.</p></footer>",
        ),
      ]),
    ],
  };

  const pages = [
    {
      type: "page",
      id: "home",
      title: "Home",
      url: "/",
      seo: {
        title: "OWB SQLite Example",
        description: "A database-backed Open Website Builder example.",
        image: "",
        noIndex: false,
      },
      content: [
        section("section-home-header", [shared("site-header")]),
        section("section-home-intro", [
          text(
            "text-home-intro",
            "<h1>SQLite, meet the open web.</h1><p>This site reads its editable content from a local database.</p>",
          ),
        ]),
        section("section-home-footer", [shared("site-footer")]),
      ],
    },
    {
      type: "page",
      id: "about",
      title: "About",
      url: "/about",
      seo: {
        title: "About the SQLite Example",
        description: "How this example separates content and public files.",
        image: "",
        noIndex: false,
      },
      content: [
        section("section-about-header", [shared("site-header")]),
        section("section-about", [
          text(
            "text-about",
            "<h1>About</h1><p>Pages, collections, and shared components live in SQLite. Public assets remain ordinary files.</p>",
          ),
        ]),
        section("section-about-footer", [shared("site-footer")]),
      ],
    },
  ];

  const collections = [
    {
      id: "posts",
      title: "Posts",
      fields: {
        title: { type: "string", required: true },
        content: { type: "array", required: true },
        excerpt: { type: "string", required: false },
        metadata: { type: "object", required: false },
        seo: { type: "object", required: false },
      },
      metadataFields: {},
      content: collectionTemplate("posts"),
      collectionMetadataAllowlist: [],
    },
    {
      id: "projects",
      title: "Projects",
      fields: {
        title: { type: "string", required: true },
        content: { type: "array", required: true },
        excerpt: { type: "string", required: false },
        metadata: { type: "object", required: false },
        seo: { type: "object", required: false },
      },
      metadataFields: {},
      content: collectionTemplate("projects"),
      collectionMetadataAllowlist: [],
    },
  ];

  const collectionItems = {
    posts: [
      item(
        "sqlite-basics",
        "SQLite Basics",
        "/posts/sqlite-basics",
        "A compact database for durable content.",
        "SQLite keeps the example portable while providing transactions and constraints.",
      ),
      item(
        "document-storage",
        "Document Storage",
        "/posts/document-storage",
        "Preserving flexible component data.",
        "Complete JSON documents preserve custom fields without a rigid content schema.",
      ),
      item(
        "static-publishing",
        "Static Publishing",
        "/posts/static-publishing",
        "Database input, static output.",
        "Publishing reads SQLite and emits ordinary HTML that can be deployed anywhere.",
      ),
    ],
    projects: [
      item(
        "field-notes",
        "Field Notes",
        "/projects/field-notes",
        "A small editorial notebook.",
        "Field Notes demonstrates a lightweight collection backed by the same database.",
      ),
      item(
        "photo-index",
        "Photo Index",
        "/projects/photo-index",
        "An index prepared for image metadata.",
        "Image metadata can live in SQLite while image binaries remain in object storage.",
      ),
      item(
        "public-archive",
        "Public Archive",
        "/projects/public-archive",
        "Static files stay visible and portable.",
        "The public directory is copied directly into each published build.",
      ),
    ],
  };

  const insertDocument = (table) =>
    database.prepare(`INSERT INTO ${table} (id, document) VALUES (?, ?)`);
  const insertPage = insertDocument("pages");
  const insertCollection = insertDocument("collections");
  const insertShared = insertDocument("shared_components");
  const insertItem = database.prepare(
    "INSERT INTO collection_items (collection_id, id, document) VALUES (?, ?, ?)",
  );

  database.exec("BEGIN IMMEDIATE");
  try {
    for (const page of pages) insertPage.run(page.id, JSON.stringify(page));
    for (const collection of collections) {
      insertCollection.run(collection.id, JSON.stringify(collection));
      for (const entry of collectionItems[collection.id]) {
        insertItem.run(collection.id, entry.id, JSON.stringify(entry));
      }
    }
    for (const component of [header, footer]) {
      insertShared.run(component.id, JSON.stringify(component));
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
} finally {
  database.close();
}

process.stdout.write(`Seeded ${databasePath}\n`);
