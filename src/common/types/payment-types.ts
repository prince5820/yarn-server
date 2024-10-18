export interface Payment {
  id?: number;
  title: string;
  description: string;
  type: string;
  amount: number;
  date: string;
  categoryId: number;
  userId: number;
}