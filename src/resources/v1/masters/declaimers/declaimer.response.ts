export const declaimerResponse = (data: any[]): any[] => {
  return data.map((declaimer) => ({
    id: declaimer._id,
    key: declaimer.key,
    title: declaimer.title,
    content: declaimer.content,
    version: declaimer.version,
    is_latest: declaimer.is_latest,
    language: declaimer.language,
    country: declaimer.country,
    metadata: declaimer.metadata || {},
    is_active: declaimer.is_active,
    is_deleted: declaimer.is_deleted,
    deleted_at: declaimer.deleted_at,
    created_by: declaimer.created_by,
    updated_by: declaimer.updated_by,
    deleted_by: declaimer.deleted_by,
    published_at: declaimer.published_at,
    created_at: declaimer.createdAt,
    updated_at: declaimer.updatedAt,
    status: declaimer.status_id?.title || null, // optional if populated
  }));
};
