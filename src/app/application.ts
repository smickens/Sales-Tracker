import { User } from './user';

export interface Application {
    type: string;
    name: string;
    member: User;
}