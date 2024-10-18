export interface ChatResponse {
  id: number;
  message_text: string;
  message_date_time: Date;
  sender_id: number;
  receiver_id: number;
  is_read: number;
  file: {
    file_name: string | null
    file_path: string | null
    file_type: string | null
  }
}

export interface RequestPayload {
  messageText: string | null
  senderId: number
  receiverId: number
  isRead: IsRead
  file: any | null
}

enum IsRead {
  read = 0,
  unRead = 1
}