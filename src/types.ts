export interface DesignToken {
  name: string;      // e.g. "--color-primary"
  value: string;     // e.g. "#2563EB"
  category: TokenCategory;
}

export type TokenCategory =
  | 'color'
  | 'spacing'
  | 'typography'
  | 'radius'
  | 'shadow'
  | 'z-index'
  | 'other';

export interface ComponentProp {
  type: string;
  values?: string[];
  default?: unknown;
  required: boolean;
}

export interface Component {
  name: string;
  import: string;
  description: string;
  props: Record<string, ComponentProp>;
  examples: string[];
  antiPatterns: string[];
}

export interface ComponentManifest {
  version: string;
  components: Component[];
}

export interface DesignSystemSpec {
  tokens: DesignToken[];
  components: Component[];
  guidelines: string;
  generatedAt: string;
  sources: {
    tokens?: string;
    components?: string;
    guidelines?: string;
  };
}

// ----------------------------------------------------------------
// Backend convention types
// ----------------------------------------------------------------

export type DomainProfile = 'frontend' | 'backend' | 'fullstack';

export type ConventionCategory =
  | 'api-naming'
  | 'response-structure'
  | 'error-handling'
  | 'security'
  | 'logging';

export interface ConventionRule {
  id: string;                     // e.g. "api-naming-kebab"
  category: ConventionCategory;
  description: string;
  severity: 'error' | 'warning';
  pattern?: string;               // regex pattern to detect violations
}

export interface ConventionViolation {
  file: string;
  line: number;
  rule: ConventionRule;
  message: string;
  context: string;
  severity: 'error' | 'warning';
}

export interface ConventionsConfig {
  api?: {
    naming?: 'kebab-case' | 'camelCase' | 'snake_case';
    versioning?: string;          // e.g. "/api/v{n}/"
    responseEnvelope?: {
      success: string[];          // e.g. ["data", "meta"]
      error: string[];            // e.g. ["code", "message", "details"]
    };
  };
  security?: {
    requireInputValidation?: boolean;
    forbiddenPatterns?: string[];
  };
  errorHandling?: {
    requireTryCatch?: boolean;
  };
  logging?: {
    format?: 'structured_json' | 'text';
    requiredFields?: string[];
  };
}

// ----------------------------------------------------------------
// Frontend design token types
// ----------------------------------------------------------------

export interface TokenSuggestion {
  token: string;
  tokenValue: string;
  confidence: number; // 0-1
}

export interface TokenViolation {
  file: string;
  line: number;
  rawValue: string;
  property: string;
  context: string;
  suggestions: TokenSuggestion[];
  severity: 'error' | 'warning';
}
