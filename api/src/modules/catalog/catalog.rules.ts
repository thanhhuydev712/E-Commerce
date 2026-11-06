import { BadRequestException } from '@nestjs/common';
export const MAX_MONEY = 9223372036854775807n;
export function vnd(value: string) {
  if (
    typeof value !== 'string' ||
    !/^(0|[1-9]\d{0,18})$/.test(value) ||
    BigInt(value) > MAX_MONEY
  )
    throw new BadRequestException(
      'VND must be an integer string within bigint range',
    );
  return BigInt(value);
}
export function optionSignature(ids: string[]) {
  return ids.length
    ? [...ids]
        .map((id) => id.toLowerCase())
        .sort()
        .join(':')
    : 'default';
}
export type CategoryNode = {
  id: string;
  parentId: string | null;
  status: string;
};
export function visibleCategoryIds(nodes: CategoryNode[], strict = false) {
  const index = new Map(nodes.map((node) => [node.id, node])),
    memo = new Map<string, boolean>();
  function visit(id: string, path: Set<string>): boolean {
    if (path.has(id) || path.size >= 16) {
      if (strict)
        throw new BadRequestException('Category cycle or depth exceeds 16');
      return false;
    }
    const node = index.get(id);
    if (!node) {
      if (strict) throw new BadRequestException('Missing category parent');
      return false;
    }
    if (!strict && memo.has(id)) return memo.get(id)!;
    const next = new Set(path);
    next.add(id);
    const ancestors = node.parentId ? visit(node.parentId, next) : true;
    const visible = node.status === 'ACTIVE' && ancestors;
    memo.set(id, visible);
    return visible;
  }
  return nodes
    .filter((node) => visit(node.id, new Set()))
    .map((node) => node.id);
}
