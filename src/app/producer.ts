// export const PRODUCERS: Producer[] = [
//     { name: "Shauna", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true },
//     { name: "Tiffany", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true },
//     { name: "Joyce", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true },
//     { name: "Pam", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true },
//     { name: "Netty", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true },
//     { name: "Michelle", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true},
//     { name: "Elaine", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true},
//     { name: "Seth", life: 0, auto: 0, bank: 0, fire: 0, health: 0, total_apps: 0, showing: true }
// ];

export interface Producer {
    name: string;
    id: string;
    hired_date?: string;
    pin?: number;
    //showing?: boolean;
}