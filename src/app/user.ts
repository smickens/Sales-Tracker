export const USERS: User[] = [
    { name: "Shauna", showing: true },
    { name: "Tiffany", showing: true },
    { name: "Joyce", showing: true },
    { name: "Pam", showing: true },
    { name: "Netty", showing: true },
    { name: "Michelle", showing: true},
    { name: "Dani", showing: true }
];

export interface User {
    name: string;
    showing: boolean;
}