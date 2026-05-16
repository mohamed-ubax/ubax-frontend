export const MIN_GALLERY_SLOTS = 4;

export const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  PUBLISHED: 'Publié',
  RESERVED: 'Réservé',
  SOLD: 'Vendu',
  ARCHIVED: 'Archivé',
  REJECTED: 'Rejeté',
};

export function isEditableEspaceStatus(status: string | null | undefined): boolean {
  return status === 'DRAFT' || status === 'REJECTED';
}

export function extractFileExtension(name: string, fileUrl: string): string {
  const source = name || fileUrl;
  const match = /\.([a-z0-9]{2,5})(?:$|\?)/i.exec(source);
  return (match?.[1] ?? 'doc').toUpperCase();
}

export function resolveDocumentKindLabel(extension: string): string {
  if (extension === 'PDF') {
    return 'Dossier PDF';
  }

  if (['PNG', 'JPG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'SVG'].includes(extension)) {
    return 'Justificatif image';
  }

  return "Pièce légale";
}
