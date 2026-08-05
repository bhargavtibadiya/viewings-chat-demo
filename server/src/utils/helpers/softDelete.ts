export function notDeleted(): { deletedAt: null } {
  return { deletedAt: null };
}

export function softDeleteData(): { deletedAt: Date } {
  return { deletedAt: new Date() };
}
