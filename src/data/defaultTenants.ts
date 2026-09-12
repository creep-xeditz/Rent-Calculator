import { Tenant, AppSettings } from '../types';

export const DEFAULT_TENANTS: Tenant[] = [
  { id: 1, name: "Shailendra", rent: 5600 },
  { id: 2, name: "Chhotu", rent: 3100 },
  { id: 3, name: "Amarjeet", rent: 2400 },
  { id: 4, name: "Chhote Lal", rent: 5300 },
  { id: 5, name: "Parmila", rent: 3200 },
  { id: 6, name: "Suman", rent: 2600 },
  { id: 7, name: "Goverdhan", rent: 2900 },
  { id: 8, name: "Vinod", rent: 2600 },
  { id: 9, name: "Radhika", rent: 2000 },
  { id: 10, name: "Bittu", rent: 2800 },
  { id: 11, name: "Suman 2", rent: 1500 },
];

export const DEFAULT_SETTINGS: AppSettings = {
  pricePerUnit: 8,
  waterCharge: 200,
};

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
