export interface PrescriptionMedicine {
  name: string;
  dosage: string | null;
  quantity: string | null;
}

export interface PriceInfo {
  pharmacy: string;
  price: string;
  discount?: string;
}

export interface GenericAlternative {
  genericName: string;
  saltComposition: string;
  strength: string;
  form: string;
  prices: PriceInfo[];
  safetyNote: string | null;
  cdscoStatus: 'Approved' | 'Banned' | 'Under Review' | 'N/A';
  schedule: 'Schedule H' | 'OTC' | 'Ayurvedic' | 'General' | 'N/A';
  recallNotice: string | null;
}

export interface BrandedMedicineAnalysis {
  brandedSaltComposition: string;
  alternatives: GenericAlternative[];
}

export interface AnalyzedMedicine {
  brandedMedicine: PrescriptionMedicine;
  analysis: BrandedMedicineAnalysis | null;
}

export interface Pharmacy {
    name: string;
    address: string;
    distance: string;
    contact: string | null;
    latitude?: number;
    longitude?: number;
    services?: string[];
}

export type JanAushadhiStore = Pharmacy;
export type GeneralPharmacy = Pharmacy;

export type InteractionSeverity = 'Major' | 'Moderate' | 'Minor' | 'None';

export interface DrugInteraction {
    medicines: [string, string];
    severity: InteractionSeverity;
    description: string;
}

export interface InteractionAnalysisResult {
    summary: string;
    interactions: DrugInteraction[];
}

export interface PillIdentificationResult {
    name: string;
    strength: string | null;
    imprint: string | null;
    color: string | null;
    shape: string | null;
    manufacturer: string | null;
    usageDescription: string;
}

export type ConditionSeverity = 'Low' | 'Medium' | 'High';

export interface PossibleCondition {
    condition: string;
    severity: ConditionSeverity;
    description: string;
}

export interface NonMedicinalRemedy {
    category: 'Home Remedy' | 'Ayurvedic' | 'Physical Activity' | 'Lifestyle';
    remedy: string;
    description: string;
}

export interface SymptomAnalysisResult {
    possibleConditions: PossibleCondition[];
    recommendation: string;
    nonMedicinalRemedies?: NonMedicinalRemedy[];
    disclaimer: string;
}
