import { createFileRoute } from "@tanstack/react-router";

const LEGACY_DOCUMENTS = new Set([
  "ozplastik-conformitate-ro.docx",
  "ozplastik-conformitate-en.docx",
  "ozplastik-50-microni-ro.docx",
  "ozplastik-50-microni-en.docx",
]);

export const Route = createFileRoute("/documente/$filename")({
  server: {
    handlers: {
      GET: ({ params }) => {
        if (!LEGACY_DOCUMENTS.has(params.filename)) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(null, {
          status: 302,
          headers: {
            Location: `/documente/${params.filename.replace(/\.docx$/, ".pdf")}`,
            "Cache-Control": "no-store",
          },
        });
      },
    },
  },
});
