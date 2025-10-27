/**
 * Service to fetch mutual fund prices from various providers
 */

export type FundProvider = 'UTT' | 'Itrust' | 'Quiver';

export interface MutualFundData {
  fundName: string;
  navPerUnit: number;
  salePricePerUnit: number; // Buying price
  repurchasePricePerUnit: number; // Selling price
  dateValued: string;
}

export interface UTTFunds {
  umoja: MutualFundData | null;
  wekezaMaisha: MutualFundData | null;
  watoto: MutualFundData | null;
  jikimu: MutualFundData | null;
  liquid: MutualFundData | null;
  bond: MutualFundData | null;
}

/**
 * Fetch mutual fund prices from UTT AMIS website
 */
export const fetchMutualFundPrices = async (): Promise<UTTFunds> => {
  try {
    const response = await fetch('https://uttamis.co.tz/fund-performance');
    const html = await response.text();
    
    // Parse the HTML to extract fund data from the table
    const funds = parseFundData(html);
    
    return funds;
  } catch (error) {
    console.error('Error fetching mutual fund prices:', error);
    return {
      umoja: null,
      wekezaMaisha: null,
      watoto: null,
      jikimu: null,
      liquid: null,
      bond: null,
    };
  }
};

/**
 * Parse HTML to extract fund data from the table
 */
const parseFundData = (html: string): UTTFunds => {
  const funds: UTTFunds = {
    umoja: null,
    wekezaMaisha: null,
    watoto: null,
    jikimu: null,
    liquid: null,
    bond: null,
  };

  try {
    // Extract table data from HTML
    // The table contains fund performance data
    // We'll look for the specific fund names in the table
    
    // This is a simplified parser - in production, you might want to use a proper HTML parser
    const tableRegex = /<table[^>]*>(.*?)<\/table>/s;
    const tableMatch = html.match(tableRegex);
    
    if (!tableMatch) {
      console.warn('Could not find table in HTML');
      return funds;
    }
    
    const tableContent = tableMatch[1];
    
    // Look for Umoja Fund specifically
    const umojaMatch = html.match(/Umoja\s+Fund[^<]*<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>/i);
    if (umojaMatch) {
      funds.umoja = {
        fundName: 'Umoja Fund',
        navPerUnit: parseFloat(umojaMatch[1].replace(/,/g, '')),
        salePricePerUnit: parseFloat(umojaMatch[2].replace(/,/g, '')),
        repurchasePricePerUnit: parseFloat(umojaMatch[3].replace(/,/g, '')),
        dateValued: umojaMatch[4],
      };
    }
    
    // Try to extract Wekeza Maisha Fund
    const wekezaMatch = html.match(/Wekeza\s+Maisha[^<]*<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>/i);
    if (wekezaMatch) {
      funds.wekezaMaisha = {
        fundName: 'Wekeza Maisha Fund',
        navPerUnit: parseFloat(wekezaMatch[1].replace(/,/g, '')),
        salePricePerUnit: parseFloat(wekezaMatch[2].replace(/,/g, '')),
        repurchasePricePerUnit: parseFloat(wekezaMatch[3].replace(/,/g, '')),
        dateValued: wekezaMatch[4],
      };
    }
    
    // Try to extract Watoto Fund
    const watotoMatch = html.match(/Watoto\s+Fund[^<]*<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>/i);
    if (watotoMatch) {
      funds.watoto = {
        fundName: 'Watoto Fund',
        navPerUnit: parseFloat(watotoMatch[1].replace(/,/g, '')),
        salePricePerUnit: parseFloat(watotoMatch[2].replace(/,/g, '')),
        repurchasePricePerUnit: parseFloat(watotoMatch[3].replace(/,/g, '')),
        dateValued: watotoMatch[4],
      };
    }
    
    // Try to extract Jikimu Fund
    const jikimuMatch = html.match(/Jikimu\s+Fund[^<]*<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>/i);
    if (jikimuMatch) {
      funds.jikimu = {
        fundName: 'Jikimu Fund',
        navPerUnit: parseFloat(jikimuMatch[1].replace(/,/g, '')),
        salePricePerUnit: parseFloat(jikimuMatch[2].replace(/,/g, '')),
        repurchasePricePerUnit: parseFloat(jikimuMatch[3].replace(/,/g, '')),
        dateValued: jikimuMatch[4],
      };
    }
    
    // Try to extract Liquid Fund
    const liquidMatch = html.match(/Liquid\s+Fund[^<]*<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>/i);
    if (liquidMatch) {
      funds.liquid = {
        fundName: 'Liquid Fund',
        navPerUnit: parseFloat(liquidMatch[1].replace(/,/g, '')),
        salePricePerUnit: parseFloat(liquidMatch[2].replace(/,/g, '')),
        repurchasePricePerUnit: parseFloat(liquidMatch[3].replace(/,/g, '')),
        dateValued: liquidMatch[4],
      };
    }
    
    // Try to extract Bond Fund
    const bondMatch = html.match(/Bond\s+Fund[^<]*<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>[^<]*<td[^>]*>([0-9.,]+)<\/td>/i);
    if (bondMatch) {
      funds.bond = {
        fundName: 'Bond Fund',
        navPerUnit: parseFloat(bondMatch[1].replace(/,/g, '')),
        salePricePerUnit: parseFloat(bondMatch[2].replace(/,/g, '')),
        repurchasePricePerUnit: parseFloat(bondMatch[3].replace(/,/g, '')),
        dateValued: bondMatch[4],
      };
    }
    
  } catch (error) {
    console.error('Error parsing fund data:', error);
  }
  
  return funds;
};

/**
 * Get prices for a specific fund by name
 */
export const getFundPricesByName = async (fundName: string): Promise<{ buyingPrice: number; sellingPrice: number } | null> => {
  try {
    const funds = await fetchMutualFundPrices();
    
    // Normalize fund name for lookup
    const normalizedName = fundName.toLowerCase();
    
    if (normalizedName.includes('umoja') && funds.umoja) {
      return {
        buyingPrice: funds.umoja.salePricePerUnit,
        sellingPrice: funds.umoja.repurchasePricePerUnit,
      };
    }
    
    if (normalizedName.includes('wekeza') || normalizedName.includes('maisha') && funds.wekezaMaisha) {
      return {
        buyingPrice: funds.wekezaMaisha.salePricePerUnit,
        sellingPrice: funds.wekezaMaisha.repurchasePricePerUnit,
      };
    }
    
    if (normalizedName.includes('watoto') && funds.watoto) {
      return {
        buyingPrice: funds.watoto.salePricePerUnit,
        sellingPrice: funds.watoto.repurchasePricePerUnit,
      };
    }
    
    if (normalizedName.includes('jikimu') && funds.jikimu) {
      return {
        buyingPrice: funds.jikimu.salePricePerUnit,
        sellingPrice: funds.jikimu.repurchasePricePerUnit,
      };
    }
    
    if (normalizedName.includes('liquid') && funds.liquid) {
      return {
        buyingPrice: funds.liquid.salePricePerUnit,
        sellingPrice: funds.liquid.repurchasePricePerUnit,
      };
    }
    
    if (normalizedName.includes('bond') && funds.bond) {
      return {
        buyingPrice: funds.bond.salePricePerUnit,
        sellingPrice: funds.bond.repurchasePricePerUnit,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting fund prices:', error);
    return null;
  }
};

