export type SlotCode = 'BB' | 'AB' | 'BL' | 'AL' | 'BD' | 'AD' | '3AM';

export interface Reading {
  id: number;
  slot: SlotCode;
  value: number; // integer glucose value
  timestamp: number; // epoch timestamp in ms
  clinical_date: string; // YYYY-MM-DD
  comment: string | null;
  created_at: number;
  updated_at: number;
}

export interface Tag {
  id: number;
  name: string;
  is_system_default: boolean;
  is_active: boolean;
}

export interface ReadingTag {
  reading_id: number;
  tag_id: number;
}

export type ThresholdConfigType = 'pre_meal' | 'post_meal' | '3am';

export interface ThresholdConfig {
  id: number;
  config_type: ThresholdConfigType;
  ok_low: number;
  okayish_low: number;
  notsobad_low: number;
  bad_low: number;
  ok_high: number;
  okayish_high: number;
  notsobad_high: number;
  bad_high: number;
}

export interface Settings {
  retention_duration_months: number | null;
  unit_system: string;
}

export interface ReadingWithTags extends Reading {
  tags: Tag[];
}
