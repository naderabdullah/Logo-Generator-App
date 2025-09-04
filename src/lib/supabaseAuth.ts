// src/lib/supabaseAuth.ts
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export interface User {
  id: number;
  email: string;
  logosCreated: number;
  logosLimit: number;
  password?: string;  // Optional since it's not always returned
  created_at?: string;
  updated_at?: string;
}

// Catalog Logo interface
export interface CatalogLogo {
  id: number;
  catalog_code: string;
  logo_key_id: string;
  image_data_uri: string;
  parameters: any; // LogoParameters from indexedDBUtils
  created_at: string;
  created_by: string;
  original_company_name: string;
}

export class SupabaseAuthService {
  
  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();
    
    return !error && !!data;
  }

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .single();
    
    if (error || !data) return null;
    return data as User;
  }

  // Get user by ID
  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return null;
    return data as User;
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare passwords
  async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Create new user (for logo credits tracking only)
  async createUser(userData: {
    email: string;
    logosCreated?: number;
    logosLimit?: number;
  }): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: userData.email.toLowerCase(),
        logosCreated: userData.logosCreated || 0,
        logosLimit: userData.logosLimit || 5, // Everyone gets 5 free logos
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data as User;
  }

  // Update user
  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return data as User;
  }

  // Delete user
  async deleteUser(id: number): Promise<void> {
    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  // Update logo count
  async updateLogoCount(id: number, increment: number = 1): Promise<User> {
    // First get current count
    const user = await this.getUserById(id);
    if (!user) {
      throw new Error('User not found');
    }

    const newCount = user.logosCreated + increment;
    
    return this.updateUser(id, { 
      logosCreated: newCount 
    });
  }
// Updated section from src/lib/supabaseAuth.ts

  // Generate next catalog code
  async getNextCatalogCode(): Promise<string> {
    const { data, error } = await supabaseAdmin
        .from('catalog_logos')
        .select('catalog_code')
        .order('id', { ascending: false })
        .limit(1);

    if (error) {
      console.error('Error getting last catalog code:', error);
      return 'CAT-0001'; // Start with first code if no entries
    }

    if (!data || data.length === 0) {
      return 'CAT-0001';
    }

    // Extract number from last code (e.g., "CAT-0042" -> 42)
    const lastCode = data[0].catalog_code;
    const match = lastCode.match(/CAT-(\d+)/);
    const lastNumber = match ? parseInt(match[1]) : 0;
    const nextNumber = lastNumber + 1;

    // Format with leading zeros (e.g., 43 -> "CAT-0043")
    return `CAT-${nextNumber.toString().padStart(4, '0')}`;
  }

// Check if logo already exists in catalog
  async checkLogoInCatalog(logoKeyId: string): Promise<CatalogLogo | null> {
    const { data, error } = await supabaseAdmin
        .from('catalog_logos')
        .select('*')
        .eq('logo_key_id', logoKeyId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`Failed to check catalog: ${error.message}`);
    }

    return data as CatalogLogo | null;
  }

// Add logo to catalog
  async addToCatalog(logoData: {
    logoKeyId: string;
    imageDataUri: string;
    parameters: any;
    originalCompanyName: string;
    createdBy: string;
  }): Promise<CatalogLogo> {
    try {
      // Check if logo already exists
      const existingLogo = await this.checkLogoInCatalog(logoData.logoKeyId);
      if (existingLogo) {
        throw new Error('Logo already exists in catalog');
      }

      // Generate next catalog code
      const catalogCode = await this.getNextCatalogCode();

      const { data, error } = await supabaseAdmin
          .from('catalog_logos')
          .insert({
            catalog_code: catalogCode,
            logo_key_id: logoData.logoKeyId,
            image_data_uri: logoData.imageDataUri,
            parameters: logoData.parameters,
            created_by: logoData.createdBy,
            original_company_name: logoData.originalCompanyName,
            created_at: new Date().toISOString()
          })
          .select()
          .single();

      if (error) {
        throw new Error(`Failed to add to catalog: ${error.message}`);
      }

      return data as CatalogLogo;
    } catch (error) {
      console.error('Error adding to catalog:', error);
      throw error;
    }
  }

  // Delete catalog logo (admin only)
  async deleteCatalogLogo(logoId: number): Promise<{success: boolean; error?: string}> {
    try {
      console.log(`Attempting to delete catalog logo with ID: ${logoId}`);
      
      // First, check if the logo exists
      const { data: existingLogo, error: checkError } = await supabaseAdmin
        .from('catalog_logos')
        .select('id, catalog_code, original_company_name, created_by')
        .eq('id', logoId)
        .single();

      if (checkError || !existingLogo) {
        console.error('Logo not found for deletion:', checkError);
        return {
          success: false,
          error: checkError?.code === 'PGRST116' ? 'Logo not found' : 'Failed to find logo'
        };
      }

      console.log(`Found logo to delete: ${existingLogo.catalog_code} - ${existingLogo.original_company_name}`);

      // Delete the logo from catalog_logos table
      const { error: deleteError } = await supabaseAdmin
        .from('catalog_logos')
        .delete()
        .eq('id', logoId);

      if (deleteError) {
        console.error('Error deleting catalog logo:', deleteError);
        return {
          success: false,
          error: `Failed to delete logo: ${deleteError.message}`
        };
      }

      console.log(`Successfully deleted catalog logo ${logoId} (${existingLogo.catalog_code})`);
      
      return {
        success: true
      };
      
    } catch (error: any) {
      console.error('Unexpected error deleting catalog logo:', error);
      return {
        success: false,
        error: error.message || 'Unexpected error occurred while deleting logo'
      };
    }
  }
  
  async getCatalogLogosMetadata(offset: number = 0, limit: number = 30, searchTerm: string = '', industryFilter: string = '') {
      try {
          // Build base query
          let baseQuery = supabaseAdmin
              .from('catalog_logos')
              .select(`
                  id,
                  catalog_code,
                  logo_key_id,
                  parameters,
                  created_at,
                  created_by,
                  original_company_name
              `)
              .order('created_at', { ascending: false });

          // Build count query with same filters
          let countQuery = supabaseAdmin
              .from('catalog_logos')
              .select('*', { count: 'exact', head: true });

          // Apply search filter to BOTH queries if provided
          if (searchTerm.trim()) {
              const searchFilter = `original_company_name.ilike.%${searchTerm}%,catalog_code.ilike.%${searchTerm}%`;
              baseQuery = baseQuery.or(searchFilter);
              countQuery = countQuery.or(searchFilter);
          }

          // Apply industry filter to BOTH queries if provided
          if (industryFilter.trim() && industryFilter !== 'all') {
              const industryFilterCondition = `parameters->>'industry'.eq.${industryFilter}`;
              baseQuery = baseQuery.filter('parameters->>industry', 'eq', industryFilter);
              countQuery = countQuery.filter('parameters->>industry', 'eq', industryFilter);
          }

          // Get data with pagination
          const { data, error } = await baseQuery
              .range(offset, offset + limit - 1);

          if (error) {
              throw new Error(`Failed to get catalog logos metadata: ${error.message}`);
          }

          // Get total count with same filters
          const { count: totalCount, error: countError } = await countQuery;

          if (countError) {
              throw new Error(`Failed to get total count: ${countError.message}`);
          }

          return {
              logos: data || [],
              total: totalCount || 0
          };
      } catch (error: any) {
          console.error('Error fetching catalog logos metadata:', error);
          throw error;
      }
  }

  // NEW: Get total count for stats (fast query)
  async getCatalogLogosStats(): Promise<{
    totalLogos: number;
    totalContributors: number;
    latestAddition: string | null;
  }> {
    try {
      // Get stats from the dedicated catalog_stats table
      const { data: statsData, error: statsError } = await supabaseAdmin
          .from('catalog_stats')
          .select('total_logos, total_contributors, latest_addition')
          .single();

      if (statsError) {
        console.error('Error getting catalog stats from catalog_stats table:', statsError);
        
        // Fallback to manual calculation if catalog_stats table doesn't exist or is empty
        console.log('Falling back to manual calculation...');
        
        // Get total count
        const { count: totalLogos, error: countError } = await supabaseAdmin
            .from('catalog_logos')
            .select('*', { count: 'exact', head: true });

        if (countError) {
          throw new Error(`Failed to get catalog count: ${countError.message}`);
        }

        // Get unique contributors
        const { data: contributors, error: contributorsError } = await supabaseAdmin
            .from('catalog_logos')
            .select('created_by')
            .neq('created_by', null);

        if (contributorsError) {
          throw new Error(`Failed to get contributors: ${contributorsError.message}`);
        }

        const uniqueContributors = new Set(contributors?.map(c => c.created_by)).size;

        // Get latest addition
        const { data: latest, error: latestError } = await supabaseAdmin
            .from('catalog_logos')
            .select('created_at')
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (latestError && latestError.code !== 'PGRST116') {
          throw new Error(`Failed to get latest addition: ${latestError.message}`);
        }

        return {
          totalLogos: totalLogos || 0,
          totalContributors: uniqueContributors,
          latestAddition: latest?.created_at || null
        };
      }

      // Return data from catalog_stats table
      return {
        totalLogos: statsData.total_logos || 0,
        totalContributors: statsData.total_contributors || 0,
        latestAddition: statsData.latest_addition || null
      };

    } catch (error) {
      console.error('Error getting catalog logos stats:', error);
      throw error;
    }
  }

  // NEW: Get single logo image by ID (fast, only one image)
  async getCatalogLogoImage(logoId: string) {
      try {
          const { data, error } = await supabaseAdmin
              .from('catalog_logos')
              .select('id, image_data_uri')
              .eq('id', logoId)
              .single();

          if (error) {
              throw new Error(`Failed to get logo image: ${error.message}`);
          }

          return data;
      } catch (error: any) {
          console.error('Error fetching logo image:', error);
          throw error;
      }
  }

// Get all catalog logos
  async getCatalogLogos(limit?: number, offset?: number): Promise<CatalogLogo[]> {
    try {
      let query = supabaseAdmin
          .from('catalog_logos')
          .select('*')
          .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      if (offset) {
        query = query.range(offset, offset + (limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get catalog logos: ${error.message}`);
      }

      return data as CatalogLogo[];
    } catch (error) {
      console.error('Error getting catalog logos:', error);
      throw error;
    }
  }

// Get catalog logo by code
  async getCatalogLogoByCode(catalogCode: string): Promise<CatalogLogo | null> {
    try {
      const { data, error } = await supabaseAdmin
          .from('catalog_logos')
          .select('*')
          .eq('catalog_code', catalogCode.toUpperCase())
          .single();

      if (error && error.code !== 'PGRST116') {
        throw new Error(`Failed to get catalog logo: ${error.message}`);
      }

      return data as CatalogLogo | null;
    } catch (error) {
      console.error('Error getting catalog logo by code:', error);
      throw error;
    }
  }

// Search catalog logos
  async searchCatalogLogos(searchTerm: string): Promise<CatalogLogo[]> {
    try {
      const { data, error } = await supabaseAdmin
          .from('catalog_logos')
          .select('*')
          .or(`catalog_code.ilike.%${searchTerm}%,original_company_name.ilike.%${searchTerm}%,created_by.ilike.%${searchTerm}%`)
          .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to search catalog: ${error.message}`);
      }

      return data as CatalogLogo[];
    } catch (error) {
      console.error('Error searching catalog:', error);
      throw error;
    }
  }

// Get catalog statistics
  async getCatalogStats(): Promise<{
    totalLogos: number;
    totalContributors: number;
    latestAddition: string | null;
  }> {
    try {
      // Get total count
      const { count: totalLogos, error: countError } = await supabaseAdmin
          .from('catalog_logos')
          .select('*', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Failed to get catalog count: ${countError.message}`);
      }

      // Get unique contributors
      const { data: contributors, error: contributorsError } = await supabaseAdmin
          .from('catalog_logos')
          .select('created_by')
          .neq('created_by', null);

      if (contributorsError) {
        throw new Error(`Failed to get contributors: ${contributorsError.message}`);
      }

      const uniqueContributors = new Set(contributors?.map(c => c.created_by)).size;

      // Get latest addition
      const { data: latest, error: latestError } = await supabaseAdmin
          .from('catalog_logos')
          .select('created_at')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

      if (latestError && latestError.code !== 'PGRST116') {
        throw new Error(`Failed to get latest addition: ${latestError.message}`);
      }

      return {
        totalLogos: totalLogos || 0,
        totalContributors: uniqueContributors,
        latestAddition: latest?.created_at || null
      };
    } catch (error) {
      console.error('Error getting catalog stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();