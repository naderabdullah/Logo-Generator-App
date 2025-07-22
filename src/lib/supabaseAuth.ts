// src/lib/supabaseAuth.ts - New authentication service
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
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
  password: string;
  subscription_type?: string;
  created_at?: string;
  updated_at?: string;
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

  // Create new user
  async createUser(userData: {
    email: string;
    password: string;
    logosLimit?: number;
    subscription_type?: string;
  }): Promise<User> {
    const hashedPassword = await this.hashPassword(userData.password);
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        logosCreated: 0,
        logosLimit: userData.logosLimit || 10,
        subscription_type: userData.subscription_type || 'standard',
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

  // Determine logo limit based on registration type
  determineLogoLimit(linkType: string, subappId?: string): number {
    if (subappId === 'premium' || linkType === 'premium') {
      return 100;
    }
    if (linkType === 'generic') {
      return 25;
    }
    return 10; // specific or default
  }

  // Determine subscription type
  determineSubscriptionType(linkType: string, subappId?: string): string {
    if (subappId === 'premium' || linkType === 'premium') {
      return 'premium';
    }
    if (linkType === 'generic') {
      return 'standard';
    }
    return 'basic';
  }
}

// Export singleton instance
export const supabaseAuth = new SupabaseAuthService();