export interface LanguageStat {
  name: string;
  color: string | null;
  bytes: number;
  percentage: number;
}

export interface LanguageDataOutput {
  generated_at: string;
  repos: number;
  total_bytes: number;
  languages: LanguageStat[];
}
