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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academies: {
        Row: {
          address: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance: {
        Row: {
          academy_id: string
          checked_in_at: string
          class_id: string | null
          class_slot_id: string | null
          created_at: string
          id: string
          notes: string | null
          professor_id: string | null
          source: Database["public"]["Enums"]["attendance_source"]
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          academy_id: string
          checked_in_at?: string
          class_id?: string | null
          class_slot_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          professor_id?: string | null
          source?: Database["public"]["Enums"]["attendance_source"]
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          academy_id?: string
          checked_in_at?: string
          class_id?: string | null
          class_slot_id?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          professor_id?: string | null
          source?: Database["public"]["Enums"]["attendance_source"]
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_slot_id_fkey"
            columns: ["class_slot_id"]
            isOneToOne: false
            referencedRelation: "class_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_validated_by_fkey"
            columns: ["validated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      belt_history: {
        Row: {
          academy_id: string
          classes_at_promotion: number | null
          created_at: string
          id: string
          new_belt: Database["public"]["Enums"]["belt_type"] | null
          new_stripes: number
          previous_belt: Database["public"]["Enums"]["belt_type"] | null
          previous_stripes: number | null
          promoted_at: string
          promoted_by: string | null
          reason: string | null
          student_id: string
        }
        Insert: {
          academy_id: string
          classes_at_promotion?: number | null
          created_at?: string
          id?: string
          new_belt?: Database["public"]["Enums"]["belt_type"] | null
          new_stripes: number
          previous_belt?: Database["public"]["Enums"]["belt_type"] | null
          previous_stripes?: number | null
          promoted_at?: string
          promoted_by?: string | null
          reason?: string | null
          student_id: string
        }
        Update: {
          academy_id?: string
          classes_at_promotion?: number | null
          created_at?: string
          id?: string
          new_belt?: Database["public"]["Enums"]["belt_type"] | null
          new_stripes?: number
          previous_belt?: Database["public"]["Enums"]["belt_type"] | null
          previous_stripes?: number | null
          promoted_at?: string
          promoted_by?: string | null
          reason?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "belt_history_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      belt_promotions: {
        Row: {
          academy_id: string
          created_at: string
          from_belt: Database["public"]["Enums"]["belt_type"] | null
          from_stripes: number
          id: string
          promoted_by: string | null
          reason: string | null
          student_id: string
          to_belt: Database["public"]["Enums"]["belt_type"] | null
          to_stripes: number
        }
        Insert: {
          academy_id: string
          created_at?: string
          from_belt?: Database["public"]["Enums"]["belt_type"] | null
          from_stripes?: number
          id?: string
          promoted_by?: string | null
          reason?: string | null
          student_id: string
          to_belt?: Database["public"]["Enums"]["belt_type"] | null
          to_stripes?: number
        }
        Update: {
          academy_id?: string
          created_at?: string
          from_belt?: Database["public"]["Enums"]["belt_type"] | null
          from_stripes?: number
          id?: string
          promoted_by?: string | null
          reason?: string | null
          student_id?: string
          to_belt?: Database["public"]["Enums"]["belt_type"] | null
          to_stripes?: number
        }
        Relationships: [
          {
            foreignKeyName: "belt_promotions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_promotions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "belt_promotions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      belt_rules: {
        Row: {
          academy_id: string
          belt: Database["public"]["Enums"]["belt_type"] | null
          classes_per_stripe: number
          created_at: string
          gift_every_classes: number | null
          id: string
          min_age_years: number | null
          min_time_months: number | null
          stripes_to_promote: number
          updated_at: string
        }
        Insert: {
          academy_id: string
          belt?: Database["public"]["Enums"]["belt_type"] | null
          classes_per_stripe?: number
          created_at?: string
          gift_every_classes?: number | null
          id?: string
          min_age_years?: number | null
          min_time_months?: number | null
          stripes_to_promote?: number
          updated_at?: string
        }
        Update: {
          academy_id?: string
          belt?: Database["public"]["Enums"]["belt_type"] | null
          classes_per_stripe?: number
          created_at?: string
          gift_every_classes?: number | null
          id?: string
          min_age_years?: number | null
          min_time_months?: number | null
          stripes_to_promote?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "belt_rules_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      class_slots: {
        Row: {
          academy_id: string
          active: boolean
          created_at: string
          day_of_week: number[]
          end_time: string
          id: string
          instructor_id: string | null
          modality_id: string
          shift: string
          start_time: string
          title: string | null
          updated_at: string
        }
        Insert: {
          academy_id: string
          active?: boolean
          created_at?: string
          day_of_week: number[]
          end_time: string
          id?: string
          instructor_id?: string | null
          modality_id: string
          shift: string
          start_time: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          academy_id?: string
          active?: boolean
          created_at?: string
          day_of_week?: number[]
          end_time?: string
          id?: string
          instructor_id?: string | null
          modality_id?: string
          shift?: string
          start_time?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_slots_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_slots_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_slots_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academy_id: string
          created_at: string
          day_of_week: number | null
          description: string | null
          end_time: string
          id: string
          is_active: boolean
          max_students: number | null
          name: string
          professor_id: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          max_students?: number | null
          name: string
          professor_id?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          day_of_week?: number | null
          description?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          max_students?: number | null
          name?: string
          professor_id?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_signatures: {
        Row: {
          accepted_at: string
          contract_id: string
          created_at: string
          id: string
          ip_address: string | null
          method: Database["public"]["Enums"]["signature_method"]
          signature_svg: string | null
          signer_document: string
          signer_name: string
          signer_profile_id: string | null
          user_agent: string | null
        }
        Insert: {
          accepted_at?: string
          contract_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          method?: Database["public"]["Enums"]["signature_method"]
          signature_svg?: string | null
          signer_document: string
          signer_name: string
          signer_profile_id?: string | null
          user_agent?: string | null
        }
        Update: {
          accepted_at?: string
          contract_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          method?: Database["public"]["Enums"]["signature_method"]
          signature_svg?: string | null
          signer_document?: string
          signer_name?: string
          signer_profile_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_signatures_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_signatures_signer_profile_id_fkey"
            columns: ["signer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          academy_id: string
          body_html: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          academy_id: string
          body_html: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title: string
          updated_at?: string
          version?: number
        }
        Update: {
          academy_id?: string
          body_html?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "contract_templates_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contract_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          academy_id: string
          contract_token: string | null
          created_at: string
          id: string
          pdf_url: string | null
          sent_at: string | null
          signed_at: string | null
          signed_pdf_url: string | null
          status: Database["public"]["Enums"]["contract_status"]
          student_id: string
          template_id: string
          updated_at: string
          voided_at: string | null
          voided_reason: string | null
        }
        Insert: {
          academy_id: string
          contract_token?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          student_id: string
          template_id: string
          updated_at?: string
          voided_at?: string | null
          voided_reason?: string | null
        }
        Update: {
          academy_id?: string
          contract_token?: string | null
          created_at?: string
          id?: string
          pdf_url?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_pdf_url?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          student_id?: string
          template_id?: string
          updated_at?: string
          voided_at?: string | null
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          academy_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          academy_id: string
          amount: number
          category_id: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          paid_at: string | null
          payment_method: string | null
          recurrence_months: number | null
          recurrence_rule: string | null
          recurring: boolean
          type: Database["public"]["Enums"]["expense_type"]
        }
        Insert: {
          academy_id: string
          amount: number
          category_id?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          recurrence_months?: number | null
          recurrence_rule?: string | null
          recurring?: boolean
          type?: Database["public"]["Enums"]["expense_type"]
        }
        Update: {
          academy_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          recurrence_months?: number | null
          recurrence_rule?: string | null
          recurring?: boolean
          type?: Database["public"]["Enums"]["expense_type"]
        }
        Relationships: [
          {
            foreignKeyName: "expenses_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gifts: {
        Row: {
          academy_id: string
          classes_count: number
          created_at: string
          delivered_at: string | null
          gift_name: string
          id: string
          student_id: string
        }
        Insert: {
          academy_id: string
          classes_count: number
          created_at?: string
          delivered_at?: string | null
          gift_name: string
          id?: string
          student_id: string
        }
        Update: {
          academy_id?: string
          classes_count?: number
          created_at?: string
          delivered_at?: string | null
          gift_name?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gifts_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gifts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          academy_id: string
          amount: number
          checkout_url: string | null
          created_at: string
          due_date: string
          external_reference: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          pix_copiaecola: string | null
          pix_expires_at: string | null
          pix_qr_base64: string | null
          provider: string | null
          provider_payment_id: string | null
          provider_ref: string | null
          provider_status: string
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          subscription_id: string | null
        }
        Insert: {
          academy_id: string
          amount: number
          checkout_url?: string | null
          created_at?: string
          due_date: string
          external_reference?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_copiaecola?: string | null
          pix_expires_at?: string | null
          pix_qr_base64?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          provider_ref?: string | null
          provider_status?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id: string
          subscription_id?: string | null
        }
        Update: {
          academy_id?: string
          amount?: number
          checkout_url?: string | null
          created_at?: string
          due_date?: string
          external_reference?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          pix_copiaecola?: string | null
          pix_expires_at?: string | null
          pix_qr_base64?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          provider_ref?: string | null
          provider_status?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      modalities: {
        Row: {
          academy_id: string
          active: boolean
          created_at: string
          id: string
          name: string
          updated_at: string
          variant: string | null
        }
        Insert: {
          academy_id: string
          active?: boolean
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          variant?: string | null
        }
        Update: {
          academy_id?: string
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modalities_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          academy_id: string
          billing_cycle: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          academy_id: string
          billing_cycle?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          academy_id?: string
          billing_cycle?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          academy_id: string
          avatar_url: string | null
          belt: Database["public"]["Enums"]["belt_type"] | null
          birth_date: string | null
          classes_since_last_stripe: number
          cpf: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles: Database["public"]["Enums"]["user_role"][]
          start_date: string | null
          status: Database["public"]["Enums"]["student_status"]
          stripes: number
          total_classes: number
          updated_at: string
        }
        Insert: {
          academy_id: string
          avatar_url?: string | null
          belt?: Database["public"]["Enums"]["belt_type"] | null
          birth_date?: string | null
          classes_since_last_stripe?: number
          cpf?: string | null
          created_at?: string
          email?: string | null
          id: string
          name: string
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: Database["public"]["Enums"]["user_role"][]
          start_date?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          stripes?: number
          total_classes?: number
          updated_at?: string
        }
        Update: {
          academy_id?: string
          avatar_url?: string | null
          belt?: Database["public"]["Enums"]["belt_type"] | null
          birth_date?: string | null
          classes_since_last_stripe?: number
          cpf?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: Database["public"]["Enums"]["user_role"][]
          start_date?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          stripes?: number
          total_classes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_queue: {
        Row: {
          academy_id: string
          created_at: string
          eligible_at: string
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          student_id: string
        }
        Insert: {
          academy_id: string
          created_at?: string
          eligible_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          student_id: string
        }
        Update: {
          academy_id?: string
          created_at?: string
          eligible_at?: string
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_queue_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_queue_processed_by_fkey"
            columns: ["processed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_queue_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_invites: {
        Row: {
          academy_id: string
          active: boolean
          class_slot_id: string | null
          created_at: string
          created_by_profile_id: string
          expires_at: string | null
          grace_days: number
          id: string
          instructor_profile_id: string | null
          modality_id: string | null
          next_due_at: string | null
          plan_id: string | null
          token: string
        }
        Insert: {
          academy_id: string
          active?: boolean
          class_slot_id?: string | null
          created_at?: string
          created_by_profile_id: string
          expires_at?: string | null
          grace_days?: number
          id?: string
          instructor_profile_id?: string | null
          modality_id?: string | null
          next_due_at?: string | null
          plan_id?: string | null
          token: string
        }
        Update: {
          academy_id?: string
          active?: boolean
          class_slot_id?: string | null
          created_at?: string
          created_by_profile_id?: string
          expires_at?: string | null
          grace_days?: number
          id?: string
          instructor_profile_id?: string | null
          modality_id?: string | null
          next_due_at?: string | null
          plan_id?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_invites_class_slot_id_fkey"
            columns: ["class_slot_id"]
            isOneToOne: false
            referencedRelation: "class_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_invites_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_links: {
        Row: {
          academy_id: string
          class_slot_id: string | null
          created_at: string
          created_by: string
          expires_at: string
          grace_days: number | null
          id: string
          instructor_id: string | null
          modality_id: string | null
          next_due_at: string | null
          plan_id: string | null
          token: string
          used_at: string | null
        }
        Insert: {
          academy_id: string
          class_slot_id?: string | null
          created_at?: string
          created_by: string
          expires_at: string
          grace_days?: number | null
          id?: string
          instructor_id?: string | null
          modality_id?: string | null
          next_due_at?: string | null
          plan_id?: string | null
          token: string
          used_at?: string | null
        }
        Update: {
          academy_id?: string
          class_slot_id?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          grace_days?: number | null
          id?: string
          instructor_id?: string | null
          modality_id?: string | null
          next_due_at?: string | null
          plan_id?: string | null
          token?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registration_links_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_links_class_slot_id_fkey"
            columns: ["class_slot_id"]
            isOneToOne: false
            referencedRelation: "class_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_links_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_links_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_links_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_links_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          academy_id: string
          belt: Database["public"]["Enums"]["belt_type"] | null
          created_at: string
          created_by: string | null
          id: string
          new_stripes: number
          previous_stripes: number
          source: string
          student_id: string
        }
        Insert: {
          academy_id: string
          belt?: Database["public"]["Enums"]["belt_type"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          new_stripes: number
          previous_stripes?: number
          source?: string
          student_id: string
        }
        Update: {
          academy_id?: string
          belt?: Database["public"]["Enums"]["belt_type"] | null
          created_at?: string
          created_by?: string | null
          id?: string
          new_stripes?: number
          previous_stripes?: number
          source?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stripe_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academy_id: string
          class_slot_id: string
          created_at: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          academy_id: string
          class_slot_id: string
          created_at?: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          academy_id?: string
          class_slot_id?: string
          created_at?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_class_slot_id_fkey"
            columns: ["class_slot_id"]
            isOneToOne: false
            referencedRelation: "class_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      student_registrations: {
        Row: {
          academy_id: string
          approved_at: string | null
          belt_current: string
          birth_date: string | null
          class_slot_id: string | null
          computed_category: string | null
          cpf: string | null
          created_at: string
          created_by_profile_id: string | null
          email: string | null
          grace_days: number | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          instructor_id: string | null
          is_minor: boolean | null
          modality_id: string | null
          name: string
          next_due_at: string | null
          phone: string | null
          plan_id: string | null
          registration_token: string | null
          rejected_at: string | null
          rejection_reason: string | null
          sex: string | null
          source: string
          status: string
          stripes: number
          token_expires_at: string | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          academy_id: string
          approved_at?: string | null
          belt_current?: string
          birth_date?: string | null
          class_slot_id?: string | null
          computed_category?: string | null
          cpf?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          email?: string | null
          grace_days?: number | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          instructor_id?: string | null
          is_minor?: boolean | null
          modality_id?: string | null
          name: string
          next_due_at?: string | null
          phone?: string | null
          plan_id?: string | null
          registration_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sex?: string | null
          source?: string
          status?: string
          stripes?: number
          token_expires_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          academy_id?: string
          approved_at?: string | null
          belt_current?: string
          birth_date?: string | null
          class_slot_id?: string | null
          computed_category?: string | null
          cpf?: string | null
          created_at?: string
          created_by_profile_id?: string | null
          email?: string | null
          grace_days?: number | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          instructor_id?: string | null
          is_minor?: boolean | null
          modality_id?: string | null
          name?: string
          next_due_at?: string | null
          phone?: string | null
          plan_id?: string | null
          registration_token?: string | null
          rejected_at?: string | null
          rejection_reason?: string | null
          sex?: string | null
          source?: string
          status?: string
          stripes?: number
          token_expires_at?: string | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "student_registrations_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_class_slot_id_fkey"
            columns: ["class_slot_id"]
            isOneToOne: false
            referencedRelation: "class_slots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_created_by_profile_id_fkey"
            columns: ["created_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_modality_id_fkey"
            columns: ["modality_id"]
            isOneToOne: false
            referencedRelation: "modalities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_registrations_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academy_id: string
          belt_current: Database["public"]["Enums"]["belt_type"] | null
          belt_cycle_classes: number
          birth_date: string | null
          category: string | null
          cpf: string | null
          created_at: string
          email: string | null
          financial_status: Database["public"]["Enums"]["financial_status"]
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          name: string
          phone: string | null
          profile_id: string | null
          responsible_instructor_id: string | null
          status: Database["public"]["Enums"]["student_status"]
          stripes_cached: number
          suspended_at: string | null
          suspended_reason: string | null
          total_classes: number
          updated_at: string
          weight: number | null
        }
        Insert: {
          academy_id: string
          belt_current?: Database["public"]["Enums"]["belt_type"] | null
          belt_cycle_classes?: number
          birth_date?: string | null
          category?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          financial_status?: Database["public"]["Enums"]["financial_status"]
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          name: string
          phone?: string | null
          profile_id?: string | null
          responsible_instructor_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          stripes_cached?: number
          suspended_at?: string | null
          suspended_reason?: string | null
          total_classes?: number
          updated_at?: string
          weight?: number | null
        }
        Update: {
          academy_id?: string
          belt_current?: Database["public"]["Enums"]["belt_type"] | null
          belt_cycle_classes?: number
          birth_date?: string | null
          category?: string | null
          cpf?: string | null
          created_at?: string
          email?: string | null
          financial_status?: Database["public"]["Enums"]["financial_status"]
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          name?: string
          phone?: string | null
          profile_id?: string | null
          responsible_instructor_id?: string | null
          status?: Database["public"]["Enums"]["student_status"]
          stripes_cached?: number
          suspended_at?: string | null
          suspended_reason?: string | null
          total_classes?: number
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_responsible_instructor_id_fkey"
            columns: ["responsible_instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          academy_id: string
          canceled_at: string | null
          created_at: string
          grace_days: number
          id: string
          next_due_at: string
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          academy_id: string
          canceled_at?: string | null
          created_at?: string
          grace_days?: number
          id?: string
          next_due_at: string
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          academy_id?: string
          canceled_at?: string | null
          created_at?: string
          grace_days?: number
          id?: string
          next_due_at?: string
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_academy_id_fkey"
            columns: ["academy_id"]
            isOneToOne: false
            referencedRelation: "academies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_contract_token: {
        Args: { provided_token: string }
        Returns: boolean
      }
      create_subscription_with_invoice: {
        Args: {
          p_grace_days?: number
          p_plan_id: string
          p_start_date?: string
          p_student_id: string
        }
        Returns: Json
      }
      get_contract_by_token: {
        Args: { p_token: string }
        Returns: {
          academy_id: string
          contract_token: string
          created_at: string
          id: string
          pdf_url: string
          sent_at: string
          signed_at: string
          signed_pdf_url: string
          status: Database["public"]["Enums"]["contract_status"]
          student_id: string
          template_id: string
          updated_at: string
          voided_at: string
          voided_reason: string
        }[]
      }
      get_registration_by_token: {
        Args: { p_token: string }
        Returns: {
          academy_id: string
          created_at: string
          id: string
          name: string
          status: string
        }[]
      }
      get_user_academy_id: { Args: { user_id: string }; Returns: string }
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          needed: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
      is_admin_or_professor: { Args: { user_id: string }; Returns: boolean }
      link_my_student_record: { Args: never; Returns: Json }
      mark_invoice_paid: {
        Args: { p_invoice_id: string; p_method?: string }
        Returns: Json
      }
      promote_student_belt: {
        Args: {
          p_reason?: string
          p_student_id: string
          p_to_belt: Database["public"]["Enums"]["belt_type"]
        }
        Returns: Json
      }
      suspend_overdue_students: { Args: never; Returns: Json }
    }
    Enums: {
      attendance_source: "app" | "manual" | "qrcode"
      attendance_status: "pending" | "approved" | "rejected"
      belt_type:
        | "white"
        | "grey_white"
        | "grey"
        | "grey_black"
        | "yellow_white"
        | "yellow"
        | "yellow_black"
        | "orange_white"
        | "orange"
        | "orange_black"
        | "green_white"
        | "green"
        | "green_black"
        | "blue"
        | "purple"
        | "brown"
        | "black"
        | "red_black"
        | "red_white"
        | "red"
      contract_status: "draft" | "sent" | "signed" | "manual_signed" | "void"
      expense_type: "fixed" | "variable"
      financial_status: "ok" | "pending" | "overdue" | "blocked"
      invoice_status: "open" | "paid" | "overdue" | "canceled"
      modality_variant: "gi" | "nogi" | "none"
      registration_source_type: "link" | "manual"
      registration_status_type: "pending" | "approved" | "rejected"
      sex_type: "nao_informado" | "masculino" | "feminino"
      shift_type: "morning" | "afternoon" | "night"
      signature_method: "digital" | "manual"
      student_status: "active" | "inactive" | "suspended"
      subscription_status: "active" | "canceled" | "paused"
      user_role: "admin" | "professor" | "student"
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
    Enums: {
      attendance_source: ["app", "manual", "qrcode"],
      attendance_status: ["pending", "approved", "rejected"],
      belt_type: [
        "white",
        "grey_white",
        "grey",
        "grey_black",
        "yellow_white",
        "yellow",
        "yellow_black",
        "orange_white",
        "orange",
        "orange_black",
        "green_white",
        "green",
        "green_black",
        "blue",
        "purple",
        "brown",
        "black",
        "red_black",
        "red_white",
        "red",
      ],
      contract_status: ["draft", "sent", "signed", "manual_signed", "void"],
      expense_type: ["fixed", "variable"],
      financial_status: ["ok", "pending", "overdue", "blocked"],
      invoice_status: ["open", "paid", "overdue", "canceled"],
      modality_variant: ["gi", "nogi", "none"],
      registration_source_type: ["link", "manual"],
      registration_status_type: ["pending", "approved", "rejected"],
      sex_type: ["nao_informado", "masculino", "feminino"],
      shift_type: ["morning", "afternoon", "night"],
      signature_method: ["digital", "manual"],
      student_status: ["active", "inactive", "suspended"],
      subscription_status: ["active", "canceled", "paused"],
      user_role: ["admin", "professor", "student"],
    },
  },
} as const
