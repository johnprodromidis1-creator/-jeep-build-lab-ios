import type { Part } from "./model";

export function partThumbnail(part: Pick<Part, "category" | "specs">) {
  if (part.category === "wheels") {
    return {
      src: `/assets/wheel-${part.specs.finish === "bronze" ? "bronze" : "charcoal"}.png`,
      className: "part-thumb-image wheels",
    };
  }
  if (part.category === "tires") {
    return {
      src: "/assets/tire-thumbnail.png",
      className: "part-thumb-image tires",
    };
  }
  return {
    src: "/assets/part-thumbnails.png",
    className: `part-thumb-sprite ${part.category}`,
  };
}
