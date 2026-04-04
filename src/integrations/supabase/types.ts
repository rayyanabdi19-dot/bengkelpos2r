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
      absensi: {
        Row: {
          catatan: string
          created_at: string
          foto_url: string
          id: string
          jam_keluar: string
          jam_masuk: string
          karyawan_id: string
          status: string
          tanggal: string
        }
        Insert: {
          catatan?: string
          created_at?: string
          foto_url?: string
          id?: string
          jam_keluar?: string
          jam_masuk?: string
          karyawan_id: string
          status?: string
          tanggal: string
        }
        Update: {
          catatan?: string
          created_at?: string
          foto_url?: string
          id?: string
          jam_keluar?: string
          jam_masuk?: string
          karyawan_id?: string
          status?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "absensi_karyawan_id_fkey"
            columns: ["karyawan_id"]
            isOneToOne: false
            referencedRelation: "karyawan"
            referencedColumns: ["id"]
          },
        ]
      }
      bengkel_profile: {
        Row: {
          alamat: string
          created_at: string
          footer_struk: string
          id: string
          link_qrcode: string
          logo_url: string
          nama: string
          pemilik: string
          telepon: string
          updated_at: string
        }
        Insert: {
          alamat?: string
          created_at?: string
          footer_struk?: string
          id?: string
          link_qrcode?: string
          logo_url?: string
          nama?: string
          pemilik?: string
          telepon?: string
          updated_at?: string
        }
        Update: {
          alamat?: string
          created_at?: string
          footer_struk?: string
          id?: string
          link_qrcode?: string
          logo_url?: string
          nama?: string
          pemilik?: string
          telepon?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      karyawan: {
        Row: {
          aktif: boolean
          alamat: string
          created_at: string
          foto_wajah: string
          gaji_pokok: number
          id: string
          jabatan: string
          nama: string
          no_hp: string
          tanggal_masuk: string
        }
        Insert: {
          aktif?: boolean
          alamat?: string
          created_at?: string
          foto_wajah?: string
          gaji_pokok?: number
          id?: string
          jabatan?: string
          nama: string
          no_hp?: string
          tanggal_masuk?: string
        }
        Update: {
          aktif?: boolean
          alamat?: string
          created_at?: string
          foto_wajah?: string
          gaji_pokok?: number
          id?: string
          jabatan?: string
          nama?: string
          no_hp?: string
          tanggal_masuk?: string
        }
        Relationships: []
      }
      layanan: {
        Row: {
          aktif: boolean
          created_at: string
          harga: number
          hpp: number
          id: string
          kategori: string
          nama: string
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          harga?: number
          hpp?: number
          id?: string
          kategori?: string
          nama: string
        }
        Update: {
          aktif?: boolean
          created_at?: string
          harga?: number
          hpp?: number
          id?: string
          kategori?: string
          nama?: string
        }
        Relationships: []
      }
      licenses: {
        Row: {
          aktif: boolean
          created_at: string
          id: string
          kode: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          aktif?: boolean
          created_at?: string
          id?: string
          kode: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          aktif?: boolean
          created_at?: string
          id?: string
          kode?: string
          used_at?: string | null
          used_by?: string | null
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
      pembelian: {
        Row: {
          catatan: string
          created_at: string
          harga_beli: number
          id: string
          nama_barang: string
          qty: number
          sparepart_id: string | null
          supplier: string
          total: number
        }
        Insert: {
          catatan?: string
          created_at?: string
          harga_beli?: number
          id?: string
          nama_barang: string
          qty?: number
          sparepart_id?: string | null
          supplier?: string
          total?: number
        }
        Update: {
          catatan?: string
          created_at?: string
          harga_beli?: number
          id?: string
          nama_barang?: string
          qty?: number
          sparepart_id?: string | null
          supplier?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pembelian_sparepart_id_fkey"
            columns: ["sparepart_id"]
            isOneToOne: false
            referencedRelation: "sparepart"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          license_kode: string | null
          no_hp: string
          role: string
          username: string
        }
        Insert: {
          created_at?: string
          id: string
          license_kode?: string | null
          no_hp?: string
          role?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          license_kode?: string | null
          no_hp?: string
          role?: string
          username?: string
        }
        Relationships: []
      }
      servis: {
        Row: {
          created_at: string
          id: string
          keluhan: string
          mekanik_id: string | null
          nama_mekanik: string
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
          mekanik_id?: string | null
          nama_mekanik?: string
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
          mekanik_id?: string | null
          nama_mekanik?: string
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
            foreignKeyName: "servis_mekanik_id_fkey"
            columns: ["mekanik_id"]
            isOneToOne: false
            referencedRelation: "karyawan"
            referencedColumns: ["id"]
          },
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
          hpp: number
          id: string
          nama: string
          servis_id: string
        }
        Insert: {
          harga?: number
          hpp?: number
          id?: string
          nama: string
          servis_id: string
        }
        Update: {
          harga?: number
          hpp?: number
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
          hpp: number
          id: string
          nama: string
          qty: number
          servis_id: string
          sparepart_id: string | null
        }
        Insert: {
          harga?: number
          hpp?: number
          id?: string
          nama: string
          qty?: number
          servis_id: string
          sparepart_id?: string | null
        }
        Update: {
          harga?: number
          hpp?: number
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
      slip_gaji: {
        Row: {
          bonus: number
          catatan: string
          created_at: string
          gaji_pokok: number
          id: string
          karyawan_id: string
          periode: string
          potongan: number
          total: number
        }
        Insert: {
          bonus?: number
          catatan?: string
          created_at?: string
          gaji_pokok?: number
          id?: string
          karyawan_id: string
          periode: string
          potongan?: number
          total?: number
        }
        Update: {
          bonus?: number
          catatan?: string
          created_at?: string
          gaji_pokok?: number
          id?: string
          karyawan_id?: string
          periode?: string
          potongan?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "slip_gaji_karyawan_id_fkey"
            columns: ["karyawan_id"]
            isOneToOne: false
            referencedRelation: "karyawan"
            referencedColumns: ["id"]
          },
        ]
      }
      sparepart: {
        Row: {
          barcode: string
          created_at: string
          harga: number
          hpp: number
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
          hpp?: number
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
          hpp?: number
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
