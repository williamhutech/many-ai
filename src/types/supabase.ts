import { Database as DatabaseTypes } from './database.types';

export type Database = DatabaseTypes;
export type Tables = Database['public']['Tables'];
export type Enums = Database['public']['Enums'];

export interface Profile {
  id: string;
  email: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface DatabaseError {
  code: string;
  message: string;
  details?: string;
}

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
