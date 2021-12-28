export interface Producer {
    name: string;
    id?: string;
    hired?: boolean;
    licensed?: boolean;
    pin?: number;
    color?: string;
    corp_color?: string;
    hover_color?: string;
    corporate_bonuses?: Array<Number>;
    production_bonuses?: Array<Number>;
}