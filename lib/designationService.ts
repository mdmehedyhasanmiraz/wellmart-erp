import { supabase } from './supabase';
import { 
  Designation, 
  DesignationWithDetails, 
  CreateDesignationData, 
  UpdateDesignationData 
} from '@/types/user';

export class DesignationService {
  // Get all designations
  static async getAll(): Promise<Designation[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching designations:', error);
        return [];
      }

      return data as Designation[];
    } catch (error) {
      console.error('Error in getAll:', error);
      return [];
    }
  }

  // Get designation by ID
  static async getById(id: string): Promise<Designation | null> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching designation:', error);
        return null;
      }

      return data as Designation;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  }

  // Get designation with details (including parent, reporting_to, children)
  static async getByIdWithDetails(id: string): Promise<DesignationWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select(`
          *,
          parent:parent_id(id, name, code, level),
          reporting_to:reporting_to_id(id, name, code, level),
          children:designations!parent_id(id, name, code, level, sort_order)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching designation with details:', error);
        return null;
      }

      return data as DesignationWithDetails;
    } catch (error) {
      console.error('Error in getByIdWithDetails:', error);
      return null;
    }
  }

  // Get designations by department
  static async getByDepartment(department: string): Promise<Designation[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('department', department)
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching designations by department:', error);
        return [];
      }

      return data as Designation[];
    } catch (error) {
      console.error('Error in getByDepartment:', error);
      return [];
    }
  }

  // Get designations by level
  static async getByLevel(level: number): Promise<Designation[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('level', level)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching designations by level:', error);
        return [];
      }

      return data as Designation[];
    } catch (error) {
      console.error('Error in getByLevel:', error);
      return [];
    }
  }

  // Get designation hierarchy (tree structure)
  static async getHierarchy(): Promise<DesignationWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select(`
          *,
          parent:parent_id(id, name, code, level),
          reporting_to:reporting_to_id(id, name, code, level),
          children:designations!parent_id(id, name, code, level, sort_order)
        `)
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching designation hierarchy:', error);
        return [];
      }

      return data as DesignationWithDetails[];
    } catch (error) {
      console.error('Error in getHierarchy:', error);
      return [];
    }
  }

  // Get root level designations (no parent)
  static async getRootLevel(): Promise<Designation[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .is('parent_id', null)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching root level designations:', error);
        return [];
      }

      return data as Designation[];
    } catch (error) {
      console.error('Error in getRootLevel:', error);
      return [];
    }
  }

  // Get children of a designation
  static async getChildren(parentId: string): Promise<Designation[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('parent_id', parentId)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching children designations:', error);
        return [];
      }

      return data as Designation[];
    } catch (error) {
      console.error('Error in getChildren:', error);
      return [];
    }
  }

  // Create designation
  static async create(designationData: CreateDesignationData): Promise<Designation | null> {
    try {
      // Clean the data - convert empty strings to null for UUID fields
      const cleanedData = {
        ...designationData,
        parent_id: designationData.parent_id === '' ? null : designationData.parent_id,
        reporting_to_id: designationData.reporting_to_id === '' ? null : designationData.reporting_to_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof typeof cleanedData] === undefined) {
          delete cleanedData[key as keyof typeof cleanedData];
        }
      });

      const { data, error } = await supabase
        .from('designations')
        .insert(cleanedData)
        .select()
        .single();

      if (error) {
        console.error('Error creating designation:', error);
        console.error('Insert data:', cleanedData);
        return null;
      }

      return data as Designation;
    } catch (error) {
      console.error('Error in create:', error);
      return null;
    }
  }

  // Utility function to check for circular references
  static async checkCircularReference(id: string, parentId: string | null): Promise<boolean> {
    if (!parentId) return false;
    
    try {
      // If trying to set parent to self, it's circular
      if (parentId === id) return true;
      
      // Check if the parent would create a circular reference
      let currentParentId = parentId;
      const visited = new Set<string>();
      
      while (currentParentId) {
        if (visited.has(currentParentId)) {
          return true; // Circular reference detected
        }
        
        if (currentParentId === id) {
          return true; // Would create circular reference
        }
        
        visited.add(currentParentId);
        
        // Get the parent of the current parent
        const { data } = await supabase
          .from('designations')
          .select('parent_id')
          .eq('id', currentParentId)
          .single();
          
        currentParentId = data?.parent_id || null;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking circular reference:', error);
      return true; // Assume circular to be safe
    }
  }

  // Update designation
  static async update(id: string, designationData: UpdateDesignationData): Promise<Designation | null> {
    try {
      // Check for circular references if parent_id is being updated
      if (designationData.parent_id !== undefined) {
        const isCircular = await this.checkCircularReference(id, designationData.parent_id);
        if (isCircular) {
          console.error('Circular reference detected in designation hierarchy');
          return null;
        }
      }

      // Clean the data - convert empty strings to null for UUID fields
      const cleanedData = {
        ...designationData,
        parent_id: designationData.parent_id === '' ? null : designationData.parent_id,
        reporting_to_id: designationData.reporting_to_id === '' ? null : designationData.reporting_to_id,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values to avoid issues
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof typeof cleanedData] === undefined) {
          delete cleanedData[key as keyof typeof cleanedData];
        }
      });

      const { data, error } = await supabase
        .from('designations')
        .update(cleanedData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating designation:', error);
        console.error('Update data:', cleanedData);
        return null;
      }

      return data as Designation;
    } catch (error) {
      console.error('Error in update:', error);
      return null;
    }
  }

  // Deactivate designation (soft delete)
  static async deactivate(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('designations')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        console.error('Error deactivating designation:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deactivate:', error);
      return false;
    }
  }

  // Search designations
  static async search(query: string): Promise<Designation[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%, code.ilike.%${query}%, description.ilike.%${query}%`)
        .order('level', { ascending: true })
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error searching designations:', error);
        return [];
      }

      return data as Designation[];
    } catch (error) {
      console.error('Error in search:', error);
      return [];
    }
  }

  // Get departments
  static async getDepartments(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('designations')
        .select('department')
        .eq('is_active', true)
        .not('department', 'is', null)
        .order('department', { ascending: true });

      if (error) {
        console.error('Error fetching departments:', error);
        return [];
      }

      // Extract unique departments
      const departments = [...new Set(data.map(item => item.department).filter(Boolean))];
      return departments;
    } catch (error) {
      console.error('Error in getDepartments:', error);
      return [];
    }
  }

  // Utility function to generate designation code
  static generateCode(name: string): string {
    return name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 20);
  }

  // Utility function to format salary range
  static formatSalaryRange(minSalary?: number, maxSalary?: number): string {
    if (!minSalary && !maxSalary) return 'Not specified';
    if (!minSalary) return `Up to ৳${maxSalary?.toLocaleString('en-BD')}`;
    if (!maxSalary) return `From ৳${minSalary.toLocaleString('en-BD')}`;
    return `৳${minSalary.toLocaleString('en-BD')} - ৳${maxSalary.toLocaleString('en-BD')}`;
  }
}
