import { z } from 'zod';


export const RegisterSchema = z.object({
name: z.string().min(2),
email: z.string().email(),
password: z.string().min(6)
});


export const LoginSchema = z.object({
email: z.string().email(),
password: z.string().min(6)
});


export const CreateRoomSchema = z.object({}); // no body


export const JoinRoomSchema = z.object({
displayName: z.string().min(1)
});


export const ScoreSchema = z.object({
type: z.enum(['DRINK', 'SHOT']),
uploadId: z.string().uuid()
});