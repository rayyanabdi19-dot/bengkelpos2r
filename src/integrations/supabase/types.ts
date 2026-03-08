export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      booking: {
        Row: {
          created_at: string
          id: string
          jam: string
          keluhan: string
          nama: string
          no_wa: string
          plat_motor: string
          status: string
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          jam?: string
          keluhan?: string
          nama: string
          no_wa?: string
          plat_motor?: string
          status?: string
          tanggal: string
        }
        Update: {
          created_at?: string
          id?: string
          jam?: string
          keluhan?: string
          nama?: string
          no_wa?: string
          plat_motor?: string
          status?: string
          tanggal?: string
        }
        Relationships: []
      }
      pelanggan: {
        Row: {
          created_at: string
          id: string
          nama: string
          no_hp: string
          plat_motor: string
          tipe_motor: string
        }
        Insert: {
          created_at?: string
          id?: string
          nama: string
          no_hp?: string
          plat_motor: string
          tipe_motor?: string
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string
          no_hp?: string
          plat_motor?: string
          tipe_motor?: string
        }
        Relationships: []
      }
      servis: {
        Row: {
          created_at: string
          id: string
          keluhan: string
          nama_pelanggan: string
          no_hp: string
          pelanggan_id: string | null
          plat_motor: string
          status: string
          tipe_motor: string
          total_biaya: number
        }
        Insert: {
          created_at?: string
          id?: string
          keluhan?: string
          nama_pelanggan: string
          no_hp?: string
          pelanggan_id?: string | null
          plat_motor: string
          status?: string
          tipe_motor?: string
          total_biaya?: number
        }
        Update: {
          created_at?: string
          id?: string
          keluhan?: string
          nama_pelanggan?: string
          no_hp?: string
          pelanggan_id?: string | null
          plat_motor?: string
          status?: string
          tipe_motor?: string
          total_biaya?: number
        }
        Relationships: [
          {
            foreignKeyName: "servis_pelanggan_id_fkey"
            columns: ["pelanggan_id"]
            isOneToOne: false
            referencedRelation: "pelanggan"
            referencedColumns: ["id"]
          },
        ]
      }
      servis_layanan: {
        Row: {
          harga: number
          id: string
          nama: string
          servis_id: string
        }
        Insert: {
          harga?: number
          id?: string
          nama: string
          servis_id: string
        }
        Update: {
          harga?: number
          id?: string
          nama?: string
          servis_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "servis_layanan_servis_id_fkey"
            columns: ["servis_id"]
            isOneToOne: false
            referencedRelation: "servis"
            referencedColumns: ["id"]
          },
        ]
      }
      servis_sparepart: {
        Row: {
          harga: number
          id: string
          nama: string
          qty: number
          servis_id: string
          sparepart_id: string | null
        }
        Insert: {
          harga?: number
          id?: string
          nama: string
          qty?: number
          servis_id: string
          sparepart_id?: string | null
        }
        Update: {
          harga?: number
          id?: string
          nama?: string
          qty?: number
          servis_id?: string
          sparepart_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "servis_sparepart_servis_id_fkey"
            columns: ["servis_id"]
            isOneToOne: false
            referencedRelation: "servis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "servis_sparepart_sparepart_id_fkey"
            columns: ["sparepart_id"]
            isOneToOne: false
            referencedRelation: "sparepart"
            referencedColumns: ["id"]
          },
        ]
      }
      sparepart: {
        Row: {
          barcode: string
          created_at: string
          harga: number
          id: string
          kategori: string
          nama: string
          stok: number
          stok_minimum: number
        }
        Insert: {
          barcode?: string
          created_at?: string
          harga?: number
          id?: string
          kategori?: string
          nama: string
          stok?: number
          stok_minimum?: number
        }
        Update: {
          barcode?: string
          created_at?: string
          harga?: number
          id?: string
          kategori?: string
          nama?: string
          stok?: number
          stok_minimum?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
