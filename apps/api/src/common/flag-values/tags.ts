import { BadRequestException } from "@nestjs/common";

export function normalizeTags(value: unknown) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new BadRequestException("tags must be an array");
  }

  const tags = value.map((tag) => {
    if (typeof tag !== "string") {
      throw new BadRequestException("tags must contain only strings");
    }

    return tag.trim();
  });

  const uniqueTags = Array.from(new Set(tags.filter(Boolean)));
  if (uniqueTags.length > 20) {
    throw new BadRequestException("Use at most 20 tags");
  }

  if (uniqueTags.some((tag) => tag.length > 50)) {
    throw new BadRequestException("Each tag must have at most 50 characters");
  }

  return uniqueTags;
}
