// IBJJF/CBJJ Belt System - Complete belt hierarchy for children and adults
// Based on Sistema Geral de Graduação (Dec/2025)

export type BeltType = 
  // Children belts (4-15 years) - 13 belts
  | 'white'         // Branca
  | 'grey_white'    // Cinza e Branca
  | 'grey'          // Cinza
  | 'grey_black'    // Cinza e Preta
  | 'yellow_white'  // Amarela e Branca
  | 'yellow'        // Amarela
  | 'yellow_black'  // Amarela e Preta
  | 'orange_white'  // Laranja e Branca
  | 'orange'        // Laranja
  | 'orange_black'  // Laranja e Preta
  | 'green_white'   // Verde e Branca
  | 'green'         // Verde
  | 'green_black'   // Verde e Preta
  // Adult belts (16+ years) - 8 belts
  | 'blue'          // Azul
  | 'purple'        // Roxa
  | 'brown'         // Marrom
  | 'black'         // Preta
  | 'red_black'     // Vermelha e Preta (7º grau - Mestre)
  | 'red_white'     // Vermelha e Branca (8º grau - Mestre)
  | 'red';          // Vermelha (9º e 10º graus - Grande Mestre)

// Belt labels in Portuguese
export const BELT_LABELS: Record<BeltType, string> = {
  // Children belts
  white: 'Branca',
  grey_white: 'Cinza e Branca',
  grey: 'Cinza',
  grey_black: 'Cinza e Preta',
  yellow_white: 'Amarela e Branca',
  yellow: 'Amarela',
  yellow_black: 'Amarela e Preta',
  orange_white: 'Laranja e Branca',
  orange: 'Laranja',
  orange_black: 'Laranja e Preta',
  green_white: 'Verde e Branca',
  green: 'Verde',
  green_black: 'Verde e Preta',
  // Adult belts
  blue: 'Azul',
  purple: 'Roxa',
  brown: 'Marrom',
  black: 'Preta',
  red_black: 'Vermelha e Preta',
  red_white: 'Vermelha e Branca',
  red: 'Vermelha',
};

// Belt colors for styling (primary and secondary for two-tone belts)
export const BELT_COLORS: Record<BeltType, { primary: string; secondary?: string; textColor: string }> = {
  // Children belts
  white: { primary: '#FFFFFF', textColor: 'text-foreground' },
  grey_white: { primary: '#9CA3AF', secondary: '#FFFFFF', textColor: 'text-foreground' },
  grey: { primary: '#6B7280', textColor: 'text-white' },
  grey_black: { primary: '#6B7280', secondary: '#1F2937', textColor: 'text-white' },
  yellow_white: { primary: '#FCD34D', secondary: '#FFFFFF', textColor: 'text-foreground' },
  yellow: { primary: '#F59E0B', textColor: 'text-foreground' },
  yellow_black: { primary: '#F59E0B', secondary: '#1F2937', textColor: 'text-foreground' },
  orange_white: { primary: '#FB923C', secondary: '#FFFFFF', textColor: 'text-foreground' },
  orange: { primary: '#EA580C', textColor: 'text-white' },
  orange_black: { primary: '#EA580C', secondary: '#1F2937', textColor: 'text-white' },
  green_white: { primary: '#22C55E', secondary: '#FFFFFF', textColor: 'text-foreground' },
  green: { primary: '#16A34A', textColor: 'text-white' },
  green_black: { primary: '#16A34A', secondary: '#1F2937', textColor: 'text-white' },
  // Adult belts
  blue: { primary: '#2563EB', textColor: 'text-white' },
  purple: { primary: '#7C3AED', textColor: 'text-white' },
  brown: { primary: '#78350F', textColor: 'text-white' },
  black: { primary: '#1F2937', textColor: 'text-white' },
  red_black: { primary: '#DC2626', secondary: '#1F2937', textColor: 'text-white' },
  red_white: { primary: '#DC2626', secondary: '#FFFFFF', textColor: 'text-white' },
  red: { primary: '#B91C1C', textColor: 'text-white' },
};

// Belt progression order
export const BELT_ORDER: BeltType[] = [
  // Children (4-15 years)
  'white',
  'grey_white',
  'grey',
  'grey_black',
  'yellow_white',
  'yellow',
  'yellow_black',
  'orange_white',
  'orange',
  'orange_black',
  'green_white',
  'green',
  'green_black',
  // Adults (16+ years)
  'blue',
  'purple',
  'brown',
  'black',
  'red_black',
  'red_white',
  'red',
];

// Children belts (4-15 years)
export const CHILDREN_BELTS: BeltType[] = [
  'white',
  'grey_white',
  'grey',
  'grey_black',
  'yellow_white',
  'yellow',
  'yellow_black',
  'orange_white',
  'orange',
  'orange_black',
  'green_white',
  'green',
  'green_black',
];

// Adult belts (16+ years)
export const ADULT_BELTS: BeltType[] = [
  'white',
  'blue',
  'purple',
  'brown',
  'black',
  'red_black',
  'red_white',
  'red',
];

// Belt progression mapping
export const BELT_PROGRESSION: Record<BeltType, BeltType | null> = {
  // Children progression
  white: 'grey_white', // For children; adults go white -> blue
  grey_white: 'grey',
  grey: 'grey_black',
  grey_black: 'yellow_white',
  yellow_white: 'yellow',
  yellow: 'yellow_black',
  yellow_black: 'orange_white',
  orange_white: 'orange',
  orange: 'orange_black',
  orange_black: 'green_white',
  green_white: 'green',
  green: 'green_black',
  green_black: 'blue', // Transition to adult belts at 16
  // Adult progression
  blue: 'purple',
  purple: 'brown',
  brown: 'black',
  black: 'red_black', // Master path
  red_black: 'red_white',
  red_white: 'red',
  red: null, // Grand Master - no further progression
};

// Adult belt progression (for 16+ years)
export const ADULT_BELT_PROGRESSION: Record<BeltType, BeltType | null> = {
  white: 'blue',
  blue: 'purple',
  purple: 'brown',
  brown: 'black',
  black: 'red_black',
  red_black: 'red_white',
  red_white: 'red',
  red: null,
  // Children belts that transition to adult
  grey_white: 'blue',
  grey: 'blue',
  grey_black: 'blue',
  yellow_white: 'blue',
  yellow: 'blue',
  yellow_black: 'blue',
  orange_white: 'blue',
  orange: 'blue',
  orange_black: 'blue',
  green_white: 'blue',
  green: 'blue',
  green_black: 'blue',
};

// Get next belt based on age
export function getNextBelt(currentBelt: BeltType, age: number): BeltType | null {
  if (age >= 16) {
    return ADULT_BELT_PROGRESSION[currentBelt] || null;
  }
  return BELT_PROGRESSION[currentBelt] || null;
}

// Get available belts for promotion based on current belt and age
export function getAvailableBeltsForPromotion(currentBelt: BeltType, age?: number): BeltType[] {
  const currentIndex = BELT_ORDER.indexOf(currentBelt);
  
  if (age && age >= 16) {
    // For adults, return adult belts after current position
    return ADULT_BELTS.filter(belt => {
      const beltIndex = BELT_ORDER.indexOf(belt);
      return beltIndex > currentIndex;
    });
  }
  
  // Return all belts after current position
  return BELT_ORDER.filter((_, index) => index > currentIndex);
}

// Check if belt is a children belt
export function isChildrenBelt(belt: BeltType): boolean {
  return CHILDREN_BELTS.includes(belt) && belt !== 'white';
}

// Check if belt is a master/grand master belt
export function isMasterBelt(belt: BeltType): boolean {
  return ['red_black', 'red_white', 'red'].includes(belt);
}

// Get belt category
export function getBeltCategory(belt: BeltType): 'children' | 'adult' | 'master' {
  if (isMasterBelt(belt)) return 'master';
  if (isChildrenBelt(belt)) return 'children';
  return 'adult';
}

// Belt data for table display
export interface BeltTableData {
  order: number;
  belt: BeltType;
  label: string;
  audience: string;
}

export function getBeltTableData(): BeltTableData[] {
  return [
    // Children and Adults
    { order: 1, belt: 'white', label: BELT_LABELS.white, audience: '4–15 e 16+' },
    // Children only
    { order: 2, belt: 'grey_white', label: BELT_LABELS.grey_white, audience: '4–15' },
    { order: 3, belt: 'grey', label: BELT_LABELS.grey, audience: '4–15' },
    { order: 4, belt: 'grey_black', label: BELT_LABELS.grey_black, audience: '4–15' },
    { order: 5, belt: 'yellow_white', label: BELT_LABELS.yellow_white, audience: '4–15' },
    { order: 6, belt: 'yellow', label: BELT_LABELS.yellow, audience: '4–15' },
    { order: 7, belt: 'yellow_black', label: BELT_LABELS.yellow_black, audience: '4–15' },
    { order: 8, belt: 'orange_white', label: BELT_LABELS.orange_white, audience: '4–15' },
    { order: 9, belt: 'orange', label: BELT_LABELS.orange, audience: '4–15' },
    { order: 10, belt: 'orange_black', label: BELT_LABELS.orange_black, audience: '4–15' },
    { order: 11, belt: 'green_white', label: BELT_LABELS.green_white, audience: '4–15' },
    { order: 12, belt: 'green', label: BELT_LABELS.green, audience: '4–15' },
    { order: 13, belt: 'green_black', label: BELT_LABELS.green_black, audience: '4–15' },
    // Adults only
    { order: 14, belt: 'blue', label: BELT_LABELS.blue, audience: '16+' },
    { order: 15, belt: 'purple', label: BELT_LABELS.purple, audience: '16+' },
    { order: 16, belt: 'brown', label: BELT_LABELS.brown, audience: '16+' },
    { order: 17, belt: 'black', label: BELT_LABELS.black, audience: '16+' },
    { order: 18, belt: 'red_black', label: `${BELT_LABELS.red_black} (7º grau)`, audience: '16+ Mestre' },
    { order: 19, belt: 'red_white', label: `${BELT_LABELS.red_white} (8º grau)`, audience: '16+ Mestre' },
    { order: 20, belt: 'red', label: `${BELT_LABELS.red} (9º e 10º graus)`, audience: '16+ Grande Mestre' },
  ];
}
