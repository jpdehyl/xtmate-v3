// Types for the New Project modal

export type NewProjectTab = 'quick' | 'email' | 'esx' | 'csv';

export interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: NewProjectTab;
}

export interface QuickCreateFormData {
  name: string;
  projectType: string;
  jobType: 'insurance' | 'private';
  scopes: string[];
}

export interface ParsedEmail {
  id: string;
  subject: string;
  from: string;
  receivedAt: string;
  status: 'pending' | 'processing' | 'parsed' | 'estimate_created' | 'ignored' | 'failed';
  parsedData?: {
    insuredName?: string;
    propertyAddress?: string;
    propertyCity?: string;
    propertyState?: string;
    claimNumber?: string;
    carrierName?: string;
    damageType?: string;
  };
  confidence?: number;
  estimateId?: string;
}

export interface ESXParseResult {
  success: boolean;
  estimate?: {
    name: string;
    propertyAddress?: string;
    propertyCity?: string;
    propertyState?: string;
    propertyZip?: string;
    claimNumber?: string;
    policyNumber?: string;
  };
  levels?: Array<{
    name: string;
    label?: string;
  }>;
  rooms?: Array<{
    levelName: string;
    name: string;
    category?: string;
    lengthIn?: number;
    widthIn?: number;
    heightIn?: number;
  }>;
  lineItems?: Array<{
    category: string;
    selector: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
  }>;
  error?: string;
}

export interface CSVColumnMapping {
  name?: number;
  propertyAddress?: number;
  propertyCity?: number;
  propertyState?: number;
  propertyZip?: number;
  claimNumber?: number;
  policyNumber?: number;
  jobType?: number;
  projectType?: number;
}

export interface CSVImportResult {
  success: boolean;
  created: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
  estimateIds: string[];
}
