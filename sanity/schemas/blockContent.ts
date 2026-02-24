// @ts-nocheck — Sanity 3 typings don't match runtime API (block styles, portableText components)
/**
 * Portable Text (block content) schema for post body.
 * Includes blockquote so Studio can resolve "text block style blockquote" for existing content.
 */

import { defineArrayMember, defineType } from "sanity";

// Sanity 3 types are stricter; block content with styles and portableText components is valid at runtime.
export const blockContentType = defineType({
  name: "blockContent",
  title: "Block Content",
  type: "array",
  of: [
    defineArrayMember({
      type: "block",
      styles: [
        { title: "Normal", value: "normal" },
        { title: "H1", value: "h1" },
        { title: "H2", value: "h2" },
        { title: "H3", value: "h3" },
        { title: "H4", value: "h4" },
        { title: "H5", value: "h5" },
        { title: "H6", value: "h6" },
        { title: "Quote", value: "blockquote" },
      ],
    }),
    {
      type: "image",
      options: { hotspot: true },
      fields: [{ name: "alt", type: "string", title: "Alt text" }],
    },
  ],
  components: {
    portableText: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sanity portable text plugins props (PortableTextPluginsProps not exported in sanity@3)
      plugins: (props: any) =>
        props.renderDefault({
          ...props,
          plugins: {
            ...props.plugins,
            markdown: {
              ...(typeof props.plugins?.markdown === "object" && props.plugins.markdown !== null
                ? props.plugins.markdown
                : {}),
              blockquoteStyle: () => "blockquote" as const,
            },
          },
        }),
    },
  },
});
