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
