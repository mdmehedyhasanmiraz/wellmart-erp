import { supabase } from './supabase';
import { Party } from '@/types/user';

export class PartyService {
  static async list(): Promise<Party[]> {
    const { data, error } = await supabase.from('parties').select('*').eq('is_active', true).order('name', { ascending: true });
    if (error) {
      console.error('Error listing parties', error);
      return [];
    }
    return data as Party[];
  }

  static async create(payload: Partial<Party>): Promise<Party | null> {
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


