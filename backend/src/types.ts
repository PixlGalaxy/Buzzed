export type User = {
id: string;
name: string;
email: string;
password_hash: string;
avatar_url?: string | null;
created_at: number;
};


export type Room = {
code: string;
host_user_id: string;
created_at: number;
is_active: number; // 1/0
};


export type Participant = {
id: string;
room_code: string;
user_id: string;
display_name: string;
selfie_url?: string | null;
score: number;
created_at: number;
};


export type Upload = {
id: string;
room_code: string;
participant_id: string;
filepath: string;
created_at: number;
used: number; // 1/0
};


export type ScoreEvent = {
id: string;
room_code: string;
participant_id: string;
type: 'DRINK' | 'SHOT';
points: number;
created_at: number;
upload_id: string;
};