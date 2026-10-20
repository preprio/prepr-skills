export const SKILLS = ['build-frontend', 'connect-prepr', 'create-schema', 'design-schema', 'manage-content', 'migrate-content', 'personalize-and-track', 'review-schema', 'sync-schema'];

// shared/<file> → skills that receive a copy in references/<file>
export const SHARED_MAP = {
  'mcp-connection.md': ['build-frontend', 'connect-prepr', 'create-schema', 'design-schema', 'manage-content', 'migrate-content', 'personalize-and-track', 'review-schema', 'sync-schema'],
  'write-safety.md': ['create-schema', 'manage-content', 'migrate-content'],
  'schema-design-principles.md': ['create-schema', 'design-schema', 'review-schema', 'sync-schema'],
  'mcp-limits.md': ['create-schema', 'manage-content'],
  'ai-context.md': ['connect-prepr', 'create-schema', 'design-schema', 'review-schema'],
  'schema-route.md': ['create-schema', 'review-schema', 'sync-schema'],
  'schema-files.md': ['create-schema', 'review-schema', 'sync-schema'],
  'batch-route.md': ['create-schema', 'manage-content'],
  'toolkit.md': ['build-frontend', 'personalize-and-track'],
};
