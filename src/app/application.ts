
export interface Application {
    id?: string;
    type: string;
    date: string;
    client_name: string;
    producer_id: string;
    co_producer_id?: string;
    co_producer_bonus?: number;
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
    life_pivot_bonus: string;
    issue_month?: string;
    marketing_source?: string;
}

export interface AutoApp extends Application {
    auto_type?: string;
    tiers?: string;
    bonus?: number;
    submitted_premium?: number;
    status?: string;
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
    status?: string;
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
    issue_month?: string;
    marketing_source?: string;
}

export interface MutualFundApp extends Application {
    product_type?: string;
    contribution_type?: string;
    contribution_amount?: number;
    marketing_source?: string;
}