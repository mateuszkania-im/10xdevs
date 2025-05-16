/* Centralne definicje typów dla aplikacji */

import type { Json } from "./db/database.types";

/********************************************
 * Typy dla formularzy i komponentów UI
 ********************************************/

export interface NoteEditorVM {
  title: string;
  content: string | null;
  priority?: number;
  tags: string[];
  isConfig: boolean;
  arrival_date?: string;
  departure_date?: string;
  num_days?: number;
  num_people?: number;
  destination?: string;
  travel_style?: string;
  budget?: string;
  interests?: string[];
  accommodation_address?: string;
}

/********************************************
 * Bazowe typy encji z bazy danych
 ********************************************/

export interface Project {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  last_notes_update_at: string;
  has_config_note?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string | null;
  is_config_note: boolean;
  position: number;
  priority: number;
  project_id: string;
  created_at: string;
  updated_at: string;
  tags?: string[];
}

export interface ConfigData {
  id: string;
  note_id: string;
  arrival_date: string;
  departure_date: string;
  num_days: number;
  num_people: number;
  destination?: string;
  travel_style?: string;
  budget?: string;
  interests?: string[];
  accommodation_address?: string;
}

export interface NoteTag {
  id: string;
  note_id: string;
  tag_name: string;
  created_at: string;
}

export interface TravelPlan {
  id: string;
  project_id: string;
  version_name: string;
  content: Json;
  is_outdated: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlanActivity {
  time: string;
  name: string;
  description: string;
  type: string;
  location?: string;
  price?: string;
  price_range?: string;
  duration?: string;
  rating?: number;
  difficulty?: string;
  mood?: string;
  notes?: string;
  tips?: string;
  website?: string;
  contact?: string;
  image_url?: string;
  tags?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PlanDay {
  day_number: number;
  date: string;
  activities: PlanActivity[];
  weather?: string;
  summary?: string;
  temperature?: {
    min: number;
    max: number;
    unit: "C" | "F";
  };
  notable_events?: string[];
}

export interface PlanContent {
  days: PlanDay[];
}

/********************************************
 * DTO - Obiekty transferu danych
 ********************************************/

// Project DTOs
export type ProjectListItemDTO = Omit<Project, "user_id">;

export type ProjectDetailDTO = ProjectListItemDTO;

export interface CreateProjectDTO {
  name: string;
}

export interface UpdateProjectDTO {
  name: string;
}

// Note DTOs
export type NoteListItemDTO = Omit<Note, "project_id"> & {
  tags: string[];
};

export type NoteDetailDTO = NoteListItemDTO & {
  config_data?: Omit<ConfigData, "id" | "note_id">;
};

export interface CreateNoteDTO {
  title: string;
  content: string | null;
  priority?: number;
  tags?: string[];
}

export type UpdateNoteDTO = Partial<CreateNoteDTO>;

export interface CreateConfigNoteDTO extends CreateNoteDTO {
  arrival_date: string;
  departure_date: string;
  num_days: number;
  num_people: number;
  destination?: string;
  travel_style?: string;
  budget?: string;
  interests?: string[];
  accommodation_address?: string;
}

export type UpdateConfigNoteDTO = Partial<CreateConfigNoteDTO>;

export interface NotePositionDTO {
  id: string;
  position: number;
}

export interface ReorderNotesDTO {
  note_positions: NotePositionDTO[];
}

// Travel Plan DTOs
export type TravelPlanListItemDTO = Omit<TravelPlan, "project_id" | "content">;

export type TravelPlanDetailDTO = Omit<TravelPlan, "project_id"> & {
  content: PlanContent;
};

export interface GeneratePlanDTO {
  version_name: string;
}

export interface UpdatePlanDTO {
  version_name?: string;
  content?: PlanContent;
}

export interface PlanComparisonDTO {
  plan1: {
    id: string;
    version_name: string;
  };
  plan2: {
    id: string;
    version_name: string;
  };
  differences: {
    day: number;
    plan1_activities: PlanActivity[];
    plan2_activities: PlanActivity[];
  }[];
}

// API Response Wrappers
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ListResponse<T> {
  data: T[];
}

export interface SuccessResponse {
  success: boolean;
}
