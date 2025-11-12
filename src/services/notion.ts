/**
 * Notion API Integration Service
 * 
 * This service provides functions to interact with Notion databases and pages
 * using the Notion API. Reference: https://developers.notion.com/reference/intro
 */

const NOTION_API_BASE_URL = 'https://api.notion.com/v1';

export interface NotionConfig {
  token: string;
  databaseId?: string;
}

export interface NotionPage {
  id: string;
  title: string;
  url: string;
  created_time: string;
  last_edited_time: string;
  properties: Record<string, any>;
}

export interface NotionDatabase {
  id: string;
  title: string;
  description?: string;
  properties: Record<string, any>;
}

/**
 * Make an authenticated request to the Notion API
 */
async function notionRequest(
  endpoint: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: any,
  token?: string
): Promise<any> {
  const storedToken = token || await getStoredToken();
  
  if (!storedToken) {
    throw new Error('Notion integration token not found. Please configure it in Settings.');
  }

  const url = `${NOTION_API_BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    'Authorization': `Bearer ${storedToken}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || 
        `Notion API error: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to connect to Notion API');
  }
}

/**
 * Get stored Notion token from AsyncStorage
 */
async function getStoredToken(): Promise<string | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('notion_integration_token');
  } catch (error) {
    console.error('Error getting Notion token:', error);
    return null;
  }
}

/**
 * Store Notion token in AsyncStorage
 */
export async function saveNotionToken(token: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('notion_integration_token', token);
  } catch (error) {
    console.error('Error saving Notion token:', error);
    throw error;
  }
}

/**
 * Remove Notion token from AsyncStorage
 */
export async function removeNotionToken(): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('notion_integration_token');
  } catch (error) {
    console.error('Error removing Notion token:', error);
    throw error;
  }
}

/**
 * Get stored Notion database ID from AsyncStorage
 */
async function getStoredDatabaseId(): Promise<string | null> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem('notion_database_id');
  } catch (error) {
    console.error('Error getting Notion database ID:', error);
    return null;
  }
}

/**
 * Store Notion database ID in AsyncStorage
 */
export async function saveNotionDatabaseId(databaseId: string): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem('notion_database_id', databaseId);
  } catch (error) {
    console.error('Error saving Notion database ID:', error);
    throw error;
  }
}

/**
 * Test the Notion API connection
 */
export async function testNotionConnection(token?: string): Promise<boolean> {
  try {
    await notionRequest('/users/me', 'GET', undefined, token);
    return true;
  } catch (error) {
    console.error('Notion connection test failed:', error);
    return false;
  }
}

/**
 * Get the bot user information
 */
export async function getBotUser(token?: string): Promise<any> {
  return await notionRequest('/users/me', 'GET', undefined, token);
}

/**
 * Search for pages and databases in Notion
 */
export async function searchNotion(
  query?: string,
  filter?: { value: 'page' | 'database', property: 'object' },
  sort?: { direction: 'ascending' | 'descending', timestamp: 'last_edited_time' },
  token?: string
): Promise<{ results: any[], has_more: boolean, next_cursor?: string }> {
  const body: any = {};
  
  if (query) {
    body.query = query;
  }
  
  if (filter) {
    body.filter = filter;
  }
  
  if (sort) {
    body.sort = sort;
  }

  return await notionRequest('/search', 'POST', body, token);
}

/**
 * Retrieve a database by ID
 */
export async function getDatabase(databaseId: string, token?: string): Promise<NotionDatabase> {
  return await notionRequest(`/databases/${databaseId}`, 'GET', undefined, token);
}

/**
 * Query a database
 */
export async function queryDatabase(
  databaseId: string,
  filter?: any,
  sorts?: any[],
  startCursor?: string,
  pageSize?: number,
  token?: string
): Promise<{ results: NotionPage[], has_more: boolean, next_cursor?: string }> {
  const body: any = {};
  
  if (filter) {
    body.filter = filter;
  }
  
  if (sorts && sorts.length > 0) {
    body.sorts = sorts;
  }
  
  if (startCursor) {
    body.start_cursor = startCursor;
  }
  
  if (pageSize) {
    body.page_size = pageSize;
  }

  return await notionRequest(`/databases/${databaseId}/query`, 'POST', body, token);
}

/**
 * Create a page in a database
 */
export async function createPage(
  databaseId: string,
  properties: Record<string, any>,
  token?: string
): Promise<NotionPage> {
  const body = {
    parent: {
      database_id: databaseId,
    },
    properties,
  };

  return await notionRequest('/pages', 'POST', body, token);
}

/**
 * Update a page
 */
export async function updatePage(
  pageId: string,
  properties: Record<string, any>,
  token?: string
): Promise<NotionPage> {
  const body = {
    properties,
  };

  return await notionRequest(`/pages/${pageId}`, 'PATCH', body, token);
}

/**
 * Retrieve a page by ID
 */
export async function getPage(pageId: string, token?: string): Promise<NotionPage> {
  return await notionRequest(`/pages/${pageId}`, 'GET', undefined, token);
}

/**
 * Retrieve block children (content) of a page
 */
export async function getPageBlocks(
  pageId: string,
  startCursor?: string,
  pageSize?: number,
  token?: string
): Promise<{ results: any[], has_more: boolean, next_cursor?: string }> {
  const params: string[] = [];
  if (startCursor) params.push(`start_cursor=${startCursor}`);
  if (pageSize) params.push(`page_size=${pageSize}`);
  
  const query = params.length > 0 ? `?${params.join('&')}` : '';
  return await notionRequest(`/blocks/${pageId}/children${query}`, 'GET', undefined, token);
}

/**
 * Get all blocks from a page (with pagination)
 */
export async function getAllPageBlocks(
  pageId: string,
  token?: string
): Promise<any[]> {
  const allBlocks: any[] = [];
  let hasMore = true;
  let nextCursor: string | undefined;

  while (hasMore) {
    const response = await getPageBlocks(pageId, nextCursor, 100, token);
    allBlocks.push(...response.results);
    hasMore = response.has_more;
    nextCursor = response.next_cursor;
  }

  return allBlocks;
}

/**
 * Search for a page by title
 */
export async function findPageByTitle(
  title: string,
  token?: string
): Promise<NotionPage | null> {
  try {
    const results = await searchNotion(
      title,
      { value: 'page', property: 'object' },
      { direction: 'descending', timestamp: 'last_edited_time' },
      token
    );

    // Find exact match or closest match
    const exactMatch = results.results.find((page: any) => {
      const pageTitle = extractPageTitle(page);
      return pageTitle.toLowerCase() === title.toLowerCase();
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Return first result if no exact match
    return results.results.length > 0 ? results.results[0] : null;
  } catch (error) {
    console.error('Error finding page by title:', error);
    return null;
  }
}

/**
 * Get all pages from a database (with pagination)
 */
export async function getAllPagesFromDatabase(
  databaseId: string,
  token?: string
): Promise<NotionPage[]> {
  const allPages: NotionPage[] = [];
  let hasMore = true;
  let nextCursor: string | undefined;

  while (hasMore) {
    const response = await queryDatabase(
      databaseId,
      undefined,
      undefined,
      nextCursor,
      100,
      token
    );

    allPages.push(...response.results);
    hasMore = response.has_more;
    nextCursor = response.next_cursor;
  }

  return allPages;
}

/**
 * Find a database by title
 */
export async function findDatabaseByTitle(
  title: string,
  token?: string
): Promise<NotionDatabase | null> {
  try {
    const results = await searchNotion(
      title,
      { value: 'database', property: 'object' },
      { direction: 'descending', timestamp: 'last_edited_time' },
      token
    );

    // Find exact match or closest match
    const exactMatch = results.results.find((db: any) => {
      const dbTitle = extractDatabaseTitle(db);
      return dbTitle.toLowerCase() === title.toLowerCase();
    });

    if (exactMatch) {
      return exactMatch;
    }

    // Return first result if no exact match
    return results.results.length > 0 ? results.results[0] : null;
  } catch (error) {
    console.error('Error finding database by title:', error);
    return null;
  }
}

/**
 * Extract title from a Notion database
 */
function extractDatabaseTitle(database: any): string {
  // Notion databases can have title in different places
  // Check if it's in the title property (array of rich text)
  if (database.title && Array.isArray(database.title) && database.title.length > 0) {
    return database.title.map((t: any) => t.plain_text || t.text?.content || '').join('');
  }
  
  // Check if it's in properties (for database objects from search)
  if (database.properties) {
    for (const [key, value] of Object.entries(database.properties)) {
      if (value && (value as any).type === 'title') {
        return key; // Property name is often the title
      }
    }
  }
  
  return 'Untitled Database';
}

/**
 * Get a random entry from a database by database name
 */
export async function getRandomEntryFromDatabase(
  databaseName: string,
  token?: string
): Promise<NotionPage | null> {
  try {
    // First, find the database by name
    const database = await findDatabaseByTitle(databaseName, token);
    
    if (!database) {
      console.error(`Database "${databaseName}" not found`);
      return null;
    }

    // Get all pages from the database
    const pages = await getAllPagesFromDatabase(database.id, token);
    
    if (pages.length === 0) {
      console.log(`No pages found in database "${databaseName}"`);
      return null;
    }

    // Return a random page
    const randomIndex = Math.floor(Math.random() * pages.length);
    return pages[randomIndex];
  } catch (error) {
    console.error(`Error getting random entry from database "${databaseName}":`, error);
    return null;
  }
}

/**
 * Extract title from a Notion page property
 */
export function extractPageTitle(page: NotionPage): string {
  // Try to find a title property
  for (const [key, value] of Object.entries(page.properties)) {
    if (value.type === 'title' && value.title && value.title.length > 0) {
      return value.title.map((t: any) => t.plain_text).join('');
    }
  }
  return 'Untitled';
}

/**
 * Extract rich text from a Notion property
 */
export function extractRichText(property: any): string {
  if (!property || property.type !== 'rich_text') {
    return '';
  }
  
  if (property.rich_text && property.rich_text.length > 0) {
    return property.rich_text.map((t: any) => t.plain_text).join('');
  }
  
  return '';
}

/**
 * Extract date from a Notion property
 */
export function extractDate(property: any): Date | null {
  if (!property || property.type !== 'date') {
    return null;
  }
  
  if (property.date && property.date.start) {
    return new Date(property.date.start);
  }
  
  return null;
}

/**
 * Extract select/multi_select from a Notion property
 */
export function extractSelect(property: any): string | string[] {
  if (!property) {
    return '';
  }
  
  if (property.type === 'select') {
    return property.select?.name || '';
  }
  
  if (property.type === 'multi_select') {
    return property.multi_select?.map((s: any) => s.name) || [];
  }
  
  return '';
}

/**
 * Create a rich text property value for Notion
 */
export function createRichTextProperty(text: string): any {
  return {
    rich_text: [
      {
        text: {
          content: text,
        },
      },
    ],
  };
}

/**
 * Create a title property value for Notion
 */
export function createTitleProperty(text: string): any {
  return {
    title: [
      {
        text: {
          content: text,
        },
      },
    ],
  };
}

/**
 * Create a date property value for Notion
 */
export function createDateProperty(date: Date): any {
  return {
    date: {
      start: date.toISOString().split('T')[0],
    },
  };
}

/**
 * Create a select property value for Notion
 */
export function createSelectProperty(value: string): any {
  return {
    select: {
      name: value,
    },
  };
}

/**
 * Extract text content from a block
 */
export function extractBlockText(block: any): string {
  if (!block) return '';

  switch (block.type) {
    case 'paragraph':
      if (block.paragraph?.rich_text) {
        return block.paragraph.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'heading_1':
      if (block.heading_1?.rich_text) {
        return block.heading_1.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'heading_2':
      if (block.heading_2?.rich_text) {
        return block.heading_2.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'heading_3':
      if (block.heading_3?.rich_text) {
        return block.heading_3.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'bulleted_list_item':
      if (block.bulleted_list_item?.rich_text) {
        return block.bulleted_list_item.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'numbered_list_item':
      if (block.numbered_list_item?.rich_text) {
        return block.numbered_list_item.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'to_do':
      if (block.to_do?.rich_text) {
        return block.to_do.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'toggle':
      if (block.toggle?.rich_text) {
        return block.toggle.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'quote':
      if (block.quote?.rich_text) {
        return block.quote.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'callout':
      if (block.callout?.rich_text) {
        return block.callout.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
    case 'code':
      if (block.code?.rich_text) {
        return block.code.rich_text.map((t: any) => t.plain_text).join('');
      }
      break;
  }

  return '';
}

/**
 * Format blocks as readable text
 */
export function formatBlocksAsText(blocks: any[]): string {
  return blocks
    .map((block) => {
      const text = extractBlockText(block);
      if (!text) return '';

      // Add formatting based on block type
      switch (block.type) {
        case 'heading_1':
          return `# ${text}\n`;
        case 'heading_2':
          return `## ${text}\n`;
        case 'heading_3':
          return `### ${text}\n`;
        case 'bulleted_list_item':
          return `• ${text}\n`;
        case 'numbered_list_item':
          return `1. ${text}\n`;
        case 'quote':
          return `> ${text}\n`;
        case 'code':
          return `\`\`\`\n${text}\n\`\`\`\n`;
        default:
          return `${text}\n`;
      }
    })
    .join('\n');
}

