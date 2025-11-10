/**
 * Service to fetch mutual fund prices from various providers
 */

export type FundProvider = 'UTT' | 'Itrust' | 'Quiver';

export interface FundOption {
  value: string;
  label: string;
}

export const UTT_FUNDS: FundOption[] = [
  { value: 'Umoja Fund', label: 'Umoja Fund' },
  { value: 'Wekeza Maisha Fund', label: 'Wekeza Maisha Fund' },
  { value: 'Watoto Fund', label: 'Watoto Fund' },
  { value: 'Jikimu Fund', label: 'Jikimu Fund' },
  { value: 'Liquid Fund', label: 'Liquid Fund' },
  { value: 'Bond Fund', label: 'Bond Fund' },
];

export const ITRUST_FUNDS: FundOption[] = [
  // TODO: Add Itrust funds when available
  { value: 'Itrust Equity Fund', label: 'Itrust Equity Fund' },
  { value: 'Itrust Balanced Fund', label: 'Itrust Balanced Fund' },
  { value: 'Itrust Fixed Income Fund', label: 'Itrust Fixed Income Fund' },
];

export const QUIVER_FUNDS: FundOption[] = [
  // TODO: Add Quiver funds when available
  { value: 'Quiver Growth Fund', label: 'Quiver Growth Fund' },
  { value: 'Quiver Conservative Fund', label: 'Quiver Conservative Fund' },
];

export const getAvailableFunds = (provider: FundProvider): FundOption[] => {
  switch (provider) {
    case 'UTT':
      return UTT_FUNDS;
    case 'Itrust':
      return ITRUST_FUNDS;
    case 'Quiver':
      return QUIVER_FUNDS;
    default:
      return [];
  }
};

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

export interface ItrustFunds {
  iGrowth: MutualFundData | null;
  iCash: MutualFundData | null;
  iSave: MutualFundData | null;
  iIncome: MutualFundData | null;
  imaan: MutualFundData | null;
  iDollar: MutualFundData | null;
}

/**
 * Fetch mutual fund prices from UTT AMIS website
 */
export const fetchMutualFundPrices = async (): Promise<UTTFunds> => {
  try {
    const response = await fetch('https://uttamis.co.tz/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
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
 * Fetch iTrust fund prices from iTrust API
 * API endpoint: https://api.itrust.co.tz/api/fund/{fundName}
 * Returns an array of fund data, with the first item being the latest date
 */
export const fetchItrustFundPrices = async (): Promise<ItrustFunds> => {
  try {
    // Fetch iGrowth Fund data from the API
    const iGrowthResponse = await fetch('https://api.itrust.co.tz/api/fund/iGrowth');
    if (!iGrowthResponse.ok) {
      throw new Error(`HTTP error! status: ${iGrowthResponse.status}`);
    }
    const iGrowthData = await iGrowthResponse.json();
    
    console.log('Fetched iGrowth Fund data from API:', iGrowthData);
    
    // The API returns an array, with the first item being the latest date
    if (Array.isArray(iGrowthData) && iGrowthData.length > 0) {
      const latestData = iGrowthData[0]; // First item is the latest
      console.log('Latest iGrowth Fund data:', latestData);
      
      return {
        iGrowth: {
          fundName: 'iGrowth Fund',
          navPerUnit: latestData.navPerUnit || 0,
          salePricePerUnit: latestData.salePricePerUnit || 0,
          repurchasePricePerUnit: latestData.repurchasePricePerUnit || 0,
          dateValued: latestData.date || new Date().toLocaleDateString(),
        },
        iCash: null,
        iSave: null,
        iIncome: null,
        imaan: null,
        iDollar: null,
      };
    }
    
    return {
      iGrowth: null,
      iCash: null,
      iSave: null,
      iIncome: null,
      imaan: null,
      iDollar: null,
    };
  } catch (error) {
    console.error('Error fetching iTrust fund prices:', error);
    return {
      iGrowth: null,
      iCash: null,
      iSave: null,
      iIncome: null,
      imaan: null,
      iDollar: null,
    };
  }
};

/**
 * Get current price for a specific UTT fund by name
 */
export const getUTTFundPrice = async (fundName: string): Promise<number | null> => {
  try {
    // Normalize fund name for lookup
    const normalizedName = fundName.toLowerCase();
    
    console.log('Looking for fund:', fundName, 'normalized:', normalizedName);
    
    // Check if it's an iTrust fund FIRST (before UTT checks)
    if (normalizedName.includes('itrust') || normalizedName.includes('igrowth')) {
      console.log('Detected iTrust fund, fetching iTrust prices...');
      const itrustFunds = await fetchItrustFundPrices();
      if (itrustFunds.iGrowth) {
        const price = itrustFunds.iGrowth.repurchasePricePerUnit;
        if (price && !isNaN(price) && price > 0) {
          console.log('Found iTrust iGrowth Fund price:', price);
          return price;
        } else {
          console.error('Invalid iTrust iGrowth Fund price:', price);
        }
      } else {
        console.log('iTrust iGrowth Fund not found in fetched funds');
      }
    }
    
    // If not iTrust, check UTT funds
    const funds = await fetchMutualFundPrices();
    
    console.log('Available UTT funds:', {
      umoja: funds.umoja ? funds.umoja.repurchasePricePerUnit : null,
      wekezaMaisha: funds.wekezaMaisha ? funds.wekezaMaisha.repurchasePricePerUnit : null,
      watoto: funds.watoto ? funds.watoto.repurchasePricePerUnit : null,
    });
    
    if ((normalizedName.includes('umoja') || normalizedName.includes('utt umoja')) && funds.umoja) {
      const price = funds.umoja.repurchasePricePerUnit;
      console.log('Found Umoja Fund price:', price);
      if (isNaN(price) || price === 0) {
        console.error('Invalid price for Umoja Fund:', price);
        return null;
      }
      return price;
    }
    
    if ((normalizedName.includes('wekeza') || normalizedName.includes('maisha')) && funds.wekezaMaisha) {
      const price = funds.wekezaMaisha.repurchasePricePerUnit;
      console.log('Found Wekeza Maisha Fund price:', price);
      if (isNaN(price) || price === 0) {
        console.error('Invalid price for Wekeza Maisha Fund:', price);
        return null;
      }
      return price;
    }
    
    if (normalizedName.includes('watoto') && funds.watoto) {
      const price = funds.watoto.repurchasePricePerUnit;
      console.log('Found Watoto Fund price:', price);
      if (isNaN(price) || price === 0) {
        console.error('Invalid price for Watoto Fund:', price);
        return null;
      }
      return price;
    }
    
    if (normalizedName.includes('jikimu') && funds.jikimu) {
      const price = funds.jikimu.repurchasePricePerUnit;
      console.log('Found Jikimu Fund price:', price);
      if (isNaN(price) || price === 0) {
        console.error('Invalid price for Jikimu Fund:', price);
        return null;
      }
      return price;
    }
    
    if (normalizedName.includes('liquid') && funds.liquid) {
      const price = funds.liquid.repurchasePricePerUnit;
      console.log('Found Liquid Fund price:', price);
      if (isNaN(price) || price === 0) {
        console.error('Invalid price for Liquid Fund:', price);
        return null;
      }
      return price;
    }
    
    if (normalizedName.includes('bond') && funds.bond) {
      const price = funds.bond.repurchasePricePerUnit;
      console.log('Found Bond Fund price:', price);
      if (isNaN(price) || price === 0) {
        console.error('Invalid price for Bond Fund:', price);
        return null;
      }
      return price;
    }
    
    if (normalizedName.includes('quiver') || normalizedName.includes('15%')) {
      // Quiver 15% Fund - not available from UTT, would need separate source
      console.log('Quiver 15% Fund is not available from UTT website');
      return null;
    }
    
    console.log('Fund not found in available funds');
    return null;
  } catch (error) {
    console.error('Error getting UTT fund price:', error);
    return null;
  }
};

/**
 * Parse HTML to extract fund data from the table
 * Based on the UTT AMIS website structure with tables like:
 * <div class="tdataTable table0">
 *   <table>
 *     <thead>
 *       <tr>
 *         <th colspan="5"><span>Date:</span> Friday, 7th of November 2025</th>
 *       </tr>
 *     </thead>
 *     <tbody>
 *       <tr>
 *         <td>398, 158, 017, 444.5430</td>
 *         <td>333, 229, 540.4847</td>
 *         <td>1,194.8461</td>
 *         <td>1,194.8461</td>
 *         <td>1,182.8976</td> <!-- Repurchase Price Per Unit (5th column) -->
 *       </tr>
 *     </tbody>
 *   </table>
 * </div>
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
    // Helper function to parse a fund table
    const parseFundTable = (fundName: string, tableHtml: string): MutualFundData | null => {
      // Extract the data row from tbody - it has 5 columns
      // Column order: Net Asset Value, Outstanding Units, NAV Per Unit, Sale Price, Repurchase Price
      const tbodyMatch = tableHtml.match(/<tbody>([\s\S]*?)<\/tbody>/);
      if (!tbodyMatch) return null;
      
      const tbodyContent = tbodyMatch[1];
      // The first <tr> in tbody is the header row, the second <tr> is the data row
      // Match all rows and skip the first one (header)
      const allRows = tbodyContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
      
      if (allRows && allRows.length >= 2) {
        // Skip the first row (header) and use the second row (data)
        const dataRow = allRows[1];
        // Match the data row - it has 5 columns with numbers
        const rowMatch = dataRow.match(/<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/s);
        
        if (rowMatch) {
        // Parse numbers by removing commas and spaces
        const parseNumber = (str: string) => {
          const cleaned = str.trim().replace(/,/g, '').replace(/\s+/g, '');
          const parsed = parseFloat(cleaned);
          if (isNaN(parsed)) {
            console.error(`Failed to parse number: "${str}" -> "${cleaned}"`);
            return 0;
          }
          return parsed;
        };
        
        const navPerUnit = parseNumber(rowMatch[3]);
        const salePrice = parseNumber(rowMatch[4]);
        const repurchasePrice = parseNumber(rowMatch[5]);
        
        // Extract date from the table header
        const dateMatch = tableHtml.match(/<th[^>]*>.*?Date:.*?([^<]+)<\/th>/s);
        const dateValued = dateMatch ? dateMatch[1].trim() : new Date().toLocaleDateString();
        
          console.log(`Parsed ${fundName}:`, { navPerUnit, salePrice, repurchasePrice });
          
          return {
            fundName,
            navPerUnit,
            salePricePerUnit: salePrice,
            repurchasePricePerUnit: repurchasePrice,
            dateValued,
          };
        }
      }
      
      console.log(`Could not find data row for ${fundName}`);
      return null;
    };
    
    // Find each fund's table section by looking for the fund name followed by a table with class "tdataTable"
    // Umoja Fund
    const umojaMatch = html.match(/Umoja\s+Fund[\s\S]*?<div[^>]*class="tdataTable[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (umojaMatch) {
      funds.umoja = parseFundTable('Umoja Fund', umojaMatch[1]);
    } else {
      console.log('Could not find Umoja Fund table in HTML');
    }
    
    // Wekeza Maisha Fund
    const wekezaMatch = html.match(/Wekeza\s+Maisha\s+Fund[\s\S]*?<div[^>]*class="tdataTable[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (wekezaMatch) {
      funds.wekezaMaisha = parseFundTable('Wekeza Maisha Fund', wekezaMatch[1]);
    }
    
    // Watoto Fund
    const watotoMatch = html.match(/Watoto\s+Fund[\s\S]*?<div[^>]*class="tdataTable[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (watotoMatch) {
      funds.watoto = parseFundTable('Watoto Fund', watotoMatch[1]);
    }
    
    // Jikimu Fund
    const jikimuMatch = html.match(/Jikimu\s+Fund[\s\S]*?<div[^>]*class="tdataTable[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (jikimuMatch) {
      funds.jikimu = parseFundTable('Jikimu Fund', jikimuMatch[1]);
    }
    
    // Liquid Fund
    const liquidMatch = html.match(/Liquid\s+Fund[\s\S]*?<div[^>]*class="tdataTable[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (liquidMatch) {
      funds.liquid = parseFundTable('Liquid Fund', liquidMatch[1]);
    }
    
    // Bond Fund
    const bondMatch = html.match(/Bond\s+Fund[\s\S]*?<div[^>]*class="tdataTable[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (bondMatch) {
      funds.bond = parseFundTable('Bond Fund', bondMatch[1]);
    }
    
  } catch (error) {
    console.error('Error parsing fund data:', error);
  }
  
  return funds;
};

/**
 * Parse HTML to extract iTrust fund data from the table
 * Based on the iTrust website structure with tables like:
 * <table class="chakra-table">
 *   <thead>
 *     <tr>
 *       <th>Date</th>
 *       <th>Net Asset Value</th>
 *       <th>Units</th>
 *       <th>NAV/Unit</th>
 *       <th>Sale Price</th>
 *       <th>Repurchase Price</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr>
 *       <td>11/7/2025</td>
 *       <td>89,939,655,256.11</td>
 *       <td>662,008,856.7540</td>
 *       <td>135.8587</td>
 *       <td>135.8587</td>
 *       <td>134.5001</td> <!-- Repurchase Price (6th column, latest row) -->
 *     </tr>
 *   </tbody>
 * </table>
 */
const parseItrustFundData = (html: string): ItrustFunds => {
  const funds: ItrustFunds = {
    iGrowth: null,
    iCash: null,
    iSave: null,
    iIncome: null,
    imaan: null,
    iDollar: null,
  };

  try {
    // Helper function to parse iGrowth Fund table
    const parseIGrowthTable = (tableHtml: string): MutualFundData | null => {
      // Find the tbody with data rows
      const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
      if (!tbodyMatch) return null;
      
      const tbodyContent = tbodyMatch[1];
      // Match all data rows
      const allRows = tbodyContent.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
      
      if (allRows && allRows.length > 0) {
        // The first row is the latest (most recent date)
        const latestRow = allRows[0];
        // Match the 6 columns: Date, Net Asset Value, Units, NAV/Unit, Sale Price, Repurchase Price
        const rowMatch = latestRow.match(/<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>[\s\S]*?<td[^>]*>([^<]+)<\/td>/s);
        
        if (rowMatch) {
          // Parse numbers by removing commas and spaces
          const parseNumber = (str: string) => {
            const cleaned = str.trim().replace(/,/g, '').replace(/\s+/g, '');
            const parsed = parseFloat(cleaned);
            if (isNaN(parsed)) {
              console.error(`Failed to parse number: "${str}" -> "${cleaned}"`);
              return 0;
            }
            return parsed;
          };
          
          const date = rowMatch[1].trim();
          const navPerUnit = parseNumber(rowMatch[4]); // NAV/Unit is 4th column
          const salePrice = parseNumber(rowMatch[5]); // Sale Price is 5th column
          const repurchasePrice = parseNumber(rowMatch[6]); // Repurchase Price is 6th column
          
          console.log(`Parsed iGrowth Fund:`, { date, navPerUnit, salePrice, repurchasePrice });
          
          return {
            fundName: 'iGrowth Fund',
            navPerUnit,
            salePricePerUnit: salePrice,
            repurchasePricePerUnit: repurchasePrice,
            dateValued: date,
          };
        }
      }
      
      return null;
    };
    
    // Find iGrowth Fund table - look for table with "Repurchase Price" column header
    // The table might be in the HTML or loaded dynamically, but we'll try to find it
    // Look for all tables with class "chakra-table" and check for "Repurchase Price" header
    console.log('Searching for iGrowth Fund table in HTML...');
    const allTables = html.match(/<table[^>]*class="chakra-table[^"]*"[^>]*>([\s\S]*?)<\/table>/g);
    
    console.log(`Found ${allTables ? allTables.length : 0} tables with class "chakra-table"`);
    
    if (allTables) {
      for (let i = 0; i < allTables.length; i++) {
        const tableHtml = allTables[i];
        // Check if this table has "Repurchase Price" header (indicating it's a fund table)
        const hasRepurchasePrice = tableHtml.includes('Repurchase Price');
        const hasNAVUnit = tableHtml.includes('NAV/Unit');
        console.log(`Table ${i + 1}: hasRepurchasePrice=${hasRepurchasePrice}, hasNAVUnit=${hasNAVUnit}`);
        
        if (hasRepurchasePrice && hasNAVUnit) {
          // This looks like an iGrowth Fund table
          const tableContent = tableHtml.match(/<table[^>]*class="chakra-table[^"]*"[^>]*>([\s\S]*?)<\/table>/);
          if (tableContent) {
            console.log(`Parsing table ${i + 1} as iGrowth Fund table...`);
            funds.iGrowth = parseIGrowthTable(tableContent[1]);
            if (funds.iGrowth) {
              console.log('Successfully parsed iGrowth Fund table');
              break;
            } else {
              console.log(`Failed to parse table ${i + 1}`);
            }
          }
        }
      }
    }
    
    // Alternative: look for table near "iGrowth Fund" text
    if (!funds.iGrowth) {
      console.log('Trying alternative: looking for table near "iGrowth Fund" text...');
      const iGrowthSection = html.match(/iGrowth\s+Fund[\s\S]{0,5000}<table[^>]*class="chakra-table[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
      if (iGrowthSection) {
        console.log('Found table near "iGrowth Fund" text, parsing...');
        funds.iGrowth = parseIGrowthTable(iGrowthSection[1]);
        if (funds.iGrowth) {
          console.log('Successfully parsed iGrowth Fund table from alternative method');
        }
      } else {
        console.log('No table found near "iGrowth Fund" text');
      }
    }
    
    // Debug: Check if HTML contains key indicators
    console.log('HTML contains "Repurchase Price":', html.includes('Repurchase Price'));
    console.log('HTML contains "iGrowth":', html.includes('iGrowth'));
    console.log('HTML contains "chakra-table":', html.includes('chakra-table'));
    
  } catch (error) {
    console.error('Error parsing iTrust fund data:', error);
  }
  
  return funds;
};

/**
 * Get prices for a specific fund by name and provider
 */
export const getFundPricesByName = async (fundName: string, provider: FundProvider = 'UTT'): Promise<{ buyingPrice: number; sellingPrice: number } | null> => {
  try {
    if (provider === 'UTT') {
      return await getUTTFundPrices(fundName);
    } else if (provider === 'Itrust') {
      // TODO: Implement Itrust fund fetching when available
      console.log('Itrust provider not yet implemented');
      return null;
    } else if (provider === 'Quiver') {
      // TODO: Implement Quiver fund fetching when available
      console.log('Quiver provider not yet implemented');
      return null;
    }
  } catch (error) {
    console.error('Error getting fund prices:', error);
    return null;
  }
  
  return null;
};

/**
 * Get UTT fund prices by name
 */
const getUTTFundPrices = async (fundName: string): Promise<{ buyingPrice: number; sellingPrice: number } | null> => {
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

