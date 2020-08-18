
export interface Application {
    type: string;
    date: string;
    client_name: string;
    producer_name: string;
}

export interface LifeApp extends Application {
    premium?: number;
    mode?: string;
    annual_premium?: number;
    policy_type?: string;
    product?: string;
    client_type?: string;
    bonus?: number;
    bound?: boolean;
    status?: string;
    paid_bonus?: number;
    issue_month?: string;
    life_pivot_bonus?: string;
}

export interface AutoApp extends Application {
    auto_type?: string;
    tiers?: string;
    bonus?: number;
    submitted_premium?: number;
    status?: boolean;
    issued_premium?: number;
    marketing_source?: string;
}

export interface BankApp extends Application {
    deposit?: number;
    premium?: number;
    mode?: string;
    status?: string;
    annual_premium?: number;
    product_type?: string;
    product?: string;
    bonus?: number;
    marketing_source?: string;
}

export interface FireApp extends Application {
    product?: string;
    submitted_premium?: number;
    status?: boolean;
    issued_premium?: number;
    marketing_source?: string;
}

export interface HealthApp extends Application {
    premium?: number;
    mode?: string;
    status?: string;
    annual_premium?: number;
    product?: string;
    bonus?: number;
    marketing_source?: string;
}