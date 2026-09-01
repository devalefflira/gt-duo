export type BookGenre =
  | 'Ficção'
  | 'Não-ficção'
  | 'Filosofia'
  | 'Religião'
  | 'Negócios'
  | 'Desenvolvimento Pessoal'
  | 'Biografia'
  | 'Ciência'
  | 'Tecnologia'
  | 'Romance'
  | 'Terror'
  | 'Fantasia'
  | 'Poesia'
  | 'História'
  | 'Outro';

export type BookStatus = 'reading' | 'completed' | 'want_to_read';

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string;
  total_pages: number;
  current_page: number;
  cover_url?: string | null;
  description?: string | null;
  genre: BookGenre;
  status: BookStatus;
  created_at: string;
  updated_at: string;
}

export interface ReadingSession {
  id: string;
  user_id: string;
  book_id: string;
  duration_minutes: number;
  pages_read: number;
  main_insight?: string | null;
  tokens_earned: number;
  created_at: string;
}