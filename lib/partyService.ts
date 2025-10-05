import { supabase } from './supabase';
import { Party } from '@/types/user';

// Extended interface for party creation that includes tracking fields
interface CreatePartyData extends Partial<Party> {
  employee_id?: string;
  branch_id?: string;
  created_by?: string;
}

export class PartyService {
  static async list(): Promise<Party[]> {
    const { data, error } = await supabase.from('parties').select('*').eq('is_active', true).order('name', { ascending: true });
    if (error) {
      console.error('Error listing parties', error);
      return [];
    }
    return data as Party[];
  }

  static async create(payload: CreatePartyData): Promise<Party | null> {
    const { data, error } = await supabase
      .from('parties')
      .insert({
        name: payload.name,
        party_code: payload.party_code,
        contact_person: payload.contact_person,
        phone: payload.phone,
        email: payload.email,
        shop_no: payload.shop_no,
        address_line1: payload.address_line1,
        address_line2: payload.address_line2,
        city: payload.city,
        state: payload.state,
        postal_code: payload.postal_code,
        country: payload.country,
        latitude: payload.latitude,
        longitude: payload.longitude,
        employee_id: payload.employee_id ?? undefined,
        branch_id: payload.branch_id ?? undefined,
        created_by: payload.created_by ?? undefined,
        is_active: payload.is_active ?? true,
      })
      .select()
      .single();
    if (error) {
      console.error('Error creating party', error);
      return null;
    }
    return data as Party;
  }
}


