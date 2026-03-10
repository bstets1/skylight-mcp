import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import { getAlbums } from "../api/endpoints/photos.js";
import { formatErrorForMcp } from "../utils/errors.js";

export function registerPhotoTools(server: McpServer): void {
  // get_albums tool
  server.tool(
    "get_albums",
    `Get photo albums from Skylight - Plus subscription required.

Use this when:
- Viewing available photo albums
- Getting album IDs for photo management

Returns: List of photo albums with their IDs.`,
    {},
    async () => {
      try {
        const albums = await getAlbums();

        if (albums.length === 0) {
          return {
            content: [{ type: "text" as const, text: "No photo albums found." }],
          };
        }

        const list = albums
          .map((album) => {
            const attrs = album.attributes as Record<string, unknown>;
            const parts = [`- ${attrs.name ?? "Untitled Album"} (ID: ${album.id})`];

            if (attrs.photo_count !== null && attrs.photo_count !== undefined) {
              parts.push(`  Photos: ${attrs.photo_count}`);
            }
            if (attrs.created_at) parts.push(`  Created: ${attrs.created_at}`);
            if (attrs.updated_at) parts.push(`  Updated: ${attrs.updated_at}`);

            return parts.join("\n");
          })
          .join("\n\n");

        return {
          content: [{ type: "text" as const, text: `Photo albums:\n\n${list}` }],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: formatErrorForMcp(error) }],
          isError: true,
        };
      }
    }
  );
}
