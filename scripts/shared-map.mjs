export const SKILLS = ['connect-prepr', 'create-schema', 'design-schema', 'manage-content', 'review-schema'];

// shared/<file> → skills that receive a copy in references/<file>
export const SHARED_MAP = {
  'mcp-connection.md': ['connect-prepr', 'create-schema', 'design-schema', 'manage-content', 'review-schema'],
  'write-safety.md': ['create-schema', 'manage-content'],
  'schema-design-principles.md': ['create-schema', 'design-schema', 'review-schema'],
  'mcp-limits.md': ['create-schema', 'manage-content'],
};
